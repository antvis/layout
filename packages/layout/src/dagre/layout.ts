import { Edge as IEdge, Graph, ID } from '@antv/graphlib';
import { isNil } from '@antv/util';
import {
  DagreAlign,
  DagreRankdir,
  EdgeData,
  Graph as IGraph,
  NodeData,
  Point,
} from '../types';
import { run as runAcyclic, undo as undoAcyclic } from './acyclic';
import { addBorderSegments } from './add-border-segments';
import {
  adjust as adjustCoordinateSystem,
  undo as undoCoordinateSystem,
} from './coordinate-system';
import {
  cleanup as cleanupNestingGraph,
  run as runNestingGraph,
} from './nesting-graph';
import { run as runNormalize, undo as undoNormalize } from './normalize';
import { order } from './order';
import { initDataOrder } from './order/init-data-order';
import { parentDummyChains } from './parent-dummy-chains';
import { position } from './position';
import { rank } from './rank';
import {
  addDummyNode,
  asNonCompoundGraph,
  buildLayerMatrix,
  intersectRect,
  normalizeRanks,
  removeEmptyRanks,
} from './util';

// const graphNumAttrs = ["nodesep", "edgesep", "ranksep", "marginx", "marginy"];
// const graphDefaults = { ranksep: 50, edgesep: 20, nodesep: 50, rankdir: "tb" };
// const graphAttrs = ["acyclicer", "ranker", "rankdir", "align"];

export const layout = (
  g: IGraph,
  options: {
    keepNodeOrder: boolean;
    prevGraph: IGraph | null;
    edgeLabelSpace?: boolean;
    align?: DagreAlign;
    nodesep?: number;
    edgesep?: number;
    ranksep?: number;
    acyclicer: string;
    nodeOrder: ID[];
    ranker: 'network-simplex' | 'tight-tree' | 'longest-path';
    rankdir: DagreRankdir;
  },
) => {
  const { edgeLabelSpace, keepNodeOrder, prevGraph, rankdir, ranksep } =
    options;

  // 如果在原图基础上修改，继承原图的order结果
  if (!keepNodeOrder && prevGraph) {
    inheritOrder(g, prevGraph);
  }
  const layoutGraph = buildLayoutGraph(g);

  // 控制是否为边的label留位置（这会影响是否在边中间添加dummy node）
  if (!!edgeLabelSpace) {
    options.ranksep = makeSpaceForEdgeLabels(layoutGraph, {
      rankdir,
      ranksep,
    });
  }
  let dimension;
  // TODO: 暂时处理层级设置不正确时的异常报错，提示设置正确的层级
  try {
    dimension = runLayout(layoutGraph, options);
  } catch (e) {
    if (
      e.message === 'Not possible to find intersection inside of the rectangle'
    ) {
      console.error(
        "The following error may be caused by improper layer setting, please make sure your manual layer setting does not violate the graph's structure:\n",
        e,
      );
      return;
    }
    throw e;
  }
  updateInputGraph(g, layoutGraph);
  return dimension;
};

const runLayout = (
  g: IGraph,
  options: {
    acyclicer: string;
    keepNodeOrder: boolean;
    nodeOrder: ID[];
    ranker: 'network-simplex' | 'tight-tree' | 'longest-path';
    rankdir: DagreRankdir;
    align?: DagreAlign;
    nodesep?: number;
    edgesep?: number;
    ranksep?: number;
  },
) => {
  const {
    acyclicer,
    ranker,
    rankdir = 'tb',
    nodeOrder,
    keepNodeOrder,
    align,
    nodesep = 50,
    edgesep = 20,
    ranksep = 50,
  } = options;

  removeSelfEdges(g);

  runAcyclic(g, acyclicer);

  const { nestingRoot, nodeRankFactor } = runNestingGraph(g);

  rank(asNonCompoundGraph(g), ranker);

  injectEdgeLabelProxies(g);

  removeEmptyRanks(g, nodeRankFactor);

  cleanupNestingGraph(g, nestingRoot);

  normalizeRanks(g);

  assignRankMinMax(g);

  removeEdgeLabelProxies(g);

  const dummyChains: ID[] = [];
  runNormalize(g, dummyChains);
  parentDummyChains(g, dummyChains);

  addBorderSegments(g);

  if (keepNodeOrder) {
    initDataOrder(g, nodeOrder);
  }

  order(g, keepNodeOrder);

  insertSelfEdges(g);

  adjustCoordinateSystem(g, rankdir);

  position(g, {
    align,
    nodesep,
    edgesep,
    ranksep,
  });

  positionSelfEdges(g);

  removeBorderNodes(g);

  undoNormalize(g, dummyChains);

  fixupEdgeLabelCoords(g);

  undoCoordinateSystem(g, rankdir);

  const { width, height } = translateGraph(g);

  assignNodeIntersects(g);

  reversePointsForReversedEdges(g);

  undoAcyclic(g);

  return { width, height };
};

/**
 * 继承上一个布局中的order，防止翻转
 * TODO: 暂时没有考虑涉及层级变动的布局，只保证原来布局层级和相对顺序不变
 */
const inheritOrder = (currG: IGraph, prevG: IGraph) => {
  currG.getAllNodes().forEach((n) => {
    const node = currG.getNode(n.id)!;
    if (prevG.hasNode(n.id)) {
      const prevNode = prevG.getNode(n.id)!;
      node.data.fixorder = prevNode.data._order as number;
      delete prevNode.data._order;
    } else {
      delete node.data.fixorder;
    }
  });
};

/*
 * Copies final layout information from the layout graph back to the input
 * graph. This process only copies whitelisted attributes from the layout graph
 * to the input graph, so it serves as a good place to determine what
 * attributes can influence layout.
 */
const updateInputGraph = (inputGraph: IGraph, layoutGraph: IGraph) => {
  inputGraph.getAllNodes().forEach((v) => {
    const inputLabel = inputGraph.getNode(v.id);

    if (inputLabel) {
      const layoutLabel = layoutGraph.getNode(v.id)!;
      inputLabel.data.x = layoutLabel.data.x;
      inputLabel.data.y = layoutLabel.data.y;
      inputLabel.data._order = layoutLabel.data.order;
      inputLabel.data._rank = layoutLabel.data.rank;

      if (layoutGraph.getChildren(v.id)?.length) {
        inputLabel.data.width = layoutLabel.data.width;
        inputLabel.data.height = layoutLabel.data.height;
      }
    }
  });

  inputGraph.getAllEdges().forEach((e) => {
    const inputLabel = inputGraph.getEdge(e.id)!;
    const layoutLabel = layoutGraph.getEdge(e.id)!;

    inputLabel.data.points = layoutLabel ? layoutLabel.data.points : [];
    if (layoutLabel && layoutLabel.data.hasOwnProperty('x')) {
      inputLabel.data.x = layoutLabel.data.x;
      inputLabel.data.y = layoutLabel.data.y;
    }
  });

  // inputGraph.graph().width = layoutGraph.graph().width;
  // inputGraph.graph().height = layoutGraph.graph().height;
};

const nodeNumAttrs = ['width', 'height', 'layer', 'fixorder']; // 需要传入layer, fixOrder作为参数参考
const nodeDefaults = { width: 0, height: 0 };
const edgeNumAttrs = ['minlen', 'weight', 'width', 'height', 'labeloffset'];
const edgeDefaults = {
  minlen: 1,
  weight: 1,
  width: 0,
  height: 0,
  labeloffset: 10,
  labelpos: 'r',
};
const edgeAttrs = ['labelpos'];

/*
 * Constructs a new graph from the input graph, which can be used for layout.
 * This process copies only whitelisted attributes from the input graph to the
 * layout graph. Thus this function serves as a good place to determine what
 * attributes can influence layout.
 */
const buildLayoutGraph = (inputGraph: IGraph) => {
  const g = new Graph({ tree: [] });
  inputGraph.getAllNodes().forEach((v) => {
    const node = canonicalize(inputGraph.getNode(v.id).data);
    const defaultNode = {
      ...nodeDefaults,
      ...node,
    } as NodeData;
    const defaultAttrs = selectNumberAttrs(defaultNode, nodeNumAttrs) as Node;

    if (!g.hasNode(v.id)) {
      g.addNode({
        id: v.id,
        data: {
          ...defaultAttrs,
        },
      });
    }

    const parent = inputGraph.hasTreeStructure('combo')
      ? inputGraph.getParent(v.id, 'combo')
      : inputGraph.getParent(v.id);
    if (!isNil(parent)) {
      if (!g.hasNode(parent.id)) {
        g.addNode({ ...parent });
      }
      g.setParent(v.id, parent.id);
    }
  });

  inputGraph.getAllEdges().forEach((e) => {
    const edge = canonicalize(inputGraph.getEdge(e.id).data);

    const pickedProperties: any = {};
    edgeAttrs?.forEach((key) => {
      if (edge[key] !== undefined) pickedProperties[key] = edge[key];
    });

    g.addEdge({
      id: e.id,
      source: e.source,
      target: e.target,
      data: Object.assign(
        {},
        edgeDefaults,
        selectNumberAttrs(edge, edgeNumAttrs),
        pickedProperties,
      ),
    });
  });

  return g;
};

/*
 * This idea comes from the Gansner paper: to account for edge labels in our
 * layout we split each rank in half by doubling minlen and halving ranksep.
 * Then we can place labels at these mid-points between nodes.
 *
 * We also add some minimal padding to the width to push the label for the edge
 * away from the edge itself a bit.
 */
const makeSpaceForEdgeLabels = (
  g: IGraph,
  options: {
    ranksep?: number;
    rankdir: string;
  },
) => {
  const { ranksep = 0, rankdir } = options;
  g.getAllNodes().forEach((node) => {
    if (!isNaN(node.data.layer!)) {
      if (!node.data.layer) node.data.layer = 0;
    }
  });
  g.getAllEdges().forEach((edge) => {
    edge.data.minlen! *= 2;
    if ((edge.data.labelpos as string)?.toLowerCase() !== 'c') {
      if (rankdir === 'TB' || rankdir === 'BT') {
        edge.data.width! += edge.data.labeloffset!;
      } else {
        edge.data.height! += edge.data.labeloffset!;
      }
    }
  });

  return ranksep / 2;
};

/*
 * Creates temporary dummy nodes that capture the rank in which each edge's
 * label is going to, if it has one of non-zero width and height. We do this
 * so that we can safely remove empty ranks while preserving balance for the
 * label's position.
 */
const injectEdgeLabelProxies = (g: IGraph) => {
  g.getAllEdges().forEach((e) => {
    if (e.data.width && e.data.height) {
      const v = g.getNode(e.source)!;
      const w = g.getNode(e.target)!;
      const label = {
        e,
        rank: (w.data.rank! - v.data.rank!) / 2 + v.data.rank!,
      };
      addDummyNode(g, 'edge-proxy', label, '_ep');
    }
  });
};

const assignRankMinMax = (g: IGraph): number => {
  let maxRank = 0;
  g.getAllNodes().forEach((node) => {
    if (node.data.borderTop) {
      node.data.minRank = g.getNode(node.data.borderTop as ID)?.data.rank;
      node.data.maxRank = g.getNode(node.data.borderBottom as ID)?.data.rank;
      maxRank = Math.max(maxRank, node.data.maxRank || -Infinity);
    }
  });

  return maxRank;
};

const removeEdgeLabelProxies = (g: IGraph) => {
  g.getAllNodes().forEach((node) => {
    if (node.data.dummy === 'edge-proxy') {
      g.getEdge(node.data.e!.id)!.data.labelRank = node.data.rank;
      g.removeNode(node.id);
    }
  });
};

const translateGraph = (
  g: IGraph,
  options?: {
    marginx: number;
    marginy: number;
  },
) => {
  let minX: number;
  let maxX = 0;
  let minY: number;
  let maxY = 0;

  const { marginx: marginX = 0, marginy: marginY = 0 } = options || {};

  const getExtremes = (attrs: any) => {
    if (!attrs.data) return;
    const x = attrs.data.x;
    const y = attrs.data.y;
    const w = attrs.data.width;
    const h = attrs.data.height;
    if (!isNaN(x) && !isNaN(w)) {
      if (minX === undefined) {
        minX = x - w / 2;
      }
      minX = Math.min(minX, x - w / 2);
      maxX = Math.max(maxX, x + w / 2);
    }
    if (!isNaN(y) && !isNaN(h)) {
      if (minY === undefined) {
        minY = y - h / 2;
      }
      minY = Math.min(minY, y - h / 2);
      maxY = Math.max(maxY, y + h / 2);
    }
  };

  g.getAllNodes().forEach((v) => {
    getExtremes(v);
  });
  g.getAllEdges().forEach((e) => {
    if (e?.data.hasOwnProperty('x')) {
      getExtremes(e);
    }
  });

  minX! -= marginX;
  minY! -= marginY;

  g.getAllNodes().forEach((node) => {
    node.data.x! -= minX;
    node.data.y! -= minY;
  });

  g.getAllEdges().forEach((edge) => {
    edge.data.points?.forEach((p: Point) => {
      p.x -= minX;
      p.y -= minY;
    });
    if (edge.data.hasOwnProperty('x')) {
      edge.data.x! -= minX;
    }
    if (edge.data.hasOwnProperty('y')) {
      edge.data.y! -= minY;
    }
  });

  return {
    width: maxX - minX! + marginX,
    height: maxY - minY! + marginY,
  };
};

const assignNodeIntersects = (g: IGraph) => {
  g.getAllEdges().forEach((e) => {
    const nodeV = g.getNode(e.source)!;
    const nodeW = g.getNode(e.target)!;
    let p1: Point;
    let p2: Point;
    if (!e.data.points) {
      e.data.points = [];
      p1 = { x: nodeW.data.x!, y: nodeW.data.y! };
      p2 = { x: nodeV.data.x!, y: nodeV.data.y! };
    } else {
      p1 = e.data.points[0];
      p2 = e.data.points[e.data.points.length - 1];
    }

    e.data.points.unshift(intersectRect(nodeV.data, p1));
    e.data.points.push(intersectRect(nodeW.data, p2));
  });
};

const fixupEdgeLabelCoords = (g: IGraph) => {
  g.getAllEdges().forEach((edge) => {
    if (edge.data.hasOwnProperty('x')) {
      if (edge.data.labelpos === 'l' || edge.data.labelpos === 'r') {
        edge.data.width! -= edge.data.labeloffset!;
      }
      switch (edge.data.labelpos) {
        case 'l':
          edge.data.x! -= edge.data.width! / 2 + edge.data.labeloffset!;
          break;
        case 'r':
          edge.data.x! += edge.data.width! / 2 + edge.data.labeloffset!;
          break;
      }
    }
  });
};

const reversePointsForReversedEdges = (g: IGraph) => {
  g.getAllEdges().forEach((edge) => {
    if (edge.data.reversed) {
      edge.data.points?.reverse();
    }
  });
};

const removeBorderNodes = (g: IGraph) => {
  g.getAllNodes().forEach((v) => {
    if (g.getChildren(v.id)?.length) {
      const node = g.getNode(v.id)!;
      const t = g.getNode(node.data.borderTop as ID);
      const b = g.getNode(node.data.borderBottom as ID);
      const l = g.getNode(
        (node.data.borderLeft as ID[])[
          (node.data.borderLeft as ID[])?.length - 1
        ],
      );
      const r = g.getNode(
        (node.data.borderRight as ID[])[
          (node.data.borderRight as ID[])?.length - 1
        ],
      );

      node.data.width = Math.abs(r?.data.x! - l?.data.x!) || 10;
      node.data.height = Math.abs(b?.data.y! - t?.data.y!) || 10;
      node.data.x = (l?.data.x! || 0) + node.data.width! / 2;
      node.data.y = (t?.data.y! || 0) + node.data.height! / 2;
    }
  });

  g.getAllNodes().forEach((n) => {
    if (n.data.dummy === 'border') {
      g.removeNode(n.id);
    }
  });
};

const removeSelfEdges = (g: IGraph) => {
  g.getAllEdges().forEach((e) => {
    if (e.source === e.target) {
      const node = g.getNode(e.source)!;
      if (!node.data.selfEdges) {
        node.data.selfEdges = [];
      }
      node.data.selfEdges.push(e);
      g.removeEdge(e.id);
    }
  });
};

const insertSelfEdges = (g: IGraph) => {
  const layers = buildLayerMatrix(g);
  layers?.forEach((layer: ID[]) => {
    let orderShift = 0;
    layer?.forEach((v: ID, i: number) => {
      const node = g.getNode(v)!;
      node.data.order = i + orderShift;
      node.data.selfEdges?.forEach((selfEdge: IEdge<EdgeData>) => {
        addDummyNode(
          g,
          'selfedge',
          {
            width: selfEdge.data.width,
            height: selfEdge.data.height,
            rank: node.data.rank,
            order: i + ++orderShift,
            e: selfEdge,
          },
          '_se',
        );
      });
      delete node.data.selfEdges;
    });
  });
};

const positionSelfEdges = (g: IGraph) => {
  g.getAllNodes().forEach((v) => {
    const node = g.getNode(v.id)!;
    if (node.data.dummy === 'selfedge') {
      const selfNode = g.getNode(node.data.e!.source)!;
      const x = selfNode.data.x! + selfNode.data.width! / 2;
      const y = selfNode.data.y!;
      const dx = node.data.x! - x;
      const dy = selfNode.data.height! / 2;

      if (g.hasEdge(node.data.e!.id)) {
        g.updateEdgeData(node.data.e!.id, node.data.e!.data);
      } else {
        g.addEdge({
          id: node.data.e!.id,
          source: node.data.e!.source,
          target: node.data.e!.target,
          data: node.data.e!.data,
        });
      }
      g.removeNode(v.id);

      node.data.e!.data.points = [
        { x: x + (2 * dx) / 3, y: y - dy },
        { x: x + (5 * dx) / 6, y: y - dy },
        { y, x: x + dx },
        { x: x + (5 * dx) / 6, y: y + dy },
        { x: x + (2 * dx) / 3, y: y + dy },
      ];

      node.data.e!.data.x = node.data.x;
      node.data.e!.data.y = node.data.y;
    }
  });
};

const selectNumberAttrs = (obj: Record<string, any>, attrs: string[]) => {
  const pickedProperties: Record<string, any> = {};
  attrs?.forEach((key: string) => {
    if (obj[key] === undefined) return;
    pickedProperties[key] = +obj[key];
  });
  return pickedProperties;
};

const canonicalize = (attrs: Record<string, any> = {}) => {
  const newAttrs: Record<string, any> = {};
  Object.keys(attrs).forEach((k: string) => {
    newAttrs[k.toLowerCase()] = attrs[k];
  });
  return newAttrs;
};

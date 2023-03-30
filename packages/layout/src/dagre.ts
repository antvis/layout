import { Graph } from "@antv/graphlib";
import { isNumber } from "@antv/util";
import { layout } from "./dagre/layout";
import type {
  Graph as IGraph,
  Layout,
  LayoutMapping,
  OutNode,
  Node,
  Edge,
  DagreLayoutOptions,
  NodeData,
  EdgeData,
  Point,
} from "./types";
import { cloneFormatData, formatNumberFn, formatNodeSize } from "./util";
// import { handleSingleNodeGraph } from "./util/common";

const DEFAULTS_LAYOUT_OPTIONS: Partial<DagreLayoutOptions> = {
  rankdir: "TB",
  nodesep: 50, // 节点水平间距(px)
  ranksep: 50, // 每一层节点之间间距
  edgeLabelSpace: true,
  controlPoints: false, // 是否保留布局连线的控制点
  radial: false, // 是否基于 dagre 进行辐射布局
  focusNode: null, // radial 为 true 时生效，关注的节点
};

/**
 * Layout arranging the nodes in a circle.
 *
 * @example
 * // Assign layout options when initialization.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = await layout.execute(graph); // { nodes: [], edges: [] }
 *
 * // Or use different options later.
 * const layout = new CircularLayout({ radius: 10 });
 * const positions = await layout.execute(graph, { radius: 20 }); // { nodes: [], edges: [] }
 *
 * // If you want to assign the positions directly to the nodes, use assign method.
 * await layout.assign(graph, { radius: 20 });
 */
export class DagreLayout implements Layout<DagreLayoutOptions> {
  id = "dagre";

  constructor(public options: DagreLayoutOptions = {} as DagreLayoutOptions) {
    this.options = {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...options,
    };
  }

  /**
   * Return the positions of nodes and edges(if needed).
   */
  async execute(graph: IGraph, options?: DagreLayoutOptions) {
    return this.genericDagreLayout(false, graph, options);
  }

  /**
   * To directly assign the positions to the nodes.
   */
  async assign(graph: IGraph, options?: DagreLayoutOptions) {
    await this.genericDagreLayout(true, graph, options);
  }

  private async genericDagreLayout(
    assign: false,
    graph: IGraph,
    options?: DagreLayoutOptions
  ): Promise<LayoutMapping>;
  private async genericDagreLayout(
    assign: true,
    graph: IGraph,
    options?: DagreLayoutOptions
  ): Promise<void>;
  private async genericDagreLayout(
    assign: boolean,
    graph: IGraph,
    options?: DagreLayoutOptions
  ): Promise<LayoutMapping | void> {
    const mergedOptions = { ...this.options, ...options };
    const {
      nodeSize,
      align,
      rankdir = "TB",
      ranksep,
      nodesep,
      ranksepFunc,
      nodesepFunc,
      edgeLabelSpace,
      nodeOrder,
      begin,
      controlPoints,
      // prevGraph,
    } = mergedOptions;

    const g = new Graph<NodeData, EdgeData>({
      tree: [],
    });

    const ranksepfunc = formatNumberFn(ranksep || 50, ranksepFunc);
    const nodesepfunc = formatNumberFn(nodesep || 50, nodesepFunc);
    let horisep: (d?: Node | undefined) => number = nodesepfunc;
    let vertisep: (d?: Node | undefined) => number = ranksepfunc;
    if (rankdir === "LR" || rankdir === "RL") {
      horisep = ranksepfunc;
      vertisep = nodesepfunc;
    }
    const nodeSizeFunc = formatNodeSize(nodeSize, undefined);

    // copy graph to g
    const nodes: Node[] = graph.getAllNodes();
    const edges: Edge[] = graph.getAllEdges();

    nodes
      .filter((node) => node.data.layout !== false)
      .forEach((node) => {
        const size = nodeSizeFunc(node);
        const verti = vertisep(node);
        const hori = horisep(node);
        // FIXME: support 2 dimensions?
        // const width = size[0] + 2 * hori;
        // const height = size[1] + 2 * verti;
        const width = size + 2 * hori;
        const height = size + 2 * verti;
        const layer = node.data.layer;
        if (isNumber(layer)) {
          // 如果有layer属性，加入到node的label中
          g.addNode({
            id: node.id,
            data: { width, height, layer },
          });
        } else {
          g.addNode({
            id: node.id,
            data: { width, height },
          });
        }

        // TODO: combo
        // if (this.sortByCombo && node.comboId) {
        //   if (!comboMap[node.comboId]) {
        //     comboMap[node.comboId] = { id: node.comboId };
        //     g.setNode(node.comboId, {});
        //   }
        //   g.setParent(node.id, node.comboId);
        // }
      });

    edges.forEach((edge) => {
      // dagrejs Wiki https://github.com/dagrejs/dagre/wiki#configuring-the-layout
      if (
        this.layoutNode(g.getNode(edge.source)) &&
        this.layoutNode(g.getNode(edge.target))
      ) {
        g.addEdge({
          id: edge.id,
          source: edge.source,
          target: edge.target,
          data: {
            weight: edge.data.weight || 1,
          },
        });
      }
    });

    // TODO: combo & prevGraph
    layout(g, {
      prevGraph: null,
      edgeLabelSpace,
      keepNodeOrder: !!nodeOrder,
      nodeOrder: nodeOrder || [],
      acyclicer: "greedy",
      ranker: "network-simplex",
      rankdir,
      nodesep,
      align,
    });

    const dBegin = [0, 0];
    if (begin) {
      let minX = Infinity;
      let minY = Infinity;
      g.getAllNodes().forEach((node) => {
        if (minX > node.data.x!) minX = node.data.x!;
        if (minY > node.data.y!) minY = node.data.y!;
      });
      g.getAllEdges().forEach((edge) => {
        edge.data.points?.forEach((point) => {
          if (minX > point.x) minX = point.x;
          if (minY > point.y) minY = point.y;
        });
      });
      dBegin[0] = begin[0] - minX;
      dBegin[1] = begin[1] - minY;
    }

    const isHorizontal = rankdir === "LR" || rankdir === "RL";

    // TODO: radial
    const layerCoords: Set<number> = new Set();
    const isInvert = rankdir === "BT" || rankdir === "RL";
    const layerCoordSort = isInvert
      ? (a: number, b: number) => b - a
      : (a: number, b: number) => a - b;
    g.getAllNodes().forEach((node) => {
      // let ndata: any = this.nodeMap[node];
      // if (!ndata) {
      //   ndata = combos?.find((it) => it.id === node);
      // }
      // if (!ndata) return;
      // ndata.x = node.data.x! + dBegin[0];
      // ndata.y = node.data.y! + dBegin[1];
      // //  pass layer order to data for increment layout use
      // ndata._order = node.data._order;
      // layerCoords.add(isHorizontal ? ndata.x : ndata.y);

      node.data.x = node.data.x! + dBegin[0];
      node.data.y = node.data.y! + dBegin[1];
      layerCoords.add(isHorizontal ? node.data.x : node.data.y);
    });
    const layerCoordsArr = Array.from(layerCoords).sort(layerCoordSort);

    // pre-define the isHorizontal related functions to avoid redundant calc in interations
    const isDifferentLayer = isHorizontal
      ? (point1: Point, point2: Point) => point1.x !== point2.x
      : (point1: Point, point2: Point) => point1.y !== point2.y;
    const filterControlPointsOutOfBoundary = isHorizontal
      ? (ps: Point[], point1: Point, point2: Point) => {
          const max = Math.max(point1.y, point2.y);
          const min = Math.min(point1.y, point2.y);
          return ps.filter((point) => point.y <= max && point.y >= min);
        }
      : (ps: Point[], point1: Point, point2: Point) => {
          const max = Math.max(point1.x, point2.x);
          const min = Math.min(point1.x, point2.x);
          return ps.filter((point) => point.x <= max && point.x >= min);
        };

    g.getAllEdges().forEach((edge, i) => {
      // const i = edges.findIndex((it) => {
      //   return it.source === edge.source && it.target === edge.target;
      // });
      // if (i <= -1) return;
      if (edgeLabelSpace && controlPoints && edge.data.type !== "loop") {
        // const sourceNode = self.nodeMap[edge.v];
        // const targetNode = self.nodeMap[edge.w];
        edge.data.controlPoints = getControlPoints(
          edge.data.points,
          g.getNode(edge.source),
          g.getNode(edge.target),
          layerCoordsArr,
          isHorizontal,
          isDifferentLayer,
          filterControlPointsOutOfBoundary
        );
        edge.data.controlPoints?.forEach((point) => {
          point.x += dBegin[0];
          point.y += dBegin[1];
        });
      }
    });

    // calculated nodes as temporary result
    let layoutNodes: OutNode[] = [];
    // layout according to the original order in the data.nodes
    layoutNodes = g
      .getAllNodes()
      .map((node) => cloneFormatData(node) as OutNode);
    const layoutEdges = g.getAllEdges();

    if (assign) {
      layoutNodes.forEach((node) => {
        graph.mergeNodeData(node.id, {
          x: node.data.x,
          y: node.data.y,
        });
      });
      layoutEdges.forEach((edge) => {
        graph.mergeEdgeData(edge.id, {
          controlPoints: edge.data.controlPoints,
        });
      });
    }

    const result = {
      nodes: layoutNodes,
      edges: layoutEdges,
    };

    return result;
  }

  layoutNode = (node: Node) => {
    return node.data.layout !== false;
  }
}

/**
 * Format controlPoints to avoid polylines crossing nodes
 * @param points
 * @param sourceNode
 * @param targetNode
 * @param layerCoordsArr
 * @param isHorizontal
 * @returns
 */
const getControlPoints = (
  points: Point[] | undefined,
  sourceNode: Node,
  targetNode: Node,
  layerCoordsArr: number[],
  isHorizontal: boolean,
  isDifferentLayer: (point1: Point, point2: Point) => boolean,
  filterControlPointsOutOfBoundary: (
    ps: Point[],
    point1: Point,
    point2: Point
  ) => Point[]
) => {
  let controlPoints = points?.slice(1, points.length - 1) || []; // 去掉头尾
  // 酌情增加控制点，使折线不穿过跨层的节点
  if (sourceNode && targetNode) {
    let { x: sourceX, y: sourceY } = sourceNode.data;
    let { x: targetX, y: targetY } = targetNode.data;
    if (isHorizontal) {
      sourceX = sourceNode.data.y;
      sourceY = sourceNode.data.x;
      targetX = targetNode.data.y;
      targetY = targetNode.data.x;
    }
    // 为跨层级的边增加第一个控制点。忽略垂直的/横向的边。
    // 新控制点 = {
    //   x: 终点x,
    //   y: (起点y + 下一层y) / 2,   #下一层y可能不等于终点y
    // }
    if (targetY !== sourceY && sourceX !== targetX) {
      const sourceLayer = layerCoordsArr.indexOf(sourceY!);
      const sourceNextLayerCoord = layerCoordsArr[sourceLayer + 1];
      if (sourceNextLayerCoord) {
        const firstControlPoint = controlPoints[0];
        const insertStartControlPoint = (
          isHorizontal
            ? {
                x: (sourceY! + sourceNextLayerCoord) / 2,
                y: firstControlPoint?.y || targetX,
              }
            : {
                x: firstControlPoint?.x || targetX,
                y: (sourceY! + sourceNextLayerCoord) / 2,
              }
        ) as Point;
        // 当新增的控制点不存在（!=当前第一个控制点）时添加
        if (
          !firstControlPoint ||
          isDifferentLayer(firstControlPoint, insertStartControlPoint)
        ) {
          controlPoints.unshift(insertStartControlPoint);
        }
      }

      const targetLayer = layerCoordsArr.indexOf(targetY!);
      const layerDiff = Math.abs(targetLayer - sourceLayer);
      if (layerDiff === 1) {
        controlPoints = filterControlPointsOutOfBoundary(
          controlPoints,
          sourceNode.data as Point,
          targetNode.data as Point
        );
        // one controlPoint at least
        if (!controlPoints.length) {
          controlPoints.push(
            (isHorizontal
              ? {
                  x: (sourceY! + targetY!) / 2,
                  y: sourceX,
                }
              : {
                  x: sourceX,
                  y: (sourceY! + targetY!) / 2,
                }) as Point
          );
        }
      } else if (layerDiff > 1) {
        const targetLastLayerCoord = layerCoordsArr[targetLayer - 1];
        if (targetLastLayerCoord) {
          const lastControlPoints = controlPoints[controlPoints.length - 1];
          const insertEndControlPoint = (
            isHorizontal
              ? {
                  x: (targetY! + targetLastLayerCoord) / 2,
                  y: lastControlPoints?.y || targetX,
                }
              : {
                  x: lastControlPoints?.x || sourceX,
                  y: (targetY! + targetLastLayerCoord) / 2,
                }
          ) as Point;
          // 当新增的控制点不存在（!=当前最后一个控制点）时添加
          if (
            !lastControlPoints ||
            isDifferentLayer(lastControlPoints, insertEndControlPoint)
          ) {
            controlPoints.push(insertEndControlPoint);
          }
        }
      }
    }
  }
  return controlPoints;
};

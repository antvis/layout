import { ID, Graph, Node } from '@antv/graphlib';
import { isNumber } from '@antv/util';
import { EdgeData, Graph as IGraph, NodeData } from '../types';

const safeSort = (valueA?: number, valueB?: number) => {
  return Number(valueA) - Number(valueB);
};

/*
 * Adds a dummy node to the graph and return v.
 */
export const addDummyNode = (
  g: IGraph,
  type: string,
  data: NodeData,
  name: string
): ID => {
  let v: ID;
  do {
    v = `${name}${Math.random()}`;
  } while (g.hasNode(v));

  data.dummy = type;
  g.addNode({
    id: v,
    data,
  });

  return v;
};

/*
 * Returns a new graph with only simple edges. Handles aggregation of data
 * associated with multi-edges.
 */
export const simplify = (g: IGraph) => {
  const simplified = new Graph<NodeData, EdgeData>();
  g.getAllNodes().forEach((v) => {
    simplified.addNode({ ...v });
  });
  g.getAllEdges().forEach((e) => {
    const edge = simplified
      .getRelatedEdges(e.source, 'out')
      .find((edge) => edge.target === e.target);
    if (!edge) {
      simplified.addEdge({
        id: e.id,
        source: e.source,
        target: e.target,
        data: {
          weight: e.data.weight! || 0,
          minlen: e.data.minlen! || 1,
        },
      });
    } else {
      simplified.updateEdgeData(edge?.id!, {
        ...edge.data,
        weight: edge.data.weight! + e.data.weight! || 0,
        minlen: Math.max(edge.data.minlen!, e.data.minlen! || 1),
      });
    }
  });
  return simplified;
};

export const asNonCompoundGraph = (g: IGraph): IGraph => {
  const simplified = new Graph();

  g.getAllNodes().forEach((node) => {
    if (!g.getChildren(node.id).length) {
      simplified.addNode({ ...node });
    }
  });

  g.getAllEdges().forEach((edge) => {
    simplified.addEdge(edge);
  });

  return simplified;
};

export const zipObject = <T = any>(keys: ID[], values: T[]) => {
  return keys?.reduce((obj, key, i) => {
    obj[key] = values[i];
    return obj;
  }, {} as Record<ID, T>);
};

export const successorWeights = (g: IGraph) => {
  const weightsMap: Record<ID, Record<string, number>> = {};

  g.getAllNodes().forEach((node) => {
    const sucs: Record<ID, number> = {};
    g.getRelatedEdges(node.id, 'out').forEach((e) => {
      sucs[e.target] = (sucs[e.target] || 0) + (e.data.weight || 0);
    });
    weightsMap[node.id] = sucs;
  });

  return weightsMap;
};

export const predecessorWeights = (g: IGraph) => {
  const nodes = g.getAllNodes();

  const weightMap = nodes.map((v) => {
    const preds: Record<ID, number> = {};
    g.getRelatedEdges(v.id, 'in').forEach((e) => {
      preds[e.source] = (preds[e.source] || 0) + e.data.weight!;
    });
    return preds;
  });
  return zipObject(
    nodes.map((n) => n.id),
    weightMap
  );
};

/*
 * Finds where a line starting at point ({x, y}) would intersect a rectangle
 * ({x, y, width, height}) if it were pointing at the rectangle's center.
 */
export const intersectRect = (
  rect: { x?: number; y?: number; width?: number; height?: number },
  point: { x?: number; y?: number }
) => {
  const x = Number(rect.x);
  const y = Number(rect.y);

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  const dx = Number(point.x) - x;
  const dy = Number(point.y) - y;
  let w = Number(rect.width) / 2;
  let h = Number(rect.height) / 2;

  if (!dx && !dy) {
    // completely overlapped directly, then return points its self
    return { x: 0, y: 0 };
  }

  let sx;
  let sy;

  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = (h * dx) / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = (w * dy) / dx;
  }

  return { x: x + sx, y: y + sy };
};

/*
 * Given a DAG with each node assigned "rank" and "order" properties, this
 * const will produce a matrix with the ids of each node.
 */
export const buildLayerMatrix = (g: IGraph) => {
  const layeringNodes: ID[][] = [];
  const rankMax = maxRank(g) + 1;
  for (let i = 0; i < rankMax; i++) {
    layeringNodes.push([]);
  }

  // const layering = _.map(_.range(maxRank(g) + 1), function() { return []; });
  g.getAllNodes().forEach((node) => {
    const rank = node.data.rank!;
    if (rank !== undefined && layeringNodes[rank]) {
      layeringNodes[rank].push(node.id);
    }
  });

  for (let i = 0; i < rankMax; i++) {
    layeringNodes[i] = layeringNodes[i].sort((va: ID, vb: ID) =>
      safeSort(g.getNode(va).data.order!, g.getNode(vb).data.order!)
    );
  }

  return layeringNodes;
};

/*
 * Adjusts the ranks for all nodes in the graph such that all nodes v have
 * rank(v) >= 0 and at least one node w has rank(w) = 0.
 */
export const normalizeRanks = (g: IGraph) => {
  const nodeRanks = g
    .getAllNodes()
    .filter((v) => v.data.rank !== undefined)
    .map((v) => v.data.rank!);
  const min = Math.min(...nodeRanks);
  g.getAllNodes().forEach((v) => {
    if (v.data.hasOwnProperty('rank') && min !== Infinity) {
      v.data.rank! -= min;
    }
  });
};

export const removeEmptyRanks = (g: IGraph, nodeRankFactor: number = 0) => {
  // Ranks may not start at 0, so we need to offset them
  const nodes = g.getAllNodes();
  const nodeRanks = nodes
    .filter((v) => v.data.rank !== undefined)
    .map((v) => v.data.rank!);

  const offset = Math.min(...nodeRanks);
  const layers: ID[][] = [];

  nodes.forEach((v) => {
    const rank = (v.data.rank! || 0) - offset;

    if (!layers[rank]) {
      layers[rank] = [];
    }
    layers[rank].push(v.id);
  });

  let delta = 0;
  for (let i = 0; i < layers.length; i++) {
    const vs = layers[i];
    if (vs === undefined) {
      if (i % nodeRankFactor !== 0) {
        delta -= 1;
      }
    } else if (delta) {
      vs?.forEach((v: ID) => {
        const node = g.getNode(v);
        if (node) {
          node.data.rank = node.data.rank || 0;
          node.data.rank! += delta;
        }
      });
    }
  }
};

export const addBorderNode = (
  g: IGraph,
  prefix: string,
  rank?: number,
  order?: number
) => {
  const node: NodeData = {
    width: 0,
    height: 0,
  };
  if (isNumber(rank) && isNumber(order)) {
    node.rank = rank;
    node.order = order;
  }
  return addDummyNode(g, 'border', node, prefix);
};

export const maxRank = (g: IGraph) => {
  let maxRank: number;
  g.getAllNodes().forEach((v) => {
    const rank = v.data.rank!;
    if (rank !== undefined) {
      if (maxRank === undefined || rank > maxRank) {
        maxRank = rank;
      }
    }
  });

  if (!maxRank!) {
    maxRank = 0;
  }
  return maxRank;
};

/*
 * Partition a collection into two groups: `lhs` and `rhs`. If the supplied
 * const returns true for an entry it goes into `lhs`. Otherwise it goes
 * into `rhs.
 */
export const partition = <T = any>(
  collection: T[],
  fn: (val: T) => boolean
) => {
  const result = { lhs: [] as T[], rhs: [] as T[] };
  collection?.forEach((value) => {
    if (fn(value)) {
      result.lhs.push(value);
    } else {
      result.rhs.push(value);
    }
  });
  return result;
};

export const minBy = <T = any>(array: T[], func: (param: T) => number) => {
  return array.reduce((a, b) => {
    const valA = func(a);
    const valB = func(b);
    return valA > valB ? b : a;
  });
};

const doDFS = (
  graph: IGraph,
  node: Node<NodeData>,
  postorder: boolean,
  visited: ID[],
  navigator: (n: ID) => Node<NodeData>[],
  result: ID[]
) => {
  if (!visited.includes(node.id)) {
    visited.push(node.id);
    if (!postorder) {
      result.push(node.id);
    }
    navigator(node.id).forEach((n) =>
      doDFS(graph, n, postorder, visited, navigator, result)
    );
    if (postorder) {
      result.push(node.id);
    }
  }
};

/**
 * @description DFS traversal.
 * @description.zh-CN DFS 遍历。
 */
export const dfs = (
  graph: IGraph,
  node: Node<NodeData> | Node<NodeData>[],
  order: 'pre' | 'post',
  isDirected: boolean
) => {
  const nodes = Array.isArray(node) ? node : [node];
  const navigator = (n: ID) =>
    (isDirected ? graph.getSuccessors(n) : graph.getNeighbors(n))!;
  const results: ID[] = [];
  const visited: ID[] = [];
  nodes.forEach((node) => {
    if (!graph.hasNode(node.id)) {
      throw new Error(`Graph does not have node: ${node}`);
    } else {
      doDFS(graph, node, order === 'post', visited, navigator, results);
    }
  });

  return results;
};

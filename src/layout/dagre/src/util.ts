/* eslint "no-console": off */

// "use strict";

// const _ = require("./lodash");
// const Graph = require("./graphlib").Graph;

import { isNumber } from '../../../util';
import { Graph as IGraph } from '../types';
import graphlib from './graphlib';

const Graph = (graphlib as any).Graph;

/*
 * Adds a dummy node to the graph and return v.
 */
const addDummyNode = (g: IGraph, type: any, attrs: any, name: string) => {
  let v;
  do {
    v = `${name}${Math.random()}`;
  } while (g.hasNode(v));

  attrs.dummy = type;
  g.setNode(v, attrs);
  return v;
}

/*
 * Returns a new graph with only simple edges. Handles aggregation of data
 * associated with multi-edges.
 */
const simplify = (g: IGraph) => {
  const simplified = new Graph().setGraph(g.graph());
  g.nodes().forEach((v) => { simplified.setNode(v, g.node(v)); });
  g.edges().forEach((e) => {
    const simpleLabel = simplified.edge(e.v, e.w) || { weight: 0, minlen: 1 };
    const label = g.edge(e);
    simplified.setEdge(e.v, e.w, {
      weight: simpleLabel.weight + label.weight,
      minlen: Math.max(simpleLabel.minlen, label.minlen)
    });
  });
  return simplified;
}

const asNonCompoundGraph = (g: IGraph): IGraph => {
  const simplified = new Graph({ multigraph: g.isMultigraph() }).setGraph(g.graph()) as any;
  g.nodes().forEach((v) => {
    if (!g.children(v)?.length) {
      simplified.setNode(v, g.node(v));
    }
  });
  g.edges().forEach((e) => simplified.setEdge(e, g.edge(e)));
  return simplified;
}

const zipObject = (keys: string[], values: any) => {
  const result: any = {};
  keys.forEach((key, i) => {
    result[key] = values[i];
  });
  return result;
}

const successorWeights = (g: IGraph) => {
  const weightMap = g.nodes().map((v: string) => {
    const sucs: any = {};
    g.outEdges(v)?.forEach((e) => {
      sucs[e.w] = (sucs[e.w] || 0) + g.edge(e).weight;
    });
    return sucs;
  });
  return zipObject(g.nodes(), weightMap);
}

const predecessorWeights = (g: IGraph) => {
  const weightMap = g.nodes().map((v) => {
    const preds: any = {};
    g.inEdges(v)?.forEach((e) => {
      preds[e.v] = (preds[e.v] || 0) + g.edge(e).weight;
    });
    return preds;
  });
  return zipObject(g.nodes(), weightMap);
}

/*
 * Finds where a line starting at point ({x, y}) would intersect a rectangle
 * ({x, y, width, height}) if it were pointing at the rectangle's center.
 */
const intersectRect = (rect: any, point: any) => {
  const x = rect.x;
  const y = rect.y;

  // Rectangle intersection algorithm from:
  // http://math.stackexchange.com/questions/108113/find-edge-between-two-boxes
  const dx = point.x - x;
  const dy = point.y - y;
  let w = rect.width / 2;
  let h = rect.height / 2;

  if (!dx && !dy) {
    throw new Error("Not possible to find intersection inside of the rectangle");
  }

  let sx, sy;
  if (Math.abs(dy) * w > Math.abs(dx) * h) {
    // Intersection is top or bottom of rect.
    if (dy < 0) {
      h = -h;
    }
    sx = h * dx / dy;
    sy = h;
  } else {
    // Intersection is left or right of rect.
    if (dx < 0) {
      w = -w;
    }
    sx = w;
    sy = w * dy / dx;
  }

  return { x: x + sx, y: y + sy };
}

/*
 * Given a DAG with each node assigned "rank" and "order" properties, this
 * const will produce a matrix with the ids of each node.
 */
const buildLayerMatrix = (g: IGraph) => {
  const layering: any = [];
  const rankMax = maxRank(g) + 1;
  for (let i = 0; i < rankMax; i++) {
    layering.push([]);
  }
  // const layering = _.map(_.range(maxRank(g) + 1), function() { return []; });
  g.nodes().forEach((v: string) => {
    const node = g.node(v);
    const rank = node.rank;
    if (rank !== undefined) {
      layering[rank][node.order || 0] = v;
    }
  });
  return layering;
}

/*
 * Adjusts the ranks for all nodes in the graph such that all nodes v have
 * rank(v) >= 0 and at least one node w has rank(w) = 0.
 */
const normalizeRanks = (g: IGraph) => {
  const nodeRanks = g.nodes().map(v => (g.node(v).rank as number));
  const min = Math.min(...nodeRanks);
  g.nodes().forEach((v) => {
    const node = g.node(v);
    if (node.hasOwnProperty("rank")) {
      if (!node.rank) node.rank = 0;
      node.rank -= min;
    }
  });
}

const removeEmptyRanks = (g: IGraph) => {
  // Ranks may not start at 0, so we need to offset them
  const nodeRanks = g.nodes().map(v => (g.node(v).rank as number));
  const offset = Math.min(...nodeRanks);

  const layers: any = [];
  g.nodes().forEach((v) => {
    const rank = (g.node(v)?.rank || 0) - offset;
    if (!layers[rank]) {
      layers[rank] = [];
    }
    layers[rank].push(v);
  });

  let delta = 0;
  const nodeRankFactor = g.graph().nodeRankFactor || 0;
  layers.forEach((vs: any, i: number) => {
    if (vs === undefined && i % nodeRankFactor !== 0) {
      --delta;
    } else if (delta) {
      vs.forEach((v: string) => {
        if (!g.node(v).rank) g.node(v).rank = 0;
        (g.node(v).rank as any) += delta;
      });
    }
  });
}

const addBorderNode = (g: IGraph, prefix: string, rank?: number, order?: number) => {
  const node: any = {
    width: 0,
    height: 0
  };
  if (isNumber(rank) && isNumber(order)) {
    node.rank = rank;
    node.order = order;
  }
  return addDummyNode(g, "border", node, prefix);
}

const maxRank = (g: IGraph) => {
  const nodeRanks = g.nodes().map(v => {
    const rank = g.node(v).rank;
    if (rank !== undefined) {
      return rank;
    }
    return -Infinity;
  })
  return Math.max(...nodeRanks);
}

/*
 * Partition a collection into two groups: `lhs` and `rhs`. If the supplied
 * const returns true for an entry it goes into `lhs`. Otherwise it goes
 * into `rhs.
 */
const partition = (collection: any, fn: any) => {
  const result = { lhs: [] as any, rhs: [] as any };
  collection.forEach((value: any) => {
    if (fn(value)) {
      result.lhs.push(value);
    } else {
      result.rhs.push(value);
    }
  });
  return result;
}

/*
 * Returns a new const that wraps `fn` with a timer. The wrapper logs the
 * time it takes to execute the function.
 */
const time = (name: string, fn: () => unknown) => {
  const start = Date.now();
  try {
    return fn();
  } finally {
    console.log(name + " time: " + (Date.now() - start) + "ms");
  }
}

const notime = (name: string, fn: () => unknown) => {
  return fn();
}


const minBy = (array: any, func: (param: any) => number) => {
  let min = Infinity;
  let minObject;
  array.forEach((item: any) => {
    const value = func(item);
    if (min > value) {
      min = value;
      minObject = item;
    }
  });
  return minObject;
}

export {
  addDummyNode,
  simplify,
  asNonCompoundGraph,
  successorWeights,
  predecessorWeights,
  intersectRect,
  buildLayerMatrix,
  normalizeRanks,
  removeEmptyRanks,
  addBorderNode,
  maxRank,
  partition,
  time,
  notime,
  zipObject,
  minBy
}

export default {
  addDummyNode,
  simplify,
  asNonCompoundGraph,
  successorWeights,
  predecessorWeights,
  intersectRect,
  buildLayerMatrix,
  normalizeRanks,
  removeEmptyRanks,
  addBorderNode,
  maxRank,
  partition,
  time,
  notime,
  zipObject,
  minBy
};
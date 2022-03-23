import { isNumber } from "../../../util";
import { Graph, Node } from "../graph";

const safeSort = (valueA?: number, valueB?: number) => {
  return Number(valueA) - Number(valueB);
};

/*
 * Adds a dummy node to the graph and return v.
 */
export const addDummyNode = (
  g: Graph,
  type: string,
  attrs: Node<Record<string, any>>,
  name: string
) => {
  let v;
  do {
    v = `${name}${Math.random()}`;
  } while (g.hasNode(v));

  attrs.dummy = type;
  g.setNode(v, attrs);

  return v;
};

/*
 * Returns a new graph with only simple edges. Handles aggregation of data
 * associated with multi-edges.
 */
export const simplify = (g: Graph) => {
  const simplified = new Graph().setGraph(g.graph());
  g.nodes().forEach((v) => { simplified.setNode(v, g.node(v)); });
  g.edges().forEach((e) => {
    const simpleLabel = simplified.edgeFromArgs(e.v, e.w) || { weight: 0, minlen: 1 };
    const label = g.edge(e)!;
    simplified.setEdge(e.v, e.w, {
      weight: simpleLabel.weight! + label.weight!,
      minlen: Math.max(simpleLabel.minlen!, label.minlen!)
    });
  });
  return simplified;
};

export const asNonCompoundGraph = (g: Graph) => {
  const simplified = new Graph({ multigraph: g.isMultigraph() }).setGraph(
    g.graph()
  );
  g.nodes().forEach((node) => {
    if (!g.children(node)?.length) {
      simplified.setNode(node, g.node(node));
    }
  });

  g.edges().forEach((edge) => {
    simplified.setEdgeObj(edge, g.edge(edge));
  });

  return simplified;
};

export const zipObject = <T = any>(keys: string[], values: T[]) => {
  return keys?.reduce((obj, key, i) => {
    obj[key] = values[i];
    return obj;
  }, {} as Record<string, T>);
};

export const successorWeights = (g: Graph) => {
  const weightsMap: Record<string, Record<string, number>> = {};

  g.nodes().forEach((node) => {
    const sucs: Record<string, number> = {};
    g.outEdges(node)?.forEach((e) => {
      sucs[e.w] = (sucs[e.w] || 0) + (g.edge(e)?.weight || 0);
    });
    weightsMap[node] = sucs;
  });

  return weightsMap;
};



export const predecessorWeights = (g: Graph) => {
  const nodes = g.nodes();

  const weightMap = nodes.map((v) => {
    const preds: Record<string, number> = {};
    g.inEdges(v)?.forEach((e) => {
      preds[e.v] = (preds[e.v] || 0) + g.edge(e)!.weight!;
    });
    return preds;
  });
  return zipObject(nodes, weightMap);
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
export const buildLayerMatrix = (g: Graph) => {
  const layeringNodes: string[][] = [];
  const rankMax = maxRank(g) + 1;
  for (let i = 0; i < rankMax; i++) {
    layeringNodes.push([]);
  }
  
  // const layering = _.map(_.range(maxRank(g) + 1), function() { return []; });
  g.nodes().forEach((v: string) => {
    const node = g.node(v)!;
    const rank = node.rank;
    if (rank !== undefined && layeringNodes[rank]) {
      layeringNodes[rank].push(v);
    }
  });

  for (let i = 0; i < rankMax; i++) {
    layeringNodes[i] = layeringNodes[i].sort((va: string, vb: string) =>
      safeSort(g.node(va)?.order, g.node(vb)?.order)
    );
  }

  return layeringNodes;
};

/*
 * Adjusts the ranks for all nodes in the graph such that all nodes v have
 * rank(v) >= 0 and at least one node w has rank(w) = 0.
 */
export const normalizeRanks = (g: Graph) => {
  const nodeRanks = g
    .nodes()
    .filter((v) => g.node(v)?.rank !== undefined)
    .map((v) => g.node(v)!.rank!);
  const min = Math.min(...nodeRanks);
  g.nodes().forEach((v) => {
    const node = g.node(v)!;
    if (node.hasOwnProperty("rank") && min !== Infinity) {
      node.rank! -= min;
    }
  });
};

export const removeEmptyRanks = (g: Graph) => {
  // Ranks may not start at 0, so we need to offset them
  const nodes = g.nodes();
  const nodeRanks = nodes
    .filter((v) => g.node(v)?.rank !== undefined)
    .map((v) => g.node(v)!.rank as number);

  const offset = Math.min(...nodeRanks);
  const layers: string[][] = [];

  nodes.forEach((v) => {
    const rank = (g.node(v)?.rank || 0) - offset;

    if (!layers[rank]) {
      layers[rank] = [];
    }
    layers[rank].push(v);
  });

  let delta = 0;
  const nodeRankFactor = g.graph().nodeRankFactor || 0;

  for (let i = 0; i < layers.length; i++) {
    const vs = layers[i];
    if (vs === undefined) {
      if (i % nodeRankFactor !== 0) {
        delta -= 1;
      }
    } else if (delta) {
      vs?.forEach((v: string) => {
        const node = g.node(v);
        if (node) {
          node.rank = node.rank || 0;
          node.rank += delta;
        }
      });
    }
  }
};

export const addBorderNode = (
  g: Graph,
  prefix: string,
  rank?: number,
  order?: number
) => {
  const node: Node = {
    width: 0,
    height: 0
  };
  if (isNumber(rank) && isNumber(order)) {
    node.rank = rank;
    node.order = order;
  }
  return addDummyNode(g, "border", node, prefix);
};

export const maxRank = (g: Graph) => {
  let maxRank: number;
  g.nodes().forEach((v) => {
    const rank = g.node(v)?.rank;
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

/*
 * Returns a new const that wraps `fn` with a timer. The wrapper logs the
 * time it takes to execute the function.
 */
export const time = (name: string, fn: () => void) => {
  const start = Date.now();
  try {
    return fn();
  } finally {
    console.log(`${name} time: ${Date.now() - start}ms`);
  }
};

export const notime = (name: string, fn: () => void) => {
  return fn();
};

export const minBy = <T = any>(array: T[], func: (param: T) => number) => {
  return array.reduce((a, b) => {
    const valA = func(a);
    const valB = func(b);
    return valA > valB ? b : a;
  });
};

/*
 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
 * and Simple Horizontal Coordinate Assignment."
 */
import { Graph as RawGraph } from "@antv/graphlib";
import { Graph } from "../../graph";
import { max, min } from '@antv/util';
import { buildLayerMatrix, minBy } from "../util";

class BlockGraph extends RawGraph<string, string, number> {}

/*
 * Marks all edges in the graph with a type-1 conflict with the "type1Conflict"
 * property. A type-1 conflict is one where a non-inner segment crosses an
 * inner segment. An inner segment is an edge with both incident nodes marked
 * with the "dummy" property.
 *
 * This algorithm scans layer by layer, starting with the second, for type-1
 * conflicts between the current layer and the previous layer. For each layer
 * it scans the nodes from left to right until it reaches one that is incident
 * on an inner segment. It then scans predecessors to determine if they have
 * edges that cross that inner segment. At the end a final scan is done for all
 * nodes on the current rank to see if they cross the last visited inner
 * segment.
 *
 * This algorithm (safely) assumes that a dummy node will only be incident on a
 * single node in the layers being scanned.
 */

type Conflicts = Record<string, Record<string, boolean>>;

export const findType1Conflicts = (g: Graph, layering?: string[][]) => {
  const conflicts = {};

  const visitLayer = (prevLayer: string[], layer: string[]) => {
    // last visited node in the previous layer that is incident on an inner
    // segment.
    let k0 = 0;
    // Tracks the last node in this layer scanned for crossings with a type-1
    // segment.
    let scanPos = 0;
    const prevLayerLength = prevLayer.length;
    const lastNode = layer?.[layer?.length - 1];

    layer?.forEach((v: string, i: number) => {
      const w = findOtherInnerSegmentNode(g, v);
      const k1 = w ? g.node(w)!.order! : prevLayerLength;

      if (w || v === lastNode) {
        layer.slice(scanPos, i + 1)?.forEach((scanNode) => {
          g.predecessors(scanNode)?.forEach((u) => {
            const uLabel = g.node(u)!;
            const uPos = uLabel.order as number;
            if (
              (uPos < k0 || k1 < uPos) &&
              !(uLabel.dummy && g.node(scanNode)?.dummy)
            ) {
              addConflict(conflicts, u, scanNode);
            }
          });
        });
        scanPos = i + 1;
        k0 = k1;
      }
    });

    return layer;
  };

  if (layering?.length) {
    layering.reduce(visitLayer);
  }
  return conflicts;
};

export const findType2Conflicts = (g: Graph, layering?: string[][]) => {
  const conflicts = {};

  function scan(
    south: string[],
    southPos: number,
    southEnd: number,
    prevNorthBorder: number,
    nextNorthBorder: number
  ) {
    let v: string;
    for (let i = southPos; i < southEnd; i++) {
      v = south[i];
      if (g.node(v)?.dummy) {
        g.predecessors(v)?.forEach((u) => {
          const uNode = g.node(u)!;
          if (
            uNode.dummy &&
            ((uNode.order as number) < prevNorthBorder ||
              (uNode.order as number) > nextNorthBorder)
          ) {
            addConflict(conflicts, u, v);
          }
        });
      }
    }
  };

  function getScannedKey(params: Parameters<typeof scan>) {
      // south数组可能很大，不适合做key
      return JSON.stringify(params.slice(1));
  }
  
  function scanIfNeeded(params: Parameters<typeof scan>, scanCache: Map<string, boolean>) {
    const cacheKey = getScannedKey(params);
    
    if (scanCache.get(cacheKey)) return;

    scan(...params);
    scanCache.set(cacheKey, true);
  }
  
  const visitLayer = (north: string[], south: string[]) => {
    let prevNorthPos = -1;
    let nextNorthPos: number;
    let southPos = 0;

    const scanned = new Map<string, boolean>();

    south?.forEach((v: string, southLookahead: number) => {
      if (g.node(v)?.dummy === "border") {
        const predecessors = g.predecessors(v) || [];
        if (predecessors.length) {
          nextNorthPos = g.node(predecessors[0]!)!.order as number;
          scanIfNeeded(
            [south, southPos, southLookahead, prevNorthPos, nextNorthPos],
            scanned
          );
          southPos = southLookahead;
          prevNorthPos = nextNorthPos;
        }
      }
      scanIfNeeded(
        [south, southPos, south.length, nextNorthPos, north.length],
        scanned
      );
    });

    return south;
  };

  if (layering?.length) {
    layering.reduce(visitLayer);
  }
  return conflicts;
};

export const findOtherInnerSegmentNode = (g: Graph, v: string) => {
  if (g.node(v)?.dummy) {
    return g.predecessors(v)?.find((u) => g.node(u)!.dummy);
  }
};

export const addConflict = (conflicts: Conflicts, v: string, w: string) => {
  let vv = v;
  let ww = w;
  if (vv > ww) {
    const tmp = vv;
    vv = ww;
    ww = tmp;
  }

  let conflictsV = conflicts[vv];
  if (!conflictsV) {
    conflicts[vv] = conflictsV = {};
  }
  conflictsV[ww] = true;
};

export const hasConflict = (conflicts: Conflicts, v: string, w: string) => {
  let vv = v;
  let ww = w;
  if (vv > ww) {
    const tmp = v;
    vv = ww;
    ww = tmp;
  }
  return !!conflicts[vv];
};

/*
 * Try to align nodes into vertical "blocks" where possible. This algorithm
 * attempts to align a node with one of its median neighbors. If the edge
 * connecting a neighbor is a type-1 conflict then we ignore that possibility.
 * If a previous node has already formed a block with a node after the node
 * we're trying to form a block with, we also ignore that possibility - our
 * blocks would be split in that scenario.
 */
export const verticalAlignment = (
  g: Graph,
  layering: string[][],
  conflicts: Conflicts,
  neighborFn: (v: string) => string[]
) => {
  const root: Record<string, string> = {};
  const align: Record<string, string> = {};
  const pos: Record<string, number> = {};

  // We cache the position here based on the layering because the graph and
  // layering may be out of sync. The layering matrix is manipulated to
  // generate different extreme alignments.
  layering?.forEach((layer) => {
    layer?.forEach((v, order: number) => {
      root[v] = v;
      align[v] = v;
      pos[v] = order;
    });
  });

  layering?.forEach((layer) => {
    let prevIdx = -1;
    layer?.forEach((v) => {
      let ws = neighborFn(v);
      if (ws.length) {
        ws = ws.sort((a: string, b: string) => pos[a] - pos[b]);
        const mp = (ws.length - 1) / 2;
        for (let i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
          const w = ws[i];
          if (
            align[v] === v &&
            prevIdx < pos[w] &&
            !hasConflict(conflicts, v, w)
          ) {
            align[w] = v;
            align[v] = root[v] = root[w];
            prevIdx = pos[w];
          }
        }
      }
    });
  });

  return { root, align };
};

export const horizontalCompaction = (
  g: Graph,
  layering: string[][],
  root: Record<string, string>,
  align: Record<string, string>,
  reverseSep?: boolean
) => {
  // This portion of the algorithm differs from BK due to a number of problems.
  // Instead of their algorithm we construct a new block graph and do two
  // sweeps. The first sweep places blocks with the smallest possible
  // coordinates. The second sweep removes unused space by moving blocks to the
  // greatest coordinates without violating separation.
  const xs: Record<string, number> = {};
  const blockG = buildBlockGraph(g, layering, root, reverseSep);
  const borderType = reverseSep ? "borderLeft" : "borderRight";

  const iterate = (
    setXsFunc: (param: string) => void,
    nextNodesFunc: (param: string) => string
  ) => {
    let stack = blockG.nodes();
    let elem = stack.pop();
    const visited: Record<string, boolean> = {};
    while (elem) {
      if (visited[elem]) {
        setXsFunc(elem);
      } else {
        visited[elem] = true;
        stack.push(elem);
        stack = stack.concat(nextNodesFunc(elem));
      }

      elem = stack.pop();
    }
  };

  // First pass, assign smallest coordinates
  const pass1 = (elem: string) => {
    xs[elem] = (blockG.inEdges(elem) || []).reduce((acc: number, e) => {
      return Math.max(acc, (xs[e.v] || 0) + blockG.edge(e)!);
    }, 0);
  };

  // Second pass, assign greatest coordinates
  const pass2 = (elem: string) => {
    const min = (blockG.outEdges(elem) || []).reduce((acc: number, e) => {
      return Math.min(acc, (xs[e.w] || 0) - blockG.edge(e)!);
    }, Number.POSITIVE_INFINITY);

    const node = g.node(elem)!;
    if (min !== Number.POSITIVE_INFINITY && node.borderType !== borderType) {
      xs[elem] = Math.max(xs[elem], min);
    }
  };

  iterate(pass1, blockG.predecessors.bind(blockG));
  iterate(pass2, blockG.successors.bind(blockG));

  // Assign x coordinates to all nodes
  Object.values(align)?.forEach((v) => {
    xs[v] = xs[root[v]];
  });

  return xs;
};

export const buildBlockGraph = (
  g: Graph,
  layering: string[][],
  root: Record<string, string>,
  reverseSep?: boolean
) => {
  const blockGraph = new BlockGraph();
  const graphLabel = g.graph();
  const sepFn = sep(
    graphLabel.nodesep as number,
    graphLabel.edgesep as number,
    reverseSep as boolean
  );

  layering?.forEach((layer) => {
    let u: string;
    layer?.forEach((v) => {
      const vRoot = root[v];
      blockGraph.setNode(vRoot);
      if (u) {
        const uRoot = root[u];
        const prevMax = blockGraph.edgeFromArgs(uRoot, vRoot);
        blockGraph.setEdge(
          uRoot,
          vRoot,
          Math.max(sepFn(g, v, u), prevMax || 0)
        );
      }
      u = v;
    });
  });

  return blockGraph;
};
/*
 * Returns the alignment that has the smallest width of the given alignments.
 */
export const findSmallestWidthAlignment = (
  g: Graph,
  xss: Record<string, Record<string, number>>
) => {
  return minBy(Object.values(xss), (xs) => {
    let max = Number.NEGATIVE_INFINITY;
    let min = Number.POSITIVE_INFINITY;

    Object.keys(xs)?.forEach((v: string) => {
      const x = xs[v];
      const halfWidth = width(g, v) / 2;

      max = Math.max(x + halfWidth, max);
      min = Math.min(x - halfWidth, min);
    });

    return max - min;
  });
};

/*
 * Align the coordinates of each of the layout alignments such that
 * left-biased alignments have their minimum coordinate at the same point as
 * the minimum coordinate of the smallest width alignment and right-biased
 * alignments have their maximum coordinate at the same point as the maximum
 * coordinate of the smallest width alignment.
 */
export function alignCoordinates(
  xss: Record<string, Record<string, number>>,
  alignTo: Record<string, number>
) {
  const alignToVals = Object.values(alignTo);
  const alignToMin = min(alignToVals)!;
  const alignToMax = max(alignToVals)!;

  ["u", "d"].forEach((vert) => {
    ["l", "r"].forEach((horiz) => {
      const alignment = vert + horiz;
      const xs = xss[alignment];
      let delta: number;
      if (xs === alignTo) return;

      const xsVals = Object.values(xs);
      delta =
        horiz === "l"
          ? alignToMin - min(xsVals)!
          : alignToMax - max(xsVals)!;

      if (delta) {
        xss[alignment] = {};
        Object.keys(xs).forEach((key) => {
          xss[alignment][key] = xs[key] + delta;
        });
      }
    });
  });
}

export const balance = (
  xss: Record<string, Record<string, number>>,
  align?: string
) => {
  const result: Record<string, number> = {};
  Object.keys(xss.ul).forEach((key) => {
    if (align) {
      result[key] = xss[align.toLowerCase()][key];
    } else {
      const values = Object.values(xss).map((x) => x[key]);
      result[key] = (values[0] + values[1]) / 2; // (ur + ul) / 2
    }
  });
  return result;
};

export const positionX = (g: Graph) => {
  const layering = buildLayerMatrix(g);
  const conflicts = Object.assign(
    findType1Conflicts(g, layering),
    findType2Conflicts(g, layering)
  );

  const xss: Record<string, Record<string, number>> = {};
  let adjustedLayering: string[][];
  ["u", "d"].forEach((vert) => {
    adjustedLayering =
      vert === "u" ? layering : Object.values(layering).reverse();
    ["l", "r"].forEach((horiz) => {
      if (horiz === "r") {
        adjustedLayering = adjustedLayering.map((inner) =>
          Object.values(inner).reverse()
        );
      }

      const neighborFn = (vert === "u" ? g.predecessors : g.successors).bind(g);
      const align = verticalAlignment(
        g,
        adjustedLayering,
        conflicts,
        neighborFn
      );
      const xs = horizontalCompaction(
        g,
        adjustedLayering,
        align.root,
        align.align,
        horiz === "r"
      );
      if (horiz === "r") {
        Object.keys(xs).forEach((key) => {
          xs[key] = -xs[key];
        });
      }
      xss[vert + horiz] = xs;
    });
  });

  const smallestWidth = findSmallestWidthAlignment(g, xss);
  alignCoordinates(xss, smallestWidth);
  return balance(xss, g.graph().align as string);
};

export const sep = (nodeSep: number, edgeSep: number, reverseSep: boolean) => {
  return (g: Graph, v: string, w: string) => {
    const vLabel = g.node(v)!;
    const wLabel = g.node(w)!;
    let sum = 0;
    let delta;

    sum += vLabel.width! / 2;
    if (vLabel.hasOwnProperty("labelpos")) {
      switch ((vLabel.labelpos || "").toLowerCase()) {
        case "l":
          delta = -vLabel.width! / 2;
          break;
        case "r":
          delta = vLabel.width! / 2;
          break;
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;

    sum += (vLabel.dummy ? edgeSep : nodeSep) / 2;
    sum += (wLabel.dummy ? edgeSep : nodeSep) / 2;

    sum += wLabel.width! / 2;
    if (wLabel.labelpos) {
      switch ((wLabel.labelpos || "").toLowerCase()) {
        case "l":
          delta = wLabel.width! / 2;
          break;
        case "r":
          delta = -wLabel.width! / 2;
          break;
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;

    return sum;
  };
};

export const width = (g: Graph, v: string) => g.node(v)!.width || 0;

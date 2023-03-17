/*
 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
 * and Simple Horizontal Coordinate Assignment."
 */
import { Graph, ID, Node } from "@antv/graphlib";
import { Graph as IGraph, NodeData } from "../../types";
import { buildLayerMatrix, minBy } from "../util";

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

type Conflicts = Record<ID, Record<ID, boolean>>;

export const findType1Conflicts = (g: IGraph, layering?: ID[][]) => {
  const conflicts = {};

  const visitLayer = (prevLayer: ID[], layer: ID[]) => {
    // last visited node in the previous layer that is incident on an inner
    // segment.
    let k0 = 0;
    // Tracks the last node in this layer scanned for crossings with a type-1
    // segment.
    let scanPos = 0;
    const prevLayerLength = prevLayer.length;
    const lastNode = layer?.[layer?.length - 1];

    layer?.forEach((v: ID, i: number) => {
      const w = findOtherInnerSegmentNode(g, v);
      const k1 = w ? (g.getNode(w.id)!.data.order! as number) : prevLayerLength;

      if (w || v === lastNode) {
        layer.slice(scanPos, i + 1)?.forEach((scanNode) => {
          g.getPredecessors(scanNode)?.forEach((u) => {
            const uLabel = g.getNode(u.id)!;
            const uPos = uLabel.data.order as number;
            if (
              (uPos < k0 || k1 < uPos) &&
              !(uLabel.data.dummy && g.getNode(scanNode)?.data.dummy)
            ) {
              addConflict(conflicts, u.id, scanNode);
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

export const findType2Conflicts = (g: IGraph, layering?: ID[][]) => {
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
      if (g.getNode(v)?.data.dummy) {
        g.getPredecessors(v)?.forEach((u) => {
          const uNode = g.getNode(u.id)!;
          if (
            uNode.data.dummy &&
            ((uNode.data.order as number) < prevNorthBorder ||
              (uNode.data.order as number) > nextNorthBorder)
          ) {
            addConflict(conflicts, u.id, v);
          }
        });
      }
    }
  }

  function getScannedKey(params: Parameters<typeof scan>) {
    // south数组可能很大，不适合做key
    return JSON.stringify(params.slice(1));
  }

  function scanIfNeeded(
    params: Parameters<typeof scan>,
    scanCache: Map<string, boolean>
  ) {
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
      if (g.getNode(v)?.data.dummy === "border") {
        const predecessors = g.getPredecessors(v) || [];
        if (predecessors.length) {
          nextNorthPos = g.getNode(predecessors[0].id)!.data.order as number;
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

export const findOtherInnerSegmentNode = (g: IGraph, v: ID) => {
  if (g.getNode(v)?.data.dummy) {
    return g.getPredecessors(v)?.find((u) => g.getNode(u.id).data.dummy);
  }
};

export const addConflict = (conflicts: Conflicts, v: ID, w: ID) => {
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

export const hasConflict = (conflicts: Conflicts, v: ID, w: ID) => {
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
  g: IGraph,
  layering: ID[][],
  conflicts: Conflicts,
  neighborFn: (v: ID) => Node<NodeData>[]
) => {
  const root: Record<ID, ID> = {};
  const align: Record<ID, ID> = {};
  const pos: Record<ID, number> = {};

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
      let ws = neighborFn(v).map((n) => n.id);

      if (ws.length) {
        ws = ws.sort((a: ID, b: ID) => pos[a] - pos[b]);
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
  g: IGraph,
  layering: ID[][],
  root: Record<ID, ID>,
  align: Record<ID, ID>,
  nodesep: number,
  edgesep: number,
  reverseSep?: boolean
) => {
  // This portion of the algorithm differs from BK due to a number of problems.
  // Instead of their algorithm we construct a new block graph and do two
  // sweeps. The first sweep places blocks with the smallest possible
  // coordinates. The second sweep removes unused space by moving blocks to the
  // greatest coordinates without violating separation.
  const xs: Record<ID, number> = {};
  const blockG = buildBlockGraph(
    g,
    layering,
    root,
    nodesep,
    edgesep,
    reverseSep
  );
  const borderType = reverseSep ? "borderLeft" : "borderRight";

  const iterate = (
    setXsFunc: (param: ID) => void,
    nextNodesFunc: (param: ID) => Node<NodeData>
  ) => {
    let stack = blockG.getAllNodes();
    let elem = stack.pop();
    const visited: Record<ID, boolean> = {};
    while (elem) {
      if (visited[elem.id]) {
        setXsFunc(elem.id);
      } else {
        visited[elem.id] = true;
        stack.push(elem);
        stack = stack.concat(nextNodesFunc(elem.id));
      }

      elem = stack.pop();
    }
  };

  // First pass, assign smallest coordinates
  const pass1 = (elem: ID) => {
    xs[elem] = (blockG.getRelatedEdges(elem, "in") || []).reduce(
      (acc: number, e) => {
        return Math.max(acc, (xs[e.source] || 0) + e.data.weight!);
      },
      0
    );
  };

  // Second pass, assign greatest coordinates
  const pass2 = (elem: ID) => {
    const min = (blockG.getRelatedEdges(elem, "out") || []).reduce(
      (acc: number, e) => {
        return Math.min(acc, (xs[e.target] || 0) - e.data.weight!);
      },
      Number.POSITIVE_INFINITY
    );

    const node = g.getNode(elem)!;
    if (
      min !== Number.POSITIVE_INFINITY &&
      node.data.borderType !== borderType
    ) {
      xs[elem] = Math.max(xs[elem], min);
    }
  };

  iterate(pass1, blockG.getPredecessors.bind(blockG));
  iterate(pass2, blockG.getSuccessors.bind(blockG));

  // Assign x coordinates to all nodes
  Object.values(align)?.forEach((v) => {
    xs[v] = xs[root[v]];
  });

  return xs;
};

export const buildBlockGraph = (
  g: IGraph,
  layering: ID[][],
  root: Record<ID, ID>,
  nodesep: number,
  edgesep: number,
  reverseSep?: boolean
): IGraph => {
  const blockGraph = new Graph();
  const sepFn = sep(nodesep, edgesep, reverseSep as boolean);

  layering?.forEach((layer) => {
    let u: ID;
    layer?.forEach((v) => {
      const vRoot = root[v];
      if (!blockGraph.hasNode(vRoot)) {
        blockGraph.addNode({
          id: vRoot,
          data: {},
        });
      }
      if (u) {
        const uRoot = root[u];
        // FIXME: should we support multi-edges?
        // const prevMax = blockGraph.edgeFromArgs(uRoot, vRoot);
        blockGraph.addEdge({
          id: `e${Math.random()}`,
          source: uRoot,
          target: vRoot,
          data: {
            weight: Math.max(sepFn(g, v, u), 0),
          },
        });
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
  g: IGraph,
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
  // @ts-ignore
  const alignToVals = Object.values(alignTo) as number[];
  const alignToMin = Math.min(...alignToVals);
  const alignToMax = Math.max(...alignToVals);

  ["u", "d"].forEach((vert) => {
    ["l", "r"].forEach((horiz) => {
      const alignment = vert + horiz;
      const xs = xss[alignment];
      let delta: number;
      if (xs === alignTo) return;

      const xsVals = Object.values(xs) as number[];
      delta =
        horiz === "l"
          ? alignToMin - Math.min(...xsVals)
          : alignToMax - Math.max(...xsVals);

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

export const positionX = (
  g: IGraph,
  options?: Partial<{
    align: string;
    nodesep: number;
    edgesep: number;
  }>
) => {
  const { align: graphAlign = "", nodesep = 0, edgesep = 0 } = options || {};

  const layering = buildLayerMatrix(g);
  const conflicts = Object.assign(
    findType1Conflicts(g, layering),
    findType2Conflicts(g, layering)
  );

  const xss: Record<string, Record<ID, number>> = {};
  let adjustedLayering: ID[][];
  ["u", "d"].forEach((vert) => {
    adjustedLayering =
      vert === "u" ? layering : Object.values(layering).reverse();
    ["l", "r"].forEach((horiz) => {
      if (horiz === "r") {
        adjustedLayering = adjustedLayering.map((inner) =>
          Object.values(inner).reverse()
        );
      }

      const neighborFn = (
        vert === "u" ? g.getPredecessors : g.getSuccessors
      ).bind(g);
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
        nodesep,
        edgesep,
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
  return balance(xss, graphAlign);
};

export const sep = (nodeSep: number, edgeSep: number, reverseSep: boolean) => {
  return (g: IGraph, v: ID, w: ID) => {
    const vLabel = g.getNode(v)!;
    const wLabel = g.getNode(w)!;
    let sum = 0;
    let delta: number = 0;

    sum += (vLabel.data.width as number) / 2;
    if (vLabel.data.hasOwnProperty("labelpos")) {
      switch (((vLabel.data.labelpos as string) || "").toLowerCase()) {
        case "l":
          delta = (-vLabel.data.width! as number) / 2;
          break;
        case "r":
          delta = (vLabel.data.width! as number) / 2;
          break;
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;

    sum += (vLabel.data.dummy ? edgeSep : nodeSep) / 2;
    sum += (wLabel.data.dummy ? edgeSep : nodeSep) / 2;

    sum += (wLabel.data.width! as number) / 2;
    if (wLabel.data.labelpos) {
      switch (((wLabel.data.labelpos as string) || "").toLowerCase()) {
        case "l":
          delta = (wLabel.data.width! as number) / 2;
          break;
        case "r":
          delta = (-wLabel.data.width! as number) / 2;
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

export const width = (g: IGraph, v: ID) =>
  (g.getNode(v)!.data.width as number) || 0;

// "use strict";

// const _ = require("../lodash");
// const Graph = require("../graphlib").Graph;
// const util = require("../util");

import graphlib from '../graphlib';
import util from '../util';
import { Graph as IGraph } from '../../types';

const Graph = (graphlib as any).Graph;

/*
 * This module provides coordinate assignment based on Brandes and Köpf, "Fast
 * and Simple Horizontal Coordinate Assignment."
 */


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
const findType1Conflicts = (g: IGraph, layering: any) => {
  const conflicts = {};

  const visitLayer = (prevLayer: any, layer: any) => {
    let
      // last visited node in the previous layer that is incident on an inner
      // segment.
      k0 = 0,
      // Tracks the last node in this layer scanned for crossings with a type-1
      // segment.
      scanPos = 0,
      prevLayerLength = prevLayer.length,
      lastNode = layer[layer?.length - 1];

      layer.forEach((v: string, i: number) => {
      const w = findOtherInnerSegmentNode(g, v),
        k1 = w ? g.node(w).order : prevLayerLength;

      if (w || v === lastNode) {
        layer.slice(scanPos, i +1).forEach((scanNode: any) => {
          g.predecessors(scanNode)?.forEach((u: any) => {
            const uLabel = g.node(u),
              uPos = uLabel.order as number;
            if ((uPos < k0 || k1 < uPos) &&
                !(uLabel.dummy && g.node(scanNode).dummy)) {
              addConflict(conflicts, u, scanNode);
            }
          });
        });
        scanPos = i + 1;
        k0 = k1;
      }
    });

    return layer;
  }

  layering.reduce(visitLayer);
  return conflicts;
}

const findType2Conflicts = (g: IGraph, layering: any) => {
  const conflicts = {};

  const scan = (south: string[], southPos: number, southEnd: number, prevNorthBorder: number, nextNorthBorder: number) => {
    let v: any;
    const range = [];
    for (let i = southPos; i < southEnd; i++ ) {
      range.push(i);
    }
    range.forEach((i) => {
      v = south[i];
      if (g.node(v).dummy) {
        g.predecessors(v)?.forEach((u: any) => {
          const uNode = g.node(u);
          if (uNode.dummy &&
              ((uNode.order as number) < prevNorthBorder || (uNode.order as number) > nextNorthBorder)) {
            addConflict(conflicts, u, v);
          }
        });
      }
    });
  }


  const visitLayer = (north: string[], south: string[]) => {
    let prevNorthPos = -1,
      nextNorthPos: number,
      southPos = 0;

      south.forEach((v: string, southLookahead: number) => {
      if (g.node(v).dummy === "border") {
        const predecessors = g.predecessors(v) || [];
        if (predecessors.length) {
          nextNorthPos = g.node(predecessors[0]).order as number;
          scan(south, southPos, southLookahead, prevNorthPos, nextNorthPos);
          southPos = southLookahead;
          prevNorthPos = nextNorthPos;
        }
      }
      scan(south, southPos, south.length, nextNorthPos, north.length);
    });

    return south;
  }

  layering.reduce(visitLayer);
  return conflicts;
}

const findOtherInnerSegmentNode = (g: IGraph, v: string) => {
  if (g.node(v).dummy) {
    return g.predecessors(v)?.find((u) => g.node(u).dummy);
  }
}

const addConflict = (conflicts: any, v: number, w: number) => {
  if (v > w) {
    const tmp = v;
    v = w;
    w = tmp;
  }

  let conflictsV = conflicts[v];
  if (!conflictsV) {
    conflicts[v] = conflictsV = {};
  }
  conflictsV[w] = true;
}

const hasConflict = (conflicts: any, v: number, w: number) => {
  if (v > w) {
    const tmp = v;
    v = w;
    w = tmp;
  }
  return conflicts[v] && conflicts[v].hasOwnProperty(w);
}

/*
 * Try to align nodes into vertical "blocks" where possible. This algorithm
 * attempts to align a node with one of its median neighbors. If the edge
 * connecting a neighbor is a type-1 conflict then we ignore that possibility.
 * If a previous node has already formed a block with a node after the node
 * we're trying to form a block with, we also ignore that possibility - our
 * blocks would be split in that scenario.
 */
const verticalAlignment = (g: IGraph, layering: any, conflicts: any, neighborFn: (v: string) => unknown) => {
  const root: any = {},
    align: any = {},
    pos: any = {};

  // We cache the position here based on the layering because the graph and
  // layering may be out of sync. The layering matrix is manipulated to
  // generate different extreme alignments.
  layering.forEach((layer: any) => {
    layer.forEach((v: string, order: number) => {
      root[v] = v;
      align[v] = v;
      pos[v] = order;
    });
  });

  layering.forEach((layer: any) => {
    let prevIdx = -1;
    layer.forEach((v: any) => {
      let ws = neighborFn(v) as any;
      if (ws.length) {
        ws = ws.sort((a: string, b: string) => pos[a] - pos[b]);
        const mp = (ws.length - 1) / 2;
        for (let i = Math.floor(mp), il = Math.ceil(mp); i <= il; ++i) {
          const w = ws[i];
          if (align[v] === v &&
              prevIdx < pos[w] &&
              !hasConflict(conflicts, v, w)) {
            align[w] = v;
            align[v] = root[v] = root[w];
            prevIdx = pos[w];
          }
        }
      }
    });
  });

  return { root, align };
}

const horizontalCompaction = (g: IGraph, layering: any, root: string, align: string[], reverseSep: boolean) => {
  // This portion of the algorithm differs from BK due to a number of problems.
  // Instead of their algorithm we construct a new block graph and do two
  // sweeps. The first sweep places blocks with the smallest possible
  // coordinates. The second sweep removes unused space by moving blocks to the
  // greatest coordinates without violating separation.
  const xs: any = {},
    blockG = buildBlockGraph(g, layering, root, reverseSep),
    borderType = reverseSep ? "borderLeft" : "borderRight";

  const iterate = (setXsFunc: (param: string) => unknown, nextNodesFunc: (param: string) => any) => {
    let stack = blockG.nodes();
    let elem = stack.pop();
    const visited: any = {};
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
  }

  // First pass, assign smallest coordinates
  const pass1 = (elem: string) => {
    xs[elem] = (blockG.inEdges(elem) || []).reduce((acc: number, e: any) => {
      return Math.max(acc, (xs[e.v] || 0) + blockG.edge(e));
    }, 0);
  }

  // Second pass, assign greatest coordinates
  const pass2 = (elem: string) => {
    const min = (blockG.outEdges(elem) || []).reduce((acc: number, e: any) => {
      return Math.min(acc, (xs[e.w] || 0) - blockG.edge(e));
    }, Number.POSITIVE_INFINITY);

    const node = g.node(elem);
    if (min !== Number.POSITIVE_INFINITY && node.borderType !== borderType) {
      xs[elem] = Math.max(xs[elem], min);
    }
  }

  iterate(pass1, blockG.predecessors.bind(blockG));
  iterate(pass2, blockG.successors.bind(blockG));

  // Assign x coordinates to all nodes
  Object.values(align).forEach((v: any) => {
    xs[v] = xs[root[v]];
  });

  return xs;
}


const buildBlockGraph = (g: IGraph, layering: any, root: string, reverseSep: boolean) => {
  const blockGraph = new Graph(),
    graphLabel = g.graph(),
    sepFn = sep(graphLabel.nodesep as number, graphLabel.edgesep as number, reverseSep as boolean);

  layering.forEach((layer: any) => {
    let u: any;
    layer.forEach((v: any) => {
      const vRoot = root[v];
      blockGraph.setNode(vRoot);
      if (u) {
        const uRoot = root[u],
          prevMax = blockGraph.edge(uRoot, vRoot);
        blockGraph.setEdge(uRoot, vRoot, Math.max(sepFn(g, v, u), prevMax || 0));
      }
      u = v;
    });
  });

  return blockGraph;
}
/*
 * Returns the alignment that has the smallest width of the given alignments.
 */
const findSmallestWidthAlignment = (g: IGraph, xss: any) => {
  return util.minBy(Object.values(xss), (xs) => {
    let max = Number.NEGATIVE_INFINITY;
    let min = Number.POSITIVE_INFINITY;

    Object.keys(xs).forEach((v: string) => {
      const x = xs[v];
      const halfWidth = width(g, v) / 2;

      max = Math.max(x + halfWidth, max);
      min = Math.min(x - halfWidth, min);
    });

    return max - min;
  });
}

/*
 * Align the coordinates of each of the layout alignments such that
 * left-biased alignments have their minimum coordinate at the same point as
 * the minimum coordinate of the smallest width alignment and right-biased
 * alignments have their maximum coordinate at the same point as the maximum
 * coordinate of the smallest width alignment.
 */
function alignCoordinates(xss: any, alignTo: any) {
  const alignToVals = Object.values(alignTo) as number[],
    alignToMin = Math.min(...alignToVals),
    alignToMax = Math.max(...alignToVals);

    ["u", "d"].forEach((vert) => {
    ["l", "r"].forEach((horiz) => {
      const alignment = vert + horiz,
        xs = xss[alignment];
      let delta: number;
      if (xs === alignTo) return;

      const xsVals = Object.values(xs) as number[];
      delta = horiz === "l" ? alignToMin - Math.min(...xsVals) : alignToMax - Math.max(...xsVals);

      if (delta) {
        xss[alignment] = {};
        Object.keys(xs).forEach(key => {
          xss[alignment][key] = xs[key] + delta;
        })
        // xss[alignment] = _.mapValues(xs, function(x) { return x + delta; });
      }
    });
  });
}

const balance = (xss: any, align: string) => {
  const result: any = {};
  Object.keys(xss.ul).forEach(key => {
    if (align) {
      result[key] = xss[align.toLowerCase()][key];
    } else {
      const values = Object.values(xss).map((x: any) => x[key]);
      const xs = values.sort((a: number, b: number) => (a - b));
      result[key] = (xs[1] + xs[2]) / 2;
    }
  });
  return result;

  // return _.mapValues(xss.ul, function(ignore, v) {
  //   if (align) {
  //     return xss[align.toLowerCase()][v];
  //   } else {
  //     const xs = _.sortBy(_.map(xss, v));
  //     return (xs[1] + xs[2]) / 2;
  //   }
  // });
}

const positionX = (g: IGraph) => {
  const layering = util.buildLayerMatrix(g);
  const conflicts = Object.assign(
    findType1Conflicts(g, layering),
    findType2Conflicts(g, layering));

  const xss: any = {};
  let adjustedLayering: any;
  ["u", "d"].forEach((vert) => {
    adjustedLayering = vert === "u" ? layering : Object.values(layering).reverse();
    ["l", "r"].forEach((horiz) => {
      if (horiz === "r") {
        adjustedLayering = adjustedLayering.map((inner: any) => Object.values(inner).reverse());
      }

      const neighborFn = (vert === "u" ? g.predecessors : g.successors).bind(g);
      const align = verticalAlignment(g, adjustedLayering, conflicts, neighborFn);
      let xs = horizontalCompaction(g, adjustedLayering,
        align.root, align.align, horiz === "r");
      if (horiz === "r") {
        xs = Object.values(xs).map((x: number) => -x);
        // xs = _.mapValues(xs, function(x) { return -x; });
      }
      xss[vert + horiz] = xs;
    });
  });

  const smallestWidth = findSmallestWidthAlignment(g, xss);
  alignCoordinates(xss, smallestWidth);
  return balance(xss, g.graph().align as string);
}

const sep = (nodeSep: number, edgeSep: number, reverseSep: boolean) => {
  return (g: IGraph, v: string, w: string) => {
    const vLabel = g.node(v);
    const wLabel = g.node(w);
    let sum = 0;
    let delta;

    sum += vLabel.width / 2;
    if (vLabel.hasOwnProperty("labelpos")) {
      switch ((vLabel.labelpos || '').toLowerCase()) {
      case "l": delta = -vLabel.width / 2; break;
      case "r": delta = vLabel.width / 2; break;
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;

    sum += (vLabel.dummy ? edgeSep : nodeSep) / 2;
    sum += (wLabel.dummy ? edgeSep : nodeSep) / 2;

    sum += wLabel.width / 2;
    if (wLabel.hasOwnProperty("labelpos")) {
      switch ((wLabel.labelpos || '').toLowerCase()) {
      case "l": delta = wLabel.width / 2; break;
      case "r": delta = -wLabel.width / 2; break;
      }
    }
    if (delta) {
      sum += reverseSep ? delta : -delta;
    }
    delta = 0;

    return sum;
  };
}

const width = (g: IGraph, v: string) => g.node(v)?.width || 0;

export {
  positionX,
  findType1Conflicts,
  findType2Conflicts,
  addConflict,
  hasConflict,
  verticalAlignment,
  horizontalCompaction,
  alignCoordinates,
  findSmallestWidthAlignment,
  balance
};

export default {
  positionX,
  findType1Conflicts,
  findType2Conflicts,
  addConflict,
  hasConflict,
  verticalAlignment,
  horizontalCompaction,
  alignCoordinates,
  findSmallestWidthAlignment,
  balance
};
// "use strict";

// const _ = require("../lodash");
// const feasibleTree = require("./feasible-tree").feasibleTree;
// const slack = require("./util").slack;
// const initRank = require("./util").longestPath;
// const preorder = require("../graphlib").alg.preorder;
// const postorder = require("../graphlib").alg.postorder;
// const simplify = require("../util").simplify;

import { Graph as IGraph } from '../../types';
import { feasibleTree } from './feasible-tree';
import { slack, longestPath as initRank } from './util';
import { minBy, simplify } from '../util';
import graphlib from '../graphlib';

const alg = graphlib.alg;

const { preorder, postorder } = alg;


/*
 * The network simplex algorithm assigns ranks to each node in the input graph
 * and iteratively improves the ranking to reduce the length of edges.
 *
 * Preconditions:
 *
 *    1. The input graph must be a DAG.
 *    2. All nodes in the graph must have an object value.
 *    3. All edges in the graph must have "minlen" and "weight" attributes.
 *
 * Postconditions:
 *
 *    1. All nodes in the graph will have an assigned "rank" attribute that has
 *       been optimized by the network simplex algorithm. Ranks start at 0.
 *
 *
 * A rough sketch of the algorithm is as follows:
 *
 *    1. Assign initial ranks to each node. We use the longest path algorithm,
 *       which assigns ranks to the lowest position possible. In general this
 *       leads to very wide bottom ranks and unnecessarily long edges.
 *    2. Construct a feasible tight tree. A tight tree is one such that all
 *       edges in the tree have no slack (difference between length of edge
 *       and minlen for the edge). This by itself greatly improves the assigned
 *       rankings by shorting edges.
 *    3. Iteratively find edges that have negative cut values. Generally a
 *       negative cut value indicates that the edge could be removed and a new
 *       tree edge could be added to produce a more compact graph.
 *
 * Much of the algorithms here are derived from Gansner, et al., "A Technique
 * for Drawing Directed Graphs." The structure of the file roughly follows the
 * structure of the overall algorithm.
 */
const networkSimplex = (g: IGraph) => {
  g = simplify(g) as any;
  initRank(g);
  const t = feasibleTree(g) as IGraph;
  initLowLimValues(t);
  initCutValues(t, g);

  let e, f;
  while ((e = leaveEdge(t))) {
    f = enterEdge(t, g, e);
    exchangeEdges(t, g, e, f);
  }
}

/*
 * Initializes cut values for all edges in the tree.
 */
const initCutValues = (t: IGraph, g: IGraph) => {
  let vs = postorder(t as any, t.nodes());
  vs = vs.slice(0, vs.length - 1);
  vs.forEach((v: string) => {
    assignCutValue(t, g, v);
  });
}

const assignCutValue = (t: IGraph, g: IGraph, child: string) => {
  const childLab = t.node(child);
  const parent = (childLab as any).parent;
  t.edge(child, parent).cutvalue = calcCutValue(t, g, child);
}

/*
 * Given the tight tree, its graph, and a child in the graph calculate and
 * return the cut value for the edge between the child and its parent.
 */
const calcCutValue = (t: IGraph, g: IGraph, child: string) => {
  const childLab = t.node(child);
  const parent = childLab.parent as string;
  // True if the child is on the tail end of the edge in the directed graph
  let childIsTail = true;
  // The graph's view of the tree edge we're inspecting
  let graphEdge = g.edge(child, parent);
  // The accumulated cut value for the edge between this node and its parent
  let cutValue = 0;

  if (!graphEdge) {
    childIsTail = false;
    graphEdge = g.edge(parent, child);
  }

  cutValue = graphEdge.weight;

  g.nodeEdges(child).forEach((e) => {
    const isOutEdge = e.v === child,
      other = isOutEdge ? e.w : e.v;

    if (other !== parent) {
      const pointsToHead = isOutEdge === childIsTail,
        otherWeight = g.edge(e).weight;

      cutValue += pointsToHead ? otherWeight : -otherWeight;
      if (isTreeEdge(t, child, other)) {
        const otherCutValue = t.edge(child, other).cutvalue;
        cutValue += pointsToHead ? -otherCutValue : otherCutValue;
      }
    }
  });

  return cutValue;
}

const initLowLimValues = (tree: IGraph, root?: string) => {
  if (root !== undefined) {
    root = tree.nodes()[0];
  }
  dfsAssignLowLim(tree, {}, 1, root as string);
}

const dfsAssignLowLim = (tree: IGraph, visited: any, nextLim: number, v: string, parent?: string) => {
  const low = nextLim;
  const label = tree.node(v) as any;

  visited[v] = true;
  tree.neighbors(v)?.forEach((w: any) => {
    if (!visited.hasOwnProperty(w)) {
      nextLim = dfsAssignLowLim(tree, visited, nextLim, w, v);
    }
  });

  label.low = low;
  label.lim = nextLim++;
  if (parent) {
    label.parent = parent;
  } else {
    // TODO should be able to remove this when we incrementally update low lim
    delete label.parent;
  }

  return nextLim;
}

const leaveEdge = (tree: IGraph) => {
  return tree.edges().find((e) => {
    return tree.edge(e).cutvalue < 0;
  });
}

const enterEdge = (t: IGraph, g: IGraph, edge: any) => {
  let v = edge.v;
  let w = edge.w;

  // For the rest of this function we assume that v is the tail and w is the
  // head, so if we don't have this edge in the graph we should flip it to
  // match the correct orientation.
  if (!g.hasEdge(v, w)) {
    v = edge.w;
    w = edge.v;
  }

  const vLabel = t.node(v);
  const wLabel = t.node(w);
  let tailLabel = vLabel;
  let flip = false;

  // If the root is in the tail of the edge then we need to flip the logic that
  // checks for the head and tail nodes in the candidates function below.
  if ((vLabel.lim as number) > (wLabel.lim as number)) {
    tailLabel = wLabel;
    flip = true;
  }

  const candidates = g.edges().filter((edge) => {
    return flip === isDescendant(t, t.node(edge.v), tailLabel) &&
           flip !== isDescendant(t, t.node(edge.w), tailLabel);
  });

  return minBy(candidates, function(edge) { return slack(g, edge); });
}

const exchangeEdges = (t: IGraph, g: IGraph, e: any, f: any) => {
  const v = e.v;
  const w = e.w;
  t.removeEdge(v, w);
  t.setEdge(f.v, f.w, {});
  initLowLimValues(t);
  initCutValues(t, g);
  updateRanks(t, g);
}

const updateRanks = (t: IGraph, g: IGraph) => {
  const root = t.nodes().find((v) =>{ return !g.node(v).parent; });
  let vs = preorder(t as any, root as any);
  vs = vs.slice(1);
  vs.forEach((v: string) => {
    const parent = t.node(v).parent as string;
    let edge = g.edge(v, parent),
      flipped = false;

    if (!edge) {
      edge = g.edge(parent, v);
      flipped = true;
    }

    g.node(v).rank = g.node(parent).rank + (flipped ? edge.minlen : -edge.minlen);
  });
}

/*
 * Returns true if the edge is in the tree.
 */
const isTreeEdge = (tree: IGraph, u: string, v: string) => {
  return tree.hasEdge(u, v);
}

/*
 * Returns true if the specified node is descendant of the root node per the
 * assigned low and lim attributes in the tree.
 */
const isDescendant = (tree: IGraph, vLabel: any, rootLabel: any) => {
  return rootLabel.low <= vLabel.lim && vLabel.lim <= rootLabel.lim;
}


// Expose some internals for testing purposes
networkSimplex.initLowLimValues = initLowLimValues;
networkSimplex.initCutValues = initCutValues;
networkSimplex.calcCutValue = calcCutValue;
networkSimplex.leaveEdge = leaveEdge;
networkSimplex.enterEdge = enterEdge;
networkSimplex.exchangeEdges = exchangeEdges;

export default networkSimplex;
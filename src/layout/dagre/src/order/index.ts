import initOrder from "./init-order";
import crossCount from "./cross-count";
import buildLayerGraph from "./build-layer-graph";
import addSubgraphConstraints from "./add-subgraph-constraints";
import sortSubgraph from "./sort-subgraph";
import { clone } from "../../../../util";
import { Graph } from "../../graph";
import { buildLayerMatrix, maxRank } from "../util";

/*
 * Applies heuristics to minimize edge crossings in the graph and sets the best
 * order solution as an order attribute on each node.
 *
 * Pre-conditions:
 *
 *    1. Graph must be DAG
 *    2. Graph nodes must be objects with a "rank" attribute
 *    3. Graph edges must have the "weight" attribute
 *
 * Post-conditions:
 *
 *    1. Graph nodes will have an "order" attribute based on the results of the
 *       algorithm.
 */
const order = (g: Graph) => {
  const mxRank = maxRank(g);
  const range1 = [];
  const range2 = [];
  for (let i = 1; i < mxRank + 1; i++) range1.push(i);
  for (let i = mxRank - 1; i > -1; i--) range2.push(i);
  const downLayerGraphs = buildLayerGraphs(g, range1, "inEdges");
  const upLayerGraphs = buildLayerGraphs(g, range2, "outEdges");

  let layering = initOrder(g);
  assignOrder(g, layering);

  let bestCC = Number.POSITIVE_INFINITY;
  let best: string[][];
  for (let i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
    sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);

    layering = buildLayerMatrix(g);
    const cc = crossCount(g, layering);
    if (cc < bestCC) {
      lastBest = 0;
      best = clone(layering);
      bestCC = cc;
    }
  }

  // consider use previous result, maybe somewhat reduendant
  layering = initOrder(g);
  assignOrder(g, layering);
  for (let i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
    sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2, true);

    layering = buildLayerMatrix(g);
    const cc = crossCount(g, layering);
    if (cc < bestCC) {
      lastBest = 0;
      best = clone(layering);
      bestCC = cc;
    }
  }
  assignOrder(g, best!);
};

const buildLayerGraphs = (
  g: Graph,
  ranks: number[],
  relationship: "inEdges" | "outEdges"
) => {
  return ranks.map((rank) => {
    return buildLayerGraph(g, rank, relationship);
  });
};

const sweepLayerGraphs = (
  layerGraphs: Graph[],
  biasRight: boolean,
  usePrev?: boolean
) => {
  const cg = new Graph();
  layerGraphs?.forEach((lg) => {
    const root = lg.graph().root as string;
    const sorted = sortSubgraph(lg, root, cg, biasRight, usePrev);
    for (let i = 0; i < sorted.vs?.length || 0; i++) {
      const lnode = lg.node(sorted.vs[i]);
      if (lnode) {
        lnode.order = i;
      }
    }
    addSubgraphConstraints(lg, cg, sorted.vs);
  });
};

const assignOrder = (g: Graph, layering: string[][]) => {
  layering?.forEach((layer) => {
    layer?.forEach((v: string, i: number) => {
      g.node(v)!.order = i;
    });
  });
};

export default order;

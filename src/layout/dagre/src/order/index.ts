// "use strict";

// const _ = require("../lodash");
// const initOrder = require("./init-order");
// const crossCount = require("./cross-count");
// const sortSubgraph = require("./sort-subgraph");
// const buildLayerGraph = require("./build-layer-graph");
// const addSubgraphConstraints = require("./add-subgraph-constraints");
// const Graph = require("../graphlib").Graph;
// const util = require("../util");

import initOrder from './init-order';
import crossCount from './cross-count';
import buildLayerGraph from './build-layer-graph';
import addSubgraphConstraints from './add-subgraph-constraints';
import sortSubgraph from './sort-subgraph';
import graphlib from '../graphlib';
import util from '../util';
import { clone } from '../../../../util';
import { Graph as IGraph } from '../../types';

const Graph = (graphlib as any).Graph;

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
const order = (g: IGraph) => {
  const maxRank = util.maxRank(g);
  const range1 = [], range2 = [];
  for (let i = 1; i < maxRank + 1; i ++) {
    range1.push(i);
  } // _.range(1, maxRank + 1)
  for (let i = maxRank - 1; i > -1; i --) {
    range2.push(i);
  } // _.range(maxRank - 1, -1, -1)
  const downLayerGraphs = buildLayerGraphs(g, range1, "inEdges"),
    upLayerGraphs = buildLayerGraphs(g, range2, "outEdges");

  let layering = initOrder(g);
  assignOrder(g, layering);

  let bestCC = Number.POSITIVE_INFINITY,
    best;

  for (let i = 0, lastBest = 0; lastBest < 4; ++i, ++lastBest) {
    sweepLayerGraphs(i % 2 ? downLayerGraphs : upLayerGraphs, i % 4 >= 2);

    layering = util.buildLayerMatrix(g);
    let cc = crossCount(g, layering);
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

    layering = util.buildLayerMatrix(g);
    let cc = crossCount(g, layering);
    if (cc < bestCC) {
      lastBest = 0;
      best = clone(layering);
      bestCC = cc;
    }
  }
  assignOrder(g, best);
}

const buildLayerGraphs = (g: IGraph, ranks: number[], relationship: string): any => {
  return ranks.map((rank) => {
    return buildLayerGraph(g, rank, relationship);
  });
}

const sweepLayerGraphs = (layerGraphs: IGraph[], biasRight: any, usePrev?: any) => {
  const cg = new Graph() as any;
  layerGraphs?.forEach((lg) => {
    const root = lg.graph().root as string;
    const sorted = sortSubgraph(lg, root, cg, biasRight, usePrev);
    sorted.vs.forEach((v: string, i: number) => {
      lg.node(v).order = i;
    });
    addSubgraphConstraints(lg, cg, sorted.vs);
  });
}

const assignOrder = (g: IGraph, layering: any) => {
  layering?.forEach((layer: any) => {
    layer.forEach((v: string, i: number) => {
      g.node(v).order = i;
    });
  });
}

export default order;
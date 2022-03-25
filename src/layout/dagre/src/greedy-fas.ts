import RawList from "./data/list";
import { Edge, Graph } from "../graph";
import { Graph as RawGraph } from "@antv/graphlib";

type StateNode = {
  v: string;
  w?: string;
  in: number;
  out: number;
  prev?: StateNode;
  next?: StateNode;
};
class List extends RawList<StateNode> {}

class StateGraph extends RawGraph<string, StateNode, number> {}

/*
 * A greedy heuristic for finding a feedback arc set for a graph. A feedback
 * arc set is a set of edges that can be removed to make a graph acyclic.
 * The algorithm comes from: P. Eades, X. Lin, and W. F. Smyth, "A fast and
 * effective heuristic for the feedback arc set problem." This implementation
 * adjusts that from the paper to allow for weighted edges.
 */

const DEFAULT_WEIGHT_FN = () => 1;

const greedyFAS = (g: Graph, weightFn?: (e: Edge) => number) => {
  if (g.nodeCount() <= 1) return [];
  const state = buildState(g, weightFn || DEFAULT_WEIGHT_FN);
  const results = doGreedyFAS(state.graph, state.buckets, state.zeroIdx);

  return results.map((e) => g.outEdges(e.v, e.w))?.flat();
};

const doGreedyFAS = (g: StateGraph, buckets: List[], zeroIdx: number) => {
  let results: StateNode[] = [];
  const sources = buckets[buckets.length - 1];
  const sinks = buckets[0];

  let entry;
  while (g.nodeCount()) {
    while ((entry = sinks.dequeue())) {
      removeNode(g, buckets, zeroIdx, entry);
    }
    while ((entry = sources.dequeue())) {
      removeNode(g, buckets, zeroIdx, entry);
    }
    if (g.nodeCount()) {
      for (let i = buckets.length - 2; i > 0; --i) {
        entry = buckets[i].dequeue();
        if (entry) {
          results = results.concat(
            removeNode(g, buckets, zeroIdx, entry, true)!
          );
          break;
        }
      }
    }
  }

  return results;
};

const removeNode = (
  g: StateGraph,
  buckets: List[],
  zeroIdx: number,
  entry: StateNode,
  collectPredecessors?: boolean
) => {
  const results: StateNode[] = [];

  g.inEdges(entry.v)?.forEach((edge) => {
    const weight = g.edge(edge)!;
    const uEntry = g.node(edge.v)!;

    if (collectPredecessors) {
      // this result not really care about in or out
      results.push({ v: edge.v, w: edge.w, in: 0, out: 0 });
    }
    if (uEntry.out === undefined) uEntry.out = 0;
    uEntry.out -= weight;
    assignBucket(buckets, zeroIdx, uEntry);
  });

  g.outEdges(entry.v)?.forEach((edge) => {
    const weight = g.edge(edge)!;
    const w = edge.w;
    const wEntry = g.node(w)!;
    if (wEntry.in === undefined) wEntry.in = 0;
    wEntry.in -= weight;
    assignBucket(buckets, zeroIdx, wEntry);
  });

  g.removeNode(entry.v);

  return collectPredecessors ? results : undefined;
};

const buildState = (g: Graph, weightFn?: (param: any) => number) => {
  const fasGraph = new StateGraph();
  let maxIn = 0;
  let maxOut = 0;

  g.nodes().forEach((v) => {
    fasGraph.setNode(v, { v, in: 0, out: 0 });
  });

  // Aggregate weights on nodes, but also sum the weights across multi-edges
  // into a single edge for the fasGraph.
  g.edges().forEach((e) => {
    const prevWeight = fasGraph.edge(e) || 0;
    const weight = weightFn?.(e) || 1;
    const edgeWeight = prevWeight + weight;
    fasGraph.setEdge(e.v, e.w, edgeWeight);
    maxOut = Math.max(maxOut, (fasGraph.node(e.v)!.out += weight));
    maxIn = Math.max(maxIn, (fasGraph.node(e.w)!.in += weight));
  });

  const buckets: List[] = [];
  const rangeMax = maxOut + maxIn + 3;
  for (let i = 0; i < rangeMax; i++) {
    buckets.push(new List());
  }
  const zeroIdx = maxIn + 1;

  fasGraph.nodes().forEach((v: string) => {
    assignBucket(buckets, zeroIdx, fasGraph.node(v)!);
  });

  return { buckets, zeroIdx, graph: fasGraph };
};

const assignBucket = (buckets: List[], zeroIdx: number, entry: StateNode) => {
  if (!entry.out) {
    buckets[0].enqueue(entry);
  } else if (!entry["in"]) {
    buckets[buckets.length - 1].enqueue(entry);
  } else {
    buckets[entry.out - entry["in"] + zeroIdx].enqueue(entry);
  }
};

export default greedyFAS;

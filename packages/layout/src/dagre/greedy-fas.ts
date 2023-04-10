/*
 * A greedy heuristic for finding a feedback arc set for a graph. A feedback
 * arc set is a set of edges that can be removed to make a graph acyclic.
 * The algorithm comes from: P. Eades, X. Lin, and W. F. Smyth, "A fast and
 * effective heuristic for the feedback arc set problem." This implementation
 * adjusts that from the paper to allow for weighted edges.
 *
 * @see https://github.com/dagrejs/dagre/blob/master/lib/greedy-fas.js
 */

import { Edge, Graph, ID } from "@antv/graphlib";
import { EdgeData, Graph as IGraph, NodeData } from "../types";
import RawList from "./data/list";

type StateNode = {
  v: ID;
  w?: ID;
  in: number;
  out: number;
  prev?: StateNode;
  next?: StateNode;
};
class List extends RawList<StateNode> {}

const DEFAULT_WEIGHT_FN = () => 1;

export const greedyFAS = (
  g: IGraph,
  weightFn?: (e: Edge<EdgeData>) => number
) => {
  if (g.getAllNodes().length <= 1) return [];
  const state = buildState(g, weightFn || DEFAULT_WEIGHT_FN);
  const results = doGreedyFAS(state.graph, state.buckets, state.zeroIdx);

  return results
    .map((e) =>
      g.getRelatedEdges(e.v, "out").filter(({ target }) => target === e.w)
    )
    ?.flat();
};

const doGreedyFAS = (g: IGraph, buckets: List[], zeroIdx: number) => {
  let results: StateNode[] = [];
  const sources = buckets[buckets.length - 1];
  const sinks = buckets[0];

  let entry;
  while (g.getAllNodes().length) {
    while ((entry = sinks.dequeue())) {
      removeNode(g, buckets, zeroIdx, entry);
    }
    while ((entry = sources.dequeue())) {
      removeNode(g, buckets, zeroIdx, entry);
    }
    if (g.getAllNodes().length) {
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
  g: IGraph,
  buckets: List[],
  zeroIdx: number,
  entry: StateNode,
  collectPredecessors?: boolean
) => {
  const results: StateNode[] = [];

  if (g.hasNode(entry.v)) {
    g.getRelatedEdges(entry.v, "in")?.forEach((edge) => {
      const weight = edge.data.weight!;
      const uEntry = g.getNode(edge.source)!;

      if (collectPredecessors) {
        // this result not really care about in or out
        results.push({ v: edge.source, w: edge.target, in: 0, out: 0 });
      }
      if (uEntry.data.out === undefined) uEntry.data.out = 0;
      // @ts-ignore
      uEntry.data.out -= weight;
      assignBucket(buckets, zeroIdx, {
        v: uEntry.id,
        ...uEntry.data,
      } as StateNode);
    });

    g.getRelatedEdges(entry.v, "out")?.forEach((edge) => {
      const weight = edge.data.weight!;
      const w = edge.target;
      const wEntry = g.getNode(w)!;
      if (wEntry.data.in === undefined) wEntry.data.in = 0;
      // @ts-ignore
      wEntry.data.in -= weight;
      assignBucket(buckets, zeroIdx, {
        v: wEntry.id,
        ...wEntry.data,
      } as StateNode);
    });

    g.removeNode(entry.v);
  }

  return collectPredecessors ? results : undefined;
};

const buildState = (g: IGraph, weightFn?: (e: Edge<EdgeData>) => number) => {
  const fasGraph = new Graph<NodeData, EdgeData>();
  let maxIn = 0;
  let maxOut = 0;

  g.getAllNodes().forEach((v) => {
    fasGraph.addNode({
      id: v.id,
      data: { v: v.id, in: 0, out: 0 },
    });
  });

  // Aggregate weights on nodes, but also sum the weights across multi-edges
  // into a single edge for the fasGraph.
  g.getAllEdges().forEach((e) => {
    const edge = fasGraph
      .getRelatedEdges(e.source, "out")
      .find((edge) => edge.target === e.target);
    const weight = weightFn?.(e) || 1;
    if (!edge) {
      fasGraph.addEdge({
        id: e.id,
        source: e.source,
        target: e.target,
        data: {
          weight,
        },
      });
    } else {
      fasGraph.updateEdgeData(edge?.id!, {
        ...edge.data,
        weight: edge.data.weight! + weight,
      });
    }
    // @ts-ignore
    maxOut = Math.max(maxOut, (fasGraph.getNode(e.source)!.data.out += weight));
    // @ts-ignore
    maxIn = Math.max(maxIn, (fasGraph.getNode(e.target)!.data.in += weight));
  });

  const buckets: List[] = [];
  const rangeMax = maxOut + maxIn + 3;
  for (let i = 0; i < rangeMax; i++) {
    buckets.push(new List());
  }
  const zeroIdx = maxIn + 1;

  fasGraph.getAllNodes().forEach((v) => {
    assignBucket(buckets, zeroIdx, {
      v: v.id,
      ...fasGraph.getNode(v.id).data,
    } as StateNode);
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

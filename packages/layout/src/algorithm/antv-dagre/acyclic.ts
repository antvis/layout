import type { EdgeData, ID } from '../../types';
import { DagreGraph, GraphEdge } from './graph';
import { greedyFAS } from './greedy-fas';

const run = (g: DagreGraph, acyclicer: string) => {
  const weightFn = (g: DagreGraph) => {
    return (e: GraphEdge<EdgeData>) => e.data.weight || 1;
  };
  const fas = acyclicer === 'greedy' ? greedyFAS(g, weightFn(g)) : dfsFAS(g);
  fas?.forEach((e: GraphEdge<EdgeData>) => {
    const label = e.data;
    g.removeEdge(e.id);
    label.forwardName = e.data.name;
    label.reversed = true;
    g.addEdge({
      id: e.id,
      source: e.target,
      target: e.source,
      data: {
        ...label,
      },
    });
  });
};

const dfsFAS = (g: DagreGraph) => {
  const fas: GraphEdge<EdgeData>[] = [];
  const stack: Record<ID, boolean> = {};
  const visited: Record<ID, boolean> = {};

  const dfs = (v: ID) => {
    if (visited[v]) {
      return;
    }
    visited[v] = true;
    stack[v] = true;
    g.getRelatedEdges(v, 'out').forEach((e) => {
      if (stack[e.target]) {
        fas.push(e);
      } else {
        dfs(e.target);
      }
    });
    delete stack[v];
  };

  g.getAllNodes().forEach((n) => dfs(n.id));
  return fas;
};

const undo = (g: DagreGraph) => {
  g.getAllEdges().forEach((e) => {
    const label = e.data;
    if (label.reversed) {
      g.removeEdge(e.id);

      const forwardName = label.forwardName;
      delete label.reversed;
      delete label.forwardName;
      g.addEdge({
        id: e.id,
        source: e.target,
        target: e.source,
        data: { ...label, forwardName },
      });
    }
  });
};

export { run, undo };

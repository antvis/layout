import { ID, Edge } from "@antv/graphlib";
import { Graph, EdgeData } from "../types";
import { greedyFAS } from "./greedy-fas";

const run = (g: Graph, acyclicer: string) => {
  const weightFn = (g: Graph) => {
    return (e: Edge<EdgeData>) => e.data.weight || 1;
  };
  const fas = acyclicer === "greedy" ? greedyFAS(g, weightFn(g)) : dfsFAS(g);
  fas?.forEach((e: Edge<EdgeData>) => {
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

const dfsFAS = (g: Graph) => {
  const fas: Edge<EdgeData>[] = [];
  const stack: Record<ID, boolean> = {};
  const visited: Record<ID, boolean> = {};

  const dfs = (v: ID) => {
    if (visited[v]) {
      return;
    }
    visited[v] = true;
    stack[v] = true;
    g.getRelatedEdges(v, "out").forEach((e) => {
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

const undo = (g: Graph) => {
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

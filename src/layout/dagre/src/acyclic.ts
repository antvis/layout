import { graphlib, Edge } from '../graphlib';
import greedyFAS from './greedy-fas';

type Graph = graphlib.Graph;

const run = (g: Graph) => {
  const weightFn = (g: Graph): any => {
    return (e: Edge) => g.edge(e)?.weight;
  };
  const fas = (g.graph().acyclicer === "greedy" ? greedyFAS(g, weightFn(g)) : dfsFAS(g));
  fas?.forEach((e: Edge) => {
    const label = g.edge(e)!;
    g.removeEdgeObj(e);
    label.forwardName = e.name;
    label.reversed = true;
    g.setEdge(e.w, e.v, label, `rev-${Math.random()}`);
  });
};

const dfsFAS = (g: Graph) => {
  const fas: Edge[] = [];
  const stack: any = {};
  const visited: any = {};

  const dfs = (v: any) => {
    if (visited.hasOwnProperty(v)) {
      return;
    }
    visited[v] = true;
    stack[v] = true;
    g.outEdges(v)?.forEach((e) => {
      if (stack.hasOwnProperty(e.w)) {
        fas.push(e);
      } else {
        dfs(e.w);
      }
    });
    delete stack[v];
  };

  g.nodes().forEach(dfs);
  return fas;
};

const undo = (g: Graph) => {
  g.edges().forEach((e) => {
    const label = g.edge(e)!;
    if (label.reversed) {
      g.removeEdgeObj(e);

      const forwardName = label.forwardName;
      delete label.reversed;
      delete label.forwardName;
      g.setEdge(e.w, e.v, label, forwardName);
    }
  });
};

export default { run, undo };
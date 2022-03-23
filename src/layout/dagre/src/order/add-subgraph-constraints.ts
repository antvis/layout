import { Graph } from "../../graph";

const addSubgraphConstraints = (g: Graph, cg: Graph, vs: string[]) => {
  const prev: Record<string, string> = {};
  let rootPrev: string;

  vs?.forEach((v) => {
    let child = g.parent(v);
    let parent;
    let prevChild;
    while (child) {
      parent = g.parent(child);
      if (parent) {
        prevChild = prev[parent];
        prev[parent] = child;
      } else {
        prevChild = rootPrev;
        rootPrev = child;
      }
      if (prevChild && prevChild !== child) {
        cg.setEdge(prevChild, child);
        return;
      }
      child = parent;
    }
  });
};

export default addSubgraphConstraints;

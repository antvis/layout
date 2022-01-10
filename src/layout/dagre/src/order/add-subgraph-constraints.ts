import { graphlib as IGraphLib } from "../../graphlib";

type Graph = IGraphLib.Graph;

const addSubgraphConstraints = (g: Graph, cg: Graph, vs: string[]) => {
  const prev: any = {};
  let rootPrev: any;

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
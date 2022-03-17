import { graphlib } from '../graphlib';

type Graph = graphlib.Graph;

const parentDummyChains = (g: Graph) => {
  const postorderNums = postorder(g);

  g.graph().dummyChains?.forEach((v: any) => {
    let node = g.node(v)!;
    const edgeObj = node.edgeObj;
    if (!edgeObj) return;
    const pathData = findPath(g, postorderNums, edgeObj.v, edgeObj.w);
    const path = pathData.path;
    const lca = pathData.lca;
    let pathIdx = 0;
    let pathV = path[pathIdx];
    let ascending = true;

    while (v !== edgeObj.w) {
      node = g.node(v)!;

      if (ascending) {
        while ((pathV = path[pathIdx]) !== lca &&
               (g.node(pathV)!.maxRank as number) < (node.rank as number)) {
          pathIdx++;
        }

        if (pathV === lca) {
          ascending = false;
        }
      }

      if (!ascending) {
        while (pathIdx < path.length - 1 &&
               (g.node(pathV = path[pathIdx + 1])?.minRank as number) <= (node.rank as number)) {
          pathIdx++;
        }
        pathV = path[pathIdx];
      }

      g.setParent(v, pathV);
      // tslint:disable-next-line
      v = g.successors(v)?.[0];
    }
  });
};

// Find a path from v to w through the lowest common ancestor (LCA). Return the
// full path and the LCA.
const findPath = (g: Graph, postorderNums: any, v: string, w: string) => {
  const vPath = [];
  const wPath = [];
  const low = Math.min(postorderNums[v].low, postorderNums[w].low);
  const lim = Math.max(postorderNums[v].lim, postorderNums[w].lim);
  let parent: any;
  let lca;

  // Traverse up from v to find the LCA
  parent = v;
  do {
    parent = g.parent(parent);
    vPath.push(parent);
  } while (parent &&
           (postorderNums[parent].low > low || lim > postorderNums[parent].lim));
  lca = parent;

  // Traverse from w to LCA
  parent = w;
  while ((parent = g.parent(parent)) !== lca) {
    wPath.push(parent);
  }

  return { lca, path: vPath.concat(wPath.reverse()) };
};

const postorder = (g: Graph) => {
  const result: any = {};
  let lim = 0;

  const dfs = (v: string) => {
    const low = lim;
    g.children(v)?.forEach(dfs);
    result[v] = { low, lim: lim++ };
  };
  g.children()?.forEach(dfs);

  return result;
};

export default parentDummyChains;
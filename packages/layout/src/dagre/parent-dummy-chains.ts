import { Graph } from "../graph";

type OrderItem = { low: number; lim: number };

// deep first search with both order low for pre, lim for post
const dfsBothOrder = (g: Graph) => {
  const result: Record<string, OrderItem> = {};
  let lim = 0;

  const dfs = (v: string) => {
    const low = lim;
    g.children(v)?.forEach(dfs);
    result[v] = { low, lim: lim++ };
  };
  g.children()?.forEach(dfs);

  return result;
};

// Find a path from v to w through the lowest common ancestor (LCA). Return the
// full path and the LCA.
const findPath = (
  g: Graph,
  postorderNums: Record<string, OrderItem>,
  v: string,
  w: string
) => {
  const vPath = [];
  const wPath = [];
  const low = Math.min(postorderNums[v].low, postorderNums[w].low);
  const lim = Math.max(postorderNums[v].lim, postorderNums[w].lim);
  let parent: string | undefined;
  let lca: string | undefined;

  // Traverse up from v to find the LCA
  parent = v;
  do {
    parent = g.parent(parent);
    vPath.push(parent);
  } while (
    parent &&
    (postorderNums[parent].low > low || lim > postorderNums[parent].lim)
  );
  lca = parent;

  // Traverse from w to LCA
  parent = w;
  while (parent && parent !== lca) {
    wPath.push(parent);
    parent = g.parent(parent);
  }

  return { lca, path: vPath.concat(wPath.reverse()) };
};

const parentDummyChains = (g: Graph) => {
  const postorderNums = dfsBothOrder(g);

  g.graph().dummyChains?.forEach((startV) => {
    let v = startV; 
    let node = g.node(v)!;
    const edgeObj = node.edgeObj;
    if (!edgeObj) return;
    const pathData = findPath(g, postorderNums, edgeObj.v, edgeObj.w);
    const path = pathData.path;
    const lca = pathData.lca;
    let pathIdx = 0;
    let pathV = path[pathIdx]!;
    let ascending = true;

    while (v !== edgeObj.w) {
      node = g.node(v)!;

      if (ascending) {
        while (pathV !== lca && g.node(pathV)?.maxRank! < node.rank!) {
          pathIdx++;
          pathV = path[pathIdx]!;
        }

        if (pathV === lca) {
          ascending = false;
        }
      }

      if (!ascending) {
        while (
          pathIdx < path.length - 1 &&
          (g.node(path[pathIdx + 1]!)?.minRank as number) <=
            (node.rank as number)
        ) {
          pathIdx++;
        }
        pathV = path[pathIdx]!;
      }

      g.setParent(v, pathV);
      v = g.successors(v)![0];
    }
  });
};

export default parentDummyChains;

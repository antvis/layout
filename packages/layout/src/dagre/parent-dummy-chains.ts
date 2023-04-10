import { Edge, ID } from "@antv/graphlib";
import { EdgeData, Graph as IGraph } from "../types";

type OrderItem = { low: number; lim: number };

// deep first search with both order low for pre, lim for post
const dfsBothOrder = (g: IGraph) => {
  const result: Record<ID, OrderItem> = {};
  let lim = 0;

  const dfs = (v: ID) => {
    const low = lim;
    g.getChildren(v).forEach((n) => dfs(n.id));
    result[v] = { low, lim: lim++ };
  };
  g.getRoots().forEach((n) => dfs(n.id));

  return result;
};

// Find a path from v to w through the lowest common ancestor (LCA). Return the
// full path and the LCA.
const findPath = (
  g: IGraph,
  postorderNums: Record<ID, OrderItem>,
  v: ID,
  w: ID
) => {
  const vPath: ID[] = [];
  const wPath: ID[] = [];
  const low = Math.min(postorderNums[v].low, postorderNums[w].low);
  const lim = Math.max(postorderNums[v].lim, postorderNums[w].lim);
  let parent: ID | undefined;
  let lca: ID | undefined;

  // Traverse up from v to find the LCA
  parent = v;
  do {
    parent = g.getParent(parent)?.id;
    vPath.push(parent!);
  } while (
    parent &&
    (postorderNums[parent].low > low || lim > postorderNums[parent].lim)
  );
  lca = parent;

  // Traverse from w to LCA
  parent = w;
  while (parent && parent !== lca) {
    wPath.push(parent);
    parent = g.getParent(parent)?.id;
  }

  return { lca, path: vPath.concat(wPath.reverse()) };
};

export const parentDummyChains = (g: IGraph, dummyChains: ID[]) => {
  const postorderNums = dfsBothOrder(g);

  dummyChains.forEach((startV) => {
    let v = startV;
    let node = g.getNode(v)!;
    const originalEdge = node.data.originalEdge as Edge<EdgeData>;
    if (!originalEdge) return;
    const pathData = findPath(
      g,
      postorderNums,
      originalEdge.source,
      originalEdge.target
    );
    const path = pathData.path;
    const lca = pathData.lca;
    let pathIdx = 0;
    let pathV = path[pathIdx]!;
    let ascending = true;

    while (v !== originalEdge.target) {
      node = g.getNode(v)!;

      if (ascending) {
        while (
          pathV !== lca &&
          g.getNode(pathV)?.data.maxRank! < node.data.rank!
        ) {
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
          g.getNode(path[pathIdx + 1]!)?.data.minRank! <= node.data.rank!
        ) {
          pathIdx++;
        }
        pathV = path[pathIdx]!;
      }

      if (g.hasNode(pathV)) {
        g.setParent(v, pathV);
      }

      v = g.getSuccessors(v)![0].id;
    }
  });
};

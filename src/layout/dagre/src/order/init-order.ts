import { graphlib as IGraphLib } from "../../graphlib";

type Graph = IGraphLib.Graph;
/*
 * Assigns an initial order value for each node by performing a DFS search
 * starting from nodes in the first rank. Nodes are assigned an order in their
 * rank as they are first visited.
 *
 * This approach comes from Gansner, et al., "A Technique for Drawing Directed
 * Graphs."
 *
 * Returns a layering matrix with an array per layer and each layer sorted by
 * the order of its nodes.
 */
const initOrder = (g: Graph) => {
  const visited: any = {};
  const simpleNodes = g.nodes().filter((v) => {
    return !g.children(v)?.length;
  });
  const nodeRanks = simpleNodes.map((v) => (g.node(v).rank as number));
  const maxRank = Math.max(...nodeRanks);
  const layers: any = [];
  for (let i = 0; i < maxRank + 1; i++) {
    layers.push([]);
  }
  // const layers = _.map(_.range(maxRank + 1), function() { return []; });

  const dfs = (v: string) => {
    if (visited.hasOwnProperty(v)) return;
    visited[v] = true;
    const node = g.node(v);
    layers[node.rank as number].push(v);
    g.successors(v)?.forEach((child) => dfs(child as any));
  };

  const orderedVs = simpleNodes.sort((a, b) => (g.node(a).rank as number) - (g.node(b).rank as number));
  // const orderedVs = _.sortBy(simpleNodes, function(v) { return g.node(v).rank; });

  // 有fixOrder的，直接排序好放进去
  const beforeSort = orderedVs.filter((n) => {
    return g.node(n).fixorder !== undefined;
  });
  const fixOrderNodes = beforeSort.sort((a, b) => (g.node(a).fixorder as number) - (g.node(b).fixorder as number));
  // const fixOrderNodes = _.sortBy(orderedVs.filter((n) => {
  //   return g.node(n).fixorder !== undefined;
  // }), function(n) {
  //   return g.node(n).fixorder;
  // });

  fixOrderNodes.forEach((n) => {
    layers[g.node(n).rank as number].push(n);
    visited[n] = true;
  });

  orderedVs.forEach(dfs);

  return layers;
};

export default initOrder;
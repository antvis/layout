import { Graph } from "../../graph";
import { max } from '@antv/util';

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
  const visited: Record<string, boolean> = {};
  const simpleNodes = g.nodes().filter((v) => {
    return !g.children(v)?.length;
  });
  const nodeRanks = simpleNodes.map((v) => (g.node(v)!.rank as number));
  const maxRank = max(nodeRanks)!;
  const layers: string[][] = [];
  for (let i = 0; i < maxRank + 1; i++) {
    layers.push([]);
  }

  const dfs = (v: string) => {
    if (visited.hasOwnProperty(v)) return;
    visited[v] = true;
    const node = g.node(v)!;
    if (!isNaN(node.rank as number)) {
      layers[node.rank as number].push(v);
    }
    g.successors(v)?.forEach((child) => dfs(child as any));
  };

  const orderedVs = simpleNodes.sort((a, b) => (g.node(a)!.rank as number) - (g.node(b)!.rank as number));
  // const orderedVs = _.sortBy(simpleNodes, function(v) { return g.node(v)!.rank; });

  // 有fixOrder的，直接排序好放进去
  const beforeSort = orderedVs.filter((n) => {
    return g.node(n)!.fixorder !== undefined;
  });
  const fixOrderNodes = beforeSort.sort((a, b) => (g.node(a)!.fixorder as number) - (g.node(b)!.fixorder as number));
  fixOrderNodes?.forEach((n) => {
    if (!isNaN(g.node(n)!.rank as number)) {
      layers[g.node(n)!.rank as number].push(n);
    }
    visited[n] = true;
  });

  orderedVs?.forEach(dfs);

  return layers;
};

export default initOrder;
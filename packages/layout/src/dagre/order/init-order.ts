import { ID } from '@antv/graphlib';
import { Graph } from '../../types';

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
export const initOrder = (g: Graph) => {
  const visited: Record<string, boolean> = {};
  // const simpleNodes = g.getAllNodes().filter((v) => {
  //   return !g.getChildren(v.id)?.length;
  // });
  const simpleNodes = g.getAllNodes();
  const nodeRanks = simpleNodes.map((v) => v.data.rank! ?? -Infinity);

  const maxRank = Math.max(...nodeRanks);
  const layers: ID[][] = [];
  for (let i = 0; i < maxRank + 1; i++) {
    layers.push([]);
  }

  const orderedVs = simpleNodes.sort(
    (a, b) => g.getNode(a.id).data.rank! - g.getNode(b.id).data.rank!
  );
  // const orderedVs = _.sortBy(simpleNodes, function(v) { return g.node(v)!.rank; });

  // 有fixOrder的，直接排序好放进去
  const beforeSort = orderedVs.filter((n) => {
    return g.getNode(n.id).data.fixorder !== undefined;
  });
  const fixOrderNodes = beforeSort.sort(
    (a, b) => g.getNode(a.id).data.fixorder! - g.getNode(b.id).data.fixorder!
  );
  fixOrderNodes?.forEach((n) => {
    if (!isNaN(g.getNode(n.id).data.rank!)) {
      layers[g.getNode(n.id).data.rank!].push(n.id);
    }
    visited[n.id] = true;
  });

  orderedVs?.forEach((n) =>
    g.dfsTree(n.id, (node) => {
      if (visited.hasOwnProperty(node.id)) return true;
      visited[node.id] = true;
      if (!isNaN(node.data.rank!)) {
        layers[node.data.rank!].push(node.id);
      }
    })
  );

  return layers;
};

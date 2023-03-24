import { Edge, ID } from "@antv/graphlib";
import { EdgeData, Graph } from "../../types";

/*
 * Initializes ranks for the input graph using the longest path algorithm. This
 * algorithm scales well and is fast in practice, it yields rather poor
 * solutions. Nodes are pushed to the lowest layer possible, leaving the bottom
 * ranks wide and leaving edges longer than necessary. However, due to its
 * speed, this algorithm is good for getting an initial ranking that can be fed
 * into other algorithms.
 *
 * This algorithm does not normalize layers because it will be used by other
 * algorithms in most cases. If using this algorithm directly, be sure to
 * run normalize at the end.
 *
 * Pre-conditions:
 *
 *    1. Input graph is a DAG.
 *    2. Input graph node labels can be assigned properties.
 *
 * Post-conditions:
 *
 *    1. Each node will be assign an (unnormalized) "rank" property.
 */
const longestPath = (g: Graph) => {
  const visited: Record<ID, boolean> = {};

  const dfs = (v: ID) => {
    const label = g.getNode(v)!;
    if (!label) return 0;
    if (visited[v]) {
      return label.data.rank! as number;
    }
    visited[v] = true;

    let rank: number;

    g.getRelatedEdges(v, "out")?.forEach((e) => {
      const wRank = dfs(e.target);
      const minLen = e.data.minlen! as number;
      const r = wRank - minLen;
      if (r) {
        if (rank === undefined || r < rank) {
          rank = r;
        }
      }
    });

    if (!rank!) {
      rank = 0;
    }

    label.data.rank = rank;
    return rank;
  };

  g.getAllNodes()
    .filter((n) => g.getRelatedEdges(n.id, "in").length === 0)
    .forEach((source) => dfs(source.id));
};

const longestPathWithLayer = (g: Graph) => {
  // 用longest path，找出最深的点
  const visited: Record<ID, boolean> = {};
  let minRank: number;

  const dfs = (v: ID) => {
    const label = g.getNode(v)!;
    if (!label) return 0;
    if (visited[v]) {
      return label.data.rank! as number;
    }
    visited[v] = true;

    let rank: number;

    g.getRelatedEdges(v, "out")?.forEach((e) => {
      const wRank = dfs(e.target);
      const minLen = e.data.minlen! as number;
      const r = wRank - minLen;
      if (r) {
        if (rank === undefined || r < rank) {
          rank = r;
        }
      }
    });

    if (!rank!) {
      rank = 0;
    }

    if (minRank === undefined || rank < minRank) {
      minRank = rank;
    }

    label.data.rank = rank;
    return rank;
  };

  g.getAllNodes()
    .filter((n) => g.getRelatedEdges(n.id, "in").length === 0)
    .forEach((source) => {
      if (source) dfs(source.id);
    });

  if (minRank! === undefined) {
    minRank = 0;
  }

  // minRank += 1; // NOTE: 最小的层级是dummy root，+1

  // forward一遍，赋值层级
  const forwardVisited: Record<string, boolean> = {};
  const dfsForward = (v: ID, nextRank: number) => {
    const label = g.getNode(v)!;

    const currRank = (
      !isNaN(label.data.layer as number) ? label.data.layer : nextRank
    ) as number;

    // 没有指定，取最大值
    if (
      label.data.rank === undefined ||
      (label.data.rank as number) < currRank
    ) {
      label.data.rank = currRank;
    }

    if (forwardVisited[v]) return;
    forwardVisited[v] = true;

    // DFS遍历子节点
    g.getRelatedEdges(v, "out")?.forEach((e) => {
      dfsForward(e.target, currRank + (e.data.minlen! as number));
    });
  };

  // 指定层级的，更新下游
  g.getAllNodes().forEach((n) => {
    const label = n.data;
    if (!label) return;
    if (!isNaN(label.layer as number)) {
      dfsForward(n.id, label.layer as number); // 默认的dummy root所在层的rank是-1
    } else {
      (label.rank as number) -= minRank;
    }
  });
};

/*
 * Returns the amount of slack for the given edge. The slack is defined as the
 * difference between the length of the edge and its minimum length.
 */
const slack = (g: Graph, e: Edge<EdgeData>) => {
  return (
    (g.getNode(e.target).data.rank as number) -
    (g.getNode(e.source).data.rank as number) -
    (e.data.minlen as number)
  );
};

export { longestPath, longestPathWithLayer, slack };

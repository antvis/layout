import { Edge, Graph } from "../../graph";

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
  const visited: Record<string, boolean> = {};

  const dfs = (v: string) => {
    const label = g.node(v)!;
    if (visited[v]) {
      return label.rank!;
    }
    visited[v] = true;

    let rank: number;

    g.outEdges(v)?.forEach(
      (edgeObj) => {
        const wRank = dfs(edgeObj.w);
        const minLen = g.edge(edgeObj)!.minlen!;
        const r = wRank - minLen;
        if (r) {
          if (rank === undefined || r < rank) {
            rank = r;
          }
        }
      }
    );


    if (!rank!) {
      rank = 0;
    }

    label.rank = rank;
    return rank;
  };

  g.sources()?.forEach((source) => dfs(source));
};

const longestPathWithLayer = (g: Graph) => {
  // 用longest path，找出最深的点
  const visited: Record<string, boolean> = {};
  let minRank: number;

  const dfs = (v: string) => {
    const label = g.node(v)!;
    if (visited[v]) {
      return label.rank!;
    }
    visited[v] = true;

    let rank: number;

    g.outEdges(v)?.forEach(
      (edgeObj) => {
        const wRank = dfs(edgeObj.w);
        const minLen = g.edge(edgeObj)!.minlen!;
        const r = wRank - minLen;
        if (r) {
          if (rank === undefined || r < rank) {
            rank = r;
          }
        }
      }
    );


    if (!rank!) {
      rank = 0;
    }

    if (minRank === undefined || rank < minRank) {
      minRank = rank;
    }

    label.rank = rank;
    return rank;
  };

  g.sources()?.forEach((source) => dfs(source));

  if (minRank! === undefined) {
    minRank = 0;
  }

  // minRank += 1; // NOTE: 最小的层级是dummy root，+1

  // forward一遍，赋值层级
  const dfsForward = (v: string, nextRank: number) => {
    const label = g.node(v)!;

    const currRank = (
      !isNaN(label.layer as number) ? label.layer : nextRank
    ) as number;

    // 没有指定，取最大值
    if (label.rank === undefined || label.rank < currRank) {
      label.rank = currRank;
    }

    // DFS遍历子节点
    g.outEdges(v)?.map((e) => {
      dfsForward(e.w, currRank + g.edge(e)!.minlen!);
    });
  };

  // 指定层级的，更新下游
  g.nodes().forEach((n) => {
    const label = g.node(n)!;
    if (!isNaN(label.layer as number)) {
      dfsForward(n, label.layer as number); // 默认的dummy root所在层的rank是-1
    } else {
      (label.rank as number) -= minRank;
    }
  });
};

/*
 * Returns the amount of slack for the given edge. The slack is defined as the
 * difference between the length of the edge and its minimum length.
 */
const slack = (g: Graph, e: Edge) => {
  return (
    (g.node(e.w)!.rank as number) -
    (g.node(e.v)!.rank as number) -
    (g.edge(e)!.minlen as number)
  );
};

export { longestPath, longestPathWithLayer, slack };

export default {
  longestPath,
  longestPathWithLayer,
  slack,
};

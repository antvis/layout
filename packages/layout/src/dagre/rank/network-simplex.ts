// import { } from '@antv/algorithm';
import { EdgeData, Graph as IGraph, NodeData } from "../../types";
import { feasibleTree } from "./feasible-tree";
import { slack, longestPath as initRank } from "./util";
import { minBy, simplify } from "../util";
import { Edge, ID, Node } from "@antv/graphlib";

// const { preorder, postorder } = algorithm;

/*
 * The network simplex algorithm assigns ranks to each node in the input graph
 * and iteratively improves the ranking to reduce the length of edges.
 *
 * Preconditions:
 *
 *    1. The input graph must be a DAG.
 *    2. All nodes in the graph must have an object value.
 *    3. All edges in the graph must have "minlen" and "weight" attributes.
 *
 * Postconditions:
 *
 *    1. All nodes in the graph will have an assigned "rank" attribute that has
 *       been optimized by the network simplex algorithm. Ranks start at 0.
 *
 *
 * A rough sketch of the algorithm is as follows:
 *
 *    1. Assign initial ranks to each node. We use the longest path algorithm,
 *       which assigns ranks to the lowest position possible. In general this
 *       leads to very wide bottom ranks and unnecessarily long edges.
 *    2. Construct a feasible tight tree. A tight tree is one such that all
 *       edges in the tree have no slack (difference between length of edge
 *       and minlen for the edge). This by itself greatly improves the assigned
 *       rankings by shorting edges.
 *    3. Iteratively find edges that have negative cut values. Generally a
 *       negative cut value indicates that the edge could be removed and a new
 *       tree edge could be added to produce a more compact graph.
 *
 * Much of the algorithms here are derived from Gansner, et al., "A Technique
 * for Drawing Directed Graphs." The structure of the file roughly follows the
 * structure of the overall algorithm.
 */
const networkSimplex = (og: IGraph) => {
  const g = simplify(og);
  initRank(g);
  const t = feasibleTree(g);
  initLowLimValues(t);
  initCutValues(t, g);

  let e: Edge<EdgeData> | undefined;
  let f: Edge<EdgeData>;
  while ((e = leaveEdge(t))) {
    f = enterEdge(t, g, e);
    exchangeEdges(t, g, e, f);
  }
};

/*
 * Initializes cut values for all edges in the tree.
 */
export const initCutValues = (t: IGraph, g: IGraph) => {
  let vs: ID[] = [];

  t.getAllNodes().forEach((n) => {
    t.dfs(n.id, (node) => {
      vs.push(node.id);
    });
  });

  // const root = t.getRoots()[0];
  // t.dfs(root.id, (n) => {
  //   vs.push(n.id);
  // });

  // let vs = postorder(t, t.getAllNodes());
  vs = vs?.slice(0, vs?.length - 1);
  vs?.forEach((v: ID) => {
    assignCutValue(t, g, v);
  });
};

const assignCutValue = (t: IGraph, g: IGraph, child: ID) => {
  const childLab = t.getNode(child)!;
  const parent = childLab.data.parent! as ID;

  const edge = t.getRelatedEdges(child, "out").find((e) => e.target === parent);
  if (edge) {
    edge.data.cutvalue = calcCutValue(t, g, child);
  }
};

/*
 * Given the tight tree, its graph, and a child in the graph calculate and
 * return the cut value for the edge between the child and its parent.
 */
export const calcCutValue = (t: IGraph, g: IGraph, child: ID) => {
  const childLab = t.getNode(child)!;
  const parent = childLab.data.parent as ID;
  // True if the child is on the tail end of the edge in the directed graph
  let childIsTail = true;
  // The graph's view of the tree edge we're inspecting

  let graphEdge = g
    .getRelatedEdges(child, "out")
    .find((e) => e.target === parent)!;
  // The accumulated cut value for the edge between this node and its parent
  let cutValue = 0;

  if (!graphEdge) {
    childIsTail = false;
    graphEdge = g
      .getRelatedEdges(parent, "out")
      .find((e) => e.target === child)!;
  }

  cutValue = graphEdge.data.weight!;

  g.getRelatedEdges(child, "both")?.forEach((e) => {
    const isOutEdge = e.source === child;
    const other = isOutEdge ? e.target : e.source;

    if (other !== parent) {
      const pointsToHead = isOutEdge === childIsTail;
      const otherWeight = e.data.weight!;

      cutValue += pointsToHead ? otherWeight : -otherWeight;
      if (isTreeEdge(t, child, other)) {
        const otherCutValue = t
          .getRelatedEdges(child, "out")
          .find((e) => e.target === other)!.data.cutvalue as number;
        cutValue += pointsToHead ? -otherCutValue : otherCutValue;
      }
    }
  });

  return cutValue;
};

export const initLowLimValues = (
  tree: IGraph,
  root: ID = tree.getAllNodes()[0].id
) => {
  dfsAssignLowLim(tree, {}, 1, root);
};

const dfsAssignLowLim = (
  tree: IGraph,
  visited: Record<ID, boolean>,
  nextLim: number,
  v: ID,
  parent?: ID
) => {
  const low = nextLim;
  let useNextLim = nextLim;
  const label = tree.getNode(v)!;

  visited[v] = true;
  tree.getNeighbors(v)?.forEach((w) => {
    if (!visited[w.id]) {
      useNextLim = dfsAssignLowLim(tree, visited, useNextLim, w.id, v);
    }
  });

  label.data.low = low;
  label.data.lim = useNextLim++;
  if (parent) {
    label.data.parent = parent;
  } else {
    // TODO should be able to remove this when we incrementally update low lim
    delete label.data.parent;
  }

  return useNextLim;
};

export const leaveEdge = (tree: IGraph) => {
  return tree.getAllEdges().find((e) => {
    return (e.data.cutvalue as number) < 0;
  });
};

export const enterEdge = (t: IGraph, g: IGraph, edge: Edge<EdgeData>) => {
  let v = edge.source;
  let w = edge.target;

  // For the rest of this function we assume that v is the tail and w is the
  // head, so if we don't have this edge in the graph we should flip it to
  // match the correct orientation.
  if (!g.getRelatedEdges(v, "out").find((e) => e.target === w)) {
    v = edge.target;
    w = edge.source;
  }

  const vLabel = t.getNode(v)!;
  const wLabel = t.getNode(w)!;
  let tailLabel = vLabel;
  let flip = false;

  // If the root is in the tail of the edge then we need to flip the logic that
  // checks for the head and tail nodes in the candidates function below.
  if ((vLabel.data.lim as number) > (wLabel.data.lim as number)) {
    tailLabel = wLabel;
    flip = true;
  }

  const candidates = g.getAllEdges().filter((edge) => {
    return (
      flip === isDescendant(t, t.getNode(edge.source), tailLabel) &&
      flip !== isDescendant(t, t.getNode(edge.target), tailLabel)
    );
  });

  return minBy(candidates, (edge) => {
    return slack(g, edge);
  });
};

export const exchangeEdges = (
  t: IGraph,
  g: IGraph,
  e: Edge<EdgeData>,
  f: Edge<EdgeData>
) => {
  t.removeEdge(e.id);
  if (!t.hasEdge(f.id)) {
    t.addEdge({
      id: f.id,
      source: f.source,
      target: f.target,
      data: {},
    });
  }
  initLowLimValues(t);
  initCutValues(t, g);
  updateRanks(t, g);
};

const updateRanks = (t: IGraph, g: IGraph) => {
  const root = t.getAllNodes().find((v) => {
    return !v.data.parent;
  })!;
  // let vs = preorder(t, root);

  let vs: ID[] = [];
  t.getAllNodes().forEach((n) => {
    t.dfs(n.id, (node) => {
      vs.push(node.id);
    });
  });

  vs = vs?.slice(1);
  vs?.forEach((v: ID) => {
    const parent = t.getNode(v).data.parent as ID;
    let edge = g.getRelatedEdges(v, "out").find((e) => e.target === parent);
    // let edge = g.edgeFromArgs(v, parent);
    let flipped = false;

    if (!edge && g.hasNode(parent)) {
      // edge = g.edgeFromArgs(parent, v)!;
      edge = g.getRelatedEdges(parent, "out").find((e) => e.target === v);
      flipped = true;
    }

    g.getNode(v).data.rank =
      ((g.hasNode(parent) && (g.getNode(parent).data.rank! as number)) || 0) +
      (flipped
        ? (edge?.data.minlen as number)
        : -(edge?.data.minlen as number));
  });
};

/*
 * Returns true if the edge is in the tree.
 */
const isTreeEdge = (tree: IGraph, u: ID, v: ID) => {
  return tree.getRelatedEdges(u, "out").find((e) => e.target === v);
};

/*
 * Returns true if the specified node is descendant of the root node per the
 * assigned low and lim attributes in the tree.
 */
const isDescendant = (
  tree: IGraph,
  vLabel: Node<NodeData>,
  rootLabel: Node<NodeData>
) => {
  return (
    (rootLabel.data.low as number) <= (vLabel.data.lim as number) &&
    (vLabel.data.lim as number) <= (rootLabel.data.lim as number)
  );
};

export default networkSimplex;

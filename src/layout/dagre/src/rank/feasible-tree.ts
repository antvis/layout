import { slack } from './util';
import { minBy } from '../util';
import { Graph } from '../../graph';

/*
 * Constructs a spanning tree with tight edges and adjusted the input node's
 * ranks to achieve this. A tight edge is one that is has a length that matches
 * its "minlen" attribute.
 *
 * The basic structure for this function is derived from Gansner, et al., "A
 * Technique for Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be a DAG.
 *    2. Graph must be connected.
 *    3. Graph must have at least one node.
 *    5. Graph nodes must have been previously assigned a "rank" property that
 *       respects the "minlen" property of incident edges.
 *    6. Graph edges must have a "minlen" property.
 *
 * Post-conditions:
 *
 *    - Graph nodes will have their rank adjusted to ensure that all edges are
 *      tight.
 *
 * Returns a tree (undirected graph) that is constructed using only "tight"
 * edges.
 */
const feasibleTree = (g: Graph) => {
  const t = new Graph({ directed: false });

  // Choose arbitrary node from which to start our tree
  const start = g.nodes()[0];
  const size = g.nodeCount();
  t.setNode(start, {});

  let edge: any;
  let delta: number;
  while (tightTree(t, g) < size) {
    edge = findMinSlackEdge(t, g);
    delta = t.hasNode(edge.v) ? slack(g, edge) : -slack(g, edge);
    shiftRanks(t, g, delta);
  }

  return t;
};

/*
 * Finds a maximal tree of tight edges and returns the number of nodes in the
 * tree.
 */
const tightTree = (t: Graph, g: Graph) => {
  const dfs = (v: string) => {
    g.nodeEdges(v)!.forEach((e) => {
      const edgeV = e.v;
      const w = (v === edgeV) ? e.w : edgeV;
      if (!t.hasNode(w) && !slack(g, e)) {
        t.setNode(w, {});
        t.setEdge(v, w, {});
        dfs(w);
      }
    });
  };

  t.nodes().forEach(dfs);
  return t.nodeCount();
};

/*
 * Constructs a spanning tree with tight edges and adjusted the input node's
 * ranks to achieve this. A tight edge is one that is has a length that matches
 * its "minlen" attribute.
 *
 * The basic structure for this function is derived from Gansner, et al., "A
 * Technique for Drawing Directed Graphs."
 *
 * Pre-conditions:
 *
 *    1. Graph must be a DAG.
 *    2. Graph must be connected.
 *    3. Graph must have at least one node.
 *    5. Graph nodes must have been previously assigned a "rank" property that
 *       respects the "minlen" property of incident edges.
 *    6. Graph edges must have a "minlen" property.
 *
 * Post-conditions:
 *
 *    - Graph nodes will have their rank adjusted to ensure that all edges are
 *      tight.
 *
 * Returns a tree (undirected graph) that is constructed using only "tight"
 * edges.
 */
const feasibleTreeWithLayer = (g: Graph) => {
  const t = new Graph({ directed: false }) as any;

  // Choose arbitrary node from which to start our tree
  const start = g.nodes()[0];
  const size = g.nodeCount();
  t.setNode(start, {});

  let edge: any;
  let delta: number;
  while (tightTreeWithLayer(t, g)! < size) {
    edge = findMinSlackEdge(t, g);
    delta = t.hasNode(edge.v) ? slack(g, edge) : -slack(g, edge);
    shiftRanks(t, g, delta);
  }

  return t;
};


/*
 * Finds a maximal tree of tight edges and returns the number of nodes in the
 * tree.
 */
const tightTreeWithLayer = (t: Graph, g: Graph) => {
  const dfs = (v: string) => {
    g.nodeEdges(v)?.forEach((e) => {
      const edgeV = e.v;
      const w = (v === edgeV) ? e.w : edgeV;
      // 对于指定layer的，直接加入tight-tree，不参与调整
      if (!t.hasNode(w) && (g.node(w)!.layer !== undefined || !slack(g, e))) {
        t.setNode(w, {});
        t.setEdge(v, w, {});
        dfs(w);
      }
    });
  };

  t.nodes().forEach(dfs);
  return t.nodeCount();
};

/*
 * Finds the edge with the smallest slack that is incident on tree and returns
 * it.
 */
const findMinSlackEdge = (t: Graph, g: Graph) => {
  return minBy(g.edges(), (e: any) => {
    if (t.hasNode(e.v) !== t.hasNode(e.w)) {
      return slack(g, e);
    }
    return Infinity;
  });
};

const shiftRanks = (t: Graph, g: Graph, delta: number) => {
  t.nodes().forEach((v: string) => {
    if (!g.node(v)!.rank) g.node(v)!.rank = 0;
    (g.node(v)!.rank as number) += delta;
  });
};

export {
  feasibleTree,
  feasibleTreeWithLayer
};

export default {
  feasibleTree,
  feasibleTreeWithLayer
};
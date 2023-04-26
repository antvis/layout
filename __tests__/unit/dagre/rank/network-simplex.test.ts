import { Edge, Graph } from "@antv/graphlib";
import {
  NodeData,
  EdgeData,
  Graph as IGraph,
} from "../../../../packages/layout/src";
import {
  networkSimplex,
  initLowLimValues,
  initCutValues,
  calcCutValue,
  leaveEdge,
  enterEdge,
  exchangeEdges,
} from "../../../../packages/layout/src/dagre/rank/network-simplex";
import { longestPath } from "../../../../packages/layout/src/dagre/rank/util";
import { normalizeRanks } from "../../../../packages/layout/src/dagre/util";

describe("network simplex", function () {
  let g: Graph<NodeData, EdgeData>;
  let t: Graph<NodeData, EdgeData>;
  let gansnerGraph: Graph<NodeData, EdgeData>;
  let gansnerTree: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>();
    t = new Graph<NodeData, EdgeData>({
      tree: [],
    });
    gansnerGraph = new Graph<NodeData, EdgeData>({
      nodes: [
        {
          id: "a",
          data: {},
        },
        {
          id: "b",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "d",
          data: {},
        },
        {
          id: "e",
          data: {},
        },
        {
          id: "f",
          data: {},
        },
        {
          id: "g",
          data: {},
        },
        {
          id: "h",
          data: {},
        },
      ],
      edges: [
        {
          id: "e1",
          source: "a",
          target: "b",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e2",
          source: "b",
          target: "c",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e3",
          source: "c",
          target: "d",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e4",
          source: "d",
          target: "h",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e5",
          source: "a",
          target: "e",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e6",
          source: "e",
          target: "g",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e7",
          source: "g",
          target: "h",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e8",
          source: "a",
          target: "f",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e9",
          source: "f",
          target: "g",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
      ],
    });

    gansnerTree = new Graph<NodeData, EdgeData>({
      tree: [],
      nodes: [
        {
          id: "a",
          data: {},
        },
        {
          id: "b",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "d",
          data: {},
        },
        {
          id: "e",
          data: {},
        },
        {
          id: "f",
          data: {},
        },
        {
          id: "g",
          data: {},
        },
        {
          id: "h",
          data: {},
        },
      ],
      edges: [
        {
          id: "e1",
          source: "a",
          target: "b",
          data: {},
        },
        {
          id: "e2",
          source: "b",
          target: "c",
          data: {},
        },
        {
          id: "e3",
          source: "c",
          target: "d",
          data: {},
        },
        {
          id: "e4",
          source: "d",
          target: "h",
          data: {},
        },
        {
          id: "e5",
          source: "h",
          target: "g",
          data: {},
        },
        {
          id: "e6",
          source: "g",
          target: "e",
          data: {},
        },
        {
          id: "e7",
          source: "g",
          target: "f",
          data: {},
        },
      ],
    });
  });

  test("can assign a rank to a single node", function () {
    g.addNode({
      id: "a",
      data: {},
    });
    ns(g);
    expect(g.getNode("a").data.rank).toEqual(0);
  });

  test("can assign a rank to a 2-node connected graph", function () {
    g.addNode({
      id: "a",
      data: {},
    });
    g.addNode({
      id: "b",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a",
      target: "b",
      data: {
        minlen: 1,
        weight: 1,
      },
    });
    ns(g);
    expect(g.getNode("a").data.rank).toEqual(0);
    expect(g.getNode("b").data.rank).toEqual(1);
  });

  test("can assign ranks for a diamond", function () {
    g.addNodes([
      {
        id: "a",
        data: {},
      },
      {
        id: "b",
        data: {},
      },
      {
        id: "c",
        data: {},
      },
      {
        id: "d",
        data: {},
      },
    ]);
    g.addEdges([
      {
        id: "e1",
        source: "a",
        target: "b",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e2",
        source: "b",
        target: "d",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e3",
        source: "a",
        target: "c",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e4",
        source: "c",
        target: "d",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
    ]);

    ns(g);
    expect(g.getNode("a").data.rank).toEqual(0);
    expect(g.getNode("b").data.rank).toEqual(1);
    expect(g.getNode("c").data.rank).toEqual(1);
    expect(g.getNode("d").data.rank).toEqual(2);
  });

  test("uses the minlen attribute on the edge", function () {
    g.addNodes([
      {
        id: "a",
        data: {},
      },
      {
        id: "b",
        data: {},
      },
      {
        id: "c",
        data: {},
      },
      {
        id: "d",
        data: {},
      },
    ]);

    g.addEdges([
      {
        id: "e1",
        source: "a",
        target: "b",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e2",
        source: "b",
        target: "d",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e3",
        source: "a",
        target: "c",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e4",
        source: "c",
        target: "d",
        data: {
          minlen: 2,
          weight: 1,
        },
      },
    ]);

    ns(g);
    expect(g.getNode("a").data.rank).toEqual(0);
    // longest path biases towards the lowest rank it can assign. Since the
    // graph has no optimization opportunities we can assume that the longest
    // path ranking is used.
    expect(g.getNode("b").data.rank).toEqual(2);
    expect(g.getNode("c").data.rank).toEqual(1);
    expect(g.getNode("d").data.rank).toEqual(3);
  });

  test("can rank the gansner graph", function () {
    g = gansnerGraph;
    ns(g);
    expect(g.getNode("a").data.rank).toEqual(0);
    expect(g.getNode("b").data.rank).toEqual(1);
    expect(g.getNode("c").data.rank).toEqual(2);
    expect(g.getNode("d").data.rank).toEqual(3);
    expect(g.getNode("h").data.rank).toEqual(4);
    expect(g.getNode("e").data.rank).toEqual(1);
    expect(g.getNode("f").data.rank).toEqual(1);
    expect(g.getNode("g").data.rank).toEqual(2);
  });

  test("can handle multi-edges", function () {
    g.addNodes([
      {
        id: "a",
        data: {},
      },
      {
        id: "b",
        data: {},
      },
      {
        id: "c",
        data: {},
      },
      {
        id: "d",
        data: {},
      },
      {
        id: "e",
        data: {},
      },
    ]);

    g.addEdges([
      {
        id: "e1",
        source: "a",
        target: "b",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e2",
        source: "b",
        target: "c",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e3",
        source: "c",
        target: "d",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e4",
        source: "a",
        target: "e",
        data: {
          minlen: 1,
          weight: 2,
        },
      },
      {
        id: "e5",
        source: "e",
        target: "d",
        data: {
          minlen: 1,
          weight: 1,
        },
      },
      {
        id: "e6",
        source: "b",
        target: "c",
        data: {
          minlen: 2,
          weight: 1,
        },
      },
    ]);

    ns(g);
    expect(g.getNode("a").data.rank).toEqual(0);
    expect(g.getNode("b").data.rank).toEqual(1);
    // b -> c has minlen = 1 and minlen = 2, so it should be 2 ranks apart.
    expect(g.getNode("c").data.rank).toEqual(3);
    expect(g.getNode("d").data.rank).toEqual(4);
    expect(g.getNode("e").data.rank).toEqual(1);
  });

  describe("leaveEdge", function () {
    test("returns undefined if there is no edge with a negative cutvalue", function () {
      let tree = new Graph();

      tree.addNodes([
        {
          id: "a",
          data: {},
        },
        {
          id: "b",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
      ]);

      tree.addEdges([
        {
          id: "e1",
          source: "a",
          target: "b",
          data: {
            cutvalue: 1,
          },
        },
        {
          id: "e2",
          source: "b",
          target: "c",
          data: {
            cutvalue: 1,
          },
        },
      ]);

      expect(leaveEdge(tree)).toBe(undefined);
    });

    test("returns an edge if one is found with a negative cutvalue", function () {
      let tree = new Graph();
      tree.addNodes([
        {
          id: "a",
          data: {},
        },
        {
          id: "b",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
      ]);

      tree.addEdges([
        {
          id: "e1",
          source: "a",
          target: "b",
          data: {
            cutvalue: 1,
          },
        },
        {
          id: "e2",
          source: "b",
          target: "c",
          data: {
            cutvalue: -1,
          },
        },
      ]);
      expect(leaveEdge(tree)).toEqual({
        id: "e2",
        source: "b",
        target: "c",
        data: {
          cutvalue: -1,
        },
      });
    });
  });

  describe("enterEdge", function () {
    test("finds an edge from the head to tail component", function () {
      g.addNodes([
        {
          id: "a",
          data: {
            rank: 0,
          },
        },
        {
          id: "b",
          data: {
            rank: 2,
          },
        },
        {
          id: "c",
          data: {
            rank: 3,
          },
        },
      ]);

      g.addEdges([
        {
          id: "e1",
          source: "a",
          target: "b",
          data: {},
        },
        {
          id: "e2",
          source: "b",
          target: "c",
          data: {},
        },
        {
          id: "e3",
          source: "a",
          target: "c",
          data: {},
        },
      ]);

      t.addNodes([
        {
          id: "a",
          data: {},
        },
        {
          id: "b",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "e1",
          source: "b",
          target: "c",
          data: {},
        },
        {
          id: "e2",
          source: "c",
          target: "a",
          data: {},
        },
      ]);
      initLowLimValues(t, "c");

      let f = enterEdge(t, g, {
        id: "e1",
        source: "b",
        target: "c",
        data: {},
      });
      expect(undirectedEdge(f)).toEqual(
        undirectedEdge({
          id: "e1",
          source: "a",
          target: "b",
          data: {},
        })
      );
    });

    test("works when the root of the tree is in the tail component", function () {
      g.addNodes([
        {
          id: "a",
          data: {
            rank: 0,
          },
        },
        {
          id: "b",
          data: {
            rank: 2,
          },
        },
        {
          id: "c",
          data: {
            rank: 3,
          },
        },
      ]);

      g.addEdges([
        {
          id: "e1",
          source: "a",
          target: "b",
          data: {},
        },
        {
          id: "e2",
          source: "b",
          target: "c",
          data: {},
        },
        {
          id: "e3",
          source: "a",
          target: "c",
          data: {},
        },
      ]);

      t.addNodes([
        {
          id: "a",
          data: {},
        },
        {
          id: "b",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "e1",
          source: "b",
          target: "c",
          data: {},
        },
        {
          id: "e2",
          source: "c",
          target: "a",
          data: {},
        },
      ]);
      initLowLimValues(t, "b");

      let f = enterEdge(t, g, {
        id: "e1",
        source: "b",
        target: "c",
        data: {},
      });
      expect(undirectedEdge(f)).toEqual(
        undirectedEdge({
          id: "e1",
          source: "a",
          target: "b",
          data: {},
        })
      );
    });

    test("finds the edge with the least slack", function () {
      g.addNodes([
        {
          id: "a",
          data: {
            rank: 0,
          },
        },
        {
          id: "b",
          data: {
            rank: 1,
          },
        },
        {
          id: "c",
          data: {
            rank: 3,
          },
        },
        {
          id: "d",
          data: {
            rank: 4,
          },
        },
      ]);
      g.addEdges([
        {
          id: "e1",
          source: "a",
          target: "d",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e2",
          source: "a",
          target: "c",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e3",
          source: "c",
          target: "d",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e4",
          source: "b",
          target: "c",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
      ]);

      t.addNodes([
        {
          id: "a",
          data: {},
        },
        {
          id: "b",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "d",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "e1",
          source: "c",
          target: "d",
          data: {},
        },
        {
          id: "e2",
          source: "d",
          target: "a",
          data: {},
        },
        {
          id: "e3",
          source: "a",
          target: "b",
          data: {},
        },
        {
          id: "e4",
          source: "d",
          target: "c",
          data: {},
        },
        {
          id: "e5",
          source: "a",
          target: "d",
          data: {},
        },
        {
          id: "e6",
          source: "b",
          target: "a",
          data: {},
        },
      ]);

      initLowLimValues(t, "a");

      let f = enterEdge(t, g, {
        id: "e1",
        source: "c",
        target: "d",
        data: {},
      });

      expect(undirectedEdge(f)).toEqual(
        undirectedEdge({
          id: "e4",
          source: "b",
          target: "c",
          data: {},
        })
      );
    });

    test("finds an appropriate edge for gansner graph #1", function () {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "a");

      let f = enterEdge(t, g, {
        id: "e7",
        source: "g",
        target: "h",
        data: {
          minlen: 1,
          weight: 1,
        },
      });
      expect(undirectedEdge(f).source).toEqual("a");
      expect(["e", "f"]).toContain(undirectedEdge(f).target);
    });

    test("finds an appropriate edge for gansner graph #2", function () {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "e");

      let f = enterEdge(t, g, {
        id: "e7",
        source: "g",
        target: "h",
        data: {
          minlen: 1,
          weight: 1,
        },
      });
      expect(undirectedEdge(f).source).toEqual("a");
      expect(["e", "f"]).toContain(undirectedEdge(f).target);
    });

    test("finds an appropriate edge for gansner graph #3", function () {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "a");

      let f = enterEdge(t, g, {
        id: "e5",
        source: "h",
        target: "g",
        data: {},
      });
      expect(undirectedEdge(f).source).toEqual("a");
      expect(["e", "f"]).toContain(undirectedEdge(f).target);
    });

    test("finds an appropriate edge for gansner graph #4", function () {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "e");

      let f = enterEdge(t, g, {
        id: "e5",
        source: "h",
        target: "g",
        data: {},
      });
      expect(undirectedEdge(f).source).toEqual("a");
      expect(["e", "f"]).toContain(undirectedEdge(f).target);
    });
  });

  describe("initLowLimValues", function () {
    test("assigns low, lim, and parent for each node in a tree", function () {
      let g = new Graph<any, any>({
        nodes: [
          {
            id: "a",
            data: {},
          },
          {
            id: "b",
            data: {},
          },
          {
            id: "c",
            data: {},
          },
          {
            id: "d",
            data: {},
          },
          {
            id: "e",
            data: {},
          },
        ],
        edges: [
          {
            id: "e1",
            source: "a",
            target: "b",
            data: {},
          },
          {
            id: "e2",
            source: "b",
            target: "a",
            data: {},
          },
          {
            id: "e3",
            source: "a",
            target: "c",
            data: {},
          },
          {
            id: "e4",
            source: "c",
            target: "d",
            data: {},
          },
          {
            id: "e5",
            source: "d",
            target: "c",
            data: {},
          },
          {
            id: "e6",
            source: "c",
            target: "e",
            data: {},
          },
        ],
      });

      initLowLimValues(g, "a");

      let a = g.getNode("a");
      let b = g.getNode("b");
      let c = g.getNode("c");
      let d = g.getNode("d");
      let e = g.getNode("e");

      expect(
        g
          .getAllNodes()
          .map((e) => e.data.lim)
          .sort()
      ).toEqual([1, 2, 3, 4, 5]);

      expect(a.data.low).toEqual(1);
      expect(a.data.lim).toEqual(5);

      expect(b.data.parent).toEqual("a");
      expect(b.data.lim).toBeLessThan(a.data.lim);

      expect(c.data.parent).toEqual("a");
      expect(c.data.lim).toBeLessThan(a.data.lim);
      expect(c.data.lim).not.toEqual(b.data.lim);

      expect(d.data.parent).toEqual("c");
      expect(d.data.lim).toBeLessThan(c.data.lim);

      expect(e.data.parent).toEqual("c");
      expect(e.data.lim).toBeLessThan(c.data.lim);
      expect(e.data.lim).not.toEqual(d.data.lim);
    });
  });

  describe("exchangeEdges", function () {
    test("exchanges edges and updates cut values and low/lim numbers", function () {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t);

      exchangeEdges(
        t,
        g,
        {
          id: "e7",
          source: "g",
          target: "h",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e5",
          source: "a",
          target: "e",
          data: {
            minlen: 1,
            weight: 1,
          },
        }
      );

      // check new cut values
      expect(
        t
          .getRelatedEdges("a", "both")
          .find((e) => e.target === "b" || e.source === "b")!.data.cutvalue
      ).toEqual(2);
      expect(
        t
          .getRelatedEdges("b", "both")
          .find((e) => e.target === "c" || e.source === "c")!.data.cutvalue
      ).toEqual(2);
      expect(
        t
          .getRelatedEdges("c", "both")
          .find((e) => e.target === "d" || e.source === "d")!.data.cutvalue
      ).toEqual(2);
      expect(
        t
          .getRelatedEdges("d", "both")
          .find((e) => e.target === "h" || e.source === "h")!.data.cutvalue
      ).toEqual(2);
      expect(
        t
          .getRelatedEdges("a", "both")
          .find((e) => e.target === "e" || e.source === "e")!.data.cutvalue
      ).toEqual(1);
      expect(
        t
          .getRelatedEdges("e", "both")
          .find((e) => e.target === "g" || e.source === "g")!.data.cutvalue
      ).toEqual(1);
      expect(
        t
          .getRelatedEdges("g", "both")
          .find((e) => e.target === "f" || e.source === "f")!.data.cutvalue
      ).toEqual(0);

      // ensure lim numbers look right
      let lims = t
        .getAllNodes()
        .map((e) => e.data.lim)
        .sort();
      expect(lims).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    });

    test("updates ranks", function () {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t);

      exchangeEdges(
        t,
        g,
        {
          id: "e7",
          source: "g",
          target: "h",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e5",
          source: "a",
          target: "e",
          data: {
            minlen: 1,
            weight: 1,
          },
        }
      );

      normalizeRanks(g);

      // check new ranks
      expect(g.getNode("a").data.rank).toEqual(0);
      expect(g.getNode("b").data.rank).toEqual(1);
      expect(g.getNode("c").data.rank).toEqual(2);
      expect(g.getNode("d").data.rank).toEqual(3);
      expect(g.getNode("e").data.rank).toEqual(1);
      expect(g.getNode("f").data.rank).toEqual(1);
      expect(g.getNode("g").data.rank).toEqual(2);
      expect(g.getNode("h").data.rank).toEqual(4);
    });
  });

  // Note: we use p for parent, c for child, gc_x for grandchild nodes, and o for
  // other nodes in the tree for these tests.
  describe("calcCutValue", function () {
    test("works for a 2-node tree with c -> p", function () {
      g.addNodes([
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      g.addEdge({
        id: "cp",
        source: "c",
        target: "p",
        data: { minlen: 1, weight: 1 },
      });

      t.addNodes([
        {
          id: "p",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
      ]);
      t.addEdge({
        id: "pc",
        source: "p",
        target: "c",
        data: {},
      });

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(1);
    });

    test("works for a 2-node tree with c <- p", function () {
      g.addNodes([
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      g.addEdge({
        id: "pc",
        source: "p",
        target: "c",
        data: { minlen: 1, weight: 1 },
      });

      t.addNodes([
        {
          id: "p",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
      ]);
      t.addEdge({
        id: "pc",
        source: "p",
        target: "c",
        data: {},
      });
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(1);
    });

    test("works for 3-node tree with gc -> c -> p", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      g.addEdge({
        id: "gc",
        source: "gc",
        target: "c",
        data: { minlen: 1, weight: 1 },
      });
      g.addEdge({
        id: "cp",
        source: "c",
        target: "p",
        data: { minlen: 1, weight: 1 },
      });

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      t.addEdge({
        id: "gc",
        source: "gc",
        target: "c",
        data: { cutvalue: 3 },
      });
      t.addEdge({
        id: "cg",
        source: "c",
        target: "gc",
        data: { cutvalue: 3 },
      });
      t.addEdge({
        id: "pc",
        source: "p",
        target: "c",
        data: {},
      });
      t.addEdge({
        id: "cp",
        source: "c",
        target: "p",
        data: {},
      });

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(3);
    });

    test("works for 3-node tree with gc -> c <- p", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      g.addEdge({
        id: "gc",
        source: "gc",
        target: "c",
        data: { minlen: 1, weight: 1 },
      });
      g.addEdge({
        id: "pc",
        source: "p",
        target: "c",
        data: { minlen: 1, weight: 1 },
      });

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      t.addEdge({
        id: "gc",
        source: "gc",
        target: "c",
        data: { cutvalue: 3 },
      });
      t.addEdge({
        id: "cg",
        source: "c",
        target: "gc",
        data: { cutvalue: 3 },
      });
      t.addEdge({
        id: "pc",
        source: "p",
        target: "c",
        data: {},
      });
      t.addEdge({
        id: "cp",
        source: "c",
        target: "p",
        data: {},
      });

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-1);
    });

    test("works for 3-node tree with gc <- c -> p", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      g.addEdge({
        id: "cp",
        source: "c",
        target: "p",
        data: { minlen: 1, weight: 1 },
      });
      g.addEdge({
        id: "cg",
        source: "c",
        target: "gc",
        data: { minlen: 1, weight: 1 },
      });

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      t.addEdge({
        id: "gc",
        source: "gc",
        target: "c",
        data: { cutvalue: 3 },
      });
      t.addEdge({
        id: "pc",
        source: "p",
        target: "c",
        data: {},
      });

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-1);
    });

    test("works for 3-node tree with gc <- c <- p", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      g.addEdge({
        id: "pc",
        source: "p",
        target: "c",
        data: { minlen: 1, weight: 1 },
      });
      g.addEdge({
        id: "cg",
        source: "c",
        target: "gc",
        data: { minlen: 1, weight: 1 },
      });

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
      ]);
      t.addEdge({
        id: "gc",
        source: "gc",
        target: "c",
        data: { cutvalue: 3 },
      });
      t.addEdge({
        id: "pc",
        source: "p",
        target: "c",
        data: {},
      });

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(3);
    });

    test("works for 4-node tree with gc -> c -> p -> o, with o -> c", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      g.addEdges([
        {
          id: "oc",
          source: "o",
          target: "c",
          data: { minlen: 1, weight: 7 },
        },
        {
          id: "gcc",
          source: "gc",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "po",
          source: "p",
          target: "o",
          data: { minlen: 1, weight: 1 },
        },
      ]);

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "gc",
          source: "gc",
          target: "c",
          data: { cutvalue: 3 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: {},
        },
        {
          id: "po",
          source: "p",
          target: "o",
          data: {},
        },
      ]);
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-4);
    });

    test("works for 4-node tree with gc -> c -> p -> o, with o <- c", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      g.addEdges([
        {
          id: "co",
          source: "c",
          target: "o",
          data: { minlen: 1, weight: 7 },
        },
        {
          id: "gcc",
          source: "gc",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "po",
          source: "p",
          target: "o",
          data: { minlen: 1, weight: 1 },
        },
      ]);

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "gc",
          source: "gc",
          target: "c",
          data: { cutvalue: 3 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: {},
        },
        {
          id: "po",
          source: "p",
          target: "o",
          data: {},
        },
      ]);

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(10);
    });

    test("works for 4-node tree with o -> gc -> c -> p, with o -> c", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      g.addEdges([
        {
          id: "oc",
          source: "o",
          target: "c",
          data: { minlen: 1, weight: 7 },
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "gcc",
          source: "gc",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: { minlen: 1, weight: 1 },
        },
      ]);

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "gc",
          source: "gc",
          target: "c",
          data: { cutvalue: 3 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: {},
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: {},
        },
      ]);

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-4);
    });

    test("works for 4-node tree with o -> gc -> c -> p, with o <- c", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      g.addEdges([
        {
          id: "co",
          source: "c",
          target: "o",
          data: { minlen: 1, weight: 7 },
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "gcc",
          source: "gc",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: { minlen: 1, weight: 1 },
        },
      ]);

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "gc",
          source: "gc",
          target: "c",
          data: { cutvalue: 3 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: {},
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: {},
        },
      ]);

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(10);
    });

    test("works for 4-node tree with gc -> c <- p -> o, with o -> c", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);

      g.addEdges([
        {
          id: "oc",
          source: "o",
          target: "c",
          data: { minlen: 1, weight: 7 },
        },
        {
          id: "gcc",
          source: "gc",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "pc",
          source: "p",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "po",
          source: "p",
          target: "o",
          data: { minlen: 1, weight: 1 },
        },
      ]);

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "gc",
          source: "gc",
          target: "c",
          data: { cutvalue: 3 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: {},
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: {},
        },
      ]);

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(6);
    });

    test("works for 4-node tree with gc -> c <- p -> o, with o <- c", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);

      g.addEdges([
        {
          id: "co",
          source: "c",
          target: "o",
          data: { minlen: 1, weight: 7 },
        },
        {
          id: "gcc",
          source: "gc",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "pc",
          source: "p",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "po",
          source: "p",
          target: "o",
          data: { minlen: 1, weight: 1 },
        },
      ]);

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "gc",
          source: "gc",
          target: "c",
          data: { cutvalue: 3 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: {},
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: {},
        },
      ]);

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-8);
    });

    test("works for 4-node tree with o -> gc -> c <- p, with o -> c", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      g.addEdges([
        {
          id: "oc",
          source: "o",
          target: "c",
          data: { minlen: 1, weight: 7 },
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "gcc",
          source: "gc",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "pc",
          source: "p",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
      ]);

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "gc",
          source: "gc",
          target: "c",
          data: { cutvalue: 3 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: {},
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: {},
        },
      ]);

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(6);
    });

    test("works for 4-node tree with o -> gc -> c <- p, with o <- c", function () {
      g.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);

      g.addEdges([
        {
          id: "co",
          source: "c",
          target: "o",
          data: { minlen: 1, weight: 7 },
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "gcc",
          source: "gc",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
        {
          id: "pc",
          source: "p",
          target: "c",
          data: { minlen: 1, weight: 1 },
        },
      ]);

      t.addNodes([
        {
          id: "gc",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "p",
          data: {},
        },
        {
          id: "o",
          data: {},
        },
      ]);
      t.addEdges([
        {
          id: "gc",
          source: "gc",
          target: "c",
          data: { cutvalue: 3 },
        },
        {
          id: "cp",
          source: "c",
          target: "p",
          data: {},
        },
        {
          id: "ogc",
          source: "o",
          target: "gc",
          data: {},
        },
      ]);

      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-8);
    });
  });

  describe("initCutValues", function () {
    test("works for gansnerGraph", function () {
      initLowLimValues(gansnerTree);
      initCutValues(gansnerTree, gansnerGraph);

      expect(
        gansnerTree.getRelatedEdges("a", "out").find((e) => e.target === "b")!
          .data.cutvalue
      ).toEqual(3);
      expect(
        gansnerTree.getRelatedEdges("b", "out").find((e) => e.target === "c")!
          .data.cutvalue
      ).toEqual(3);
      expect(
        gansnerTree.getRelatedEdges("c", "out").find((e) => e.target === "d")!
          .data.cutvalue
      ).toEqual(3);
      expect(
        gansnerTree.getRelatedEdges("d", "out").find((e) => e.target === "h")!
          .data.cutvalue
      ).toEqual(3);
      expect(
        gansnerTree.getRelatedEdges("h", "out").find((e) => e.target === "g")!
          .data.cutvalue
      ).toEqual(-1);
      expect(
        gansnerTree.getRelatedEdges("g", "out").find((e) => e.target === "e")!
          .data.cutvalue
      ).toEqual(0);
      expect(
        gansnerTree.getRelatedEdges("g", "out").find((e) => e.target === "f")!
          .data.cutvalue
      ).toEqual(0);
    });

    test("works for updated gansnerGraph", function () {
      const edge = gansnerTree
        .getRelatedEdges("g", "both")
        .find((e) => e.source === "h" || e.target === "h");
      gansnerTree.removeEdge(edge?.id!);
      gansnerTree.addEdge({
        id: "e10",
        source: "a",
        target: "e",
        data: {},
      });
      initLowLimValues(gansnerTree);
      initCutValues(gansnerTree, gansnerGraph);

      expect(
        gansnerTree.getRelatedEdges("a", "out").find((e) => e.target === "b")!
          .data.cutvalue
      ).toEqual(2);
      expect(
        gansnerTree.getRelatedEdges("b", "out").find((e) => e.target === "c")!
          .data.cutvalue
      ).toEqual(2);
      expect(
        gansnerTree.getRelatedEdges("c", "out").find((e) => e.target === "d")!
          .data.cutvalue
      ).toEqual(2);
      expect(
        gansnerTree.getRelatedEdges("a", "out").find((e) => e.target === "e")!
          .data.cutvalue
      ).toEqual(1);
      expect(
        gansnerTree.getRelatedEdges("g", "out").find((e) => e.target === "e")!
          .data.cutvalue
      ).toEqual(1);
      expect(
        gansnerTree.getRelatedEdges("g", "out").find((e) => e.target === "f")!
          .data.cutvalue
      ).toEqual(0);
    });
  });
});

function ns(g: IGraph) {
  networkSimplex(g);
  normalizeRanks(g);
}

function undirectedEdge(e: Edge<EdgeData>) {
  return e.source < e.target
    ? { source: e.source, target: e.target }
    : { source: e.target, target: e.source };
}

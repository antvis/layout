import {Graph} from '@antv/graphlib';
import networkSimplex, { initLowLimValues, initCutValues, calcCutValue, leaveEdge, enterEdge, exchangeEdges } from '../../../src/layout/dagre/src/rank/network-simplex';
import { longestPath } from '../../../src/layout/dagre/src/rank/util';
import { normalizeRanks } from '../../../src/layout/dagre/src/util';

describe("network simplex", function() {
  let g, t, gansnerGraph, gansnerTree;

  beforeEach(function() {
    g = new Graph<string ,any, any, any>({ multigraph: true })
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; });

    t = new Graph<string ,any, any, any>({ directed: false })
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return {}; });

    gansnerGraph = new Graph<string ,any, any, any>()
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; })
      .setPath(["a", "b", "c", "d", "h"])
      .setPath(["a", "e", "g", "h"])
      .setPath(["a", "f", "g"]);

    gansnerTree = new Graph<string ,any, any, any>({ directed: false })
      .setDefaultNodeLabel(function() { return {}; })
      .setDefaultEdgeLabel(function() { return {}; })
      .setPath(["a", "b", "c", "d", "h", "g", "e"])
      .setEdge("g", "f");
  });

  it("can assign a rank to a single node", function() {
    g.setNode("a");
    ns(g);
    expect(g.node("a").rank).toEqual(0);
  });

  it("can assign a rank to a 2-node connected graph", function() {
    g.setEdge("a", "b");
    ns(g);
    expect(g.node("a").rank).toEqual(0);
    expect(g.node("b").rank).toEqual(1);
  });

  it("can assign ranks for a diamond", function() {
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);
    ns(g);
    expect(g.node("a").rank).toEqual(0);
    expect(g.node("b").rank).toEqual(1);
    expect(g.node("c").rank).toEqual(1);
    expect(g.node("d").rank).toEqual(2);
  });

  it("uses the minlen attribute on the edge", function() {
    g.setPath(["a", "b", "d"]);
    g.setEdge("a", "c");
    g.setEdge("c", "d", { minlen: 2 });
    ns(g);
    expect(g.node("a").rank).toEqual(0);
    // longest path biases towards the lowest rank it can assign. Since the
    // graph has no optimization opportunities we can assume that the longest
    // path ranking is used.
    expect(g.node("b").rank).toEqual(2);
    expect(g.node("c").rank).toEqual(1);
    expect(g.node("d").rank).toEqual(3);
  });

  it("can rank the gansner graph", function() {
    g = gansnerGraph;
    ns(g);
    expect(g.node("a").rank).toEqual(0);
    expect(g.node("b").rank).toEqual(1);
    expect(g.node("c").rank).toEqual(2);
    expect(g.node("d").rank).toEqual(3);
    expect(g.node("h").rank).toEqual(4);
    expect(g.node("e").rank).toEqual(1);
    expect(g.node("f").rank).toEqual(1);
    expect(g.node("g").rank).toEqual(2);
  });

  it("can handle multi-edges", function() {
    g.setPath(["a", "b", "c", "d"]);
    g.setEdge("a", "e", { weight: 2, minlen: 1 });
    g.setEdge("e", "d");
    g.setEdge("b", "c", { weight: 1, minlen: 2 }, "multi");
    ns(g);
    expect(g.node("a").rank).toEqual(0);
    expect(g.node("b").rank).toEqual(1);
    // b -> c has minlen = 1 and minlen = 2, so it should be 2 ranks apart.
    expect(g.node("c").rank).toEqual(3);
    expect(g.node("d").rank).toEqual(4);
    expect(g.node("e").rank).toEqual(1);
  });

  describe("leaveEdge", function() {
    it("returns undefined if there is no edge with a negative cutvalue", function() {
      let tree = new Graph<string ,any, any, any>({ directed: false });
      tree.setEdge("a", "b", { cutvalue: 1 });
      tree.setEdge("b", "c", { cutvalue: 1 });
      expect(leaveEdge(tree)).toBe(undefined);
    });

    it("returns an edge if one is found with a negative cutvalue", function() {
      let tree = new Graph<string ,any, any, any>({ directed: false });
      tree.setEdge("a", "b", { cutvalue: 1 });
      tree.setEdge("b", "c", { cutvalue: -1 });
      expect(leaveEdge(tree)).toEqual({ v: "b", w: "c" });
    });
  });

  describe("enterEdge", function() {
    it("finds an edge from the head to tail component", function() {
      g
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 2 })
        .setNode("c", { rank: 3 })
        .setPath(["a", "b", "c"])
        .setEdge("a", "c");
      t.setPath(["b", "c", "a"]);
      initLowLimValues(t, "c");

      let f = enterEdge(t, g, { v: "b", w: "c" });
      expect(undirectedEdge(f)).toEqual(undirectedEdge({ v: "a", w: "b" }));
    });

    it("works when the root of the tree is in the tail component", function() {
      g
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 2 })
        .setNode("c", { rank: 3 })
        .setPath(["a", "b", "c"])
        .setEdge("a", "c");
      t.setPath(["b", "c", "a"]);
      initLowLimValues(t, "b");

      let f = enterEdge(t, g, { v: "b", w: "c" });
      expect(undirectedEdge(f)).toEqual(undirectedEdge({ v: "a", w: "b" }));
    });

    it("finds the edge with the least slack", function() {
      g
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 1 })
        .setNode("c", { rank: 3 })
        .setNode("d", { rank: 4 })
        .setEdge("a", "d")
        .setPath(["a", "c", "d"])
        .setEdge("b", "c");
      t.setPath(["c", "d", "a", "b"]);
      initLowLimValues(t, "a");

      let f = enterEdge(t, g, { v: "c", w: "d" });
      expect(undirectedEdge(f)).toEqual(undirectedEdge({ v: "b", w: "c" }));
    });

    it("finds an appropriate edge for gansner graph #1", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "a");

      let f = enterEdge(t, g, { v: "g", w: "h" });
      expect(undirectedEdge(f).v).toEqual("a");
      expect(["e", "f"]).toContain(undirectedEdge(f).w);
    });

    it("finds an appropriate edge for gansner graph #2", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "e");

      let f = enterEdge(t, g, { v: "g", w: "h" });
      expect(undirectedEdge(f).v).toEqual("a");
      expect(["e", "f"]).toContain(undirectedEdge(f).w);
    });

    it("finds an appropriate edge for gansner graph #3", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "a");

      let f = enterEdge(t, g, { v: "h", w: "g" });
      expect(undirectedEdge(f).v).toEqual("a");
      expect(["e", "f"]).toContain(undirectedEdge(f).w);
    });

    it("finds an appropriate edge for gansner graph #4", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t, "e");

      let f = enterEdge(t, g, { v: "h", w: "g" });
      expect(undirectedEdge(f).v).toEqual("a");
      expect(["e", "f"]).toContain(undirectedEdge(f).w);
    });
  });

  describe("initLowLimValues", function() {
    it("assigns low, lim, and parent for each node in a tree", function() {
      let g = new Graph<string ,any, any, any>()
        .setDefaultNodeLabel(function() { return {}; })
        .setNodes(["a", "b", "c", "d", "e"])
        .setPath(["a", "b", "a", "c", "d", "c", "e"]);

      initLowLimValues(g, "a");

      let a = g.node("a");
      let b = g.node("b");
      let c = g.node("c");
      let d = g.node("d");
      let e = g.node("e");

      expect(g.nodes().map(e => g.node(e).lim).sort()).toEqual([1,2,3,4,5]);

      expect(a).toEqual({ low: 1, lim: 5 });

      expect(b.parent).toEqual("a");
      expect(b.lim).toBeLessThan(a.lim);

      expect(c.parent).toEqual("a");
      expect(c.lim).toBeLessThan(a.lim);
      expect(c.lim).not.toEqual(b.lim);

      expect(d.parent).toEqual("c");
      expect(d.lim).toBeLessThan(c.lim);

      expect(e.parent).toEqual("c");
      expect(e.lim).toBeLessThan(c.lim);
      expect(e.lim).not.toEqual(d.lim);
    });
  });

  describe("exchangeEdges", function() {
    it("exchanges edges and updates cut values and low/lim numbers", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t);

      exchangeEdges(t, g, { v: "g", w: "h" }, { v: "a", w: "e" });

      // check new cut values
      expect(t.edgeFromArgs("a", "b").cutvalue).toEqual(2);
      expect(t.edgeFromArgs("b", "c").cutvalue).toEqual(2);
      expect(t.edgeFromArgs("c", "d").cutvalue).toEqual(2);
      expect(t.edgeFromArgs("d", "h").cutvalue).toEqual(2);
      expect(t.edgeFromArgs("a", "e").cutvalue).toEqual(1);
      expect(t.edgeFromArgs("e", "g").cutvalue).toEqual(1);
      expect(t.edgeFromArgs("g", "f").cutvalue).toEqual(0);

      // ensure lim numbers look right
      let lims = t.nodes().map(e => t.node(e).lim).sort();
      expect(lims).toEqual([1,2,3,4,5,6,7,8]);
    });

    it("updates ranks", function() {
      g = gansnerGraph;
      t = gansnerTree;
      longestPath(g);
      initLowLimValues(t);

      exchangeEdges(t, g, { v: "g", w: "h" }, { v: "a", w: "e" });
      normalizeRanks(g);

      // check new ranks
      expect(g.node("a").rank).toEqual(0);
      expect(g.node("b").rank).toEqual(1);
      expect(g.node("c").rank).toEqual(2);
      expect(g.node("d").rank).toEqual(3);
      expect(g.node("e").rank).toEqual(1);
      expect(g.node("f").rank).toEqual(1);
      expect(g.node("g").rank).toEqual(2);
      expect(g.node("h").rank).toEqual(4);
    });
  });

  // Note: we use p for parent, c for child, gc_x for grandchild nodes, and o for
  // other nodes in the tree for these tests.
  describe("calcCutValue", function() {
    it("works for a 2-node tree with c -> p", function() {
      g.setPath(["c", "p"]);
      t.setPath(["p", "c"]);
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(1);
    });

    it("works for a 2-node tree with c <- p", function() {
      g.setPath(["p", "c"]);
      t.setPath(["p", "c"]);
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(1);
    });

    it("works for 3-node tree with gc -> c -> p", function() {
      g.setPath(["gc", "c", "p"]);
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("p", "c");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(3);
    });

    it("works for 3-node tree with gc -> c <- p", function() {
      g
        .setEdge("p", "c")
        .setEdge("gc", "c");
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("p", "c");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-1);
    });

    it("works for 3-node tree with gc <- c -> p", function() {
      g
        .setEdge("c", "p")
        .setEdge("c", "gc");
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("p", "c");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-1);
    });

    it("works for 3-node tree with gc <- c <- p", function() {
      g.setPath(["p", "c", "gc"]);
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("p", "c");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(3);
    });

    it("works for 4-node tree with gc -> c -> p -> o, with o -> c", function() {
      g
        .setEdge("o", "c", { weight: 7 })
        .setPath(["gc", "c", "p", "o"]);
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setPath(["c", "p", "o"]);
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-4);
    });

    it("works for 4-node tree with gc -> c -> p -> o, with o <- c", function() {
      g
        .setEdge("c", "o", { weight: 7 })
        .setPath(["gc", "c", "p", "o"]);
      t
        .setEdge("gc", "c", { cutvalue: 3 })
        .setPath(["c", "p", "o"]);
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(10);
    });

    it("works for 4-node tree with o -> gc -> c -> p, with o -> c", function() {
      g
        .setEdge("o", "c", { weight: 7 })
        .setPath(["o", "gc", "c", "p"]);
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-4);
    });

    it("works for 4-node tree with o -> gc -> c -> p, with o <- c", function() {
      g
        .setEdge("c", "o", { weight: 7 })
        .setPath(["o", "gc", "c", "p"]);
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(10);
    });

    it("works for 4-node tree with gc -> c <- p -> o, with o -> c", function() {
      g
        .setEdge("gc", "c")
        .setEdge("p", "c")
        .setEdge("p", "o")
        .setEdge("o", "c", { weight: 7 });
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(6);
    });

    it("works for 4-node tree with gc -> c <- p -> o, with o <- c", function() {
      g
        .setEdge("gc", "c")
        .setEdge("p", "c")
        .setEdge("p", "o")
        .setEdge("c", "o", { weight: 7 });
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-8);
    });

    it("works for 4-node tree with o -> gc -> c <- p, with o -> c", function() {
      g
        .setEdge("o", "c", { weight: 7 })
        .setPath(["o", "gc", "c"])
        .setEdge("p", "c");
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(6);
    });

    it("works for 4-node tree with o -> gc -> c <- p, with o <- c", function() {
      g
        .setEdge("c", "o", { weight: 7 })
        .setPath(["o", "gc", "c"])
        .setEdge("p", "c");
      t
        .setEdge("o", "gc")
        .setEdge("gc", "c", { cutvalue: 3 })
        .setEdge("c", "p");
      initLowLimValues(t, "p");

      expect(calcCutValue(t, g, "c")).toEqual(-8);
    });
  });

  describe("initCutValues", function() {
    it("works for gansnerGraph", function() {
      initLowLimValues(gansnerTree);
      initCutValues(gansnerTree, gansnerGraph);
      expect(gansnerTree.edgeFromArgs("a", "b").cutvalue).toEqual(3);
      expect(gansnerTree.edgeFromArgs("b", "c").cutvalue).toEqual(3);
      expect(gansnerTree.edgeFromArgs("c", "d").cutvalue).toEqual(3);
      expect(gansnerTree.edgeFromArgs("d", "h").cutvalue).toEqual(3);
      expect(gansnerTree.edgeFromArgs("g", "h").cutvalue).toEqual(-1);
      expect(gansnerTree.edgeFromArgs("e", "g").cutvalue).toEqual(0);
      expect(gansnerTree.edgeFromArgs("f", "g").cutvalue).toEqual(0);
    });

    it("works for updated gansnerGraph", function() {
      gansnerTree.removeEdge("g", "h");
      gansnerTree.setEdge("a", "e");
      initLowLimValues(gansnerTree);
      initCutValues(gansnerTree, gansnerGraph);
      expect(gansnerTree.edgeFromArgs("a", "b").cutvalue).toEqual(2);
      expect(gansnerTree.edgeFromArgs("b", "c").cutvalue).toEqual(2);
      expect(gansnerTree.edgeFromArgs("c", "d").cutvalue).toEqual(2);
      expect(gansnerTree.edgeFromArgs("d", "h").cutvalue).toEqual(2);
      expect(gansnerTree.edgeFromArgs("a", "e").cutvalue).toEqual(1);
      expect(gansnerTree.edgeFromArgs("e", "g").cutvalue).toEqual(1);
      expect(gansnerTree.edgeFromArgs("f", "g").cutvalue).toEqual(0);
    });
  });
});

function ns(g) {
  networkSimplex(g);
  normalizeRanks(g);
}

function undirectedEdge(e) {
  return e.v < e.w ? { v: e.v, w: e.w } : { v: e.w, w: e.v };
}

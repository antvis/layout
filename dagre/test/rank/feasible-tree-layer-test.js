var _ = require("lodash");
var expect = require("../chai").expect;
var Graph = require("../../lib/graphlib").Graph;
var feasibleTree =
  require("../../lib/rank/feasible-tree").feasibleTreeWithLayer;

describe("feasibleTreeWithLayer", function () {
  describe("specify layer, rank according to given layer", function () {
    it("proper layer", function () {
      var g = new Graph()
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 1, layer: 1 })
        .setNode("c", { rank: 2 })
        // .setNode("d", { rank: 2 })
        .setEdge("a", "b", { minlen: 1 })
        .setEdge("a", "c", { minlen: 1 });
      // .setEdge("b", "d", { minlen: 1 });

      feasibleTree(g);
      expect(g.node("b").rank).to.equal(g.node("a").rank + 1);
      expect(g.node("c").rank).to.equal(g.node("a").rank + 1);
    });
    it("deeper layer", function () {
      var g = new Graph()
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 2, layer: 2 })
        .setNode("c", { rank: 2 })
        .setNode("d", { rank: 2 })
        .setEdge("a", "b", { minlen: 1 })
        .setEdge("a", "c", { minlen: 1 })
        .setEdge("b", "d", { minlen: 1 });

      feasibleTree(g);
      expect(g.node("b").rank).to.equal(g.node("a").rank + 2);
      expect(g.node("d").rank).to.equal(g.node("b").rank + 1);
      expect(g.node("c").rank).to.equal(g.node("a").rank + 1);
    });
    it("shalow layer", function () {
      var g = new Graph()
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 0, layer: 0 })
        .setNode("c", { rank: 2 })
        .setNode("d", { rank: 2 })
        .setEdge("a", "b", { minlen: 1 })
        .setEdge("a", "c", { minlen: 1 })
        .setEdge("b", "d", { minlen: 1 });

      feasibleTree(g);
      expect(g.node("b").rank).to.equal(g.node("a").rank);
      expect(g.node("c").rank).to.equal(g.node("a").rank + 1);
      expect(g.node("d").rank).to.equal(g.node("b").rank + 1);
    });
  });
  describe("without specify layer, no effect", function () {
    it("creates a tree for a trivial input graph", function () {
      var g = new Graph()
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 1 })
        .setEdge("a", "b", { minlen: 1 });

      var tree = feasibleTree(g);
      expect(g.node("b").rank).to.equal(g.node("a").rank + 1);
      expect(tree.neighbors("a")).to.eql(["b"]);
    });

    it("correctly shortens slack by pulling a node up", function () {
      var g = new Graph()
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 1 })
        .setNode("c", { rank: 2 })
        .setNode("d", { rank: 2 })
        .setPath(["a", "b", "c"], { minlen: 1 })
        .setEdge("a", "d", { minlen: 1 });

      var tree = feasibleTree(g);
      expect(g.node("b").rank).to.eql(g.node("a").rank + 1);
      expect(g.node("c").rank).to.eql(g.node("b").rank + 1);
      expect(g.node("d").rank).to.eql(g.node("a").rank + 1);
      expect(_.sortBy(tree.neighbors("a"))).to.eql(["b", "d"]);
      expect(_.sortBy(tree.neighbors("b"))).to.eql(["a", "c"]);
      expect(tree.neighbors("c")).to.eql(["b"]);
      expect(tree.neighbors("d")).to.eql(["a"]);
    });

    it("correctly shortens slack by pulling a node down", function () {
      var g = new Graph()
        .setNode("a", { rank: 2 })
        .setNode("b", { rank: 0 })
        .setNode("c", { rank: 2 })
        .setEdge("b", "a", { minlen: 1 })
        .setEdge("b", "c", { minlen: 1 });

      var tree = feasibleTree(g);
      expect(g.node("a").rank).to.eql(g.node("b").rank + 1);
      expect(g.node("c").rank).to.eql(g.node("b").rank + 1);
      expect(_.sortBy(tree.neighbors("a"))).to.eql(["b"]);
      expect(_.sortBy(tree.neighbors("b"))).to.eql(["a", "c"]);
      expect(_.sortBy(tree.neighbors("c"))).to.eql(["b"]);
    });
  });
});

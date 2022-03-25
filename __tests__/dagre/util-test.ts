import { Graph } from '@antv/graphlib';
import * as util from "../../src/layout/dagre/src/util";

describe("util", function() {
  describe("simplify", function() {
    let g;

    beforeEach(function() {
      g = new Graph({ multigraph: true });
    });

    it("copies without change a graph with no multi-edges", function() {
      g.setEdge("a", "b", { weight: 1, minlen: 1 });
      let g2 = util.simplify(g);
      expect(g2.edgeFromArgs("a", "b")).toEqual({ weight: 1, minlen: 1 });
      expect(g2.edgeCount()).toEqual(1);
    });

    it("collapses multi-edges", function() {
      g.setEdge("a", "b", { weight: 1, minlen: 1 });
      g.setEdge("a", "b", { weight: 2, minlen: 2 }, "multi");
      let g2 = util.simplify(g);
      expect(g2.isMultigraph()).toBe(false);
      expect(g2.edgeFromArgs("a", "b")).toEqual({ weight: 3, minlen: 2 });
      expect(g2.edgeCount()).toEqual(1);
    });

    it("copies the graph object", function() {
      g.setGraph({ foo: "bar" });
      let g2 = util.simplify(g);
      expect(g2.graph()).toEqual({ foo: "bar" });
    });
  });

  describe("asNonCompoundGraph", function() {
    let g;

    beforeEach(function() {
      g = new Graph({ compound: true, multigraph: true });
    });

    it("copies all nodes", function() {
      g.setNode("a", { foo: "bar" });
      g.setNode("b");
      let g2 = util.asNonCompoundGraph(g);
      expect(g2.node("a")).toEqual({ foo: "bar" });
      expect(g2.hasNode("b")).toBe(true);
    });

    it("copies all edges", function() {
      g.setEdge("a", "b", { foo: "bar" });
      g.setEdge("a", "b", { foo: "baz" }, "multi");
      let g2 = util.asNonCompoundGraph(g);
      expect(g2.edgeFromArgs("a", "b")).toEqual({ foo: "bar" });
      expect(g2.edgeFromArgs("a", "b", "multi")).toEqual({ foo: "baz" });
    });

    it("does not copy compound nodes", function() {
      g.setParent("a", "sg1");
      let g2 = util.asNonCompoundGraph(g);
      expect(g2.parent(g)).toBe(undefined);
      expect(g2.isCompound()).toBe(false);
    });

    it ("copies the graph object", function() {
      g.setGraph({ foo: "bar" });
      let g2 = util.asNonCompoundGraph(g);
      expect(g2.graph()).toEqual({ foo: "bar" });
    });
  });

  describe("successorWeights", function() {
    it("maps a node to its successors with associated weights", function() {
      let g = new Graph<string ,any, any, any>({ multigraph: true });
      g.setEdge("a", "b", { weight: 2 });
      g.setEdge("b", "c", { weight: 1 });
      g.setEdge("b", "c", { weight: 2 }, "multi");
      g.setEdge("b", "d", { weight: 1 }, "multi");
      expect(util.successorWeights(g).a).toEqual({ b: 2 });
      expect(util.successorWeights(g).b).toEqual({ c: 3, d: 1 });
      expect(util.successorWeights(g).c).toEqual({});
      expect(util.successorWeights(g).d).toEqual({});
    });
  });

  describe("predecessorWeights", function() {
    it("maps a node to its predecessors with associated weights", function() {
      let g = new Graph<string ,any, any, any>({ multigraph: true });
      g.setEdge("a", "b", { weight: 2 });
      g.setEdge("b", "c", { weight: 1 });
      g.setEdge("b", "c", { weight: 2 }, "multi");
      g.setEdge("b", "d", { weight: 1 }, "multi");
      expect(util.predecessorWeights(g).a).toEqual({});
      expect(util.predecessorWeights(g).b).toEqual({ a: 2 });
      expect(util.predecessorWeights(g).c).toEqual({ b: 3 });
      expect(util.predecessorWeights(g).d).toEqual({ b: 1 });
    });
  });

  describe("intersectRect", function() {
    function expectIntersects(rect, point) {
      let cross = util.intersectRect(rect, point);
      if (cross.x !== point.x) {
        let m = (cross.y - point.y) / (cross.x - point.x);
        expect(cross.y - rect.y).toBeCloseTo(m * (cross.x - rect.x));
      }
    }

    function expectTouchesBorder(rect, point) {
      let cross = util.intersectRect(rect, point);
      if (Math.abs(rect.x - cross.x) !== rect.width / 2) {
        expect(Math.abs(rect.y - cross.y)).toEqual(rect.height / 2);
      }
    }

    it("creates a slope that will intersect the rectangle's center", function() {
      let rect = { x: 0, y: 0, width: 1, height: 1 };
      expectIntersects(rect, { x:  2, y:  6 });
      expectIntersects(rect, { x:  2, y: -6 });
      expectIntersects(rect, { x:  6, y:  2 });
      expectIntersects(rect, { x: -6, y:  2 });
      expectIntersects(rect, { x:  5, y:  0 });
      expectIntersects(rect, { x:  0, y:  5 });
    });

    it("touches the border of the rectangle", function() {
      let rect = { x: 0, y: 0, width: 1, height: 1 };
      expectTouchesBorder(rect, { x:  2, y:  6 });
      expectTouchesBorder(rect, { x:  2, y: -6 });
      expectTouchesBorder(rect, { x:  6, y:  2 });
      expectTouchesBorder(rect, { x: -6, y:  2 });
      expectTouchesBorder(rect, { x:  5, y:  0 });
      expectTouchesBorder(rect, { x:  0, y:  5 });
    });

    it("return (0, 0) if the point is at the center of the rectangle", function() {
      let rect = { x: 0, y: 0, width: 1, height: 1 };
      expect( util.intersectRect(rect, { x: 0, y: 0 })).toEqual({x: 0, y: 0});
    });
  });

  describe("buildLayerMatrix", function() {
    it("creates a matrix based on rank and order of nodes in the graph", function() {
      let g = new Graph<string ,any, any, any>();
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 1, order: 0 });
      g.setNode("d", { rank: 1, order: 1 });
      g.setNode("e", { rank: 2, order: 0 });

      expect(util.buildLayerMatrix(g)).toEqual([
        ["a", "b"],
        ["c", "d"],
        ["e"]
      ]);
    });
  });

  describe("time", function() {
    let consoleLog;

    beforeEach(function() {
      consoleLog = console.log;
    });

    afterEach(function() {
      console.log = consoleLog;
    });

    it("logs timing information", function() {
      let capture = [];
      console.log = function() { capture.push(Array.from(arguments)[0]); };
      util.time("foo", function() {});
      expect(capture.length).toEqual(1);
      expect(capture[0]).toMatch(/^foo time: .*ms/);
    });

    it("returns the value from the evaluated function", function() {
      console.log = function() {};
      expect(util.time("foo", () => 'bar')).toEqual("bar");
    });
  });

  describe("normalizeRanks", function() {
    it("adjust ranks such that all are >= 0, and at least one is 0", function() {
      let g = new Graph<string ,any, any, any>()
        .setNode("a", { rank: 3 })
        .setNode("b", { rank: 2 })
        .setNode("c", { rank: 4 });

      util.normalizeRanks(g);

      expect(g.node("a").rank).toEqual(1);
      expect(g.node("b").rank).toEqual(0);
      expect(g.node("c").rank).toEqual(2);
    });

    it("works for negative ranks", function() {
      let g = new Graph<string ,any, any, any>()
        .setNode("a", { rank: -3 })
        .setNode("b", { rank: -2 });

      util.normalizeRanks(g);

      expect(g.node("a").rank).toEqual(0);
      expect(g.node("b").rank).toEqual(1);
    });

    it("does not assign a rank to subgraphs", function() {
      let g = new Graph<string, any, any, any>({ compound: true })
        .setNode("a", { rank: 0 })
        .setNode("sg", {})
        .setParent("a", "sg");

      util.normalizeRanks(g);

      expect(g.node("sg").hasOwnProperty('rank')).not.toBe(true);
      expect(g.node("a").rank).toEqual(0);
    });
  });

  describe("removeEmptyRanks", function() {
    it("Removes border ranks without any nodes", function() {
      let g = new Graph<string, any, any, any>()
        .setGraph({ nodeRankFactor: 4 })
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 4 });
      util.removeEmptyRanks(g);
      expect(g.node("a").rank).toEqual(0);
      expect(g.node("b").rank).toEqual(1);
    });

    it("Does not remove non-border ranks", function() {
      let g = new Graph<string, any, any, any>()
        .setGraph({ nodeRankFactor: 4 })
        .setNode("a", { rank: 0 })
        .setNode("b", { rank: 8 });
      util.removeEmptyRanks(g);
      expect(g.node("a").rank).toEqual(0);
      expect(g.node("b").rank).toEqual(2);
    });
  });
});

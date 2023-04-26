import { Graph } from "@antv/graphlib";
import { NodeData, EdgeData } from "../../../packages/layout";
import * as util from "../../../packages/layout/src/dagre/util";

describe("util", function () {
  describe("simplify", function () {
    let g: Graph<NodeData, EdgeData>;

    beforeEach(function () {
      g = new Graph<NodeData, EdgeData>();
    });

    test("copies without change a graph with no multi-edges", function () {
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
          weight: 1,
          minlen: 1,
        },
      });

      let g2 = util.simplify(g);
      expect(
        g2.getRelatedEdges("a", "out").find((e) => e.target === "b")!.data
      ).toEqual({ weight: 1, minlen: 1 });
      expect(g2.getAllEdges().length).toEqual(1);
    });

    test("collapses multi-edges", function () {
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
          weight: 1,
          minlen: 1,
        },
      });
      g.addEdge({
        id: "e2",
        source: "a",
        target: "b",
        data: {
          weight: 2,
          minlen: 2,
        },
      });

      let g2 = util.simplify(g);

      expect(
        g2.getRelatedEdges("a", "out").find((e) => e.target === "b")!.data
      ).toEqual({ weight: 3, minlen: 2 });
      expect(g2.getAllEdges().length).toEqual(1);
    });

    test("copies the graph object", function () {
      let g2 = util.simplify(g);
      expect(g2.getAllNodes().length).toEqual(0);
      expect(g2.getAllEdges().length).toEqual(0);
    });
  });

  describe("asNonCompoundGraph", function () {
    let g: Graph<NodeData, EdgeData>;

    beforeEach(function () {
      g = new Graph<NodeData, EdgeData>({
        tree: [],
      });
    });

    test("copies all nodes", function () {
      g.addNodes([
        {
          id: "a",
          data: { foo: "bar" },
        },
        {
          id: "b",
          data: {},
        },
      ]);

      let g2 = util.asNonCompoundGraph(g);
      expect(g2.getNode("a").data).toEqual({ foo: "bar" });
      expect(g2.hasNode("b")).toBe(true);
    });

    test("copies all edges", function () {
      g.addNodes([
        {
          id: "a",
          data: {},
        },
        {
          id: "b",
          data: {},
        },
      ]);

      g.addEdge({
        id: "e1",
        source: "a",
        target: "b",
        data: { foo: "bar" },
      });
      g.addEdge({
        id: "e2",
        source: "a",
        target: "b",
        data: { foo: "baz" },
      });

      let g2 = util.asNonCompoundGraph(g);
      expect(g2.getRelatedEdges("a", "out").length).toEqual(2);
      expect(g2.getRelatedEdges("a", "out")[0].data).toEqual({ foo: "bar" });
      expect(g2.getRelatedEdges("a", "out")[1].data).toEqual({ foo: "baz" });
    });

    test("does not copy compound nodes", function () {
      g.addTree({
        id: "sg1",
        data: {},
        children: [
          {
            id: "a",
            data: {},
          },
        ],
      });

      let g2 = util.asNonCompoundGraph(g);

      expect(g2.hasNode("a")).toBeTruthy();
      expect(g2.hasNode("sg1")).toBeFalsy();
    });

    test("copies the graph object", function () {
      let g2 = util.asNonCompoundGraph(g);
      expect(g2).toBeTruthy();
    });
  });

  describe("successorWeights", function () {
    test("maps a node to its successors with associated weights", function () {
      let g = new Graph();
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
          data: { weight: 2 },
        },
        {
          id: "e2",
          source: "b",
          target: "c",
          data: { weight: 1 },
        },
        {
          id: "e3",
          source: "b",
          target: "c",
          data: { weight: 2 },
        },
        {
          id: "e4",
          source: "b",
          target: "d",
          data: { weight: 1 },
        },
      ]);

      expect(util.successorWeights(g).a).toEqual({ b: 2 });
      expect(util.successorWeights(g).b).toEqual({ c: 3, d: 1 });
      expect(util.successorWeights(g).c).toEqual({});
      expect(util.successorWeights(g).d).toEqual({});
    });
  });

  describe("predecessorWeights", function () {
    test("maps a node to its predecessors with associated weights", function () {
      let g = new Graph();
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
          data: { weight: 2 },
        },
        {
          id: "e2",
          source: "b",
          target: "c",
          data: { weight: 1 },
        },
        {
          id: "e3",
          source: "b",
          target: "c",
          data: { weight: 2 },
        },
        {
          id: "e4",
          source: "b",
          target: "d",
          data: { weight: 1 },
        },
      ]);
      expect(util.predecessorWeights(g).a).toEqual({});
      expect(util.predecessorWeights(g).b).toEqual({ a: 2 });
      expect(util.predecessorWeights(g).c).toEqual({ b: 3 });
      expect(util.predecessorWeights(g).d).toEqual({ b: 1 });
    });
  });

  describe("intersectRect", function () {
    function expectIntersects(rect: any, point: any) {
      let cross = util.intersectRect(rect, point);
      if (cross.x !== point.x) {
        let m = (cross.y - point.y) / (cross.x - point.x);
        expect(cross.y - rect.y).toBeCloseTo(m * (cross.x - rect.x));
      }
    }

    function expectTouchesBorder(rect: any, point: any) {
      let cross = util.intersectRect(rect, point);
      if (Math.abs(rect.x - cross.x) !== rect.width / 2) {
        expect(Math.abs(rect.y - cross.y)).toEqual(rect.height / 2);
      }
    }

    test("creates a slope that will intersect the rectangle's center", function () {
      let rect = { x: 0, y: 0, width: 1, height: 1 };
      expectIntersects(rect, { x: 2, y: 6 });
      expectIntersects(rect, { x: 2, y: -6 });
      expectIntersects(rect, { x: 6, y: 2 });
      expectIntersects(rect, { x: -6, y: 2 });
      expectIntersects(rect, { x: 5, y: 0 });
      expectIntersects(rect, { x: 0, y: 5 });
    });

    test("touches the border of the rectangle", function () {
      let rect = { x: 0, y: 0, width: 1, height: 1 };
      expectTouchesBorder(rect, { x: 2, y: 6 });
      expectTouchesBorder(rect, { x: 2, y: -6 });
      expectTouchesBorder(rect, { x: 6, y: 2 });
      expectTouchesBorder(rect, { x: -6, y: 2 });
      expectTouchesBorder(rect, { x: 5, y: 0 });
      expectTouchesBorder(rect, { x: 0, y: 5 });
    });

    test("return (0, 0) if the point is at the center of the rectangle", function () {
      let rect = { x: 0, y: 0, width: 1, height: 1 };
      expect(util.intersectRect(rect, { x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    });
  });

  describe("buildLayerMatrix", function () {
    test("creates a matrix based on rank and order of nodes in the graph", function () {
      let g = new Graph();

      g.addNodes([
        {
          id: "a",
          data: { rank: 0, order: 0 },
        },
        {
          id: "b",
          data: { rank: 0, order: 1 },
        },
        {
          id: "c",
          data: { rank: 1, order: 0 },
        },
        {
          id: "d",
          data: { rank: 1, order: 1 },
        },
        {
          id: "e",
          data: { rank: 2, order: 0 },
        },
      ]);

      expect(util.buildLayerMatrix(g)).toEqual([["a", "b"], ["c", "d"], ["e"]]);
    });
  });

  // describe("time", function() {
  //   let consoleLog;

  //   beforeEach(function() {
  //     consoleLog = console.log;
  //   });

  //   afterEach(function() {
  //     console.log = consoleLog;
  //   });

  //   test("logs timing information", function() {
  //     let capture = [];
  //     console.log = function() { capture.push(Array.from(arguments)[0]); };
  //     util.time("foo", function() {});
  //     expect(capture.length).toEqual(1);
  //     expect(capture[0]).toMatch(/^foo time: .*ms/);
  //   });

  //   test("returns the value from the evaluated function", function() {
  //     console.log = function() {};
  //     expect(util.time("foo", () => 'bar')).toEqual("bar");
  //   });
  // });

  describe("normalizeRanks", function () {
    test("adjust ranks such that all are >= 0, and at least one is 0", function () {
      let g = new Graph();
      g.addNodes([
        {
          id: "a",
          data: { rank: 3 },
        },
        {
          id: "b",
          data: { rank: 2 },
        },
        {
          id: "c",
          data: { rank: 4 },
        },
      ]);

      util.normalizeRanks(g);

      expect(g.getNode("a").data.rank).toEqual(1);
      expect(g.getNode("b").data.rank).toEqual(0);
      expect(g.getNode("c").data.rank).toEqual(2);
    });

    test("works for negative ranks", function () {
      let g = new Graph();
      g.addNodes([
        {
          id: "a",
          data: { rank: -3 },
        },
        {
          id: "b",
          data: { rank: -2 },
        },
      ]);

      util.normalizeRanks(g);

      expect(g.getNode("a").data.rank).toEqual(0);
      expect(g.getNode("b").data.rank).toEqual(1);
    });

    test("does not assign a rank to subgraphs", function () {
      let g = new Graph<any, any>({
        tree: [
          {
            id: "sg",
            data: {},
            children: [
              {
                id: "a",
                data: { rank: 0 },
              },
            ],
          },
        ],
      });

      util.normalizeRanks(g);

      expect(g.getNode("sg").data.hasOwnProperty("rank")).not.toBe(true);
      expect(g.getNode("a").data.rank).toEqual(0);
    });
  });

  describe("removeEmptyRanks", function () {
    test("Removes border ranks without any nodes", function () {
      let g = new Graph<any, any>({
        nodes: [
          {
            id: "a",
            data: { rank: 0 },
          },
          {
            id: "b",
            data: { rank: 4 },
          },
        ],
      });
      util.removeEmptyRanks(g, 4);
      expect(g.getNode("a").data.rank).toEqual(0);
      expect(g.getNode("b").data.rank).toEqual(1);
    });

    test("Does not remove non-border ranks", function () {
      let g = new Graph<any, any>({
        nodes: [
          {
            id: "a",
            data: { rank: 0 },
          },
          {
            id: "b",
            data: { rank: 8 },
          },
        ],
      });
      util.removeEmptyRanks(g, 4);
      expect(g.getNode("a").data.rank).toEqual(0);
      expect(g.getNode("b").data.rank).toEqual(2);
    });
  });
});

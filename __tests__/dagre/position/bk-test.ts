// @ts-ignore
import _ from 'lodash';
import { Graph } from "@antv/graphlib";
import { buildLayerMatrix } from '../../../src/layout/dagre/src/util';
import * as bk from '../../../src/layout/dagre/src/position/bk';
// let bk = require("../../lib/position/bk");
let findType1Conflicts = bk.findType1Conflicts;
let findType2Conflicts = bk.findType2Conflicts;
let addConflict = bk.addConflict;
let hasConflict = bk.hasConflict;
let verticalAlignment = bk.verticalAlignment;
let horizontalCompaction = bk.horizontalCompaction;
let alignCoordinates = bk.alignCoordinates;
let balance = bk.balance;
let findSmallestWidthAlignment = bk.findSmallestWidthAlignment;
let positionX = bk.positionX;


describe("position/bk", function() {
  let g;

  beforeEach(function() {
    g = new Graph<string, any, any, any>().setGraph({});
  });

  describe("findType1Conflicts", function() {
    let layering;

    beforeEach(function() {
      g
        .setDefaultEdgeLabel(function() { return {}; })
        .setNode("a", { rank: 0, order: 0 })
        .setNode("b", { rank: 0, order: 1 })
        .setNode("c", { rank: 1, order: 0 })
        .setNode("d", { rank: 1, order: 1 })
        // Set up crossing
        .setEdge("a", "d")
        .setEdge("b", "c");

      layering = buildLayerMatrix(g);
    });

    it("does not mark edges that have no conflict", function() {
      g.removeEdge("a", "d");
      g.removeEdge("b", "c");
      g.setEdge("a", "c");
      g.setEdge("b", "d");

      let conflicts = findType1Conflicts(g, layering);
      expect(hasConflict(conflicts, "a", "c")).toBe(false);
      expect(hasConflict(conflicts, "b", "d")).toBe(false);
    });

    it("does not mark type-0 conflicts (no dummies)", function() {
      let conflicts = findType1Conflicts(g, layering);
      expect(hasConflict(conflicts, "a", "d")).toBe(false);
      expect(hasConflict(conflicts, "b", "c")).toBe(false);
    });

    _.forEach(["a", "b", "c", "d"], function(v) {
      it("does not mark type-0 conflicts (" + v + " is dummy)", function() {
        g.node(v).dummy = true;

        let conflicts = findType1Conflicts(g, layering);
        expect(hasConflict(conflicts, "a", "d")).toBe(false);
        expect(hasConflict(conflicts, "b", "c")).toBe(false);
      });
    });

    _.forEach(["a", "b", "c", "d"], function(v) {
      it("does mark type-1 conflicts (" + v + " is non-dummy)", function() {
        _.forEach(["a", "b", "c", "d"], function(w) {
          if (v !== w) {
            g.node(w).dummy = true;
          }
        });

        let conflicts = findType1Conflicts(g, layering);
        if (v === "a" || v === "d") {
          expect(hasConflict(conflicts, "a", "d")).toBe(true);
          expect(hasConflict(conflicts, "b", "c")).toBe(false);
        } else {
          expect(hasConflict(conflicts, "a", "d")).toBe(false);
          expect(hasConflict(conflicts, "b", "c")).toBe(true);
        }
      });
    });

    it("does not mark type-2 conflicts (all dummies)", function() {
      _.forEach(["a", "b", "c", "d"], function(v) {
        g.node(v).dummy = true;
      });

      let conflicts = findType1Conflicts(g, layering);
      expect(hasConflict(conflicts, "a", "d")).toBe(false);
      expect(hasConflict(conflicts, "b", "c")).toBe(false);
      findType1Conflicts(g, layering);
    });
  });

  describe("findType2Conflicts", function() {
    let layering;

    beforeEach(function() {
      g
        .setDefaultEdgeLabel(function() { return {}; })
        .setNode("a", { rank: 0, order: 0 })
        .setNode("b", { rank: 0, order: 1 })
        .setNode("c", { rank: 1, order: 0 })
        .setNode("d", { rank: 1, order: 1 })
        // Set up crossing
        .setEdge("a", "d")
        .setEdge("b", "c");

      layering = buildLayerMatrix(g);
    });

    it("marks type-2 conflicts favoring border segments #1", function() {
      _.forEach(["a", "d"], function(v) {
        g.node(v).dummy = true;
      });

      _.forEach(["b", "c"], function(v) {
        g.node(v).dummy = "border";
      });

      let conflicts = findType2Conflicts(g, layering);
      expect(hasConflict(conflicts, "a", "d")).toBe(true);
      expect(hasConflict(conflicts, "b", "c")).toBe(false);
      findType1Conflicts(g, layering);
    });

    it("marks type-2 conflicts favoring border segments #2", function() {
      _.forEach(["b", "c"], function(v) {
        g.node(v).dummy = true;
      });

      _.forEach(["a", "d"], function(v) {
        g.node(v).dummy = "border";
      });

      let conflicts = findType2Conflicts(g, layering);
      expect(hasConflict(conflicts, "a", "d")).toBe(false);
      expect(hasConflict(conflicts, "b", "c")).toBe(true);
      findType1Conflicts(g, layering);
    });

  });

  describe("hasConflict", function() {
    it("can test for a type-1 conflict regardless of edge orientation", function() {
      let conflicts = {};
      addConflict(conflicts, "b", "a");
      expect(hasConflict(conflicts, "a", "b")).toBe(true);
      expect(hasConflict(conflicts, "b", "a")).toBe(true);
    });

    it("works for multiple conflicts with the same node", function() {
      let conflicts = {};
      addConflict(conflicts, "a", "b");
      addConflict(conflicts, "a", "c");
      expect(hasConflict(conflicts, "a", "b")).toBe(true);
      expect(hasConflict(conflicts, "a", "c")).toBe(true);
    });
  });

  describe("verticalAlignment", function() {
    it("Aligns with itself if the node has no adjacencies", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 1, order: 0 });

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(result).toEqual({
        root:  { a: "a", b: "b" },
        align: { a: "a", b: "b" }
      });
    });

    it("Aligns with its sole adjacency", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 1, order: 0 });
      g.setEdge("a", "b");

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(result).toEqual({
        root:  { a: "a", b: "a" },
        align: { a: "b", b: "a" }
      });
    });

    it("aligns with its left median when possible", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 1, order: 0 });
      g.setEdge("a", "c");
      g.setEdge("b", "c");

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(result).toEqual({
        root:  { a: "a", b: "b", c: "a" },
        align: { a: "c", b: "b", c: "a" }
      });
    });

    it("aligns correctly even regardless of node name / insertion order", function() {
      // This test ensures that we're actually properly sorting nodes by
      // position when searching for candidates. Many of these tests previously
      // passed because the node insertion order matched the order of the nodes
      // in the layering.
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 1, order: 0 });
      g.setNode("z", { rank: 0, order: 0 });
      g.setEdge("z", "c");
      g.setEdge("b", "c");

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(result).toEqual({
        root:  { z: "z", b: "b", c: "z" },
        align: { z: "c", b: "b", c: "z" }
      });
    });


    it("aligns with its right median when left is unavailable", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 1, order: 0 });
      g.setEdge("a", "c");
      g.setEdge("b", "c");

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      addConflict(conflicts, "a", "c");

      let result = verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(result).toEqual({
        root:  { a: "a", b: "b", c: "b" },
        align: { a: "a", b: "c", c: "b" }
      });
    });

    it("aligns with neither median if both are unavailable", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 1, order: 0 });
      g.setNode("d", { rank: 1, order: 1 });
      g.setEdge("a", "d");
      g.setEdge("b", "c");
      g.setEdge("b", "d");

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      // c will align with b, so d will not be able to align with a, because
      // (a,d) and (c,b) cross.
      expect(result).toEqual({
        root:  { a: "a", b: "b", c: "b", d: "d" },
        align: { a: "a", b: "c", c: "b", d: "d" }
      });
    });

    it("aligns with the single median for an odd number of adjacencies", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 0, order: 1 });
      g.setNode("c", { rank: 0, order: 2 });
      g.setNode("d", { rank: 1, order: 0 });
      g.setEdge("a", "d");
      g.setEdge("b", "d");
      g.setEdge("c", "d");

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(result).toEqual({
        root:  { a: "a", b: "b", c: "c", d: "b" },
        align: { a: "a", b: "d", c: "c", d: "b" }
      });
    });

    it("aligns blocks across multiple layers", function() {
      g.setNode("a", { rank: 0, order: 0 });
      g.setNode("b", { rank: 1, order: 0 });
      g.setNode("c", { rank: 1, order: 1 });
      g.setNode("d", { rank: 2, order: 0 });
      g.setPath(["a", "b", "d"]);
      g.setPath(["a", "c", "d"]);

      let layering = buildLayerMatrix(g);
      let conflicts = {};

      let result = verticalAlignment(g, layering, conflicts, g.predecessors.bind(g));
      expect(result).toEqual({
        root:  { a: "a", b: "a", c: "c", d: "a" },
        align: { a: "b", b: "d", c: "c", d: "a" }
      });
    });
  });

  describe("horizonalCompaction", function() {
    it("places the center of a single node graph at origin (0,0)", function() {
      let root =  { a: "a" };
      let align = { a: "a" };
      g.setNode("a", { rank: 0, order: 0 });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
    });

    it("separates adjacent nodes by specified node separation", function() {
      let root =  { a: "a", b: "b" };
      let align = { a: "a", b: "b" };
      g.graph().nodesep = 100;
      g.setNode("a", { rank: 0, order: 0, width: 100 });
      g.setNode("b", { rank: 0, order: 1, width: 200 });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(100 / 2 + 100 + 200 / 2);
    });

    it("separates adjacent edges by specified node separation", function() {
      let root =  { a: "a", b: "b" };
      let align = { a: "a", b: "b" };
      g.graph().edgesep = 20;
      g.setNode("a", { rank: 0, order: 0, width: 100, dummy: true });
      g.setNode("b", { rank: 0, order: 1, width: 200, dummy: true });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(100 / 2 + 20 + 200 / 2);
    });

    it("aligns the centers of nodes in the same block", function() {
      let root =  { a: "a", b: "a" };
      let align = { a: "b", b: "a" };
      g.setNode("a", { rank: 0, order: 0, width: 100 });
      g.setNode("b", { rank: 1, order: 0, width: 200 });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(0);
    });

    it("separates blocks with the appropriate separation", function() {
      let root =  { a: "a", b: "a", c: "c" };
      let align = { a: "b", b: "a", c: "c" };
      g.graph().nodesep = 75;
      g.setNode("a", { rank: 0, order: 0, width: 100 });
      g.setNode("b", { rank: 1, order: 1, width: 200 });
      g.setNode("c", { rank: 1, order: 0, width:  50 });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(50 / 2 + 75 + 200 / 2);
      expect(xs.b).toEqual(50 / 2 + 75 + 200 / 2);
      expect(xs.c).toEqual(0);
    });

    it("separates classes with the appropriate separation", function() {
      let root =  { a: "a", b: "b", c: "c", d: "b" };
      let align = { a: "a", b: "d", c: "c", d: "b" };
      g.graph().nodesep = 75;
      g.setNode("a", { rank: 0, order: 0, width: 100 });
      g.setNode("b", { rank: 0, order: 1, width: 200 });
      g.setNode("c", { rank: 1, order: 0, width:  50 });
      g.setNode("d", { rank: 1, order: 1, width:  80 });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(100 / 2 + 75 + 200 / 2);
      expect(xs.c).toEqual(100 / 2 + 75 + 200 / 2 - 80 / 2 - 75 - 50 / 2);
      expect(xs.d).toEqual(100 / 2 + 75 + 200 / 2);
    });

    it("shifts classes by max sep from the adjacent block #1", function() {
      let root =  { a: "a", b: "b", c: "a", d: "b" };
      let align = { a: "c", b: "d", c: "a", d: "b" };
      g.graph().nodesep = 75;
      g.setNode("a", { rank: 0, order: 0, width:  50 });
      g.setNode("b", { rank: 0, order: 1, width: 150 });
      g.setNode("c", { rank: 1, order: 0, width:  60 });
      g.setNode("d", { rank: 1, order: 1, width:  70 });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(50 / 2 + 75 + 150 / 2);
      expect(xs.c).toEqual(0);
      expect(xs.d).toEqual(50 / 2 + 75 + 150 / 2);
    });

    it("shifts classes by max sep from the adjacent block #2", function() {
      let root =  { a: "a", b: "b", c: "a", d: "b" };
      let align = { a: "c", b: "d", c: "a", d: "b" };
      g.graph().nodesep = 75;
      g.setNode("a", { rank: 0, order: 0, width:  50 });
      g.setNode("b", { rank: 0, order: 1, width:  70 });
      g.setNode("c", { rank: 1, order: 0, width:  60 });
      g.setNode("d", { rank: 1, order: 1, width: 150 });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(60 / 2 + 75 + 150 / 2);
      expect(xs.c).toEqual(0);
      expect(xs.d).toEqual(60 / 2 + 75 + 150 / 2);
    });

    it("cascades class shift", function() {
      let root =  { a: "a", b: "b", c: "c", d: "d", e: "b", f: "f", g: "d" };
      let align = { a: "a", b: "e", c: "c", d: "g", e: "b", f: "f", g: "d" };
      g.graph().nodesep = 75;
      g.setNode("a", { rank: 0, order: 0, width: 50 });
      g.setNode("b", { rank: 0, order: 1, width: 50 });
      g.setNode("c", { rank: 1, order: 0, width: 50 });
      g.setNode("d", { rank: 1, order: 1, width: 50 });
      g.setNode("e", { rank: 1, order: 2, width: 50 });
      g.setNode("f", { rank: 2, order: 0, width: 50 });
      g.setNode("g", { rank: 2, order: 1, width: 50 });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);

      // Use f as 0, everything is relative to it
      expect(xs.a).toEqual(xs.b - 50 / 2 - 75 - 50 / 2);
      expect(xs.b).toEqual(xs.e);
      expect(xs.c).toEqual(xs.f);
      expect(xs.d).toEqual(xs.c + 50 / 2 + 75 + 50 / 2);
      expect(xs.e).toEqual(xs.d + 50 / 2 + 75 + 50 / 2);
      expect(xs.g).toEqual(xs.f + 50 / 2 + 75 + 50 / 2);
    });

    it("handles labelpos = l", function() {
      let root =  { a: "a", b: "b", c: "c" };
      let align = { a: "a", b: "b", c: "c" };
      g.graph().edgesep = 50;
      g.setNode("a", { rank: 0, order: 0, width:  100, dummy: "edge" });
      g.setNode("b", {
        rank: 0, order: 1, width: 200,
        dummy: "edge-label", labelpos: "l"
      });
      g.setNode("c", { rank: 0, order: 2, width:  300, dummy: "edge" });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(xs.a + 100 / 2 + 50 + 200);
      expect(xs.c).toEqual(xs.b + 0 + 50 + 300 / 2);
    });

    it("handles labelpos = c", function() {
      let root =  { a: "a", b: "b", c: "c" };
      let align = { a: "a", b: "b", c: "c" };
      g.graph().edgesep = 50;
      g.setNode("a", { rank: 0, order: 0, width:  100, dummy: "edge" });
      g.setNode("b", {
        rank: 0, order: 1, width: 200,
        dummy: "edge-label", labelpos: "c"
      });
      g.setNode("c", { rank: 0, order: 2, width:  300, dummy: "edge" });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(xs.a + 100 / 2 + 50 + 200 / 2);
      expect(xs.c).toEqual(xs.b + 200 / 2 + 50 + 300 / 2);
    });

    it("handles labelpos = r", function() {
      let root =  { a: "a", b: "b", c: "c" };
      let align = { a: "a", b: "b", c: "c" };
      g.graph().edgesep = 50;
      g.setNode("a", { rank: 0, order: 0, width:  100, dummy: "edge" });
      g.setNode("b", {
        rank: 0, order: 1, width: 200,
        dummy: "edge-label", labelpos: "r"
      });
      g.setNode("c", { rank: 0, order: 2, width:  300, dummy: "edge" });

      let xs = horizontalCompaction(g, buildLayerMatrix(g), root, align);
      expect(xs.a).toEqual(0);
      expect(xs.b).toEqual(xs.a + 100 / 2 + 50 + 0);
      expect(xs.c).toEqual(xs.b + 200 + 50 + 300 / 2);
    });
  });

  describe("alignCoordinates", function() {
    it("aligns a single node", function() {
      let xss = {
        ul: { a:  50 },
        ur: { a: 100 },
        dl: { a:  50 },
        dr: { a: 200 }
      };

      alignCoordinates(xss, xss.ul);

      expect(xss.ul).toEqual({ a: 50 });
      expect(xss.ur).toEqual({ a: 50 });
      expect(xss.dl).toEqual({ a: 50 });
      expect(xss.dr).toEqual({ a: 50 });
    });

    it("aligns multiple nodes", function() {
      let xss = {
        ul: { a:  50, b: 1000 },
        ur: { a: 100, b:  900 },
        dl: { a: 150, b:  800 },
        dr: { a: 200, b:  700 }
      };

      alignCoordinates(xss, xss.ul);

      expect(xss.ul).toEqual({ a:  50, b: 1000 });
      expect(xss.ur).toEqual({ a: 200, b: 1000 });
      expect(xss.dl).toEqual({ a:  50, b:  700 });
      expect(xss.dr).toEqual({ a: 500, b: 1000 });
    });
  });

  describe("findSmallestWidthAlignment", function() {
    it("finds the alignment with the smallest width", function() {
      g.setNode("a", { width: 50 });
      g.setNode("b", { width: 50 });

      let xss = {
        ul: { a:  0, b: 1000 },
        ur: { a: -5, b: 1000 },
        dl: { a:  5, b: 2000 },
        dr: { a:  0, b:  200 },
      };

      expect(findSmallestWidthAlignment(g, xss)).toEqual(xss.dr);
    });

    it("takes node width into account", function() {
      g.setNode("a", { width:  50 });
      g.setNode("b", { width:  50 });
      g.setNode("c", { width: 200 });

      let xss = {
        ul: { a:  0, b: 100, c: 75 },
        ur: { a:  0, b: 100, c: 80 },
        dl: { a:  0, b: 100, c: 85 },
        dr: { a:  0, b: 100, c: 90 },
      };

      expect(findSmallestWidthAlignment(g, xss)).toEqual(xss.ul);
    });
  });

  describe("balance", function() {
    it("aligns a single node to the shared median value", function() {
      let xss = {
        ul: { a:   0 },
        ur: { a: 100 },
        dl: { a: 100 },
        dr: { a: 200 }
      };

      expect(balance(xss)).toEqual({ a: 100 });
    });

    it("aligns a single node to the average of different median values", function() {
      let xss = {
        ul: { a:   0 },
        ur: { a:  75 },
        dl: { a: 125 },
        dr: { a: 200 }
      };

      expect(balance(xss)).toEqual({ a: 100 });
    });

    it("balances multiple nodes", function() {
      let xss = {
        ul: { a:   0, b: 50 },
        ur: { a:  75, b:  0 },
        dl: { a: 125, b: 60 },
        dr: { a: 200, b: 75 }
      };

      expect(balance(xss)).toEqual({ a: 100, b: 55 });
    });
  });

  describe("positionX", function() {
    it("positions a single node at origin", function() {
      g.setNode("a", { rank: 0, order: 0, width: 100 });
      expect(positionX(g)).toEqual({ a: 0 });
    });

    it("positions a single node block at origin", function() {
      g.setNode("a", { rank: 0, order: 0, width: 100 });
      g.setNode("b", { rank: 1, order: 0, width: 100 });
      g.setEdge("a", "b");
      expect(positionX(g)).toEqual({ a: 0, b: 0 });
    });

    it("positions a single node block at origin even when their sizes differ", function() {
      g.setNode("a", { rank: 0, order: 0, width:  40 });
      g.setNode("b", { rank: 1, order: 0, width: 500 });
      g.setNode("c", { rank: 2, order: 0, width:  20 });
      g.setPath(["a", "b", "c"]);
      expect(positionX(g)).toEqual({ a: 0, b: 0, c: 0 });
    });

    it("centers a node if it is a predecessor of two same sized nodes", function() {
      g.graph().nodesep = 10;
      g.setNode("a", { rank: 0, order: 0, width:  20 });
      g.setNode("b", { rank: 1, order: 0, width:  50 });
      g.setNode("c", { rank: 1, order: 1, width:  50 });
      g.setEdge("a", "b");
      g.setEdge("a", "c");

      let pos = positionX(g);
      let a = pos.a;
      expect(pos).toEqual({ a: a, b: a - (25 + 5), c: a + (25 + 5) });
    });

    it("shifts blocks on both sides of aligned block", function() {
      g.graph().nodesep = 10;
      g.setNode("a", { rank: 0, order: 0, width:  50 });
      g.setNode("b", { rank: 0, order: 1, width:  60 });
      g.setNode("c", { rank: 1, order: 0, width:  70 });
      g.setNode("d", { rank: 1, order: 1, width:  80 });
      g.setEdge("b", "c");

      let pos = positionX(g);
      let b = pos.b;
      let c = b;
      expect(pos).toEqual({
        a: b - 60 / 2 - 10 - 50 / 2,
        b: b,
        c: c,
        d: c + 70 / 2 + 10 + 80 / 2
      });
    });

    it("aligns inner segments", function() {
      g.graph().nodesep = 10;
      g.setNode("a", { rank: 0, order: 0, width:  50, dummy: true });
      g.setNode("b", { rank: 0, order: 1, width:  60 });
      g.setNode("c", { rank: 1, order: 0, width:  70 });
      g.setNode("d", { rank: 1, order: 1, width:  80, dummy: true });
      g.setEdge("b", "c");
      g.setEdge("a", "d");

      let pos = positionX(g);
      let a = pos.a;
      let d = a;
      expect(pos).toEqual({
        a: a,
        b: a + 50 / 2 + 10 + 60 / 2,
        c: d - 70 / 2 - 10 - 80 / 2,
        d: d
      });
    });
  });
});

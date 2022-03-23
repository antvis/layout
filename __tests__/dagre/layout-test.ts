import { Graph } from '@antv/graphlib';
import layout from '../../src/layout/dagre/src/layout';
let _ = require("lodash");

describe("layout", function() {
  let g;

  beforeEach(function() {
    g = new Graph<string, any, any, any>({ multigraph: true, compound: true })
      .setGraph({})
      .setDefaultEdgeLabel(function() { return {}; });
  });

  it("can layout a single node", function() {
    g.setNode("a", { width: 50, height: 100 });
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 50 / 2, y: 100 / 2 }
    });
    expect(g.node("a").x).toEqual(50 / 2);
    expect(g.node("a").y).toEqual(100 / 2);
  });

  it("can layout two nodes on the same rank", function() {
    g.graph().nodesep = 200;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 50 / 2,            y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 }
    });
  });

  it("can layout two nodes connected by an edge", function() {
    g.graph().ranksep = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b");
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 300 + 200 / 2 }
    });

    // We should not get x, y coordinates if the edge has no label
    expect(g.edgeFromArgs("a", "b")).not.toHaveProperty("x");
    expect(g.edgeFromArgs("a", "b")).not.toHaveProperty("y");
  });

  it("can layout an edge with a label", function() {
    g.graph().ranksep = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b", { width: 60, height: 70, labelpos: "c" });
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 75 / 2, y: 100 / 2 },
      b: { x: 75 / 2, y: 100 + 150 + 70 + 150 + 200 / 2 }
    });
    expect(_.pick(g.edgeFromArgs("a", "b"), ["x", "y"]))
      .toEqual({ x: 75 / 2, y: 100  + 150 + 70 / 2 });
  });

  describe("can layout an edge with a long label, with rankdir =", function() {
    _.forEach(["TB", "BT", "LR", "RL"], function(rankdir) {
      it(rankdir, function() {
        g.graph().nodesep = g.graph().edgesep = 10;
        g.graph().rankdir = rankdir;
        _.forEach(["a", "b", "c", "d"], function(v) {
          g.setNode(v, { width: 10, height: 10 });
        });
        g.setEdge("a", "c", { width: 2000, height: 10, labelpos: "c" });
        g.setEdge("b", "d", { width: 1, height: 1 });
        layout(g);

        let p1, p2;
        if (rankdir === "TB" || rankdir === "BT") {
          p1 = g.edgeFromArgs("a", "c");
          p2 = g.edgeFromArgs("b", "d");
        } else {
          p1 = g.node("a");
          p2 = g.node("c");
        }

        expect(Math.abs(p1.x - p2.x)).toBeGreaterThan(1000);
      });
    });
  });

  describe("can apply an offset, with rankdir =", function() {
    _.forEach(["TB", "BT", "LR", "RL"], function(rankdir) {
      it(rankdir, function() {
        g.graph().nodesep = g.graph().edgesep = 10;
        g.graph().rankdir = rankdir;
        _.forEach(["a", "b", "c", "d"], function(v) {
          g.setNode(v, { width: 10, height: 10 });
        });
        g.setEdge("a", "b", { width: 10, height: 10, labelpos: "l", labeloffset: 1000 });
        g.setEdge("c", "d", { width: 10, height: 10, labelpos: "r", labeloffset: 1000 });
        layout(g);

        if (rankdir === "TB" || rankdir === "BT") {
          expect(g.edgeFromArgs("a", "b").x - g.edgeFromArgs("a", "b").points[0].x).toEqual(-1000 - 10 / 2);
          expect(g.edgeFromArgs("c", "d").x - g.edgeFromArgs("c", "d").points[0].x).toEqual(1000 + 10 / 2);
        } else {
          expect(g.edgeFromArgs("a", "b").y - g.edgeFromArgs("a", "b").points[0].y).toEqual(-1000 - 10 / 2);
          expect(g.edgeFromArgs("c", "d").y - g.edgeFromArgs("c", "d").points[0].y).toEqual(1000 + 10 / 2);
        }
      });
    });
  });

  it("can layout a long edge with a label", function() {
    g.graph().ranksep = 300;
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    g.setEdge("a", "b", { width: 60, height: 70, minlen: 2, labelpos: "c" });
    layout(g);
    expect(g.edgeFromArgs("a", "b").x).toEqual(75 / 2);
    expect(g.edgeFromArgs("a", "b").y)
      .toBeGreaterThan(g.node("a").y)
      expect(g.edgeFromArgs("a", "b").y).toBeLessThan(g.node("b").y);
  });

  it("can layout out a short cycle", function() {
    g.graph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { weight: 2 });
    g.setEdge("b", "a");
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 100 / 2, y: 100 / 2 },
      b: { x: 100 / 2, y: 100 + 200 + 100 / 2}
    });
    // One arrow should point down, one up
    expect(g.edgeFromArgs("a", "b").points[1].y).toBeGreaterThan(g.edgeFromArgs("a", "b").points[0].y);
    expect(g.edgeFromArgs("b", "a").points[0].y).toBeGreaterThan(g.edgeFromArgs("b", "a").points[1].y);
  });

  it("adds rectangle intersects for edges", function() {
    g.graph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b");
    layout(g);
    let points = g.edgeFromArgs("a", "b").points;
    expect(points).toHaveLength(3);
    expect(points).toEqual([
      { x: 100 / 2, y: 100 },           // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 200 }      // intersect with top of b
    ]);
  });

  it("adds rectangle intersects for edges spanning multiple ranks", function() {
    g.graph().ranksep = 200;
    g.setNode("a", { width: 100, height: 100 });
    g.setNode("b", { width: 100, height: 100 });
    g.setEdge("a", "b", { minlen: 2 });
    layout(g);
    let points = g.edgeFromArgs("a", "b").points;
    expect(points).toHaveLength(5);
    expect(points).toEqual([
      { x: 100 / 2, y: 100 },           // intersect with bottom of a
      { x: 100 / 2, y: 100 + 200 / 2 }, // bend #1
      { x: 100 / 2, y: 100 + 400 / 2 }, // point for edge label
      { x: 100 / 2, y: 100 + 600 / 2 }, // bend #2
      { x: 100 / 2, y: 100 + 800 / 2 }  // intersect with top of b
    ]);
  });

  describe("can layout a self loop", function() {
    _.forEach(["TB", "BT", "LR", "RL"], function(rankdir) {
      it ("in rankdir = " + rankdir, function() {
        g.graph().edgesep = 75;
        g.graph().rankdir = rankdir;
        g.setNode("a", { width: 100, height: 100 });
        g.setEdge("a", "a", { width: 50, height: 50 });
        layout(g);
        let nodeA = g.node("a");
        let points = g.edgeFromArgs("a", "a").points;
        expect(points).toHaveLength(7);
        _.forEach(points, function(point) {
          if (rankdir !== "LR" && rankdir !== "RL") {
            expect(point.x).toBeGreaterThan(nodeA.x);
            expect(Math.abs(point.y - nodeA.y)).toBeLessThanOrEqual(nodeA.height / 2);
          } else {
            expect(point.y).toBeGreaterThan(nodeA.y);
            expect(Math.abs(point.x - nodeA.x)).toBeLessThanOrEqual(nodeA.width / 2);
          }
        });
      });
    });
  });

  it("can layout a graph with subgraphs", function() {
    // To be expanded, this primarily ensures nothing blows up for the moment.
    g.setNode("a", { width: 50, height: 50 });
    g.setParent("a", "sg1");
    layout(g);
  });

  it("minimizes the height of subgraphs", function() {
    _.forEach(["a", "b", "c", "d", "x", "y"], function(v) {
      g.setNode(v, { width: 50, height: 50 });
    });
    g.setPath(["a", "b", "c", "d"]);
    g.setEdge("a", "x", { weight: 100 });
    g.setEdge("y", "d", { weight: 100 });
    g.setParent("x", "sg");
    g.setParent("y", "sg");

    // We did not set up an edge (x, y), and we set up high-weight edges from
    // outside of the subgraph to nodes in the subgraph. This is to try to
    // force nodes x and y to be on different ranks, which we want our ranker
    // to avoid.
    layout(g);
    expect(g.node("x").y).toEqual(g.node("y").y);
  });

  it("can layout subgraphs with different rankdirs", function() {
    g.setNode("a", { width: 50, height: 50 });
    g.setNode("sg", {});
    g.setParent("a", "sg");

    function check() {
      expect(g.node("sg").width).toBeGreaterThan(50);
      expect(g.node("sg").height).toBeGreaterThan(50);
      expect(g.node("sg").x).toBeGreaterThan(50 / 2);
      expect(g.node("sg").y).toBeGreaterThan(50 / 2);
    }

    _.forEach(["tb", "bt", "lr", "rl"], function(rankdir) {
      g.graph().rankdir = rankdir;
      layout(g);
      check();
    });
  });

  it("adds dimensions to the graph", function() {
    g.setNode("a", { width: 100, height: 50 });
    layout(g);
    expect(g.graph().width).toEqual(100);
    expect(g.graph().height).toEqual(50);
  });

  describe("ensures all coordinates are in the bounding box for the graph", function() {
    _.forEach(["TB", "BT", "LR", "RL"], function(rankdir) {
      describe(rankdir, function() {
        beforeEach(function() {
          g.graph().rankdir = rankdir;
        });

        it("node", function() {
          g.setNode("a", { width: 100, height: 200 });
          layout(g);
          expect(g.node("a").x).toEqual(100 / 2);
          expect(g.node("a").y).toEqual(200 / 2);
        });

        it("edge, labelpos = l", function() {
          g.setNode("a", { width: 100, height: 100 });
          g.setNode("b", { width: 100, height: 100 });
          g.setEdge("a", "b", {
            width: 1000, height: 2000, labelpos: "l", labeloffset: 0
          });
          layout(g);
          if (rankdir === "TB" || rankdir === "BT") {
            expect(g.edgeFromArgs("a", "b").x).toEqual(1000 / 2);
          } else {
            expect(g.edgeFromArgs("a", "b").y).toEqual(2000 / 2);
          }
        });
      });
    });
  });

  it("treats attributes with case-insensitivity", function() {
    g.graph().nodeSep = 200; // note the capital S
    g.setNode("a", { width: 50, height: 100 });
    g.setNode("b", { width: 75, height: 200 });
    layout(g);
    expect(extractCoordinates(g)).toEqual({
      a: { x: 50 / 2,            y: 200 / 2 },
      b: { x: 50 + 200 + 75 / 2, y: 200 / 2 }
    });
  });
});

function extractCoordinates(g) {
  let nodes = g.nodes();
  return _.zipObject(nodes, _.map(nodes, function(v) {
    return _.pick(g.node(v), ["x", "y"]);
  }));
}

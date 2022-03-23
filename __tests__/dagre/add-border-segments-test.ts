import { Graph } from "@antv/graphlib";
import addBorderSegments from "../../src/layout/dagre/src/add-border-segments";

describe("addBorderSegments", function () {
  let g;

  beforeEach(function () {
    g = new Graph<string ,any, any, any>({ compound: true });
  });

  it("does not add border nodes for a non-compound graph", function () {
    let g = new Graph<string ,any, any, any>();
    g.setNode("a", { rank: 0 });
    addBorderSegments(g);
    expect(g.nodeCount()).toEqual(1);
    expect(g.node("a")).toEqual({ rank: 0 });
  });

  it("does not add border nodes for a graph with no clusters", function () {
    g.setNode("a", { rank: 0 });
    addBorderSegments(g);
    expect(g.nodeCount()).toEqual(1);
    expect(g.node("a")).toEqual({ rank: 0 });
  });

  it("adds a border for a single-rank subgraph", function () {
    g.setNode("sg", { minRank: 1, maxRank: 1 });
    addBorderSegments(g);

    let bl = g.node("sg").borderLeft[1];
    let br = g.node("sg").borderRight[1];
    expect(g.node(bl)).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.parent(bl)).toEqual("sg");
    expect(g.node(br)).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.parent(br)).toEqual("sg");
  });

  it("adds a border for a multi-rank subgraph", function () {
    g.setNode("sg", { minRank: 1, maxRank: 2 });
    addBorderSegments(g);

    let sgNode = g.node("sg");
    let bl2 = sgNode.borderLeft[1];
    let br2 = sgNode.borderRight[1];
    expect(g.node(bl2)).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.parent(bl2)).toEqual("sg");
    expect(g.node(br2)).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.parent(br2)).toEqual("sg");

    let bl1 = sgNode.borderLeft[2];
    let br1 = sgNode.borderRight[2];
    expect(g.node(bl1)).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 2,
      width: 0,
      height: 0,
    });
    expect(g.parent(bl1)).toEqual("sg");
    expect(g.node(br1)).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 2,
      width: 0,
      height: 0,
    });
    expect(g.parent(br1)).toEqual("sg");

    expect(g.hasEdge(sgNode.borderLeft[1], sgNode.borderLeft[2])).toBe(true);
    expect(g.hasEdge(sgNode.borderRight[1], sgNode.borderRight[2])).toBe(true);
  });

  it("adds borders for nested subgraphs", function () {
    g.setNode("sg1", { minRank: 1, maxRank: 1 });
    g.setNode("sg2", { minRank: 1, maxRank: 1 });
    g.setParent("sg2", "sg1");
    addBorderSegments(g);

    let bl1 = g.node("sg1").borderLeft[1];
    let br1 = g.node("sg1").borderRight[1];
    expect(g.node(bl1)).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.parent(bl1)).toEqual("sg1");
    expect(g.node(br1)).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.parent(br1)).toEqual("sg1");

    let bl2 = g.node("sg2").borderLeft[1];
    let br2 = g.node("sg2").borderRight[1];
    expect(g.node(bl2)).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.parent(bl2)).toEqual("sg2");
    expect(g.node(br2)).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.parent(br2)).toEqual("sg2");
  });
});

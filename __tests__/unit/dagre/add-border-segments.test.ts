import { Edge, Graph } from "@antv/graphlib";
import { Graph as IGraph, NodeData, EdgeData } from "../../../packages/layout";
import { addBorderSegments } from "../../../packages/layout/src/dagre/add-border-segments";

describe("addBorderSegments", function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
  });

  it("does not add border nodes for a non-compound graph", function () {
    g.addNode({
      id: "a",
      data: { rank: 0 },
    });
    addBorderSegments(g);
    expect(g.getAllNodes().length).toEqual(1);
    expect(g.getNode("a").data).toEqual({ rank: 0 });
  });

  // it("does not add border nodes for a graph with no clusters", function () {
  //   g.addNode("a", { rank: 0 });
  //   addBorderSegments(g);
  //   expect(g.nodeCount()).toEqual(1);
  //   expect(g.node("a")).toEqual({ rank: 0 });
  // });

  it("adds a border for a single-rank subgraph", function () {
    g.addNode({
      id: "sg",
      data: { minRank: 1, maxRank: 1 },
    });
    addBorderSegments(g);

    // @ts-ignore
    let bl = g.getNode("sg").data.borderLeft[1];
    // @ts-ignore
    let br = g.getNode("sg").data.borderRight[1];
    expect(g.getNode(bl).data).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.getParent(bl)?.id).toEqual("sg");
    expect(g.getNode(br).data).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.getParent(br)?.id).toEqual("sg");
  });

  it("adds a border for a multi-rank subgraph", function () {
    g.addNode({
      id: "sg",
      data: { minRank: 1, maxRank: 2 },
    });
    addBorderSegments(g);

    let sgNode = g.getNode("sg");
    // @ts-ignore
    let bl2 = sgNode.data.borderLeft[1];
    // @ts-ignore
    let br2 = sgNode.data.borderRight[1];
    expect(g.getNode(bl2).data).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.getParent(bl2)?.id).toEqual("sg");
    expect(g.getNode(br2).data).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.getParent(br2)?.id).toEqual("sg");

    // @ts-ignore
    let bl1 = sgNode.data.borderLeft[2];
    // @ts-ignore
    let br1 = sgNode.data.borderRight[2];
    expect(g.getNode(bl1).data).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 2,
      width: 0,
      height: 0,
    });
    expect(g.getParent(bl1)?.id).toEqual("sg");
    expect(g.getNode(br1).data).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 2,
      width: 0,
      height: 0,
    });
    expect(g.getParent(br1)?.id).toEqual("sg");

    expect(
      g
        // @ts-ignore
        .getRelatedEdges(sgNode.data.borderLeft[1], "out")
        // @ts-ignore
        .find((e) => e.target === sgNode.data.borderLeft[2])
    ).toBeTruthy();
    expect(
      g
        // @ts-ignore
        .getRelatedEdges(sgNode.data.borderRight[1], "out")
        // @ts-ignore
        .find((e) => e.target === sgNode.data.borderRight[2])
    ).toBeTruthy();
  });

  it("adds borders for nested subgraphs", function () {
    g.addNode({
      id: "sg1",
      data: { minRank: 1, maxRank: 1 },
    });
    g.addNode({
      id: "sg2",
      data: { minRank: 1, maxRank: 1 },
    });
    g.setParent("sg2", "sg1");
    addBorderSegments(g);

    // @ts-ignore
    let bl1 = g.getNode("sg1").data.borderLeft[1];
    // @ts-ignore
    let br1 = g.getNode("sg1").data.borderRight[1];
    expect(g.getNode(bl1).data).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.getParent(bl1)?.id).toEqual("sg1");
    expect(g.getNode(br1).data).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.getParent(br1)?.id).toEqual("sg1");

    // @ts-ignore
    let bl2 = g.getNode("sg2").data.borderLeft[1];
    // @ts-ignore
    let br2 = g.getNode("sg2").data.borderRight[1];
    expect(g.getNode(bl2).data).toEqual({
      dummy: "border",
      borderType: "borderLeft",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.getParent(bl2)?.id).toEqual("sg2");
    expect(g.getNode(br2).data).toEqual({
      dummy: "border",
      borderType: "borderRight",
      rank: 1,
      width: 0,
      height: 0,
    });
    expect(g.getParent(br2)?.id).toEqual("sg2");
  });
});

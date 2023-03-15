import { Graph } from "@antv/graphlib";
import { Graph as IGraph, NodeData, EdgeData } from "@antv/layout";
import crossCount from "../../../../packages/layout/src/dagre/order/cross-count";

describe("crossCount", function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      nodes: [],
      edges: [],
    });
  });

  it("returns 0 for an empty layering", function () {
    expect(crossCount(g, [])).toEqual(0);
  });

  it("returns 0 for a layering with no crossings", function () {
    g.addNode({
      id: "a1",
      data: {},
    });
    g.addNode({
      id: "a2",
      data: {},
    });
    g.addNode({
      id: "b1",
      data: {},
    });
    g.addNode({
      id: "b2",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a1",
      target: "b1",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "a2",
      target: "b2",
      data: {
        weight: 1,
      },
    });
    expect(
      crossCount(g, [
        ["a1", "a2"],
        ["b1", "b2"],
      ])
    ).toEqual(0);
  });

  it("returns 1 for a layering with 1 crossing", function () {
    g.addNode({
      id: "a1",
      data: {},
    });
    g.addNode({
      id: "a2",
      data: {},
    });
    g.addNode({
      id: "b1",
      data: {},
    });
    g.addNode({
      id: "b2",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a1",
      target: "b1",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "a2",
      target: "b2",
      data: {
        weight: 1,
      },
    });
    expect(
      crossCount(g, [
        ["a1", "a2"],
        ["b2", "b1"],
      ])
    ).toEqual(1);
  });

  it("returns a weighted crossing count for a layering with 1 crossing", function () {
    g.addNode({
      id: "a1",
      data: {},
    });
    g.addNode({
      id: "a2",
      data: {},
    });
    g.addNode({
      id: "b1",
      data: {},
    });
    g.addNode({
      id: "b2",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a1",
      target: "b1",
      data: {
        weight: 2,
      },
    });
    g.addEdge({
      id: "e2",
      source: "a2",
      target: "b2",
      data: {
        weight: 3,
      },
    });
    expect(
      crossCount(g, [
        ["a1", "a2"],
        ["b2", "b1"],
      ])
    ).toEqual(6);
  });

  it("calculates crossings across layers", function () {
    g.addNode({
      id: "a1",
      data: {},
    });
    g.addNode({
      id: "a2",
      data: {},
    });
    g.addNode({
      id: "b1",
      data: {},
    });
    g.addNode({
      id: "b2",
      data: {},
    });
    g.addNode({
      id: "c1",
      data: {},
    });
    g.addNode({
      id: "c2",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a1",
      target: "b1",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "a2",
      target: "b2",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e3",
      source: "b1",
      target: "c1",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e4",
      source: "b2",
      target: "c2",
      data: {
        weight: 1,
      },
    });
    expect(
      crossCount(g, [
        ["a1", "a2"],
        ["b2", "b1"],
        ["c1", "c2"],
      ])
    ).toEqual(2);
  });

  it("works for graph #1", function () {
    g.addNode({
      id: "a",
      data: {},
    });
    g.addNode({
      id: "b",
      data: {},
    });
    g.addNode({
      id: "c",
      data: {},
    });
    g.addNode({
      id: "d",
      data: {},
    });
    g.addNode({
      id: "e",
      data: {},
    });
    g.addNode({
      id: "f",
      data: {},
    });
    g.addNode({
      id: "i",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a",
      target: "b",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "b",
      target: "c",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e3",
      source: "d",
      target: "e",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e4",
      source: "e",
      target: "c",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e5",
      source: "a",
      target: "f",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e6",
      source: "f",
      target: "i",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e7",
      source: "a",
      target: "e",
      data: {
        weight: 1,
      },
    });

    expect(
      crossCount(g, [
        ["a", "d"],
        ["b", "e", "f"],
        ["c", "i"],
      ])
    ).toEqual(1);
    expect(
      crossCount(g, [
        ["d", "a"],
        ["e", "b", "f"],
        ["c", "i"],
      ])
    ).toEqual(0);
  });
});

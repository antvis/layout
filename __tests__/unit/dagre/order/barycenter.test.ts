import { Graph } from "@antv/graphlib";
import { NodeData, EdgeData } from "@antv/layout";
import { barycenter } from "../../../../packages/layout/src/dagre/order/barycenter";

describe("order/barycenter", function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      nodes: [],
      edges: [],
    });
  });

  it("assigns an undefined barycenter for a node with no predecessors", function () {
    g.addNode({
      id: "x",
      data: {},
    });

    let results = barycenter(g, ["x"]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ v: "x" });
  });

  it("assigns the position of the sole predecessors", function () {
    g.addNode({
      id: "a",
      data: { order: 2 },
    });
    g.addNode({
      id: "x",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a",
      target: "x",
      data: {
        weight: 1,
      },
    });

    let results = barycenter(g, ["x"]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ v: "x", barycenter: 2, weight: 1 });
  });

  it("assigns the average of multiple predecessors", function () {
    g.addNode({
      id: "a",
      data: { order: 2 },
    });
    g.addNode({
      id: "b",
      data: { order: 4 },
    });
    g.addNode({
      id: "x",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a",
      target: "x",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "b",
      target: "x",
      data: {
        weight: 1,
      },
    });

    let results = barycenter(g, ["x"]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ v: "x", barycenter: 3, weight: 2 });
  });

  it("takes into account the weight of edges", function () {
    g.addNode({
      id: "a",
      data: { order: 2 },
    });
    g.addNode({
      id: "b",
      data: { order: 4 },
    });
    g.addNode({
      id: "x",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a",
      target: "x",
      data: {
        weight: 3,
      },
    });
    g.addEdge({
      id: "e2",
      source: "b",
      target: "x",
      data: {
        weight: 1,
      },
    });

    let results = barycenter(g, ["x"]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ v: "x", barycenter: 2.5, weight: 4 });
  });

  it("calculates barycenters for all nodes in the movable layer", function () {
    g.addNode({
      id: "a",
      data: { order: 1 },
    });
    g.addNode({
      id: "b",
      data: { order: 2 },
    });
    g.addNode({
      id: "c",
      data: { order: 4 },
    });
    g.addNode({
      id: "x",
      data: {},
    });
    g.addEdge({
      id: "e1",
      source: "a",
      target: "x",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "b",
      target: "x",
      data: {
        weight: 1,
      },
    });
    g.addNode({
      id: "y",
      data: {},
    });
    g.addNode({
      id: "z",
      data: {},
    });
    g.addEdge({
      id: "e3",
      source: "a",
      target: "z",
      data: {
        weight: 2,
      },
    });
    g.addEdge({
      id: "e4",
      source: "c",
      target: "z",
      data: {
        weight: 1,
      },
    });

    let results = barycenter(g, ["x", "y", "z"]);
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ v: "x", barycenter: 1.5, weight: 2 });
    expect(results[1]).toEqual({ v: "y" });
    expect(results[2]).toEqual({ v: "z", barycenter: 2, weight: 3 });
  });
});

import { Graph } from "@antv/graphlib";
import { NodeData, EdgeData } from "@antv/layout";
import { sortSubgraph } from "../../../../packages/layout/src/dagre/order/sort-subgraph";

describe("order/sortSubgraph", function () {
  let g: Graph<NodeData, EdgeData>;
  let cg: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
    cg = new Graph();
  });

  beforeEach(function () {
    g = new Graph();
    for (let i = 0; i < 5; i++) {
      g.addNode({
        id: `${i}`,
        data: { order: i },
      });
    }
    cg = new Graph();
  });

  it("sorts a flat subgraph based on barycenter", function () {
    g.addTree({
      id: "movable",
      data: {},
      children: [
        {
          id: "x",
          data: {},
          children: [],
        },
        {
          id: "y",
          data: {},
        },
      ],
    });

    g.addEdge({
      id: "e1",
      source: "3",
      target: "x",
      data: { weight: 1 },
    });
    g.addEdge({
      id: "e2",
      source: "1",
      target: "y",
      data: { weight: 2 },
    });
    g.addEdge({
      id: "e3",
      source: "4",
      target: "y",
      data: { weight: 1 },
    });

    expect(sortSubgraph(g, "movable", cg).vs).toEqual(["y", "x"]);
  });

  it("preserves the pos of a node (y) w/o neighbors in a flat subgraph", function () {
    g.addTree({
      id: "movable",
      data: {},
      children: [
        {
          id: "x",
          data: {},
          children: [],
        },
        {
          id: "y",
          data: {},
        },
        {
          id: "z",
          data: {},
        },
      ],
    });
    g.addEdge({
      id: "e1",
      source: "3",
      target: "x",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "1",
      target: "z",
      data: {
        weight: 2,
      },
    });
    g.addEdge({
      id: "e3",
      source: "4",
      target: "z",
      data: {
        weight: 1,
      },
    });

    expect(sortSubgraph(g, "movable", cg).vs).toEqual(["z", "y", "x"]);
  });

  it("biases to the left without reverse bias", function () {
    g.addTree({
      id: "movable",
      data: {},
      children: [
        {
          id: "x",
          data: {},
          children: [],
        },
        {
          id: "y",
          data: {},
        },
      ],
    });
    g.addEdge({
      id: "e1",
      source: "1",
      target: "x",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "1",
      target: "y",
      data: {
        weight: 1,
      },
    });

    expect(sortSubgraph(g, "movable", cg).vs).toEqual(["x", "y"]);
  });

  it("biases to the right with reverse bias", function () {
    g.addTree({
      id: "movable",
      data: {},
      children: [
        {
          id: "x",
          data: {},
          children: [],
        },
        {
          id: "y",
          data: {},
        },
      ],
    });
    g.addEdge({
      id: "e1",
      source: "1",
      target: "x",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "1",
      target: "y",
      data: {
        weight: 1,
      },
    });

    expect(sortSubgraph(g, "movable", cg, true).vs).toEqual(["y", "x"]);
  });

  it("aggregates stats about the subgraph", function () {
    g.addTree({
      id: "movable",
      data: {},
      children: [
        {
          id: "x",
          data: {},
          children: [],
        },
        {
          id: "y",
          data: {},
        },
      ],
    });

    g.addEdge({
      id: "e1",
      source: "3",
      target: "x",
      data: { weight: 1 },
    });
    g.addEdge({
      id: "e2",
      source: "1",
      target: "y",
      data: { weight: 2 },
    });
    g.addEdge({
      id: "e3",
      source: "4",
      target: "y",
      data: { weight: 1 },
    });

    let results = sortSubgraph(g, "movable", cg);
    expect(results.barycenter).toEqual(2.25);
    expect(results.weight).toEqual(4);
  });

  it("can sort a nested subgraph with no barycenter", function () {
    g.addTree({
      id: "movable",
      data: {},
      children: [
        {
          id: "x",
          data: {},
          children: [],
        },
        {
          id: "y",
          data: {},
          children: [
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
          ],
        },
        {
          id: "z",
          data: {},
        },
      ],
    });

    g.addEdge({
      id: "e1",
      source: "0",
      target: "x",
      data: { weight: 1 },
    });

    g.addEdge({
      id: "e2",
      source: "1",
      target: "z",
      data: { weight: 1 },
    });

    g.addEdge({
      id: "e3",
      source: "2",
      target: "y",
      data: { weight: 1 },
    });

    expect(sortSubgraph(g, "movable", cg).vs).toEqual([
      "x",
      "z",
      "a",
      "b",
      "c",
    ]);
  });

  it("can sort a nested subgraph with a barycenter", function () {
    g.addTree({
      id: "movable",
      data: {},
      children: [
        {
          id: "x",
          data: {},
          children: [],
        },
        {
          id: "y",
          data: {},
          children: [
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
          ],
        },
        {
          id: "z",
          data: {},
        },
      ],
    });

    g.addEdge({
      id: "e0",
      source: "0",
      target: "a",
      data: { weight: 3 },
    });

    g.addEdge({
      id: "e1",
      source: "0",
      target: "x",
      data: { weight: 1 },
    });

    g.addEdge({
      id: "e2",
      source: "1",
      target: "z",
      data: { weight: 1 },
    });

    g.addEdge({
      id: "e3",
      source: "2",
      target: "y",
      data: { weight: 1 },
    });

    expect(sortSubgraph(g, "movable", cg).vs).toEqual([
      "x",
      "a",
      "b",
      "c",
      "z",
    ]);
  });

  it("can sort a nested subgraph with no in-edges", function () {
    g.addTree({
      id: "movable",
      data: {},
      children: [
        {
          id: "x",
          data: {},
          children: [],
        },
        {
          id: "y",
          data: {},
          children: [
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
          ],
        },
        {
          id: "z",
          data: {},
        },
      ],
    });

    g.addEdge({
      id: "e0",
      source: "0",
      target: "a",
      data: { weight: 1 },
    });

    g.addEdge({
      id: "e1",
      source: "1",
      target: "b",
      data: { weight: 1 },
    });

    g.addEdge({
      id: "e2",
      source: "0",
      target: "x",
      data: { weight: 1 },
    });

    g.addEdge({
      id: "e3",
      source: "1",
      target: "z",
      data: { weight: 1 },
    });

    expect(sortSubgraph(g, "movable", cg).vs).toEqual([
      "x",
      "a",
      "b",
      "c",
      "z",
    ]);
  });

  it("sorts border nodes to the extremes of the subgraph", function () {
    g.addTree({
      id: "sg1",
      data: {
        borderLeft: "bl",
        borderRight: "br",
      },
      children: [
        {
          id: "x",
          data: {},
        },
        {
          id: "y",
          data: {},
        },
        {
          id: "z",
          data: {},
        },
        {
          id: "bl",
          data: {},
        },
        {
          id: "br",
          data: {},
        },
      ],
    });

    g.addEdge({
      id: "e0",
      source: "0",
      target: "x",
      data: { weight: 1 },
    });
    g.addEdge({
      id: "e1",
      source: "1",
      target: "y",
      data: { weight: 1 },
    });
    g.addEdge({
      id: "e2",
      source: "2",
      target: "z",
      data: { weight: 1 },
    });

    expect(sortSubgraph(g, "sg1", cg).vs).toEqual(["bl", "x", "y", "z", "br"]);
  });

  it("assigns a barycenter to a subgraph based on previous border nodes", function () {
    g.addTree({
      id: "sg",
      data: {
        borderLeft: "bl2",
        borderRight: "br2",
      },
      children: [
        {
          id: "bl2",
          data: {},
        },
        {
          id: "br2",
          data: {},
        },
      ],
    });

    g.addNode({
      id: "bl1",
      data: {
        order: 0,
      },
    });
    g.addNode({
      id: "br1",
      data: {
        order: 1,
      },
    });
    g.addEdge({
      id: "e1",
      source: "bl1",
      target: "bl2",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e2",
      source: "br1",
      target: "br2",
      data: {
        weight: 1,
      },
    });

    expect(sortSubgraph(g, "sg", cg)).toEqual({
      barycenter: 0.5,
      weight: 2,
      vs: ["bl2", "br2"],
    });
  });
});

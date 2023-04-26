import { Graph } from "@antv/graphlib";
import {
  Graph as IGraph,
  NodeData,
  EdgeData,
} from "../../../../packages/layout";
import { order } from "../../../../packages/layout/src/dagre/order";
import { crossCount } from "../../../../packages/layout/src/dagre/order/cross-count";
import * as util from "../../../../packages/layout/src/dagre/util";

describe("order", function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
  });

  test("does not add crossings to a tree structure", function () {
    g.addNode({
      id: "a",
      data: { rank: 1 },
    });
    g.addNode({
      id: "b",
      data: { rank: 2 },
    });
    g.addNode({
      id: "e",
      data: { rank: 2 },
    });
    g.addNode({
      id: "c",
      data: { rank: 3 },
    });
    g.addNode({
      id: "d",
      data: { rank: 3 },
    });
    g.addNode({
      id: "f",
      data: { rank: 3 },
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
      source: "b",
      target: "d",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e4",
      source: "a",
      target: "e",
      data: {
        weight: 1,
      },
    });
    g.addEdge({
      id: "e5",
      source: "e",
      target: "f",
      data: {
        weight: 1,
      },
    });
    order(g);
    let layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toEqual(0);
  });

  test("can solve a simple graph", function () {
    // This graph resulted in a single crossing for previous versions of dagre.
    ["a", "d"].forEach((v) => {
      g.addNode({
        id: v,
        data: { rank: 1 },
      });
    });
    ["b", "f", "e"].forEach((v) => {
      g.addNode({
        id: v,
        data: { rank: 2 },
      });
    });
    ["c", "g"].forEach((v) => {
      g.addNode({
        id: v,
        data: { rank: 3 },
      });
    });
    order(g);
    let layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toEqual(0);
  });

  test("can minimize crossings", function () {
    g.addNode({
      id: "a",
      data: { rank: 1 },
    });
    ["b", "e", "g"].forEach((v) => {
      g.addNode({
        id: v,
        data: { rank: 2 },
      });
    });
    ["c", "f", "h"].forEach((v) => {
      g.addNode({
        id: v,
        data: { rank: 3 },
      });
    });

    g.addNode({
      id: "d",
      data: { rank: 4 },
    });
    order(g);
    let layering = util.buildLayerMatrix(g);
    expect(crossCount(g, layering)).toBeLessThanOrEqual(1);
  });
});

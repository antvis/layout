import { Edge, Graph } from "@antv/graphlib";
import { Graph as IGraph, NodeData, EdgeData } from "@antv/layout";
import coordinateSystem from "../../../packages/layout/src/dagre/coordinate-system";

describe("coordinateSystem", function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>();
  });

  describe("coordinateSystem.adjust", function () {
    beforeEach(function () {
      g.addNode({
        id: "a",
        data: { width: 100, height: 200 },
      });
    });

    it("does nothing to node dimensions with rankdir = TB", function () {
      coordinateSystem.adjust(g, "TB");
      expect(g.getNode("a").data).toEqual({ width: 100, height: 200 });
    });

    it("does nothing to node dimensions with rankdir = BT", function () {
      coordinateSystem.adjust(g, "BT");
      expect(g.getNode("a").data).toEqual({ width: 100, height: 200 });
    });

    it("swaps width and height for nodes with rankdir = LR", function () {
      coordinateSystem.adjust(g, "LR");
      expect(g.getNode("a").data).toEqual({ width: 200, height: 100 });
    });

    it("swaps width and height for nodes with rankdir = RL", function () {
      coordinateSystem.adjust(g, "RL");
      expect(g.getNode("a").data).toEqual({ width: 200, height: 100 });
    });
  });

  describe("coordinateSystem.undo", function () {
    beforeEach(function () {
      g.addNode({
        id: "a",
        data: { width: 100, height: 200, x: 20, y: 40 },
      });
    });

    it("does nothing to points with rankdir = TB", function () {
      coordinateSystem.undo(g, "TB");
      expect(g.getNode("a").data).toEqual({
        x: 20,
        y: 40,
        width: 100,
        height: 200,
      });
    });

    it("flips the y coordinate for points with rankdir = BT", function () {
      coordinateSystem.undo(g, "BT");
      expect(g.getNode("a").data).toEqual({
        x: 20,
        y: -40,
        width: 100,
        height: 200,
      });
    });

    it("swaps dimensions and coordinates for points with rankdir = LR", function () {
      coordinateSystem.undo(g, "LR");
      expect(g.getNode("a").data).toEqual({
        x: 40,
        y: 20,
        width: 200,
        height: 100,
      });
    });

    it("swaps dims and coords and flips x for points with rankdir = RL", function () {
      coordinateSystem.undo(g, "RL");
      expect(g.getNode("a").data).toEqual({
        x: -40,
        y: 20,
        width: 200,
        height: 100,
      });
    });
  });
});

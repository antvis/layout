import normalize from "../../src/layout/dagre/src/normalize";
import { Graph } from '@antv/graphlib';

describe("normalize", function() {
  let g;

  beforeEach(function() {
    g = new Graph<string ,any, any, any>({ multigraph: true, compound: true }).setGraph({});
  });

  describe("run", function() {
    it("does not change a short edge", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 1 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      expect(g.edges().map(incidentNodes)).toEqual([{ v: "a", w: "b" }]);
      expect(g.node("a").rank).toEqual(0);
      expect(g.node("b").rank).toEqual(1);
    });

    it("splits a two layer edge into two segments", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      expect(g.successors("a")).toHaveLength(1);
      let successor = g.successors("a")[0];
      expect(g.node(successor).dummy).toEqual("edge");
      expect(g.node(successor).rank).toEqual(1);
      expect(g.successors(successor)).toEqual(["b"]);
      expect(g.node("a").rank).toEqual(0);
      expect(g.node("b").rank).toEqual(2);

      expect(g.graph().dummyChains).toHaveLength(1);
      expect(g.graph().dummyChains[0]).toEqual(successor);
    });

    it("assigns width = 0, height = 0 to dummy nodes by default", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", { width: 10, height: 10 });

      normalize.run(g);

      expect(g.successors("a")).toHaveLength(1);
      let successor = g.successors("a")[0];
      expect(g.node(successor).width).toEqual(0);
      expect(g.node(successor).height).toEqual(0);
    });

    it("assigns width and height from the edge for the node on labelRank", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 4 });
      g.setEdge("a", "b", { width: 20, height: 10, labelRank: 2 });

      normalize.run(g);

      let labelV = g.successors(g.successors("a")[0])[0];
      let labelNode = g.node(labelV);
      expect(labelNode.width).toEqual(20);
      expect(labelNode.height).toEqual(10);
    });

    it("preserves the weight for the edge", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", { weight: 2 });

      normalize.run(g);


      expect(g.successors("a")).toHaveLength(1);
      expect(g.edgeFromArgs("a", g.successors("a")[0])?.weight).toEqual(2);
    });
  });

  describe("undo", function() {
    it("reverses the run operation", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);
      normalize.undo(g);

      expect(g.edges().map(incidentNodes)).toEqual([{ v: "a", w: "b" }]);
      expect(g.node("a").rank).toEqual(0);
      expect(g.node("b").rank).toEqual(2);
    });

    it("restores previous edge labels", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", { foo: "bar" });

      normalize.run(g);
      normalize.undo(g);

      expect(g.edgeFromArgs("a", "b").foo).toEqual("bar");
    });

    it("collects assigned coordinates into the 'points' attribute", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      let dummyLabel = g.node(g.neighbors("a")[0]);
      dummyLabel.x = 5;
      dummyLabel.y = 10;

      normalize.undo(g);

      expect(g.edgeFromArgs("a", "b").points).toEqual([{ x: 5, y: 10 }]);
    });

    it("merges assigned coordinates into the 'points' attribute", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 4 });
      g.setEdge("a", "b", {});

      normalize.run(g);

      let aSucLabel = g.node(g.neighbors("a")[0]);
      aSucLabel.x = 5;
      aSucLabel.y = 10;

      let midLabel = g.node(g.successors(g.successors("a")[0])[0]);
      midLabel.x = 20;
      midLabel.y = 25;

      let bPredLabel = g.node(g.neighbors("b")[0]);
      bPredLabel.x = 100;
      bPredLabel.y = 200;

      normalize.undo(g);

      expect(g.edgeFromArgs("a", "b").points)
        .toEqual([{ x: 5, y: 10 }, { x: 20, y: 25 }, { x: 100, y: 200 }]);
    });

    it("sets coords and dims for the label, if the edge has one", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", { width: 10, height: 20, labelRank: 1 });

      normalize.run(g);

      let labelNode = g.node(g.successors("a")[0]);
      labelNode.x = 50;
      labelNode.y = 60;
      labelNode.width = 20;
      labelNode.height = 10;

      normalize.undo(g);

      const { x, y , width, height} = g.edgeFromArgs("a", "b");

      expect({ x, y , width, height}).toEqual({
        x: 50, y: 60, width: 20, height: 10
      });
    });

    it("sets coords and dims for the label, if the long edge has one", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 4 });
      g.setEdge("a", "b", { width: 10, height: 20, labelRank: 2 });

      normalize.run(g);

      let labelNode = g.node(g.successors(g.successors("a")[0])[0]);
      labelNode.x = 50;
      labelNode.y = 60;
      labelNode.width = 20;
      labelNode.height = 10;

      normalize.undo(g);

      const { x, y , width, height} = g.edgeFromArgs("a", "b");

      expect({ x, y , width, height}).toEqual({
        x: 50, y: 60, width: 20, height: 10
      });
    });

    it("restores multi-edges", function() {
      g.setNode("a", { rank: 0 });
      g.setNode("b", { rank: 2 });
      g.setEdge("a", "b", {}, "bar");
      g.setEdge("a", "b", {}, "foo");

      normalize.run(g);

      let outEdges = g.outEdges("a").sort((a, b) => a.name - b.name);
      expect(outEdges).toHaveLength(2);

      let barDummy = g.node(outEdges[0].w);
      barDummy.x = 5;
      barDummy.y = 10;

      let fooDummy = g.node(outEdges[1].w);
      fooDummy.x = 15;
      fooDummy.y = 20;

      normalize.undo(g);

      expect(g.hasEdge("a", "b")).toBe(false);
      expect(g.edgeFromArgs("a", "b", "bar").points).toEqual([{ x: 5, y: 10 }]);
      expect(g.edgeFromArgs("a", "b", "foo").points).toEqual([{ x: 15, y: 20 }]);
    });
  });
});

function incidentNodes(edge) {
  return { v: edge.v, w: edge.w };
}

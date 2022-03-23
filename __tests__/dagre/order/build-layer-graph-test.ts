import { Graph } from "@antv/graphlib";
import buildLayerGraph from "../../../src/layout/dagre/src/order/build-layer-graph";

let _ = require("lodash");



describe("order/buildLayerGraph", function() {
  let g;

  beforeEach(function() {
    g = new Graph<string, any, any, any>({ compound: true, multigraph: true });
  });

  it("places movable nodes with no parents under the root node", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 1 });
    g.setNode("c", { rank: 2 });
    g.setNode("d", { rank: 3 });

    let lg;
    lg = buildLayerGraph(g, 1, "inEdges");
    expect(lg.hasNode(lg.graph().root));
    expect(lg.children()).toEqual([lg.graph().root]);
    expect(lg.children(lg.graph().root)).toEqual(["a", "b"]);
  });

  it("copies flat nodes from the layer to the graph", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 1 });
    g.setNode("c", { rank: 2 });
    g.setNode("d", { rank: 3 });

    expect(buildLayerGraph(g, 1, "inEdges").nodes()).toContain("a");
    expect(buildLayerGraph(g, 1, "inEdges").nodes()).toContain("b");
    expect(buildLayerGraph(g, 2, "inEdges").nodes()).toContain("c");
    expect(buildLayerGraph(g, 3, "inEdges").nodes()).toContain("d");
  });

  it("uses the original node label for copied nodes", function() {
    // This allows us to make updates to the original graph and have them
    // be available automatically in the layer graph.
    g.setNode("a", { foo: 1, rank: 1 });
    g.setNode("b", { foo: 2, rank: 2 });
    g.setEdge("a", "b", { weight: 1 });

    let lg = buildLayerGraph(g, 2, "inEdges");

    expect(lg.node("a").foo).toEqual(1);
    g.node("a").foo = "updated";
    expect(lg.node("a").foo).toEqual("updated");

    expect(lg.node("b").foo).toEqual(2);
    g.node("b").foo = "updated";
    expect(lg.node("b").foo).toEqual("updated");
  });

  it("copies edges incident on rank nodes to the graph (inEdges)", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 1 });
    g.setNode("c", { rank: 2 });
    g.setNode("d", { rank: 3 });
    g.setEdge("a", "c", { weight: 2 });
    g.setEdge("b", "c", { weight: 3 });
    g.setEdge("c", "d", { weight: 4 });

    expect(buildLayerGraph(g, 1, "inEdges").edgeCount()).toEqual(0);
    expect(buildLayerGraph(g, 2, "inEdges").edgeCount()).toEqual(2);
    expect(buildLayerGraph(g, 2, "inEdges").edgeFromArgs("a", "c")).toEqual({ weight: 2 });
    expect(buildLayerGraph(g, 2, "inEdges").edgeFromArgs("b", "c")).toEqual({ weight: 3 });
    expect(buildLayerGraph(g, 3, "inEdges").edgeCount()).toEqual(1);
    expect(buildLayerGraph(g, 3, "inEdges").edgeFromArgs("c", "d")).toEqual({ weight: 4 });
  });

  it("copies edges incident on rank nodes to the graph (outEdges)", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 1 });
    g.setNode("c", { rank: 2 });
    g.setNode("d", { rank: 3 });
    g.setEdge("a", "c", { weight: 2 });
    g.setEdge("b", "c", { weight: 3 });
    g.setEdge("c", "d", { weight: 4 });

    expect(buildLayerGraph(g, 1, "outEdges").edgeCount()).toEqual(2);
    expect(buildLayerGraph(g, 1, "outEdges").edgeFromArgs("c", "a")).toEqual({ weight: 2 });
    expect(buildLayerGraph(g, 1, "outEdges").edgeFromArgs("c", "b")).toEqual({ weight: 3 });
    expect(buildLayerGraph(g, 2, "outEdges").edgeCount()).toEqual(1);
    expect(buildLayerGraph(g, 2, "outEdges").edgeFromArgs("d", "c")).toEqual({ weight: 4 });
    expect(buildLayerGraph(g, 3, "outEdges").edgeCount()).toEqual(0);
  });

  it("collapses multi-edges", function() {
    g.setNode("a", { rank: 1 });
    g.setNode("b", { rank: 2 });
    g.setEdge("a", "b", { weight: 2 });
    g.setEdge("a", "b", { weight: 3 }, "multi");

    expect(buildLayerGraph(g, 2, "inEdges").edgeFromArgs("a", "b")).toEqual({ weight: 5 });
  });

  it("preserves hierarchy for the movable layer", function() {
    g.setNode("a", { rank: 0 });
    g.setNode("b", { rank: 0 });
    g.setNode("c", { rank: 0 });
    g.setNode("sg", {
      minRank: 0,
      maxRank: 0,
      borderLeft: ["bl"],
      borderRight: ["br"]
    });
    _.forEach(["a", "b"], function(v) { g.setParent(v, "sg"); });

    let lg = buildLayerGraph(g, 0, "inEdges");
    let root = lg.graph().root;
    expect(_.sortBy(lg.children(root))).toEqual(["c", "sg"]);
    expect(lg.parent("a")).toEqual("sg");
    expect(lg.parent("b")).toEqual("sg");
  });
});

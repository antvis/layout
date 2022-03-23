import { Graph, algorithm } from '@antv/graphlib';

import nestingGraph from "../../src/layout/dagre/src/nesting-graph";

const { components } = algorithm;

describe("rank/nestingGraph", function() {
  let g;

  beforeEach(function() {
    g = new Graph<string ,any, any, any>({ compound: true })
      .setGraph({})
      .setDefaultNodeLabel(function() { return {}; });
  });

  describe("run", function() {
    it("connects a disconnected graph", function() {
      g.setNode("a");
      g.setNode("b");
      expect(components(g)).toHaveLength(2);
      nestingGraph.run(g);
      expect(components(g)).toHaveLength(1);
      expect(g.hasNode("a"));
      expect(g.hasNode("b"));
    });

    it("adds border nodes to the top and bottom of a subgraph", function() {
      g.setParent("a", "sg1");
      nestingGraph.run(g);

      const node = g.node("sg1");
      let borderTop = g.node("sg1").borderTop;
      let borderBottom = g.node("sg1").borderBottom;
      expect(node).toHaveProperty('borderTop');
      expect(node).toHaveProperty('borderBottom');
      expect(g.parent(borderTop)).toEqual("sg1");
      expect(g.parent(borderBottom)).toEqual("sg1");
      expect(g.outEdges(borderTop, "a")).toHaveLength(1);
      expect(g.edge(g.outEdges(borderTop, "a")[0]).minlen).toEqual(1);
      expect(g.outEdges("a", borderBottom)).toHaveLength(1);
      expect(g.edge(g.outEdges("a", borderBottom)[0]).minlen).toEqual(1);
      expect(g.node(borderTop)).toEqual({ width: 0, height: 0, dummy: "border" });
      expect(g.node(borderBottom)).toEqual({ width: 0, height: 0, dummy: "border" });
    });

    it("adds edges between borders of nested subgraphs", function() {
      g.setParent("sg2", "sg1");
      g.setParent("a", "sg2");
      nestingGraph.run(g);

      let sg1Top = g.node("sg1").borderTop;
      let sg1Bottom = g.node("sg1").borderBottom;
      let sg2Top = g.node("sg2").borderTop;
      let sg2Bottom = g.node("sg2").borderBottom;
      expect(sg1Top).not.toBeUndefined();
      expect(sg1Bottom).not.toBeUndefined();
      expect(sg2Top).not.toBeUndefined();
      expect(sg2Bottom).not.toBeUndefined();
      expect(g.outEdges(sg1Top, sg2Top)).toHaveLength(1);
      expect(g.edge(g.outEdges(sg1Top, sg2Top)[0]).minlen).toEqual(1);
      expect(g.outEdges(sg2Bottom, sg1Bottom)).toHaveLength(1);
      expect(g.edge(g.outEdges(sg2Bottom, sg1Bottom)[0]).minlen).toEqual(1);
    });

    it("adds sufficient weight to border to node edges", function() {
      // We want to keep subgraphs tight, so we should ensure that the weight for
      // the edge between the top (and bottom) border nodes and nodes in the
      // subgraph have weights exceeding anything in the graph.
      g.setParent("x", "sg");
      g.setEdge("a", "x", { weight: 100 });
      g.setEdge("x", "b", { weight: 200 });
      nestingGraph.run(g);

      let top = g.node("sg").borderTop;
      let bot = g.node("sg").borderBottom;
      expect(g.edgeFromArgs(top, "x").weight).toBeGreaterThan(300);
      expect(g.edgeFromArgs("x", bot).weight).toBeGreaterThan(300);
    });

    it("adds an edge from the root to the tops of top-level subgraphs", function() {
      g.setParent("a", "sg1");
      nestingGraph.run(g);

      let root = g.graph().nestingRoot;
      let borderTop = g.node("sg1").borderTop;
      expect(root).not.toBeUndefined();
      expect(borderTop).not.toBeUndefined();
      expect(g.outEdges(root, borderTop)).toHaveLength(1);
      const edge = g.outEdges(root, borderTop)[0];
      expect(g.hasEdge(edge.v, edge.w, edge.name)).toBe(true);
    });

    it("adds an edge from root to each node with the correct minlen #1", function() {
      g.setNode("a");
      nestingGraph.run(g);

      let root = g.graph().nestingRoot;
      expect(root).not.toBeUndefined();
      expect(g.outEdges(root, "a")).toHaveLength(1);
      expect(g.edge(g.outEdges(root, "a")[0])).toEqual({ weight: 0, minlen: 1 });
    });

    it("adds an edge from root to each node with the correct minlen #2", function() {
      g.setParent("a", "sg1");
      nestingGraph.run(g);

      let root = g.graph().nestingRoot;
      expect(root).not.toBeUndefined();
      expect(g.outEdges(root, "a")).toHaveLength(1);
      expect(g.edge(g.outEdges(root, "a")[0])).toEqual({ weight: 0, minlen: 3 });
    });

    it("adds an edge from root to each node with the correct minlen #3", function() {
      g.setParent("sg2", "sg1");
      g.setParent("a", "sg2");
      nestingGraph.run(g);

      let root = g.graph().nestingRoot;
      expect(root).not.toBeUndefined();
      expect(g.outEdges(root, "a")).toHaveLength(1);
      expect(g.edge(g.outEdges(root, "a")[0])).toEqual({ weight: 0, minlen: 5 });
    });

    it("does not add an edge from the root to itself", function() {
      g.setNode("a");
      nestingGraph.run(g);

      let root = g.graph().nestingRoot;
      expect(g.outEdges(root, root)).toEqual([]);
    });

    it("expands inter-node edges to separate SG border and nodes #1", function() {
      g.setEdge("a", "b", { minlen: 1 });
      nestingGraph.run(g);
      expect(g.edgeFromArgs("a", "b").minlen).toEqual(1);
    });

    it("expands inter-node edges to separate SG border and nodes #2", function() {
      g.setParent("a", "sg1");
      g.setEdge("a", "b", { minlen: 1 });
      nestingGraph.run(g);
      expect(g.edgeFromArgs("a", "b").minlen).toEqual(3);
    });

    it("expands inter-node edges to separate SG border and nodes #3", function() {
      g.setParent("sg2", "sg1");
      g.setParent("a", "sg2");
      g.setEdge("a", "b", { minlen: 1 });
      nestingGraph.run(g);
      expect(g.edgeFromArgs("a", "b").minlen).toEqual(5);
    });

    it("sets minlen correctly for nested SG boder to children", function() {
      g.setParent("a", "sg1");
      g.setParent("sg2", "sg1");
      g.setParent("b", "sg2");
      nestingGraph.run(g);

      // We expect the following layering:
      //
      // 0: root
      // 1: empty (close sg2)
      // 2: empty (close sg1)
      // 3: open sg1
      // 4: open sg2
      // 5: a, b
      // 6: close sg2
      // 7: close sg1

      let root = g.graph().nestingRoot;
      let sg1Top = g.node("sg1").borderTop;
      let sg1Bot = g.node("sg1").borderBottom;
      let sg2Top = g.node("sg2").borderTop;
      let sg2Bot = g.node("sg2").borderBottom;

      expect(g.edgeFromArgs(root, sg1Top).minlen).toEqual(3);
      expect(g.edgeFromArgs(sg1Top, sg2Top).minlen).toEqual(1);
      expect(g.edgeFromArgs(sg1Top, "a").minlen).toEqual(2);
      expect(g.edgeFromArgs("a", sg1Bot).minlen).toEqual(2);
      expect(g.edgeFromArgs(sg2Top, "b").minlen).toEqual(1);
      expect(g.edgeFromArgs("b", sg2Bot).minlen).toEqual(1);
      expect(g.edgeFromArgs(sg2Bot, sg1Bot).minlen).toEqual(1);
    });
  });

  describe("cleanup", function() {
    it("removes nesting graph edges", function() {
      g.setParent("a", "sg1");
      g.setEdge("a", "b", { minlen: 1 });
      nestingGraph.run(g);
      nestingGraph.cleanup(g);
      expect(g.successors("a")).toEqual(["b"]);
    });

    it("removes the root node", function() {
      g.setParent("a", "sg1");
      nestingGraph.run(g);
      nestingGraph.cleanup(g);
      expect(g.nodeCount()).toEqual(4); // sg1 + sg1Top + sg1Bottom + "a"
    });
  });
});

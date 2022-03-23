import { Graph } from '@antv/graphlib';
import parentDummyChains  from "../../src/layout/dagre/src/parent-dummy-chains";

describe("parentDummyChains", function() {
  let g;

  beforeEach(function() {
    g = new Graph<string ,any, any, any>({ compound: true }).setGraph({});
  });

  it("does not set a parent if both the tail and head have no parent", function() {
    g.setNode("a");
    g.setNode("b");
    g.setNode("d1", { edgeObj: { v: "a", w: "b" } });
    g.graph().dummyChains = ["d1"];
    g.setPath(["a", "d1", "b"]);

    parentDummyChains(g);
    expect(g.parent("d1")).toBe(undefined);
  });

  it("uses the tail's parent for the first node if it is not the root", function() {
    g.setParent("a", "sg1");
    g.setNode("sg1", { minRank: 0, maxRank: 2 });
    g.setNode("d1", { edgeObj: { v: "a", w: "b" }, rank: 2 });
    g.graph().dummyChains = ["d1"];
    g.setPath(["a", "d1", "b"]);

    parentDummyChains(g);
    expect(g.parent("d1")).toEqual("sg1");
  });

  it("uses the heads's parent for the first node if tail's is root", function() {
    g.setParent("b", "sg1");
    g.setNode("sg1", { minRank: 1, maxRank: 3 });
    g.setNode("d1", { edgeObj: { v: "a", w: "b" }, rank: 1 });
    g.graph().dummyChains = ["d1"];
    g.setPath(["a", "d1", "b"]);

    parentDummyChains(g);
    expect(g.parent("d1")).toEqual("sg1");
  });

  it("handles a long chain starting in a subgraph", function() {
    g.setParent("a", "sg1");
    g.setNode("sg1", { minRank: 0, maxRank: 2 });
    g.setNode("d1", { edgeObj: { v: "a", w: "b" }, rank: 2 });
    g.setNode("d2", { rank: 3 });
    g.setNode("d3", { rank: 4 });
    g.graph().dummyChains = ["d1"];
    g.setPath(["a", "d1", "d2", "d3", "b"]);

    parentDummyChains(g);
    expect(g.parent("d1")).toEqual("sg1");
    expect(g.parent("d2")).toBe(undefined);
    expect(g.parent("d3")).toBe(undefined);
  });

  it("handles a long chain ending in a subgraph", function() {
    g.setParent("b", "sg1");
    g.setNode("sg1", { minRank: 3, maxRank: 5 });
    g.setNode("d1", { edgeObj: { v: "a", w: "b" }, rank: 1 });
    g.setNode("d2", { rank: 2 });
    g.setNode("d3", { rank: 3 });
    g.graph().dummyChains = ["d1"];
    g.setPath(["a", "d1", "d2", "d3", "b"]);

    parentDummyChains(g);
    expect(g.parent("d1")).toBe(undefined);
    expect(g.parent("d2")).toBe(undefined);
    expect(g.parent("d3")).toEqual("sg1");
  });

  it("handles nested subgraphs", function() {
    g.setParent("a", "sg2");
    g.setParent("sg2", "sg1");
    g.setNode("sg1", { minRank: 0, maxRank: 4 });
    g.setNode("sg2", { minRank: 1, maxRank: 3 });
    g.setParent("b", "sg4");
    g.setParent("sg4", "sg3");
    g.setNode("sg3", { minRank: 6, maxRank: 10 });
    g.setNode("sg4", { minRank: 7, maxRank:  9 });
    for (let i = 0; i < 5; ++i) {
      g.setNode("d" + (i + 1), { rank: i + 3  });
    }
    g.node("d1").edgeObj = { v: "a", w: "b" };
    g.graph().dummyChains = ["d1"];
    g.setPath(["a", "d1", "d2", "d3", "d4", "d5", "b"]);

    parentDummyChains(g);
    expect(g.parent("d1")).toEqual("sg2");
    expect(g.parent("d2")).toEqual("sg1");
    expect(g.parent("d3")).toBe(undefined);
    expect(g.parent("d4")).toEqual("sg3");
    expect(g.parent("d5")).toEqual("sg4");
  });

  it("handles overlapping rank ranges", function() {
    g.setParent("a", "sg1");
    g.setNode("sg1", { minRank: 0, maxRank: 3 });
    g.setParent("b", "sg2");
    g.setNode("sg2", { minRank: 2, maxRank: 6 });
    g.setNode("d1", { edgeObj: { v: "a", w: "b" }, rank: 2 });
    g.setNode("d2", { rank: 3 });
    g.setNode("d3", { rank: 4 });
    g.graph().dummyChains = ["d1"];
    g.setPath(["a", "d1", "d2", "d3", "b"]);

    parentDummyChains(g);
    expect(g.parent("d1")).toEqual("sg1");
    expect(g.parent("d2")).toEqual("sg1");
    expect(g.parent("d3")).toEqual("sg2");
  });

  it("handles an LCA that is not the root of the graph #1", function() {
    g.setParent("a", "sg1");
    g.setParent("sg2", "sg1");
    g.setNode("sg1", { minRank: 0, maxRank: 6 });
    g.setParent("b", "sg2");
    g.setNode("sg2", { minRank: 3, maxRank: 5 });
    g.setNode("d1", { edgeObj: { v: "a", w: "b" }, rank: 2 });
    g.setNode("d2", { rank: 3 });
    g.graph().dummyChains = ["d1"];
    g.setPath(["a", "d1", "d2", "b"]);

    parentDummyChains(g);
    expect(g.parent("d1")).toEqual("sg1");
    expect(g.parent("d2")).toEqual("sg2");
  });

  it("handles an LCA that is not the root of the graph #2", function() {
    g.setParent("a", "sg2");
    g.setParent("sg2", "sg1");
    g.setNode("sg1", { minRank: 0, maxRank: 6 });
    g.setParent("b", "sg1");
    g.setNode("sg2", { minRank: 1, maxRank: 3 });
    g.setNode("d1", { edgeObj: { v: "a", w: "b" }, rank: 3 });
    g.setNode("d2", { rank: 4 });
    g.graph().dummyChains = ["d1"];
    g.setPath(["a", "d1", "d2", "b"]);

    parentDummyChains(g);
    expect(g.parent("d1")).toEqual("sg2");
    expect(g.parent("d2")).toEqual("sg1");
  });
});

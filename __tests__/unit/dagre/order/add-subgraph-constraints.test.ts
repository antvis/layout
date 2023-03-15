import { Graph } from "@antv/graphlib";
import { NodeData, EdgeData } from "@antv/layout";
import addSubgraphConstraints from "../../../../packages/layout/src/dagre/order/add-subgraph-constraints";

describe("order/addSubgraphConstraints", function () {
  let g: Graph<NodeData, EdgeData>;
  let cg: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
    cg = new Graph<NodeData, EdgeData>({
      nodes: [],
      edges: [],
    });
  });

  it("does not change CG for a flat set of nodes", function () {
    let vs = ["a", "b", "c", "d"];
    const children = vs.map((v) => ({ id: v, data: {} }));
    g.addTree({
      id: "1",
      data: {},
      children,
    });
    addSubgraphConstraints(g, cg, vs);
    expect(cg.getAllNodes().length).toEqual(0);
    expect(cg.getAllEdges().length).toEqual(0);
  });

  it("doesn't create a constraint for contiguous subgraph nodes", function () {
    let vs = ["a", "b", "c"];
    g.addTree({
      id: "sg",
      data: {},
      children: [],
    });
    vs.forEach((v) => {
      g.addNode({ id: v, data: {} });
      g.setParent(v, "sg");
    });
    addSubgraphConstraints(g, cg, vs);
    expect(cg.getAllNodes().length).toEqual(0);
    expect(cg.getAllEdges().length).toEqual(0);
  });

  it("adds a constraint when the parents for adjacent nodes are different", function () {
    g.addTree([
      {
        id: "sg1",
        data: {},
        children: [],
      },
      {
        id: "sg2",
        data: {},
        children: [],
      },
    ]);

    let vs = ["a", "b"];
    vs.forEach((v) => {
      g.addNode({ id: v, data: {} });
    });
    g.setParent("a", "sg1");
    g.setParent("b", "sg2");
    addSubgraphConstraints(g, cg, vs);

    expect(cg.getAllEdges().length).toEqual(1);
    expect(cg.getAllEdges()[0].source).toEqual("sg1");
    expect(cg.getAllEdges()[0].target).toEqual("sg2");
  });

  it("works for multiple levels", function () {
    let vs = ["a", "b", "c", "d", "e", "f", "g", "h"];
    vs.forEach((v) => {
      g.addNode({ id: v, data: {} });
    });
    g.addNode({ id: "sg1", data: {} });
    g.addNode({ id: "sg2", data: {} });
    g.addNode({ id: "sg3", data: {} });
    g.addNode({ id: "sg4", data: {} });
    g.addNode({ id: "sg5", data: {} });
    g.setParent("b", "sg2");
    g.setParent("sg2", "sg1");
    g.setParent("c", "sg1");
    g.setParent("d", "sg3");
    g.setParent("sg3", "sg1");
    g.setParent("f", "sg4");
    g.setParent("g", "sg5");
    g.setParent("sg5", "sg4");

    addSubgraphConstraints(g, cg, vs);

    expect(cg.getAllEdges().length).toEqual(2);
    expect(cg.getAllEdges()[0].source).toEqual("sg2");
    expect(cg.getAllEdges()[0].target).toEqual("sg3");
    expect(cg.getAllEdges()[1].source).toEqual("sg1");
    expect(cg.getAllEdges()[1].target).toEqual("sg4");
  });
});

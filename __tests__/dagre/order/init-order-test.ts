import { Graph } from "@antv/graphlib";
import initOrder from "../../../src/layout/dagre/src/order/init-order";

let _ = require("lodash");

describe("order/initOrder", function() {
  let g;

  beforeEach(function() {
    g = new Graph({ compound: true })
      .setDefaultEdgeLabel(function() { return { weight: 1 }; });
  });

  it("assigns non-overlapping orders for each rank in a tree", function() {
    _.forEach({ a: 0, b: 1, c: 2, d: 2, e: 1 }, function(rank, v) {
      g.setNode(v, { rank: rank });
    });
    g.setPath(["a", "b", "c"]);
    g.setEdge("b", "d");
    g.setEdge("a", "e");

    let layering = initOrder(g);
    expect(layering[0]).toEqual(["a"]);
    expect(_.sortBy(layering[1])).toEqual(["b", "e"]);
    expect(_.sortBy(layering[2])).toEqual(["c", "d"]);
  });

  it("assigns non-overlapping orders for each rank in a DAG", function() {
    _.forEach({ a: 0, b: 1, c: 1, d: 2 }, function(rank, v) {
      g.setNode(v, { rank: rank });
    });
    g.setPath(["a", "b", "d"]);
    g.setPath(["a", "c", "d"]);

    let layering = initOrder(g);
    expect(layering[0]).toEqual(["a"]);
    expect(_.sortBy(layering[1])).toEqual(["b", "c"]);
    expect(_.sortBy(layering[2])).toEqual(["d"]);
  });

  it("does not assign an order to subgraph nodes", function() {
    g.setNode("a", { rank: 0 });
    g.setNode("sg1", {});
    g.setParent("a", "sg1");

    let layering = initOrder(g);
    expect(layering).toEqual([["a"]]);
  });
});

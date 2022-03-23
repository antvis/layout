import {Graph} from '@antv/graphlib';
import {feasibleTree} from '../../../src/layout/dagre/src/rank/feasible-tree';

describe("feasibleTree", function() {
  it("creates a tree for a trivial input graph", function() {
    let g = new Graph<string ,any, any, any>()
      .setNode("a", { rank: 0 })
      .setNode("b", { rank: 1 })
      .setEdge("a", "b", { minlen: 1 });

    let tree = feasibleTree(g);
    expect(g.node("b").rank).toEqual(g.node("a").rank + 1);
    expect(tree.neighbors("a")).toEqual(["b"]);
  });

  it("correctly shortens slack by pulling a node up", function() {
    let g = new Graph<string ,any, any, any>()
      .setNode("a", { rank: 0 })
      .setNode("b", { rank: 1 })
      .setNode("c", { rank: 2 })
      .setNode("d", { rank: 2 })
      .setPath(["a", "b", "c"], { minlen: 1 })
      .setEdge("a", "d", { minlen: 1 });

    let tree = feasibleTree(g);
    expect(g.node("b").rank).toEqual(g.node("a").rank + 1);
    expect(g.node("c").rank).toEqual(g.node("b").rank + 1);
    expect(g.node("d").rank).toEqual(g.node("a").rank + 1);
    expect(tree.neighbors("a").sort()).toEqual(["b", "d"]);
    expect(tree.neighbors("b").sort()).toEqual(["a", "c"]);
    expect(tree.neighbors("c")).toEqual(["b"]);
    expect(tree.neighbors("d")).toEqual(["a"]);
  });

  it("correctly shortens slack by pulling a node down", function() {
    let g = new Graph<string ,any, any, any>()
      .setNode("a", { rank: 2 })
      .setNode("b", { rank: 0 })
      .setNode("c", { rank: 2 })
      .setEdge("b", "a", { minlen: 1 })
      .setEdge("b", "c", { minlen: 1 });

    let tree = feasibleTree(g);
    expect(g.node("a").rank).toEqual(g.node("b").rank + 1);
    expect(g.node("c").rank).toEqual(g.node("b").rank + 1);
    expect(tree.neighbors("a").sort()).toEqual(["b"]);
    expect(tree.neighbors("b").sort()).toEqual(["a", "c"]);
    expect(tree.neighbors("c").sort()).toEqual(["b"]);
  });
});

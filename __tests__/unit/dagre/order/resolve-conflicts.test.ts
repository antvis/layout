import { Graph } from "@antv/graphlib";
import { Graph as IGraph } from "@antv/layout";
import resolveConflicts from "../../../../packages/layout/src/dagre/order/resolve-conflicts";

describe("order/resolveConflicts", function () {
  let cg: IGraph;

  beforeEach(function () {
    cg = new Graph();
  });

  it("returns back nodes unchanged when no constraints exist", function () {
    let input = [
      { v: "a", barycenter: 2, weight: 3 },
      { v: "b", barycenter: 1, weight: 2 },
    ];
    expect(resolveConflicts(input, cg)).toEqual([
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 },
      { vs: ["a"], i: 0, barycenter: 2, weight: 3 },
    ]);
  });

  it("returns back nodes unchanged when no conflicts exist", function () {
    let input = [
      { v: "a", barycenter: 2, weight: 3 },
      { v: "b", barycenter: 1, weight: 2 },
    ];
    cg.addNode({
      id: "a",
      data: {},
    });
    cg.addNode({
      id: "b",
      data: {},
    });
    cg.addEdge({
      id: "e1",
      source: "b",
      target: "a",
      data: {},
    });
    expect(resolveConflicts(input, cg)).toEqual([
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 },
      { vs: ["a"], i: 0, barycenter: 2, weight: 3 },
    ]);
  });

  it("coalesces nodes when there is a conflict", function () {
    let input = [
      { v: "a", barycenter: 2, weight: 3 },
      { v: "b", barycenter: 1, weight: 2 },
    ];
    cg.addNode({
      id: "a",
      data: {},
    });
    cg.addNode({
      id: "b",
      data: {},
    });
    cg.addEdge({
      id: "e1",
      source: "a",
      target: "b",
      data: {},
    });
    expect(resolveConflicts(input, cg)).toEqual([
      {
        vs: ["a", "b"],
        i: 0,
        barycenter: (3 * 2 + 2 * 1) / (3 + 2),
        weight: 3 + 2,
      },
    ]);
  });

  it("coalesces nodes when there is a conflict #2", function () {
    let input = [
      { v: "a", barycenter: 4, weight: 1 },
      { v: "b", barycenter: 3, weight: 1 },
      { v: "c", barycenter: 2, weight: 1 },
      { v: "d", barycenter: 1, weight: 1 },
    ];
    cg.addNode({
      id: "a",
      data: {},
    });
    cg.addNode({
      id: "b",
      data: {},
    });
    cg.addNode({
      id: "c",
      data: {},
    });
    cg.addNode({
      id: "d",
      data: {},
    });
    cg.addEdge({
      id: "e1",
      source: "a",
      target: "b",
      data: {},
    });
    cg.addEdge({
      id: "e2",
      source: "b",
      target: "c",
      data: {},
    });
    cg.addEdge({
      id: "e3",
      source: "c",
      target: "d",
      data: {},
    });
    expect(resolveConflicts(input, cg)).toEqual([
      {
        vs: ["a", "b", "c", "d"],
        i: 0,
        barycenter: (4 + 3 + 2 + 1) / 4,
        weight: 4,
      },
    ]);
  });

  it("works with multiple constraints for the same target #1", function () {
    let input = [
      { v: "a", barycenter: 4, weight: 1 },
      { v: "b", barycenter: 3, weight: 1 },
      { v: "c", barycenter: 2, weight: 1 },
    ];
    cg.addNode({
      id: "a",
      data: {},
    });
    cg.addNode({
      id: "b",
      data: {},
    });
    cg.addNode({
      id: "c",
      data: {},
    });
    cg.addEdge({
      id: "e1",
      source: "a",
      target: "c",
      data: {},
    });
    cg.addEdge({
      id: "e2",
      source: "b",
      target: "c",
      data: {},
    });

    let results = resolveConflicts(input, cg);
    expect(results).toHaveLength(1);
    expect(results[0].vs.indexOf("c")).toBeGreaterThan(
      results[0].vs.indexOf("a")
    );
    expect(results[0].vs.indexOf("c")).toBeGreaterThan(
      results[0].vs.indexOf("b")
    );
    expect(results[0].i).toEqual(0);
    expect(results[0].barycenter).toEqual((4 + 3 + 2) / 3);
    expect(results[0].weight).toEqual(3);
  });

  it("works with multiple constraints for the same target #2", function () {
    let input = [
      { v: "a", barycenter: 4, weight: 1 },
      { v: "b", barycenter: 3, weight: 1 },
      { v: "c", barycenter: 2, weight: 1 },
      { v: "d", barycenter: 1, weight: 1 },
    ];
    cg.addNode({
      id: "a",
      data: {},
    });
    cg.addNode({
      id: "b",
      data: {},
    });
    cg.addNode({
      id: "c",
      data: {},
    });
    cg.addNode({
      id: "d",
      data: {},
    });

    cg.addEdge({
      id: "e1",
      source: "a",
      target: "c",
      data: {},
    });
    cg.addEdge({
      id: "e2",
      source: "a",
      target: "d",
      data: {},
    });
    cg.addEdge({
      id: "e3",
      source: "b",
      target: "c",
      data: {},
    });
    cg.addEdge({
      id: "e4",
      source: "c",
      target: "d",
      data: {},
    });
    let results = resolveConflicts(input, cg);
    expect(results).toHaveLength(1);
    expect(results[0].vs.indexOf("c")).toBeGreaterThan(
      results[0].vs.indexOf("a")
    );
    expect(results[0].vs.indexOf("c")).toBeGreaterThan(
      results[0].vs.indexOf("b")
    );
    expect(results[0].vs.indexOf("d")).toBeGreaterThan(
      results[0].vs.indexOf("c")
    );
    expect(results[0].i).toEqual(0);
    expect(results[0].barycenter).toEqual((4 + 3 + 2 + 1) / 4);
    expect(results[0].weight).toEqual(4);
  });

  it("does nothing to a node lacking both a barycenter and a constraint", function () {
    let input = [{ v: "a" }, { v: "b", barycenter: 1, weight: 2 }];
    expect(resolveConflicts(input, cg)).toEqual([
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 },
      { vs: ["a"], i: 0 },
    ]);
  });

  it("treats a node w/o a barycenter as always violating constraints #1", function () {
    let input = [{ v: "a" }, { v: "b", barycenter: 1, weight: 2 }];
    cg.addNode({
      id: "a",
      data: {},
    });
    cg.addNode({
      id: "b",
      data: {},
    });
    cg.addEdge({
      id: "e4",
      source: "a",
      target: "b",
      data: {},
    });
    expect(resolveConflicts(input, cg)).toEqual([
      { vs: ["a", "b"], i: 0, barycenter: 1, weight: 2 },
    ]);
  });

  it("treats a node w/o a barycenter as always violating constraints #2", function () {
    let input = [{ v: "a" }, { v: "b", barycenter: 1, weight: 2 }];
    cg.addNode({
      id: "a",
      data: {},
    });
    cg.addNode({
      id: "b",
      data: {},
    });
    cg.addEdge({
      id: "e4",
      source: "b",
      target: "a",
      data: {},
    });
    expect(resolveConflicts(input, cg)).toEqual([
      { vs: ["b", "a"], i: 0, barycenter: 1, weight: 2 },
    ]);
  });

  it("ignores edges not related to entries", function () {
    let input = [
      { v: "a", barycenter: 2, weight: 3 },
      { v: "b", barycenter: 1, weight: 2 },
    ];
    cg.addNode({
      id: "c",
      data: {},
    });
    cg.addNode({
      id: "d",
      data: {},
    });
    cg.addEdge({
      id: "e4",
      source: "c",
      target: "d",
      data: {},
    });
    expect(resolveConflicts(input, cg)).toEqual([
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 },
      { vs: ["a"], i: 0, barycenter: 2, weight: 3 },
    ]);
  });
});

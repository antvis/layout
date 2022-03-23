import { Graph } from "@antv/graphlib";
import resolveConflicts from "../../../src/layout/dagre/src/order/resolve-conflicts";

let _ = require("lodash");

describe("order/resolveConflicts", function() {
  let cg;

  beforeEach(function() {
    cg = new Graph();
  });

  it("returns back nodes unchanged when no constraints exist", function() {
    let input = [
      { v: "a", barycenter: 2, weight: 3 },
      { v: "b", barycenter: 1, weight: 2 }
    ];
    expect(_.sortBy(resolveConflicts(input, cg), "vs")).toEqual([
      { vs: ["a"], i: 0, barycenter: 2, weight: 3 },
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 }
    ]);
  });

  it("returns back nodes unchanged when no conflicts exist", function() {
    let input = [
      { v: "a", barycenter: 2, weight: 3 },
      { v: "b", barycenter: 1, weight: 2 }
    ];
    cg.setEdge("b", "a");
    expect(_.sortBy(resolveConflicts(input, cg), "vs")).toEqual([
      { vs: ["a"], i: 0, barycenter: 2, weight: 3 },
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 }
    ]);
  });

  it("coalesces nodes when there is a conflict", function() {
    let input = [
      { v: "a", barycenter: 2, weight: 3 },
      { v: "b", barycenter: 1, weight: 2 }
    ];
    cg.setEdge("a", "b");
    expect(_.sortBy(resolveConflicts(input, cg), "vs")).toEqual([
      { vs: ["a", "b"],
        i: 0,
        barycenter: (3 * 2 + 2 * 1) / (3 + 2),
        weight: 3 + 2
      }
    ]);
  });

  it("coalesces nodes when there is a conflict #2", function() {
    let input = [
      { v: "a", barycenter: 4, weight: 1 },
      { v: "b", barycenter: 3, weight: 1 },
      { v: "c", barycenter: 2, weight: 1 },
      { v: "d", barycenter: 1, weight: 1 }
    ];
    cg.setPath(["a", "b", "c", "d"]);
    expect(_.sortBy(resolveConflicts(input, cg), "vs")).toEqual([
      { vs: ["a", "b", "c", "d"],
        i: 0,
        barycenter: (4 + 3 + 2 + 1) / 4,
        weight: 4
      }
    ]);
  });

  it("works with multiple constraints for the same target #1", function() {
    let input = [
      { v: "a", barycenter: 4, weight: 1 },
      { v: "b", barycenter: 3, weight: 1 },
      { v: "c", barycenter: 2, weight: 1 },
    ];
    cg.setEdge("a", "c");
    cg.setEdge("b", "c");
    let results = resolveConflicts(input, cg);
    expect(results).toHaveLength(1);
    expect(_.indexOf(results[0].vs, "c")).toBeGreaterThan(_.indexOf(results[0].vs, "a"));
    expect(_.indexOf(results[0].vs, "c")).toBeGreaterThan(_.indexOf(results[0].vs, "b"));
    expect(results[0].i).toEqual(0);
    expect(results[0].barycenter).toEqual((4 + 3 + 2) / 3);
    expect(results[0].weight).toEqual(3);
  });

  it("works with multiple constraints for the same target #2", function() {
    let input = [
      { v: "a", barycenter: 4, weight: 1 },
      { v: "b", barycenter: 3, weight: 1 },
      { v: "c", barycenter: 2, weight: 1 },
      { v: "d", barycenter: 1, weight: 1 },
    ];
    cg.setEdge("a", "c");
    cg.setEdge("a", "d");
    cg.setEdge("b", "c");
    cg.setEdge("c", "d");
    let results = resolveConflicts(input, cg);
    expect(results).toHaveLength(1);
    expect(_.indexOf(results[0].vs, "c")).toBeGreaterThan(_.indexOf(results[0].vs, "a"));
    expect(_.indexOf(results[0].vs, "c")).toBeGreaterThan(_.indexOf(results[0].vs, "b"));
    expect(_.indexOf(results[0].vs, "d")).toBeGreaterThan(_.indexOf(results[0].vs, "c"));
    expect(results[0].i).toEqual(0);
    expect(results[0].barycenter).toEqual((4 + 3 + 2 + 1) / 4);
    expect(results[0].weight).toEqual(4);
  });

  it("does nothing to a node lacking both a barycenter and a constraint", function() {
    let input = [
      { v: "a" },
      { v: "b", barycenter: 1, weight: 2 }
    ];
    expect(_.sortBy(resolveConflicts(input, cg), "vs")).toEqual([
      { vs: ["a"], i: 0 },
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 }
    ]);
  });

  it("treats a node w/o a barycenter as always violating constraints #1", function() {
    let input = [
      { v: "a" },
      { v: "b", barycenter: 1, weight: 2 }
    ];
    cg.setEdge("a", "b");
    expect(_.sortBy(resolveConflicts(input, cg), "vs")).toEqual([
      { vs: ["a", "b"], i: 0, barycenter: 1, weight: 2 }
    ]);
  });

  it("treats a node w/o a barycenter as always violating constraints #2", function() {
    let input = [
      { v: "a" },
      { v: "b", barycenter: 1, weight: 2 }
    ];
    cg.setEdge("b", "a");
    expect(_.sortBy(resolveConflicts(input, cg), "vs")).toEqual([
      { vs: ["b", "a"], i: 0, barycenter: 1, weight: 2 }
    ]);
  });

  it("ignores edges not related to entries", function() {
    let input = [
      { v: "a", barycenter: 2, weight: 3 },
      { v: "b", barycenter: 1, weight: 2 }
    ];
    cg.setEdge("c", "d");
    expect(_.sortBy(resolveConflicts(input, cg), "vs")).toEqual([
      { vs: ["a"], i: 0, barycenter: 2, weight: 3 },
      { vs: ["b"], i: 1, barycenter: 1, weight: 2 }
    ]);
  });
});

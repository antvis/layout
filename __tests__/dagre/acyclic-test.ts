// @ts-ignore
import _ from 'lodash';
import { Graph } from '@antv/graphlib';
import acyclic from '../../src/layout/dagre/src/acyclic';
import { findCycles } from '@antv/graphlib/lib/algorithm';

describe("acyclic", function() {
  let ACYCLICERS = [
    "greedy",
    "dfs",
    "unknown-should-still-work"
  ];
  let g;

  beforeEach(function() {
    g = new Graph({ multigraph: true })
      .setDefaultEdgeLabel(function() { return { minlen: 1, weight: 1 }; });
  });

  _.forEach(ACYCLICERS, function(acyclicer) {
    describe(acyclicer, function() {
      beforeEach(function() {
        g.setGraph({ acyclicer: acyclicer });
      });

      describe("run", function() {
        it("does not change an already acyclic graph", function() {
          g.setPath(["a", "b", "d"]);
          g.setPath(["a", "c", "d"]);
          acyclic.run(g);
          let results = _.map(g.edges(), stripLabel);
          expect(_.sortBy(results, ["v", "w"])).toEqual([
            { v: "a", w: "b" },
            { v: "a", w: "c" },
            { v: "b", w: "d" },
            { v: "c", w: "d" }
          ]);
        });

        it("breaks cycles in the input graph", function() {
          g.setPath(["a", "b", "c", "d", "a"]);
          acyclic.run(g);
          expect(findCycles(g)).toEqual([]);
        });

        it("creates a multi-edge where necessary", function() {
          g.setPath(["a", "b", "a"]);
          acyclic.run(g);
          expect(findCycles(g)).toEqual([]);
          if (g.hasEdge("a", "b")) {
            expect(g.outEdges("a", "b")).toHaveLength(2);
          } else {
            expect(g.outEdges("b", "a")).toHaveLength(2);
          }
          expect(g.edgeCount()).toEqual(2);
        });
      });

      describe("undo", function() {
        it("does not change edges where the original graph was acyclic", function() {
          g.setEdge("a", "b", { minlen: 2, weight: 3 });
          acyclic.run(g);
          acyclic.undo(g);
          expect(g.edgeFromArgs("a", "b")).toEqual({ minlen: 2, weight: 3 });
          expect(g.edges()).toHaveLength(1);
        });

        it("can restore previosuly reversed edges", function() {
          g.setEdge("a", "b", { minlen: 2, weight: 3 });
          g.setEdge("b", "a", { minlen: 3, weight: 4 });
          acyclic.run(g);
          acyclic.undo(g);
          expect(g.edgeFromArgs("a", "b")).toEqual({ minlen: 2, weight: 3 });
          expect(g.edgeFromArgs("b", "a")).toEqual({ minlen: 3, weight: 4 });
          expect(g.edges()).toHaveLength(2);
        });
      });
    });
  });

  describe("greedy-specific functionality", function() {
    it("prefers to break cycles at low-weight edges", function() {
      g.setGraph({ acyclicer: "greedy" });
      g.setDefaultEdgeLabel(function() { return { minlen: 1, weight: 2 }; });
      g.setPath(["a", "b", "c", "d", "a"]);
      g.setEdge("c", "d", { weight: 1 });
      acyclic.run(g);
      expect(findCycles(g)).toEqual([]);
      expect(g.hasEdge("c", "d")).toBe(false);
    });
  });
});

function stripLabel(edge) {
  let c = _.clone(edge);
  delete c.label;
  return c;
}

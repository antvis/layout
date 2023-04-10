import { Edge, Graph } from "@antv/graphlib";
import { Graph as IGraph, NodeData, EdgeData } from "../../../packages/layout";
import { run, undo } from "../../../packages/layout/src/dagre/acyclic";
import { findCycles } from "../../util";

describe("acyclic", function () {
  let ACYCLICERS = ["greedy", "dfs", "unknown-should-still-work"];

  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>();
  });

  ACYCLICERS.forEach(function (acyclicer) {
    describe(acyclicer, function () {
      describe("run", function () {
        it(`${acyclicer} does not change an already acyclic graph`, function () {
          g.addNodes([
            {
              id: "a",
              data: {},
            },
            {
              id: "b",
              data: {},
            },
            {
              id: "c",
              data: {},
            },
            {
              id: "d",
              data: {},
            },
          ]);
          g.addEdges([
            {
              id: "e1",
              source: "a",
              target: "b",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e2",
              source: "b",
              target: "d",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e3",
              source: "a",
              target: "c",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e4",
              source: "c",
              target: "d",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
          ]);

          // @ts-ignore
          run(g, acyclicer);
          let results = g.getAllEdges().map((e) => stripLabel(e));

          expect(results).toEqual([
            {
              id: "e1",
              source: "a",
              target: "b",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e2",
              source: "b",
              target: "d",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e3",
              source: "a",
              target: "c",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e4",
              source: "c",
              target: "d",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
          ]);
        });

        it(`${acyclicer} breaks cycles in the input graph`, function () {
          g.addNodes([
            {
              id: "a",
              data: {},
            },
            {
              id: "b",
              data: {},
            },
            {
              id: "c",
              data: {},
            },
            {
              id: "d",
              data: {},
            },
          ]);
          g.addEdges([
            {
              id: "e1",
              source: "a",
              target: "b",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e2",
              source: "b",
              target: "c",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e3",
              source: "c",
              target: "d",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e4",
              source: "d",
              target: "a",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
          ]);

          // @ts-ignore
          run(g, acyclicer);
          expect(findCycles(g)).toEqual([]);
        });

        it(`${acyclicer} creates a multi-edge where necessary`, function () {
          g.addNodes([
            {
              id: "a",
              data: {},
            },
            {
              id: "b",
              data: {},
            },
          ]);
          g.addEdges([
            {
              id: "e1",
              source: "a",
              target: "b",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
            {
              id: "e2",
              source: "b",
              target: "a",
              data: {
                minlen: 1,
                weight: 1,
              },
            },
          ]);

          // @ts-ignore
          run(g, acyclicer);
          expect(findCycles(g)).toEqual([]);
          if (
            !!g.getRelatedEdges("a", "out").filter((e) => e.target === "b")
              .length
          ) {
            expect(
              g.getRelatedEdges("a", "out").filter((e) => e.target === "b")
            ).toHaveLength(2);
          } else {
            expect(
              g.getRelatedEdges("b", "out").filter((e) => e.target === "a")
            ).toHaveLength(2);
          }
          expect(g.getAllEdges().length).toEqual(2);
        });
      });

      describe("undo", function () {
        it("does not change edges where the original graph was acyclic", function () {
          g.addNodes([
            {
              id: "a",
              data: {},
            },
            {
              id: "b",
              data: {},
            },
          ]);
          g.addEdge({
            id: "e1",
            source: "a",
            target: "b",
            data: { minlen: 2, weight: 3 },
          });

          // @ts-ignore
          run(g, acyclicer);
          undo(g);
          expect(
            g.getRelatedEdges("a", "out").find((e) => e.target === "b")!.data
          ).toEqual({ minlen: 2, weight: 3 });
          expect(g.getAllEdges()).toHaveLength(1);
        });

        it("can restore previosuly reversed edges", function () {
          g.addNodes([
            {
              id: "a",
              data: {},
            },
            {
              id: "b",
              data: {},
            },
          ]);
          g.addEdges([
            {
              id: "e1",
              source: "a",
              target: "b",
              data: { minlen: 2, weight: 3 },
            },
            {
              id: "e2",
              source: "b",
              target: "a",
              data: { minlen: 3, weight: 4 },
            },
          ]);

          // @ts-ignore
          run(g, acyclicer);
          undo(g);

          expect(
            g.getRelatedEdges("a", "out").find((e) => e.target === "b")!.data
          ).toEqual({ minlen: 2, weight: 3 });
          expect(
            g.getRelatedEdges("b", "out").find((e) => e.target === "a")!.data
          ).toEqual({ minlen: 3, weight: 4 });
          expect(g.getAllEdges()).toHaveLength(2);
        });
      });
    });
  });

  describe("greedy-specific functionality", function () {
    it("prefers to break cycles at low-weight edges", function () {
      g.addNodes([
        {
          id: "a",
          data: {},
        },
        {
          id: "b",
          data: {},
        },
        {
          id: "c",
          data: {},
        },
        {
          id: "d",
          data: {},
        },
      ]);
      g.addEdges([
        {
          id: "e1",
          source: "a",
          target: "b",
          data: {
            minlen: 1,
            weight: 2,
          },
        },
        {
          id: "e2",
          source: "b",
          target: "c",
          data: {
            minlen: 1,
            weight: 2,
          },
        },
        {
          id: "e3",
          source: "c",
          target: "d",
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: "e4",
          source: "d",
          target: "a",
          data: {
            minlen: 1,
            weight: 2,
          },
        },
      ]);

      run(g, "greedy");
      expect(findCycles(g)).toEqual([]);

      expect(
        !!g.getRelatedEdges("c", "out").find((e) => e.target === "d")
      ).toBe(false);
    });
  });
});

function stripLabel(edge: Edge<EdgeData>) {
  let c = { ...edge };
  delete c.data.label;
  return c;
}

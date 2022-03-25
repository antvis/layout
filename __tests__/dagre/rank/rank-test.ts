import { Graph } from "@antv/graphlib";
import rank from "../../../src/layout/dagre/src/rank";

describe("rank", function () {
  let RANKERS = [
    "longest-path",
    "tight-tree",
    "network-simplex",
    "unknown-should-still-work",
  ];
  let g;

  beforeEach(function () {
    g = new Graph<string, any, any, any>()
      .setGraph({})
      .setDefaultNodeLabel(function () {
        return {};
      })
      .setDefaultEdgeLabel(function () {
        return { minlen: 1, weight: 1 };
      })
      .setPath(["a", "b", "c", "d", "h"])
      .setPath(["a", "e", "g", "h"])
      .setPath(["a", "f", "g"]);
  });

  RANKERS.forEach(function (ranker) {
    describe(ranker, function () {
      it("respects the minlen attribute", function () {
        g.graph().ranker = ranker;
        rank(g);
        g.edges().forEach(function (e) {
          let vRank = g.node(e.v).rank;
          let wRank = g.node(e.w).rank;
          expect(wRank - vRank).toBeGreaterThanOrEqual(g.edge(e).minlen);
        });
      });

      it("can rank a single node graph", function () {
        let g = new Graph<string, any, any, any>()
          .setGraph({ ranker })
          .setNode("a", {});

        rank(g);
        expect(g.node("a").rank).toEqual(0);
      });
    });
  });
});

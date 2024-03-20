import { Graph } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../../packages/layout';
import { rank } from '../../../../packages/layout/src/antv-dagre/rank';

describe('rank', function () {
  let RANKERS = [
    'longest-path',
    'tight-tree',
    'network-simplex',
    'unknown-should-still-work',
  ];

  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      nodes: [
        {
          id: 'a',
          data: {},
        },
        {
          id: 'b',
          data: {},
        },
        {
          id: 'c',
          data: {},
        },
        {
          id: 'd',
          data: {},
        },
        {
          id: 'e',
          data: {},
        },
        {
          id: 'f',
          data: {},
        },
        {
          id: 'g',
          data: {},
        },
        {
          id: 'h',
          data: {},
        },
      ],
      edges: [
        {
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: 'e2',
          source: 'b',
          target: 'c',
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: 'e3',
          source: 'c',
          target: 'd',
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: 'e4',
          source: 'd',
          target: 'h',
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: 'e5',
          source: 'a',
          target: 'e',
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: 'e6',
          source: 'e',
          target: 'g',
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: 'e7',
          source: 'g',
          target: 'h',
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: 'e8',
          source: 'a',
          target: 'f',
          data: {
            minlen: 1,
            weight: 1,
          },
        },
        {
          id: 'e9',
          source: 'f',
          target: 'g',
          data: {
            minlen: 1,
            weight: 1,
          },
        },
      ],
    });
  });

  RANKERS.forEach(function (ranker) {
    describe(ranker, function () {
      test(`${ranker} respects the minlen attribute`, function () {
        // @ts-ignore
        rank(g, ranker);
        g.getAllEdges().forEach(function (e) {
          let vRank = g.getNode(e.source).data.rank as number;
          let wRank = g.getNode(e.target).data.rank as number;
          expect(wRank - vRank).toBeGreaterThanOrEqual(e.data.minlen as number);
        });
      });

      test(`${ranker} can rank a single node graph`, function () {
        let g = new Graph({
          nodes: [
            {
              id: 'a',
              data: {},
            },
          ],
        });

        // @ts-ignore
        rank(g, ranker);
        // @ts-ignore
        expect(g.getNode('a').data.rank).toEqual(0);
      });
    });
  });
});

import { Graph } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../../packages/layout';
import { longestPath } from '../../../../packages/layout/src/antv-dagre/rank/util';
import { normalizeRanks } from '../../../../packages/layout/src/antv-dagre/util';

describe('rank/util', function () {
  describe('longestPath', function () {
    let g: Graph<NodeData, EdgeData>;

    beforeEach(function () {
      g = new Graph<NodeData, EdgeData>();
    });

    test('can assign a rank to a single node graph', function () {
      g.addNode({
        id: 'a',
        data: {},
      });
      longestPath(g);
      normalizeRanks(g);
      expect(g.getNode('a').data.rank).toEqual(0);
    });

    test('can assign ranks to unconnected nodes', function () {
      g.addNode({
        id: 'a',
        data: {},
      });
      g.addNode({
        id: 'b',
        data: {},
      });
      longestPath(g);
      normalizeRanks(g);
      expect(g.getNode('a').data.rank).toEqual(0);
      expect(g.getNode('b').data.rank).toEqual(0);
    });

    test('can assign ranks to connected nodes', function () {
      g.addNode({
        id: 'a',
        data: {},
      });
      g.addNode({
        id: 'b',
        data: {},
      });
      g.addEdge({
        id: 'e1',
        source: 'a',
        target: 'b',
        data: {
          minlen: 1,
        },
      });
      longestPath(g);
      normalizeRanks(g);
      expect(g.getNode('a').data.rank).toEqual(0);
      expect(g.getNode('b').data.rank).toEqual(1);
    });

    test('can assign ranks for a diamond', function () {
      g.addNodes([
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
      ]);
      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {
            minlen: 1,
          },
        },
        {
          id: 'e2',
          source: 'b',
          target: 'd',
          data: {
            minlen: 1,
          },
        },
        {
          id: 'e3',
          source: 'a',
          target: 'c',
          data: {
            minlen: 1,
          },
        },
        {
          id: 'e4',
          source: 'c',
          target: 'd',
          data: {
            minlen: 1,
          },
        },
      ]);
      longestPath(g);
      normalizeRanks(g);
      expect(g.getNode('a').data.rank).toEqual(0);
      expect(g.getNode('b').data.rank).toEqual(1);
      expect(g.getNode('c').data.rank).toEqual(1);
      expect(g.getNode('d').data.rank).toEqual(2);
    });

    test('uses the minlen attribute on the edge', function () {
      g.addNodes([
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
      ]);
      g.addEdges([
        {
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {
            minlen: 1,
          },
        },
        {
          id: 'e2',
          source: 'b',
          target: 'd',
          data: {
            minlen: 1,
          },
        },
        {
          id: 'e3',
          source: 'a',
          target: 'c',
          data: {
            minlen: 1,
          },
        },
        {
          id: 'e4',
          source: 'c',
          target: 'd',
          data: {
            minlen: 2,
          },
        },
      ]);

      longestPath(g);
      normalizeRanks(g);
      expect(g.getNode('a').data.rank).toEqual(0);
      // longest path biases towards the lowest rank it can assign
      expect(g.getNode('b').data.rank).toEqual(2);
      expect(g.getNode('c').data.rank).toEqual(1);
      expect(g.getNode('d').data.rank).toEqual(3);
    });
  });
});

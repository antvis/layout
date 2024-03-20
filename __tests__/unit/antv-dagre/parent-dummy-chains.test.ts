import { Graph } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../packages/layout/lib';
import { parentDummyChains } from '../../../packages/layout/src/dagre/parent-dummy-chains';

describe('parentDummyChains', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
  });

  test('does not set a parent if both the tail and head have no parent', function () {
    g.addNode({
      id: 'a',
      data: {},
    });
    g.addNode({
      id: 'b',
      data: {},
    });
    g.addNode({
      id: 'd1',
      data: {
        originalEdge: {
          id: 'e1',
          source: 'a',
          target: 'b',
          data: {},
        },
      },
    });
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'd1',
      data: {},
    });
    g.addEdge({
      id: 'e2',
      source: 'd1',
      target: 'b',
      data: {},
    });

    parentDummyChains(g, ['d1']);
    expect(g.getParent('d1')).toBe(null);
  });

  test("uses the tail's parent for the first node if it is not the root", function () {
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
        id: 'sg1',
        data: { minRank: 0, maxRank: 2 },
      },
      {
        id: 'd1',
        data: {
          originalEdge: {
            id: 'e1',
            source: 'a',
            target: 'b',
            data: {},
          },
          rank: 2,
        },
      },
    ]);

    g.setParent('a', 'sg1');
    g.addEdge({
      id: 'e2',
      source: 'a',
      target: 'd1',
      data: {},
    });
    g.addEdge({
      id: 'e3',
      source: 'd1',
      target: 'b',
      data: {},
    });

    parentDummyChains(g, ['d1']);
    expect(g.getParent('d1')?.id).toEqual('sg1');
  });

  test("uses the heads's parent for the first node if tail's is root", function () {
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
        id: 'sg1',
        data: { minRank: 1, maxRank: 3 },
      },
      {
        id: 'd1',
        data: {
          originalEdge: {
            id: 'e1',
            source: 'a',
            target: 'b',
            data: {},
          },
          rank: 1,
        },
      },
    ]);

    g.setParent('b', 'sg1');
    g.addEdge({
      id: 'e2',
      source: 'a',
      target: 'd1',
      data: {},
    });
    g.addEdge({
      id: 'e3',
      source: 'd1',
      target: 'b',
      data: {},
    });

    parentDummyChains(g, ['d1']);
    expect(g.getParent('d1')?.id).toEqual('sg1');
  });

  test('handles a long chain starting in a subgraph', function () {
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
        id: 'sg1',
        data: { minRank: 0, maxRank: 2 },
      },
      {
        id: 'd1',
        data: {
          originalEdge: {
            id: 'e1',
            source: 'a',
            target: 'b',
            data: {},
          },
          rank: 2,
        },
      },
      {
        id: 'd2',
        data: { rank: 3 },
      },
      {
        id: 'd3',
        data: { rank: 4 },
      },
    ]);

    g.setParent('a', 'sg1');

    g.addEdges([
      {
        id: 'e1',
        source: 'a',
        target: 'd1',
        data: {},
      },
      {
        id: 'e2',
        source: 'd1',
        target: 'd2',
        data: {},
      },
      {
        id: 'e3',
        source: 'd2',
        target: 'd3',
        data: {},
      },
      {
        id: 'e4',
        source: 'd3',
        target: 'b',
        data: {},
      },
    ]);

    parentDummyChains(g, ['d1']);
    expect(g.getParent('d1')?.id).toEqual('sg1');
    expect(g.getParent('d2')).toBe(null);
    expect(g.getParent('d3')).toBe(null);
  });

  test('handles a long chain ending in a subgraph', function () {
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
        id: 'sg1',
        data: { minRank: 3, maxRank: 5 },
      },
      {
        id: 'd1',
        data: {
          originalEdge: {
            id: 'e1',
            source: 'a',
            target: 'b',
            data: {},
          },
          rank: 1,
        },
      },
      {
        id: 'd2',
        data: { rank: 2 },
      },
      {
        id: 'd3',
        data: { rank: 3 },
      },
    ]);

    g.setParent('b', 'sg1');

    g.addEdges([
      {
        id: 'e1',
        source: 'a',
        target: 'd1',
        data: {},
      },
      {
        id: 'e2',
        source: 'd1',
        target: 'd2',
        data: {},
      },
      {
        id: 'e3',
        source: 'd2',
        target: 'd3',
        data: {},
      },
      {
        id: 'e4',
        source: 'd3',
        target: 'b',
        data: {},
      },
    ]);

    parentDummyChains(g, ['d1']);
    expect(g.getParent('d3')?.id).toEqual('sg1');
    expect(g.getParent('d2')).toBe(null);
    expect(g.getParent('d1')).toBe(null);
  });

  test('handles nested subgraphs', function () {
    for (let i = 0; i < 5; ++i) {
      g.addNode({
        id: 'd' + (i + 1),
        data: { rank: i + 3 },
      });
    }
    g.getNode('d1').data.originalEdge = {
      id: 'e1',
      source: 'a',
      target: 'b',
      data: {},
    };
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
        id: 'sg1',
        data: { minRank: 0, maxRank: 4 },
      },
      {
        id: 'sg2',
        data: { minRank: 1, maxRank: 3 },
      },
      {
        id: 'sg3',
        data: { minRank: 6, maxRank: 10 },
      },
      {
        id: 'sg4',
        data: { minRank: 7, maxRank: 9 },
      },
    ]);

    g.addEdges([
      {
        id: 'e1',
        source: 'a',
        target: 'd1',
        data: {},
      },
      {
        id: 'e2',
        source: 'd1',
        target: 'd2',
        data: {},
      },
      {
        id: 'e3',
        source: 'd2',
        target: 'd3',
        data: {},
      },
      {
        id: 'e4',
        source: 'd3',
        target: 'd4',
        data: {},
      },
      {
        id: 'e5',
        source: 'd4',
        target: 'd5',
        data: {},
      },
      {
        id: 'e6',
        source: 'd5',
        target: 'b',
        data: {},
      },
    ]);

    g.setParent('a', 'sg2');
    g.setParent('sg2', 'sg1');
    g.setParent('b', 'sg4');
    g.setParent('sg4', 'sg3');

    parentDummyChains(g, ['d1']);
    expect(g.getParent('d1')?.id).toEqual('sg2');
    expect(g.getParent('d2')?.id).toEqual('sg1');
    expect(g.getParent('d3')).toBe(null);
    expect(g.getParent('d4')?.id).toEqual('sg3');
    expect(g.getParent('d5')?.id).toEqual('sg4');
  });

  test('handles overlapping rank ranges', function () {
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
        id: 'sg1',
        data: { minRank: 0, maxRank: 3 },
      },
      {
        id: 'sg2',
        data: { minRank: 2, maxRank: 6 },
      },
      {
        id: 'd1',
        data: {
          originalEdge: {
            id: 'e1',
            source: 'a',
            target: 'b',
            data: {},
          },
          rank: 2,
        },
      },
      {
        id: 'd2',
        data: { rank: 3 },
      },
      {
        id: 'd3',
        data: { rank: 4 },
      },
    ]);

    g.addEdges([
      {
        id: 'e1',
        source: 'a',
        target: 'd1',
        data: {},
      },
      {
        id: 'e2',
        source: 'd1',
        target: 'd2',
        data: {},
      },
      {
        id: 'e3',
        source: 'd2',
        target: 'd3',
        data: {},
      },
      {
        id: 'e4',
        source: 'd3',
        target: 'b',
        data: {},
      },
    ]);

    g.setParent('a', 'sg1');
    g.setParent('b', 'sg2');

    parentDummyChains(g, ['d1']);
    expect(g.getParent('d1')?.id).toEqual('sg1');
    expect(g.getParent('d2')?.id).toEqual('sg1');
    expect(g.getParent('d3')?.id).toEqual('sg2');
  });

  test('handles an LCA that is not the root of the graph #1', function () {
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
        id: 'sg1',
        data: { minRank: 0, maxRank: 6 },
      },
      {
        id: 'sg2',
        data: { minRank: 3, maxRank: 5 },
      },
      {
        id: 'd1',
        data: {
          originalEdge: {
            id: 'e1',
            source: 'a',
            target: 'b',
            data: {},
          },
          rank: 2,
        },
      },
      {
        id: 'd2',
        data: { rank: 3 },
      },
    ]);

    g.addEdges([
      {
        id: 'e1',
        source: 'a',
        target: 'd1',
        data: {},
      },
      {
        id: 'e2',
        source: 'd1',
        target: 'd2',
        data: {},
      },
      {
        id: 'e3',
        source: 'd2',
        target: 'b',
        data: {},
      },
    ]);

    g.setParent('a', 'sg1');
    g.setParent('sg2', 'sg1');
    g.setParent('b', 'sg2');

    parentDummyChains(g, ['d1']);
    expect(g.getParent('d1')?.id).toEqual('sg1');
    expect(g.getParent('d2')?.id).toEqual('sg2');
  });

  test('handles an LCA that is not the root of the graph #2', function () {
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
        id: 'sg1',
        data: { minRank: 0, maxRank: 6 },
      },
      {
        id: 'sg2',
        data: { minRank: 1, maxRank: 3 },
      },
      {
        id: 'd1',
        data: {
          originalEdge: {
            id: 'e1',
            source: 'a',
            target: 'b',
            data: {},
          },
          rank: 3,
        },
      },
      {
        id: 'd2',
        data: { rank: 4 },
      },
    ]);

    g.addEdges([
      {
        id: 'e1',
        source: 'a',
        target: 'd1',
        data: {},
      },
      {
        id: 'e2',
        source: 'd1',
        target: 'd2',
        data: {},
      },
      {
        id: 'e3',
        source: 'd2',
        target: 'b',
        data: {},
      },
    ]);

    g.setParent('a', 'sg2');
    g.setParent('sg2', 'sg1');
    g.setParent('b', 'sg1');

    parentDummyChains(g, ['d1']);
    expect(g.getParent('d1')?.id).toEqual('sg2');
    expect(g.getParent('d2')?.id).toEqual('sg1');
  });
});

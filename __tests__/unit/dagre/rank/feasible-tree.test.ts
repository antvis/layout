import { Graph } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../../packages/layout';
import { feasibleTree } from '../../../../packages/layout/src/dagre/rank/feasible-tree';

describe('feasibleTree', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>();
  });

  test('creates a tree for a trivial input graph', function () {
    g.addNodes([
      {
        id: 'a',
        data: { rank: 0 },
      },
      {
        id: 'b',
        data: { rank: 1 },
      },
    ]);

    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: { minlen: 1 },
    });

    let tree = feasibleTree(g);
    expect(g.getNode('b').data.rank).toEqual(
      (g.getNode('a').data.rank as number) + 1,
    );

    expect(tree.getNeighbors('a').map((n) => n.id)).toEqual(['b']);
  });

  test('correctly shortens slack by pulling a node up', function () {
    g.addNodes([
      {
        id: 'a',
        data: { rank: 0 },
      },
      {
        id: 'b',
        data: { rank: 1 },
      },
      {
        id: 'c',
        data: { rank: 2 },
      },
      {
        id: 'd',
        data: { rank: 2 },
      },
    ]);
    g.addEdges([
      {
        id: 'e1',
        source: 'a',
        target: 'b',
        data: { minlen: 1 },
      },
      {
        id: 'e2',
        source: 'b',
        target: 'c',
        data: { minlen: 1 },
      },
      {
        id: 'e3',
        source: 'a',
        target: 'd',
        data: { minlen: 1 },
      },
    ]);

    let tree = feasibleTree(g);
    expect(g.getNode('b').data.rank).toEqual(
      (g.getNode('a').data.rank as number) + 1,
    );
    expect(g.getNode('c').data.rank).toEqual(
      (g.getNode('b').data.rank as number) + 1,
    );
    expect(g.getNode('d').data.rank).toEqual(
      (g.getNode('a').data.rank as number) + 1,
    );
    expect(
      tree
        .getNeighbors('a')
        .map((n) => n.id)
        .sort(),
    ).toEqual(['b', 'd']);
    expect(
      tree
        .getNeighbors('b')
        .map((n) => n.id)
        .sort(),
    ).toEqual(['a', 'c']);
    expect(tree.getNeighbors('c').map((n) => n.id)).toEqual(['b']);
    expect(tree.getNeighbors('d').map((n) => n.id)).toEqual(['a']);
  });

  test('correctly shortens slack by pulling a node down', function () {
    g.addNodes([
      {
        id: 'a',
        data: { rank: 2 },
      },
      {
        id: 'b',
        data: { rank: 0 },
      },
      {
        id: 'c',
        data: { rank: 2 },
      },
    ]);
    g.addEdges([
      {
        id: 'e1',
        source: 'b',
        target: 'a',
        data: { minlen: 1 },
      },
      {
        id: 'e2',
        source: 'b',
        target: 'c',
        data: { minlen: 1 },
      },
    ]);

    let tree = feasibleTree(g);
    expect(g.getNode('a').data.rank).toEqual(
      (g.getNode('b').data.rank as number) + 1,
    );
    expect(g.getNode('c').data.rank).toEqual(
      (g.getNode('b').data.rank as number) + 1,
    );
    expect(
      tree
        .getNeighbors('a')
        .map((n) => n.id)
        .sort(),
    ).toEqual(['b']);
    expect(
      tree
        .getNeighbors('b')
        .map((n) => n.id)
        .sort(),
    ).toEqual(['a', 'c']);
    expect(
      tree
        .getNeighbors('c')
        .map((n) => n.id)
        .sort(),
    ).toEqual(['b']);
  });
});

import { Graph } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../packages/layout';
import { position } from '../../../packages/layout/src/dagre/position';

describe('position', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph({ tree: [] });
    // .setGraph({
    //   ranksep: 50,
    //   nodesep: 50,
    //   edgesep: 10
    // });
  });

  test('respects ranksep', function () {
    g.addNodes([
      {
        id: 'a',
        data: { width: 50, height: 100, rank: 0, order: 0 },
      },
      {
        id: 'b',
        data: { width: 50, height: 80, rank: 1, order: 0 },
      },
    ]);
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'b',
      data: {},
    });
    position(g, { nodesep: 50, edgesep: 10, ranksep: 1000 });
    expect(g.getNode('b').data.y).toEqual(100 + 1000 + 80 / 2);
  });

  test('use the largest height in each rank with ranksep', function () {
    g.addNodes([
      {
        id: 'a',
        data: { width: 50, height: 100, rank: 0, order: 0 },
      },
      {
        id: 'b',
        data: { width: 50, height: 80, rank: 0, order: 1 },
      },
      {
        id: 'c',
        data: { width: 50, height: 90, rank: 1, order: 0 },
      },
    ]);
    g.addEdge({
      id: 'e1',
      source: 'a',
      target: 'c',
      data: {},
    });

    position(g, { nodesep: 50, edgesep: 10, ranksep: 1000 });
    expect(g.getNode('a').data.y).toEqual(100 / 2);
    expect(g.getNode('b').data.y).toEqual(100 / 2); // Note we used 100 and not 80 here
    expect(g.getNode('c').data.y).toEqual(100 + 1000 + 90 / 2);
  });

  test('respects nodesep', function () {
    g.addNodes([
      {
        id: 'a',
        data: { width: 50, height: 100, rank: 0, order: 0 },
      },
      {
        id: 'b',
        data: { width: 70, height: 80, rank: 0, order: 1 },
      },
    ]);

    position(g, {
      ranksep: 50,
      nodesep: 1000,
      edgesep: 10,
    });
    expect(g.getNode('b').data.x).toEqual(
      (g.getNode('a').data.x as number) + 50 / 2 + 1000 + 70 / 2,
    );
  });

  test('should not try to position the subgraph node itself', function () {
    g.addNodes([
      {
        id: 'a',
        data: { width: 50, height: 50, rank: 0, order: 0 },
      },
      {
        id: 'sg1',
        data: {},
      },
    ]);

    g.setParent('a', 'sg1');
    position(g, {
      ranksep: 50,
      nodesep: 50,
      edgesep: 10,
    });
    expect(g.getNode('sg1').data.hasOwnProperty('x')).toBe(false);
    expect(g.getNode('sg1').data.hasOwnProperty('y')).toBe(false);
  });
});

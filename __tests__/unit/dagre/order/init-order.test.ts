import { Graph } from '@antv/graphlib';
import { EdgeData, NodeData } from '../../../../packages/layout';
import { initOrder } from '../../../../packages/layout/src/dagre/order/init-order';

describe('order/initOrder', function () {
  let g: Graph<NodeData, EdgeData>;

  beforeEach(function () {
    g = new Graph<NodeData, EdgeData>({
      tree: [],
    });
  });

  test('assigns non-overlapping orders for each rank in a tree', function () {
    const c = {
      id: 'c',
      data: {
        rank: 2,
      },
      children: [] as any[],
    };
    const d = {
      id: 'd',
      data: {
        rank: 2,
      },
      children: [] as any[],
    };
    const b = {
      id: 'b',
      data: {
        rank: 1,
      },
      children: [c, d],
    };
    const e = {
      id: 'e',
      data: {
        rank: 1,
      },
      children: [] as any[],
    };
    g.addTree({
      id: 'a',
      data: {
        rank: 0,
      },
      children: [b, e],
    });

    let layering = initOrder(g);
    expect(layering[0]).toEqual(['a']);
    expect(layering[1]).toEqual(['b', 'e']);
    expect(layering[2]).toEqual(['c', 'd']);
  });

  test('assigns non-overlapping orders for each rank in a DAG', function () {
    const d = {
      id: 'd',
      data: {
        rank: 2,
      },
      children: [] as any[],
    };
    const b = {
      id: 'b',
      data: {
        rank: 1,
      },
      children: [d],
    };
    const c = {
      id: 'c',
      data: {
        rank: 1,
      },
      children: [] as any[],
    };
    g.addTree({
      id: 'a',
      data: {
        rank: 0,
      },
      children: [b, c],
    });

    let layering = initOrder(g);
    expect(layering[0]).toEqual(['a']);
    expect(layering[1]).toEqual(['b', 'c']);
    expect(layering[2]).toEqual(['d']);
  });

  test('does not assign an order to subgraph nodes', function () {
    g.addTree({
      id: 'sg1',
      data: {},
      children: [
        {
          id: 'a',
          data: {
            rank: 0,
          },
        },
      ],
    });

    let layering = initOrder(g);
    expect(layering).toEqual([['a']]);
  });
});

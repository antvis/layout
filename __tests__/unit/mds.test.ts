import { Graph } from '@antv/graphlib';
import { MDSLayout } from '../../packages/layout';
import data from '../data/test-data-1';

describe('MDSLayout', () => {
  test('should return correct default config.', async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const mds = new MDSLayout();
    expect(mds.options).toEqual({
      center: [0, 0],
      linkDistance: 50,
    });

    const positions = await mds.execute(graph);

    expect(positions.nodes[0].data.x).not.toBe(undefined);
    expect(positions.nodes[0].data.y).not.toBe(undefined);
  });

  test('should do mds layout with an empty graph.', async () => {
    const graph = new Graph<any, any>({
      nodes: [],
      edges: [],
    });

    const mds = new MDSLayout();
    const positions = await mds.execute(graph);
    expect(positions.nodes).not.toBe(undefined);
  });

  test('should do mds layout with a graph which has only one node.', async () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    });

    const mds = new MDSLayout({ center: [10, 20] });
    const positions = await mds.execute(graph);

    expect(positions.nodes[0].data.x).toBe(10);
    expect(positions.nodes[0].data.y).toBe(20);
  });

  test('layout unconnected graph', async () => {
    const graph = new Graph<any, any>({
      nodes: [
        {
          id: 'node0',
          data: {},
        },
        {
          id: 'node1',
          data: {},
        },
        {
          id: 'node2',
          data: {},
        },
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node0',
          target: 'node1',
          data: {},
        },
      ],
    });

    const mds = new MDSLayout({ center: [100, 200] });
    const positions = await mds.execute(graph);

    expect(
      (positions.nodes[0].data.x +
        positions.nodes[1].data.x +
        positions.nodes[2].data.x) /
        3,
    ).toBe(100);
    expect(
      (positions.nodes[0].data.y +
        positions.nodes[1].data.y +
        positions.nodes[2].data.y) /
        3,
    ).toBe(200);
  });
});

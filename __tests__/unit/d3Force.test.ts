import { Graph } from '@antv/graphlib';
import { D3ForceLayout } from '../../packages/layout';
import data from '../data/test-data-1';

describe('D3ForceLayout', () => {
  test('should return correct default config.', async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const force = new D3ForceLayout({
      alphaDecay: 0.2,
      nodeSize: 10,
    });

    const { nodes } = await force.execute(graph);
    const node = nodes[0];
    expect(node.data.x).not.toEqual(undefined);
    expect(node.data.y).not.toEqual(undefined);
  });

  test('force layout with onTick', async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    let x: number;
    let y: number;
    let count = 0;
    let isEnd = false;

    const force = new D3ForceLayout({
      alphaDecay: 0.2,
      nodeSize: 10,
      onTick: ({ nodes }) => {
        const node = nodes[0];
        count++;
        expect(node.data.x !== x);
        expect(node.data.y !== y);
        x = node.data.x;
        y = node.data.y;
      },
    });

    const { nodes } = await force.execute(graph);
    const node = nodes[0];
    expect(node.data.x).not.toEqual(undefined);
    expect(node.data.y).not.toEqual(undefined);
  });
});

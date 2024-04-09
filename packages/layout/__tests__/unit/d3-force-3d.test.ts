import { Graph } from '@antv/graphlib';
import { D3Force3DLayout } from '../../src/d3-force-3d';
import type { EdgeData, NodeData } from '../../src/types';
import data from '../dataset/force-3d.json';

describe('d3 force 3d', () => {
  test('default layout', async () => {
    const graph = new Graph<NodeData, EdgeData>(data);

    const d3Force3D = new D3Force3DLayout();

    const positions = await d3Force3D.execute(graph);

    expect(positions.nodes.length).toBe(data.nodes.length);
    // @ts-ignore
    expect(data.nodes[0].x).toBeUndefined();
    // @ts-ignore
    expect(data.nodes[0].y).toBeUndefined();
    // @ts-ignore
    expect(data.nodes[0].z).toBeUndefined();
    // @ts-ignore
    expect(data.nodes[0].vx).toBeUndefined();
    // @ts-ignore
    expect(data.nodes[0].vy).toBeUndefined();
    // @ts-ignore
    expect(data.nodes[0].vz).toBeUndefined();

    expect(positions.nodes[0].data.x).toBeDefined();
    expect(positions.nodes[0].data.y).toBeDefined();
    expect(positions.nodes[0].data.z).toBeDefined();
    expect(positions.nodes[0].data.vx).toBeDefined();
    expect(positions.nodes[0].data.vy).toBeDefined();
    expect(positions.nodes[0].data.vz).toBeDefined();

    expect(positions.edges.length).toBe(data.edges.length);
    expect(positions.edges[0].source).toBe(data.edges[0].source);
    expect(positions.edges[0].target).toBe(data.edges[0].target);
  });

  test('tick layout', async () => {
    const graph = new Graph<NodeData, EdgeData>(data);
    const d3Force3D = new D3Force3DLayout();

    const onTick = jest.fn();

    await d3Force3D.execute(graph, {
      onTick,
    });

    expect(onTick).toHaveBeenCalledTimes(300);
  });
});

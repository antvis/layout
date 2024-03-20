import { Graph } from '@antv/graphlib';
import { ForceAtlas2Layout } from '../../packages/layout';
import data from '../data/test-data-1';
import { getEuclideanDistance } from '../util';

describe('ForceAtlas2Layout', () => {
  test('should return correct default config.', async () => {
    const graph = new Graph<any, any>({
      nodes: [...data.nodes],
      edges: [...data.edges],
    });

    const fa2 = new ForceAtlas2Layout();
    expect(fa2.options).toEqual({
      center: [0, 0],
      width: 300,
      height: 300,
      kr: 5,
      kg: 1,
      mode: 'normal',
      preventOverlap: false,
      dissuadeHubs: false,
      maxIteration: 0,
      ks: 0.1,
      ksmax: 10,
      tao: 0.1,
    });

    const positions = await fa2.execute(graph);

    expect(positions.nodes[0].data.x).not.toBe(undefined);
    expect(positions.nodes[0].data.y).not.toBe(undefined);
  });

  test('should do fa2 layout with an empty graph.', async () => {
    const graph = new Graph<any, any>({
      nodes: [],
      edges: [],
    });

    const fa2 = new ForceAtlas2Layout();
    const positions = await fa2.execute(graph);
    expect(positions.nodes).not.toBe(undefined);
  });

  test('should do fa2 layout with a graph which has only one node.', async () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    });

    const fa2 = new ForceAtlas2Layout({ center: [10, 20] });
    const positions = await fa2.execute(graph);

    expect(positions.nodes[0].data.x).toBe(10);
    expect(positions.nodes[0].data.y).toBe(20);
  });

  test('should do fa2 layout with diffrent kr', async () => {
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

    // smaller the kr, more compact the result

    const fa21 = new ForceAtlas2Layout({ center: [100, 200], kr: 2 });
    const positions1 = await fa21.execute(graph);
    const dist1 = getEuclideanDistance(
      positions1.nodes[0],
      positions1.nodes[1],
    );

    const fa22 = new ForceAtlas2Layout({ center: [100, 200], kr: 20 });
    const positions2 = await fa22.execute(graph);
    const dist2 = getEuclideanDistance(
      positions2.nodes[0],
      positions2.nodes[1],
    );

    expect(dist1 < dist2).toBe(true);
  });
  test('should do fa2 layout with diffrent kg', async () => {
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

    // larger the kg, more compact the result

    const fa21 = new ForceAtlas2Layout({ center: [100, 200], kg: 2 });
    const positions1 = await fa21.execute(graph);
    const dist1 = getEuclideanDistance(
      positions1.nodes[0],
      positions1.nodes[1],
    );

    const fa22 = new ForceAtlas2Layout({ center: [100, 200], kg: 20 });
    const positions2 = await fa22.execute(graph);
    const dist2 = getEuclideanDistance(
      positions2.nodes[0],
      positions2.nodes[1],
    );

    expect(dist1 > dist2).toBe(true);
  });
  test('should do fa2 layout with diffrent mode', async () => {
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

    // normal mode is more compact than linlog mode

    const fa21 = new ForceAtlas2Layout({ center: [100, 200], mode: 'normal' });
    const positions1 = await fa21.execute(graph);
    const dist1 = getEuclideanDistance(
      positions1.nodes[0],
      positions1.nodes[1],
    );

    const fa22 = new ForceAtlas2Layout({ center: [100, 200], mode: 'linlog' });
    const positions2 = await fa22.execute(graph);
    const dist2 = getEuclideanDistance(
      positions2.nodes[0],
      positions2.nodes[1],
    );

    expect(dist1 < dist2).toBe(true);
  });
  test('should do fa2 layout with onTick', async () => {
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

    let tickCount = 0;
    const fa2 = new ForceAtlas2Layout({
      center: [100, 200],
      onTick: (res) => {
        tickCount++;
        expect(res.nodes[0].data.x).not.toBe(undefined);
        expect(res.nodes[0].data.y).not.toBe(undefined);
      },
    });
    const res = await fa2.execute(graph);
    expect(res.nodes[0].data.x).not.toBe(undefined);
    expect(res.nodes[0].data.y).not.toBe(undefined);
    expect(tickCount).toBe(250); // default maxIteration for small graph is 250

    const nodes100: any = [];
    for (let i = 0; i < 101; i++) nodes100.push({ id: i, data: {} });
    const graph2 = new Graph<any, any>({
      nodes: nodes100,
      edges: [],
    });
    let tickCount2 = 0;
    const fa22 = new ForceAtlas2Layout({
      center: [100, 200],
      onTick: (res) => {
        tickCount2++;
        expect(res.nodes[0].data.x).not.toBe(undefined);
        expect(res.nodes[0].data.y).not.toBe(undefined);
      },
    });
    await fa22.execute(graph2);
    expect(res.nodes[0].data.x).not.toBe(undefined);
    expect(res.nodes[0].data.y).not.toBe(undefined);
    // nodes more than 100, prune is opened automatically, and the iteration will be 1000 + 100(for prune post-process)
    expect(tickCount2).toBe(1000 + 100);
  });
});

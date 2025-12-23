import { ForceAtlas2Layout } from '@/src';
import type { Canvas } from '@antv/g';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { cluster as data } from '../dataset';
import { createCanvas, getEuclideanDistance, GraphRenderer } from '../utils';
import { calculatePositions } from '../utils/render-update';

describe('ForceAtlas2Layout', () => {
  let canvas: Canvas;
  let renderer: GraphRenderer;

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas(null, 500, 500);
    renderer = new GraphRenderer(canvas);
  });

  afterEach(() => {
    clearMockRandom();
    canvas.destroy();
  });

  const renderLayout = async (layout: ForceAtlas2Layout) => {
    await renderer.render(layout, {
      nodeRadius: 10,
    });
  };

  it('should return correct default config.', async () => {
    const fa2 = new ForceAtlas2Layout();
    expect(fa2.options).toEqual({
      nodeSize: 10,
      nodeSpacing: 0,
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

    await fa2.execute(data);

    fa2.forEachNode((node) => {
      expect(node.x).not.toBe(undefined);
      expect(node.y).not.toBe(undefined);
    });
  });

  it('should do fa2 layout with a simple graph.', async () => {
    const fa2 = new ForceAtlas2Layout();

    await fa2.execute(data, {
      preventOverlap: true,
      nodeSize: 20,
      maxIterations: 500,
      kr: 10,
      radius: 200,
    });

    renderLayout(fa2);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should do fa2 layout with an empty graph.', async () => {
    const graph = {
      nodes: [],
      edges: [],
    };

    const fa2 = new ForceAtlas2Layout();
    await fa2.execute(graph);
    const positions = calculatePositions(fa2);
    expect(positions.nodes).not.toBe(undefined);
  });

  it('should do fa2 layout with a graph which has only one node.', async () => {
    const graph = {
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    };

    const fa2 = new ForceAtlas2Layout({ center: [10, 20] });
    await fa2.execute(graph);
    const positions = calculatePositions(fa2);

    expect(positions.nodes[0].x).toBe(10);
    expect(positions.nodes[0].y).toBe(20);
  });

  it('should do fa2 layout with diffrent kr', async () => {
    const graph = {
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
    };

    // smaller the kr, more compact the result

    const fa21 = new ForceAtlas2Layout({ center: [100, 200], kr: 2 });
    await fa21.execute(graph);
    const positions1 = calculatePositions(fa21);
    const dist1 = getEuclideanDistance(
      positions1.nodes[0],
      positions1.nodes[1],
    );

    const fa22 = new ForceAtlas2Layout({ center: [100, 200], kr: 20 });
    await fa22.execute(graph);
    const positions2 = calculatePositions(fa22);
    const dist2 = getEuclideanDistance(
      positions2.nodes[0],
      positions2.nodes[1],
    );

    expect(dist1 < dist2).toBe(true);
  });
  it('should do fa2 layout with diffrent kg', async () => {
    const graph = {
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
    };

    // larger the kg, more compact the result

    const fa21 = new ForceAtlas2Layout({ center: [100, 200], kg: 2 });
    await fa21.execute(graph);
    const positions1 = calculatePositions(fa21);
    const dist1 = getEuclideanDistance(
      positions1.nodes[0],
      positions1.nodes[1],
    );

    const fa22 = new ForceAtlas2Layout({ center: [100, 200], kg: 20 });
    await fa22.execute(graph);
    const positions2 = calculatePositions(fa22);
    const dist2 = getEuclideanDistance(
      positions2.nodes[0],
      positions2.nodes[1],
    );

    expect(dist1 > dist2).toBe(true);
  });
  it('should do fa2 layout with diffrent mode', async () => {
    const graph = {
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
    };

    // normal mode is more compact than linlog mode

    const fa21 = new ForceAtlas2Layout({ center: [100, 200], mode: 'normal' });
    await fa21.execute(graph);
    const positions1 = calculatePositions(fa21);
    const dist1 = getEuclideanDistance(
      positions1.nodes[0],
      positions1.nodes[1],
    );

    const fa22 = new ForceAtlas2Layout({ center: [100, 200], mode: 'linlog' });
    await fa22.execute(graph);
    const positions2 = calculatePositions(fa22);
    const dist2 = getEuclideanDistance(
      positions2.nodes[0],
      positions2.nodes[1],
    );

    expect(dist1 < dist2).toBe(true);
  });
  it('should do fa2 layout with onTick', async () => {
    const graph = {
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
    };

    let tickCount = 0;
    const fa2 = new ForceAtlas2Layout({
      center: [100, 200],
      onTick: (res) => {
        res.forEachNode((node) => {
          expect(node.x).not.toBe(undefined);
          expect(node.y).not.toBe(undefined);
        });
        tickCount++;
      },
    });
    await fa2.execute(graph);
    expect(tickCount).toBe(250); // default maxIteration for small graph is 250

    const nodes100: any = [];
    for (let i = 0; i < 101; i++) nodes100.push({ id: i, data: {} });
    const graph2 = {
      nodes: nodes100,
      edges: [],
    };
    let tickCount2 = 0;
    const fa22 = new ForceAtlas2Layout({
      center: [100, 200],
      onTick: (res) => {
        tickCount2++;
        res.forEachNode((node) => {
          expect(node.x).not.toBe(undefined);
          expect(node.y).not.toBe(undefined);
        });
      },
    });
    await fa22.execute(graph2);
    // nodes more than 100, prune is opened automatically, and the iteration will be 1000 + 100(for prune post-process)
    expect(tickCount2).toBe(1000 + 100);
  });
});

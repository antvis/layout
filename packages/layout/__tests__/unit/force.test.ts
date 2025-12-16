import { ForceLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { cluster } from '../dataset';
import { GraphRenderer, preprocessGraphData } from '../utils';
import { calculatePositions } from '../utils/render-update';

describe('layout force', () => {
  let canvas: Canvas;
  let width: number;
  let height: number;
  let renderer: GraphRenderer;
  let data;

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas(null, 1000, 1000);
    renderer = new GraphRenderer(canvas);
    width = renderer.getCanvasSize().width;
    height = renderer.getCanvasSize().height;
    data = preprocessGraphData(cluster, { width, height });
  });

  afterEach(() => {
    clearMockRandom();
    canvas.destroy();
  });

  const renderLayout = async (layout: ForceLayout) => {
    await renderer.render(
      layout,
      {
        nodeRadius: 10,
        showLabel: true,
      },
      data,
    );
  };

  it('should return correct default config', () => {
    const layout = new ForceLayout();
    expect(layout.options).toMatchObject({
      nodeSize: 30,
      dimensions: 2,
      maxIteration: 500,
      gravity: 10,
      factor: 1,
      edgeStrength: 50,
      nodeStrength: 1000,
      coulombDisScale: 0.005,
      damping: 0.9,
      maxSpeed: 200,
      minMovement: 0.4,
      interval: 0.02,
      linkDistance: 200,
      clusterNodeStrength: 20,
      preventOverlap: true,
      distanceThresholdMode: 'mean',
    });
  });

  it('should render with default config', async () => {
    const layout = new ForceLayout({ width, height });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom gravity', async () => {
    const layout = new ForceLayout({
      width,
      height,
      gravity: 20,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'gravity-20');
  });

  it('should render with low gravity', async () => {
    const layout = new ForceLayout({
      width,
      height,
      gravity: 1,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'gravity-1');
  });

  it('should render with custom linkDistance', async () => {
    const layout = new ForceLayout({
      width,
      height,
      linkDistance: 100,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'linkDistance-100');
  });

  it('should render with custom edgeStrength', async () => {
    const layout = new ForceLayout({
      width,
      height,
      edgeStrength: 100,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'edgeStrength-100');
  });

  it('should render with custom nodeStrength', async () => {
    const layout = new ForceLayout({
      width,
      height,
      nodeStrength: 2000,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'nodeStrength-2000');
  });

  it('should render with preventOverlap disabled', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      preventOverlap: false,
      width: 1000,
      height: 1000,
    });
    layout.execute(data);
    layout.stop();
    layout.tick(100);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'preventOverlap-false');
  });

  it('should render with custom center', async () => {
    const layout = new ForceLayout({
      center: [300, 300],
      maxIteration: 100,
      width: 1000,
      height: 1000,
    });
    layout.execute(data);
    layout.stop();
    layout.tick(100);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('should render with custom width and height', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      width: 800,
      height: 600,
    });
    layout.execute(data);
    layout.stop();
    layout.tick(100);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-dimensions');
  });

  it('returns empty result for empty graph', async () => {
    const emptyGraph = { nodes: [], edges: [] };
    const layout = new ForceLayout();
    await layout.execute(emptyGraph);
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should handle clustering with nodeClusterBy', async () => {
    const clusterGraph = {
      nodes: [
        { id: 'node0', data: { cluster: 'a' } },
        { id: 'node1', data: { cluster: 'c' } },
        { id: 'node2', data: { cluster: 'b' } },
        { id: 'node3', data: { cluster: 'a' } },
        { id: 'node4', data: { cluster: 'c' } },
        { id: 'node5', data: { cluster: 'b' } },
      ],
      edges: [],
    };
    const layout = new ForceLayout({
      clustering: true,
      nodeClusterBy: (d) => d.data.cluster,
      maxIteration: 100,
    });
    layout.execute(clusterGraph);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'clustering');
  });

  it('should cluster nodes with custom clusterNodeStrength', async () => {
    const clusterGraph = {
      nodes: [
        { id: 'a1', data: { type: 'A' } },
        { id: 'a2', data: { type: 'A' } },
        { id: 'a3', data: { type: 'A' } },
        { id: 'b1', data: { type: 'B' } },
        { id: 'b2', data: { type: 'B' } },
        { id: 'b3', data: { type: 'B' } },
      ],
      edges: [],
    };
    const layout = new ForceLayout({
      clustering: true,
      nodeClusterBy: (d) => d.data.type,
      clusterNodeStrength: 40,
      maxIteration: 100,
    });
    layout.execute(clusterGraph);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'cluster-strength-40');
  });

  it('should handle onTick callback', async () => {
    let tickCount = 0;
    const onTick = (layout: any) => {
      layout.forEachNode((node) => {
        expect(node.x).toBeDefined();
        expect(node.y).toBeDefined();
      });
      tickCount++;
    };

    const layout = new ForceLayout({
      maxIteration: 10,
      onTick,
    });
    await layout.execute(data);
    expect(tickCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle overlapped nodes', async () => {
    const overlapGraph = {
      nodes: [
        { id: 'node0', data: { x: 100, y: 100 } },
        { id: 'node1', data: { x: 100, y: 100 } },
        { id: 'node2', data: { x: 150, y: 120 } },
      ],
      edges: [
        { id: 'edge0', source: 'node2', target: 'node2', data: {} },
        { id: 'edge1', source: 'node1', target: 'node1', data: {} },
      ],
    };
    const layout = new ForceLayout({ maxIteration: 100, preventOverlap: true });
    layout.execute(overlapGraph);
    layout.stop();
    layout.tick(100);
    const positions = calculatePositions(layout);
    // After layout with preventOverlap, overlapped nodes should be separated
    expect(positions.nodes[0].x).not.toEqual(positions.nodes[1].x);
    expect(positions.nodes[0].y).not.toEqual(positions.nodes[1].y);
  });

  it('should render star graph', async () => {
    const starGraph = {
      nodes: [
        { id: 'center', data: {} },
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
        { id: 'e', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'center', target: 'a', data: {} },
        { id: 'e2', source: 'center', target: 'b', data: {} },
        { id: 'e3', source: 'center', target: 'c', data: {} },
        { id: 'e4', source: 'center', target: 'd', data: {} },
        { id: 'e5', source: 'center', target: 'e', data: {} },
      ],
    };
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(starGraph);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'star-graph');
  });

  it('should render path graph', async () => {
    const pathGraph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
        { id: 'e', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
        { id: 'e3', source: 'c', target: 'd', data: {} },
        { id: 'e4', source: 'd', target: 'e', data: {} },
      ],
    };
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(pathGraph);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'path-graph');
  });

  it('should handle fixed node positions', async () => {
    const fixedGraph = {
      nodes: [
        { id: 'a', data: { fx: 100, fy: 100 } },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
      ],
    };
    const layout = new ForceLayout({
      node: (d) => ({
        fx: d.data.fx,
        fy: d.data.fy,
      }),
      maxIteration: 100,
    });
    layout.execute(fixedGraph);
    layout.stop();
    layout.tick(100);
    const positions = calculatePositions(layout);
    // Fixed node should stay at its position
    expect(positions.nodes[0].x).toBe(100);
    expect(positions.nodes[0].y).toBe(100);
  });

  it('should render with low maxIteration', async () => {
    const layout = new ForceLayout({ maxIteration: 10 });
    layout.execute(data);
    layout.stop();
    layout.tick(10);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'max-iteration-10');
  });

  it('should render disconnected components', async () => {
    const disconnectedGraph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'c', target: 'd', data: {} },
      ],
    };
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(disconnectedGraph);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'disconnected-components');
  });

  it('should handle self-loop edges', async () => {
    const loopGraph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'a', data: {} },
        { id: 'e2', source: 'a', target: 'b', data: {} },
      ],
    };
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(loopGraph);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'self-loop');
  });

  it('should handle custom damping', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      damping: 0.5,
      width: 1000,
      height: 1000,
    });
    layout.execute(data);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'damping-0.5');
  });

  it('should handle custom factor', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      factor: 2,
      width: 1000,
      height: 1000,
    });
    layout.execute(data);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'factor-2');
  });

  it('should handle distanceThresholdMode max', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      distanceThresholdMode: 'max',
      width: 1000,
      height: 1000,
    });
    layout.execute(data);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'threshold-max');
  });

  it('should handle distanceThresholdMode min', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      distanceThresholdMode: 'min',
      width: 1000,
      height: 1000,
    });
    layout.execute(data);
    layout.stop();
    layout.tick(100);

    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'threshold-min');
  });
});

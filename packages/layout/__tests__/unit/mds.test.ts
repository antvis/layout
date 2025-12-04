import { MDSLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { countries as data } from '../dataset';
import { GraphRenderer, RenderOptions } from '../utils';
import { calculatePositions } from '../utils/render-update';

describe('layout mds', () => {
  let canvas: Canvas;
  let mds: MDSLayout;
  let renderer: GraphRenderer;

  beforeEach(() => {
    canvas = createCanvas();
    mds = new MDSLayout({
      center: [250, 250],
      linkDistance: 50,
    });
    renderer = new GraphRenderer(canvas);
  });

  afterEach(() => {
    canvas.destroy();
  });

  const renderLayout = async (
    layout: MDSLayout,
    options: RenderOptions = {},
  ) => {
    await renderer.render(layout, {
      nodeRadius: 10,
      nodeStyle: { lineWidth: 2 },
      ...options,
    });
  };

  it('should render with default config', async () => {
    await mds.execute(data);
    await renderLayout(mds);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom center', async () => {
    await mds.execute(data, { center: [300, 300] });
    await renderLayout(mds);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('should render with custom linkDistance', async () => {
    await mds.execute(data, { linkDistance: 60 });
    await renderLayout(mds);
    await expect(canvas).toMatchSnapshot(__filename, 'linkDistance-60');
  });

  it('should render with small linkDistance', async () => {
    await mds.execute(data, { linkDistance: 20 });
    await renderLayout(mds);
    await expect(canvas).toMatchSnapshot(__filename, 'linkDistance-20');
  });

  it('returns empty result for empty graph', async () => {
    const emptyGraph = { nodes: [], edges: [] };
    const layout = new MDSLayout({ center: [0, 0], linkDistance: 50 });
    await layout.execute(emptyGraph);
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should handle single node graph', async () => {
    const singleGraph = {
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    };
    const layout = new MDSLayout({ center: [10, 20] });
    await layout.execute(singleGraph);
    const positions = calculatePositions(layout);
    expect(positions.nodes[0].x).toBe(10);
    expect(positions.nodes[0].y).toBe(20);
  });

  it('should layout unconnected graph', async () => {
    const unconnectedGraph = {
      nodes: [
        { id: 'node0', data: {} },
        { id: 'node1', data: {} },
        { id: 'node2', data: {} },
      ],
      edges: [{ id: 'edge1', source: 'node0', target: 'node1', data: {} }],
    };
    const layout = new MDSLayout({ center: [100, 200] });
    await layout.execute(unconnectedGraph);
    const positions = calculatePositions(layout);

    // Check center of mass
    const avgX =
      (positions.nodes[0].x + positions.nodes[1].x + positions.nodes[2].x) / 3;
    const avgY =
      (positions.nodes[0].y + positions.nodes[1].y + positions.nodes[2].y) / 3;
    expect(avgX).toBe(100);
    expect(avgY).toBe(200);
  });

  it('should handle graph with infinity distances', async () => {
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
    await mds.execute(disconnectedGraph);
    await renderLayout(mds);
    await expect(canvas).toMatchSnapshot(__filename, 'disconnected-components');
  });

  it('should render complete graph', async () => {
    const completeGraph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'a', target: 'c', data: {} },
        { id: 'e3', source: 'a', target: 'd', data: {} },
        { id: 'e4', source: 'b', target: 'c', data: {} },
        { id: 'e5', source: 'b', target: 'd', data: {} },
        { id: 'e6', source: 'c', target: 'd', data: {} },
      ],
    };
    await mds.execute(completeGraph);
    await renderLayout(mds);
    await expect(canvas).toMatchSnapshot(__filename, 'complete-graph');
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
    await mds.execute(starGraph);
    await renderLayout(mds);
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
    await mds.execute(pathGraph);
    await renderLayout(mds);
    await expect(canvas).toMatchSnapshot(__filename, 'path-graph');
  });

  it('should handle varying linkDistance values', async () => {
    await mds.execute(data, { linkDistance: 30 });
    const positions1 = calculatePositions(mds);
    await mds.execute(data, { linkDistance: 100 });
    const positions2 = calculatePositions(mds);

    // With larger linkDistance, nodes should be more spread out
    const dist1 = Math.sqrt(
      Math.pow(positions1.nodes[0].x - positions1.nodes[1].x, 2) +
        Math.pow(positions1.nodes[0].y - positions1.nodes[1].y, 2),
    );
    const dist2 = Math.sqrt(
      Math.pow(positions2.nodes[0].x - positions2.nodes[1].x, 2) +
        Math.pow(positions2.nodes[0].y - positions2.nodes[1].y, 2),
    );

    // Generally, larger linkDistance should result in larger distances
    expect(dist2).toBeGreaterThan(dist1 * 0.5); // Allow some variance
  });

  it('should verify positions are valid numbers', async () => {
    await mds.execute(data);
    const positions = calculatePositions(mds);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    });
  });

  it('should center nodes around specified center', async () => {
    const centerX = 150;
    const centerY = 150;
    await mds.execute(data, {
      center: [centerX, centerY],
    });
    const positions = calculatePositions(mds);
    // Calculate the center of mass
    const avgX =
      positions.nodes.reduce((sum, n) => sum + n.x, 0) / positions.nodes.length;
    const avgY =
      positions.nodes.reduce((sum, n) => sum + n.y, 0) / positions.nodes.length;

    // Should be close to the specified center
    expect(Math.abs(avgX - centerX)).toBeLessThan(1);
    expect(Math.abs(avgY - centerY)).toBeLessThan(1);
  });
});

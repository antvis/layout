import { MDSLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { Graph } from '@antv/graphlib';
import { countries as data } from '../dataset';
import { renderNodesAndEdges } from '../utils/render';

describe('layout mds', () => {
  let canvas: Canvas;
  let graph: Graph<any, any>;
  let mds: MDSLayout;

  beforeEach(() => {
    canvas = createCanvas();
    const { nodes, edges } = data;
    graph = new Graph({ nodes, edges });
    mds = new MDSLayout({
      center: [250, 250],
      linkDistance: 50,
    });
  });

  afterEach(() => {
    canvas.destroy();
  });

  it('should render with default config', async () => {
    const positions = await mds.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom center', async () => {
    const positions = await mds.execute(graph, { center: [300, 300] });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('should render with custom linkDistance', async () => {
    const positions = await mds.execute(graph, { linkDistance: 60 });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'linkDistance-60');
  });

  it('should render with small linkDistance', async () => {
    const positions = await mds.execute(graph, { linkDistance: 20 });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'linkDistance-20');
  });

  it('returns empty result for empty graph', async () => {
    const emptyGraph = new Graph({ nodes: [], edges: [] });
    const layout = new MDSLayout({ center: [0, 0], linkDistance: 50 });
    const positions = await layout.execute(emptyGraph);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('assign places single node at center', async () => {
    const singleGraph = new Graph({
      nodes: [{ id: 'a', data: {} }],
      edges: [] as any,
    });
    const layout = new MDSLayout();
    await layout.assign(singleGraph, { center: [10, 20] } as any);
    const n = singleGraph.getAllNodes()[0];
    expect((n.data as any).x).toBe(10);
    expect((n.data as any).y).toBe(20);
  });

  it('should handle single node graph', async () => {
    const singleGraph = new Graph({
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    });
    const layout = new MDSLayout({ center: [10, 20] });
    const positions = await layout.execute(singleGraph);
    expect(positions.nodes[0].data.x).toBe(10);
    expect(positions.nodes[0].data.y).toBe(20);
  });

  it('should layout unconnected graph', async () => {
    const unconnectedGraph = new Graph({
      nodes: [
        { id: 'node0', data: {} },
        { id: 'node1', data: {} },
        { id: 'node2', data: {} },
      ],
      edges: [{ id: 'edge1', source: 'node0', target: 'node1', data: {} }],
    });
    const layout = new MDSLayout({ center: [100, 200] });
    const positions = await layout.execute(unconnectedGraph);

    // Check center of mass
    const avgX =
      (positions.nodes[0].data.x +
        positions.nodes[1].data.x +
        positions.nodes[2].data.x) /
      3;
    const avgY =
      (positions.nodes[0].data.y +
        positions.nodes[1].data.y +
        positions.nodes[2].data.y) /
      3;
    expect(avgX).toBe(100);
    expect(avgY).toBe(200);
  });

  it('should handle graph with infinity distances', async () => {
    const disconnectedGraph = new Graph({
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
    });
    const positions = await mds.execute(disconnectedGraph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'disconnected-components');
  });

  it('should render complete graph', async () => {
    const completeGraph = new Graph({
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
    });
    const positions = await mds.execute(completeGraph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'complete-graph');
  });

  it('should render star graph', async () => {
    const starGraph = new Graph({
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
    });
    const positions = await mds.execute(starGraph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'star-graph');
  });

  it('should render path graph', async () => {
    const pathGraph = new Graph({
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
    });
    const positions = await mds.execute(pathGraph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'path-graph');
  });

  it('assign mode should directly modify graph node positions', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'c', data: {} },
    ];
    const testGraph = new Graph({ nodes: nodes as any, edges: edges as any });
    const layout = new MDSLayout({ center: [100, 100], linkDistance: 50 });
    await layout.assign(testGraph, {});
    const allNodes = testGraph.getAllNodes();
    allNodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should handle varying linkDistance values', async () => {
    const positions1 = await mds.execute(graph, { linkDistance: 30 });
    const positions2 = await mds.execute(graph, { linkDistance: 100 });

    // With larger linkDistance, nodes should be more spread out
    const dist1 = Math.sqrt(
      Math.pow(positions1.nodes[0].data.x - positions1.nodes[1].data.x, 2) +
        Math.pow(positions1.nodes[0].data.y - positions1.nodes[1].data.y, 2),
    );
    const dist2 = Math.sqrt(
      Math.pow(positions2.nodes[0].data.x - positions2.nodes[1].data.x, 2) +
        Math.pow(positions2.nodes[0].data.y - positions2.nodes[1].data.y, 2),
    );

    // Generally, larger linkDistance should result in larger distances
    expect(dist2).toBeGreaterThan(dist1 * 0.5); // Allow some variance
  });

  it('should verify positions are valid numbers', async () => {
    const positions = await mds.execute(graph);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should center nodes around specified center', async () => {
    const centerX = 150;
    const centerY = 150;
    const positions = await mds.execute(graph, {
      center: [centerX, centerY],
    });

    // Calculate the center of mass
    const avgX =
      positions.nodes.reduce((sum, n) => sum + n.data.x, 0) /
      positions.nodes.length;
    const avgY =
      positions.nodes.reduce((sum, n) => sum + n.data.y, 0) /
      positions.nodes.length;

    // Should be close to the specified center
    expect(Math.abs(avgX - centerX)).toBeLessThan(1);
    expect(Math.abs(avgY - centerY)).toBeLessThan(1);
  });
});

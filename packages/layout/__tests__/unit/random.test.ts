import { RandomLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { Graph } from '@antv/graphlib';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { countries as data } from '../dataset';
import { renderNodesAndEdges } from '../utils/render';

describe('layout random', () => {
  let canvas: Canvas;
  let graph: Graph<any, any>;
  let random: RandomLayout;

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas();
    const { nodes, edges } = data;
    graph = new Graph({ nodes, edges });
    random = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
  });

  afterEach(() => {
    clearMockRandom();
    canvas.destroy();
  });

  it('should render with default config', async () => {
    const positions = await random.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with pure data', async () => {
    const positions = await random.execute(data);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should return correct default config', () => {
    const layout = new RandomLayout();
    expect(layout.options).toEqual({
      center: [0, 0],
      width: 300,
      height: 300,
    });
  });

  it('should render with custom center', async () => {
    const layout = new RandomLayout({
      center: [300, 300],
      width: 500,
      height: 500,
    });
    const positions = await layout.execute(graph);
    await renderNodesAndEdges(canvas, positions);

    // Check that nodes are distributed around the center
    const avgX =
      positions.nodes.reduce((sum, n) => sum + n.data.x, 0) /
      positions.nodes.length;
    const avgY =
      positions.nodes.reduce((sum, n) => sum + n.data.y, 0) /
      positions.nodes.length;

    // Should be roughly centered (allowing for randomness)
    expect(Math.abs(avgX - 300)).toBeLessThan(100);
    expect(Math.abs(avgY - 300)).toBeLessThan(100);
  });

  it('should render with custom width', async () => {
    const layout = new RandomLayout({
      center: [250, 250],
      width: 800,
      height: 500,
    });
    const positions = await layout.execute(graph);

    // Verify nodes are within bounds
    positions.nodes.forEach((node) => {
      expect(node.data.x).toBeGreaterThanOrEqual(250 - (800 * 0.9) / 2);
      expect(node.data.x).toBeLessThanOrEqual(250 + (800 * 0.9) / 2);
    });
  });

  it('should render with custom height', async () => {
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 800,
    });
    const positions = await layout.execute(graph);

    // Verify nodes are within bounds
    positions.nodes.forEach((node) => {
      expect(node.data.y).toBeGreaterThanOrEqual(250 - (800 * 0.9) / 2);
      expect(node.data.y).toBeLessThanOrEqual(250 + (800 * 0.9) / 2);
    });
  });

  it('should render with small dimensions', async () => {
    const layout = new RandomLayout({
      center: [250, 250],
      width: 100,
      height: 100,
    });
    const positions = await layout.execute(graph);
    await renderNodesAndEdges(canvas, positions);

    // All nodes should be within small area
    positions.nodes.forEach((node) => {
      expect(node.data.x).toBeGreaterThanOrEqual(250 - (100 * 0.9) / 2);
      expect(node.data.x).toBeLessThanOrEqual(250 + (100 * 0.9) / 2);
      expect(node.data.y).toBeGreaterThanOrEqual(250 - (100 * 0.9) / 2);
      expect(node.data.y).toBeLessThanOrEqual(250 + (100 * 0.9) / 2);
    });
  });

  it('should render with large dimensions', async () => {
    const layout = new RandomLayout({
      center: [250, 250],
      width: 1000,
      height: 1000,
    });
    const positions = await layout.execute(graph);

    // Nodes should be spread across larger area
    const xValues = positions.nodes.map((n) => n.data.x);
    const yValues = positions.nodes.map((n) => n.data.y);
    const xRange = Math.max(...xValues) - Math.min(...xValues);
    const yRange = Math.max(...yValues) - Math.min(...yValues);

    // Should have significant spread
    expect(xRange).toBeGreaterThan(500);
    expect(yRange).toBeGreaterThan(500);
  });

  it('returns empty result for empty graph', async () => {
    const emptyGraph = new Graph({ nodes: [], edges: [] });
    const layout = new RandomLayout();
    const positions = await layout.execute(emptyGraph);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should handle single node graph', async () => {
    const singleGraph = new Graph({
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    });
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    const positions = await layout.execute(singleGraph);

    expect(positions.nodes).toHaveLength(1);
    expect(typeof positions.nodes[0].data.x).toBe('number');
    expect(typeof positions.nodes[0].data.y).toBe('number');
    // Should be within bounds
    expect(positions.nodes[0].data.x).toBeGreaterThanOrEqual(
      250 - (500 * 0.9) / 2,
    );
    expect(positions.nodes[0].data.x).toBeLessThanOrEqual(
      250 + (500 * 0.9) / 2,
    );
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
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    await layout.assign(testGraph, {});
    const allNodes = testGraph.getAllNodes();
    allNodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should place nodes randomly (different positions)', async () => {
    const testGraph = new Graph({
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
        { id: 'e', data: {} },
      ],
      edges: [],
    });
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    const positions = await layout.execute(testGraph);

    // All nodes should have different positions (with high probability)
    const posSet = new Set(
      positions.nodes.map((n) => `${n.data.x},${n.data.y}`),
    );
    expect(posSet.size).toBe(positions.nodes.length);
  });

  it('should verify all positions are valid numbers', async () => {
    const positions = await random.execute(graph);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should preserve edges', async () => {
    const positions = await random.execute(graph);
    expect(positions.edges.length).toBe(graph.getAllEdges().length);
    positions.edges.forEach((edge, i) => {
      const originalEdge = graph.getAllEdges()[i];
      expect(edge.id).toBe(originalEdge.id);
      expect(edge.source).toBe(originalEdge.source);
      expect(edge.target).toBe(originalEdge.target);
    });
  });

  it('should work with graph with edges', async () => {
    const connectedGraph = new Graph({
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
        { id: 'e3', source: 'c', target: 'd', data: {} },
        { id: 'e4', source: 'd', target: 'a', data: {} },
      ],
    });
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    const positions = await layout.execute(connectedGraph);
    await renderNodesAndEdges(canvas, positions);

    expect(positions.nodes).toHaveLength(4);
    expect(positions.edges).toHaveLength(4);
  });

  it('should handle many nodes', async () => {
    const manyNodes = Array.from({ length: 100 }, (_, i) => ({
      id: `node${i}`,
      data: {},
    }));
    const largeGraph = new Graph({
      nodes: manyNodes as any,
      edges: [],
    });
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    const positions = await layout.execute(largeGraph);

    expect(positions.nodes).toHaveLength(100);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should handle disconnected components', async () => {
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
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    const positions = await layout.execute(disconnectedGraph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'disconnected-graph');
  });
});

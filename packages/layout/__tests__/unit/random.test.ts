import { RandomLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { countries as data } from '../dataset';
import {
  calculatePositions,
  renderNodesAndEdges,
} from '../utils/render-update';

describe('layout random', () => {
  let canvas: Canvas;
  let random: RandomLayout;

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas();
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
    await random.execute(data);
    await renderNodesAndEdges(canvas, random);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with pure data', async () => {
    await random.execute(data);
    await renderNodesAndEdges(canvas, random);
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
    await layout.execute(data);
    await renderNodesAndEdges(canvas, layout);

    const positions = calculatePositions(layout);
    // Check that nodes are distributed around the center
    const avgX =
      positions.nodes.reduce((sum, n) => sum + n.x, 0) / positions.nodes.length;
    const avgY =
      positions.nodes.reduce((sum, n) => sum + n.y, 0) / positions.nodes.length;

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
    await layout.execute(data);

    const positions = calculatePositions(layout);
    // Verify nodes are within bounds
    positions.nodes.forEach((node) => {
      expect(node.x).toBeGreaterThanOrEqual(250 - (800 * 0.9) / 2);
      expect(node.x).toBeLessThanOrEqual(250 + (800 * 0.9) / 2);
    });
  });

  it('should render with custom height', async () => {
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 800,
    });
    await layout.execute(data);

    const positions = calculatePositions(layout);
    // Verify nodes are within bounds
    positions.nodes.forEach((node) => {
      expect(node.y).toBeGreaterThanOrEqual(250 - (800 * 0.9) / 2);
      expect(node.y).toBeLessThanOrEqual(250 + (800 * 0.9) / 2);
    });
  });

  it('should render with small dimensions', async () => {
    const layout = new RandomLayout({
      center: [250, 250],
      width: 100,
      height: 100,
    });
    await layout.execute(data);
    await renderNodesAndEdges(canvas, layout);

    const positions = calculatePositions(layout);
    // All nodes should be within small area
    positions.nodes.forEach((node) => {
      expect(node.x).toBeGreaterThanOrEqual(250 - (100 * 0.9) / 2);
      expect(node.x).toBeLessThanOrEqual(250 + (100 * 0.9) / 2);
      expect(node.y).toBeGreaterThanOrEqual(250 - (100 * 0.9) / 2);
      expect(node.y).toBeLessThanOrEqual(250 + (100 * 0.9) / 2);
    });
  });

  it('should render with large dimensions', async () => {
    const layout = new RandomLayout({
      center: [250, 250],
      width: 1000,
      height: 1000,
    });
    await layout.execute(data);

    const positions = calculatePositions(layout);
    // Nodes should be spread across larger area
    const xValues = positions.nodes.map((n) => n.x);
    const yValues = positions.nodes.map((n) => n.y);
    const xRange = Math.max(...xValues) - Math.min(...xValues);
    const yRange = Math.max(...yValues) - Math.min(...yValues);

    // Should have significant spread
    expect(xRange).toBeGreaterThan(500);
    expect(yRange).toBeGreaterThan(500);
  });

  it('returns empty result for empty graph', async () => {
    const layout = new RandomLayout();
    await layout.execute({ nodes: [], edges: [] });
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should handle single node graph', async () => {
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    await layout.execute({
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    });
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(1);
    expect(typeof positions.nodes[0].x).toBe('number');
    expect(typeof positions.nodes[0].y).toBe('number');
    // Should be within bounds
    expect(positions.nodes[0].x).toBeGreaterThanOrEqual(250 - (500 * 0.9) / 2);
    expect(positions.nodes[0].x).toBeLessThanOrEqual(250 + (500 * 0.9) / 2);
  });

  it('should place nodes randomly (different positions)', async () => {
    const testGraph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
        { id: 'd', data: {} },
        { id: 'e', data: {} },
      ],
      edges: [],
    };
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    await layout.execute(testGraph);

    const positions = calculatePositions(layout);
    // All nodes should have different positions (with high probability)
    const posSet = new Set(positions.nodes.map((n) => `${n.x},${n.y}`));
    expect(posSet.size).toBe(positions.nodes.length);
  });

  it('should verify all positions are valid numbers', async () => {
    await random.execute(data);
    const positions = calculatePositions(random);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    });
  });

  it('should work with graph with edges', async () => {
    const connectedGraph = {
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
    };
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    await layout.execute(connectedGraph);
    await renderNodesAndEdges(canvas, layout);

    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(4);
    expect(positions.edges).toHaveLength(4);
  });

  it('should handle many nodes', async () => {
    const manyNodes = Array.from({ length: 100 }, (_, i) => ({
      id: `node${i}`,
      data: {},
    }));
    const largeGraph = {
      nodes: manyNodes as any,
      edges: [],
    };
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });
    await layout.execute(largeGraph);

    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(100);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    });
  });

  it('should handle disconnected components', async () => {
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
    const layout = new RandomLayout({
      center: [250, 250],
      width: 500,
      height: 500,
    });

    await layout.execute(disconnectedGraph);
    await renderNodesAndEdges(canvas, layout);
    await expect(canvas).toMatchSnapshot(__filename, 'disconnected-graph');
  });
});

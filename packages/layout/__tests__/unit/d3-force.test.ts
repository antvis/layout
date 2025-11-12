import { D3ForceLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { Graph } from '@antv/graphlib';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { countries } from '../dataset';
import data from '../dataset/force-3d.json';
import { renderNodesAndEdges } from '../utils/render';

describe('layout d3-force', () => {
  let canvas: Canvas;
  let graph: Graph<any, any>;

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas();
    const { nodes, edges } = countries;
    graph = new Graph({ nodes, edges });
  });

  afterEach(() => {
    clearMockRandom();
    canvas.destroy();
  });

  it('should return correct default config.', async () => {
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

  it('force layout with onTick', async () => {
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

  it('should render with default config', async () => {
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should return correct default config', () => {
    const d3Force = new D3ForceLayout();
    expect(d3Force.options).toMatchObject({
      link: {
        id: expect.any(Function),
      },
      manyBody: {},
      center: {
        x: 0,
        y: 0,
      },
    });
  });

  it('should handle tick callback', async () => {
    const testGraph = new Graph(data);
    const d3Force = new D3ForceLayout();
    const onTick = jest.fn();

    await d3Force.execute(testGraph, {
      onTick,
    });

    expect(onTick).toHaveBeenCalled();
  });

  it('should have valid positions after layout', async () => {
    const testGraph = new Graph(data);
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(testGraph);

    expect(positions.nodes.length).toBe(data.nodes.length);
    expect(positions.nodes[0].data.x).toBeDefined();
    expect(positions.nodes[0].data.y).toBeDefined();
    expect(positions.nodes[0].data.vx).toBeDefined();
    expect(positions.nodes[0].data.vy).toBeDefined();

    expect(positions.edges.length).toBe(data.edges.length);
    expect(positions.edges[0].source).toBe(data.edges[0].source);
    expect(positions.edges[0].target).toBe(data.edges[0].target);
  });

  it('should render with custom center', async () => {
    const d3Force = new D3ForceLayout({
      center: {
        x: 300,
        y: 300,
      },
    });
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('should render with manyBody force', async () => {
    const d3Force = new D3ForceLayout({
      manyBody: {
        strength: -100,
      },
    });
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'manyBody-strength');
  });

  it('should render with link force', async () => {
    const d3Force = new D3ForceLayout({
      link: {
        id: (d: any) => d.id,
        distance: 100,
      },
    });
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'link-distance');
  });

  it('should render with collide force', async () => {
    const d3Force = new D3ForceLayout({
      collide: {
        radius: 20,
      },
    });
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'collide-radius');
  });

  it('should render with x and y forces', async () => {
    const d3Force = new D3ForceLayout({
      x: {
        x: 250,
        strength: 0.1,
      },
      y: {
        y: 250,
        strength: 0.1,
      },
    });
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'x-y-forces');
  });

  it('should render with radial force', async () => {
    const d3Force = new D3ForceLayout({
      radial: {
        radius: 100,
        x: 250,
        y: 250,
      },
    });
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'radial-force');
  });

  it('should handle custom alphaDecay', async () => {
    const d3Force = new D3ForceLayout({
      alphaDecay: 0.1,
    });
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'alpha-decay-0.1');
  });

  it('should handle custom velocityDecay', async () => {
    const d3Force = new D3ForceLayout({
      velocityDecay: 0.5,
    });
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'velocity-decay-0.5');
  });

  it('returns empty result for empty graph', async () => {
    const emptyGraph = new Graph({ nodes: [], edges: [] });
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(emptyGraph);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should handle single node graph', async () => {
    const singleGraph = new Graph({
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    });
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(singleGraph);
    expect(positions.nodes[0].data.x).toBeDefined();
    expect(positions.nodes[0].data.y).toBeDefined();
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
    const d3Force = new D3ForceLayout();
    await d3Force.assign(testGraph, {});
    const allNodes = testGraph.getAllNodes();
    allNodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should use tick method to manually step simulation', async () => {
    const d3Force = new D3ForceLayout();
    await d3Force.execute(graph);
    d3Force.stop();
    const positions = d3Force.tick(10);
    expect(positions.nodes.length).toBeGreaterThan(0);
    expect(positions.nodes[0].data.x).toBeDefined();
    expect(positions.nodes[0].data.y).toBeDefined();
  });

  it('should stop simulation', async () => {
    const d3Force = new D3ForceLayout();
    d3Force.execute(graph);
    d3Force.stop();
    // Simulation should be stopped
    expect(d3Force.simulation).toBeDefined();
  });

  it('should restart simulation', async () => {
    const d3Force = new D3ForceLayout();
    await d3Force.execute(graph);
    d3Force.stop();
    d3Force.restart();
    // Should be able to restart
    expect(d3Force.simulation).toBeDefined();
  });

  it('should set fixed position', async () => {
    const d3Force = new D3ForceLayout();
    await d3Force.execute(graph);
    const nodeId = graph.getAllNodes()[0].id;
    d3Force.setFixedPosition(nodeId, [100, 200]);
    const node = d3Force['context'].nodes.find((n) => n.id === nodeId);
    expect(node?.fx).toBe(100);
    expect(node?.fy).toBe(200);
  });

  it('should unset fixed position with null', async () => {
    const d3Force = new D3ForceLayout();
    await d3Force.execute(graph);
    const nodeId = graph.getAllNodes()[0].id;
    d3Force.setFixedPosition(nodeId, [100, 200]);
    d3Force.setFixedPosition(nodeId, [null, null]);
    const node = d3Force['context'].nodes.find((n) => n.id === nodeId);
    expect(node?.fx).toBe(null);
    expect(node?.fy).toBe(null);
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
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(completeGraph);
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
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(starGraph);
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
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(pathGraph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'path-graph');
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
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(disconnectedGraph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'disconnected-components');
  });

  it('should verify all positions are valid numbers', async () => {
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(graph);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should handle self-loop edges', async () => {
    const loopGraph = new Graph({
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'a', data: {} },
        { id: 'e2', source: 'a', target: 'b', data: {} },
      ],
    });
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(loopGraph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'self-loop');
  });

  it('should handle nodes with initial positions', async () => {
    const positionGraph = new Graph({
      nodes: [
        { id: 'a', data: { x: 100, y: 100 } },
        { id: 'b', data: { x: 200, y: 100 } },
        { id: 'c', data: { x: 150, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
      ],
    });
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(positionGraph);
    positions.nodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
    });
  });

  it('should handle nodes with velocity', async () => {
    const velocityGraph = new Graph({
      nodes: [
        { id: 'a', data: { vx: 10, vy: 10 } },
        { id: 'b', data: { vx: -10, vy: 10 } },
        { id: 'c', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
      ],
    });
    const d3Force = new D3ForceLayout();
    const positions = await d3Force.execute(velocityGraph);
    positions.nodes.forEach((node) => {
      expect(typeof node.data.vx).toBe('number');
      expect(typeof node.data.vy).toBe('number');
    });
  });

  // FIXME
  // it('should handle custom alpha values', async () => {
  //   const d3Force = new D3ForceLayout({
  //     alpha: 0.5,
  //     alphaMin: 0.01,
  //     alphaTarget: 0.1,
  //   });
  //   const positions = await d3Force.execute(graph);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'custom-alpha');
  // });

  it('should handle combined forces', async () => {
    const d3Force = new D3ForceLayout({
      link: {
        id: (d: any) => d.id,
        distance: 80,
        strength: 0.5,
      },
      manyBody: {
        strength: -50,
      },
      center: {
        x: 250,
        y: 250,
      },
      collide: {
        radius: 15,
      },
    });
    const positions = await d3Force.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'combined-forces');
  });
});

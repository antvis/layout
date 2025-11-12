import { ForceLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { Graph } from '@antv/graphlib';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { countries } from '../dataset';
import { renderNodesAndEdges } from '../utils/render';

describe('layout force', () => {
  let canvas: Canvas;
  let graph: Graph<any, any>;
  let force: ForceLayout;

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas(null, 1000, 1000);
    const { nodes, edges } = countries;
    graph = new Graph({ nodes, edges });
    force = new ForceLayout({ center: [500, 500], width: 1000, height: 1000 });
  });

  afterEach(() => {
    clearMockRandom();
    canvas.destroy();
    force.stop();
  });

  it('should render with default config', async () => {
    force.execute(graph);
    force.stop();
    const positions = force.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should return correct default config', () => {
    const layout = new ForceLayout();
    expect(layout.options).toMatchObject({
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

  it('should render with custom gravity', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      gravity: 20,
      width: 1000,
      height: 1000,
    });
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'gravity-20');
  });

  it('should render with low gravity', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      gravity: 1,
      width: 1000,
      height: 1000,
    });
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'gravity-1');
  });

  it('should render with custom linkDistance', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      linkDistance: 100,
      width: 1000,
      height: 1000,
    });
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'linkDistance-100');
  });

  it('should render with custom edgeStrength', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      edgeStrength: 100,
      width: 1000,
      height: 1000,
    });
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'edgeStrength-100');
  });

  it('should render with custom nodeStrength', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      nodeStrength: 2000,
      width: 1000,
      height: 1000,
    });
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
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
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'preventOverlap-false');
  });

  it('should render with custom center', async () => {
    const layout = new ForceLayout({
      center: [300, 300],
      maxIteration: 100,
      width: 1000,
      height: 1000,
    });
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('should render with custom width and height', async () => {
    const layout = new ForceLayout({
      center: [500, 500],
      maxIteration: 100,
      width: 800,
      height: 600,
    });
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-dimensions');
  });

  it('returns empty result for empty graph', async () => {
    const emptyGraph = new Graph({ nodes: [], edges: [] });
    const layout = new ForceLayout();
    const positions = await layout.execute(emptyGraph);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  // FIXME: enable this test after fixing the issue of single node layout
  // it('assign places single node at center', async () => {
  //   const singleGraph = new Graph({
  //     nodes: [{ id: 'a', data: {} }],
  //     edges: [] as any,
  //   });
  //   const layout = new ForceLayout();
  //   await layout.assign(singleGraph, { center: [10, 20] } as any);
  //   const n = singleGraph.getAllNodes()[0];
  //   expect((n.data as any).x).toBe(10);
  //   expect((n.data as any).y).toBe(20);
  // });

  // FIXME: enable this test after fixing the issue of single node layout
  // it('should handle single node graph', async () => {
  //   const singleGraph = new Graph({
  //     nodes: [{ id: 'node', data: {} }],
  //     edges: [],
  //   });
  //   const layout = new ForceLayout({ center: [10, 20] });
  //   const positions = await layout.execute(singleGraph);
  //   expect(positions.nodes[0].data.x).toBe(10);
  //   expect(positions.nodes[0].data.y).toBe(20);
  // });

  it('should handle clustering with nodeClusterBy', async () => {
    const clusterGraph = new Graph({
      nodes: [
        { id: 'node0', data: { cluster: 'a' } },
        { id: 'node1', data: { cluster: 'c' } },
        { id: 'node2', data: { cluster: 'b' } },
        { id: 'node3', data: { cluster: 'a' } },
        { id: 'node4', data: { cluster: 'c' } },
        { id: 'node5', data: { cluster: 'b' } },
      ],
      edges: [],
    });
    const layout = new ForceLayout({
      clustering: true,
      nodeClusterBy: 'cluster',
      maxIteration: 100,
    });
    layout.execute(clusterGraph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'clustering');
  });

  it('should cluster nodes with custom clusterNodeStrength', async () => {
    const clusterGraph = new Graph({
      nodes: [
        { id: 'a1', data: { type: 'A' } },
        { id: 'a2', data: { type: 'A' } },
        { id: 'a3', data: { type: 'A' } },
        { id: 'b1', data: { type: 'B' } },
        { id: 'b2', data: { type: 'B' } },
        { id: 'b3', data: { type: 'B' } },
      ],
      edges: [],
    });
    const layout = new ForceLayout({
      clustering: true,
      nodeClusterBy: 'type',
      clusterNodeStrength: 40,
      maxIteration: 100,
    });
    layout.execute(clusterGraph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'cluster-strength-40');
  });

  it('should handle onTick callback', async () => {
    let tickCount = 0;
    const onTick = (data: any) => {
      expect(data.nodes.length).toBeGreaterThan(0);
      expect(data.nodes[0].data.x).toBeDefined();
      expect(data.nodes[0].data.y).toBeDefined();
      tickCount++;
    };

    const layout = new ForceLayout({
      maxIteration: 10,
      onTick,
    });
    await layout.execute(graph);
    expect(tickCount).toBeGreaterThanOrEqual(1);
  });

  it('should handle overlapped nodes', async () => {
    const overlapGraph = new Graph({
      nodes: [
        { id: 'node0', data: { x: 100, y: 100 } },
        { id: 'node1', data: { x: 100, y: 100 } },
        { id: 'node2', data: { x: 150, y: 120 } },
      ],
      edges: [
        { id: 'edge0', source: 'node2', target: 'node2', data: {} },
        { id: 'edge1', source: 'node1', target: 'node1', data: {} },
      ],
    });
    const layout = new ForceLayout({ maxIteration: 100, preventOverlap: true });
    layout.execute(overlapGraph);
    layout.stop();
    const positions = layout.tick(100);
    // After layout with preventOverlap, overlapped nodes should be separated
    expect(positions.nodes[0].data.x).not.toEqual(positions.nodes[1].data.x);
    expect(positions.nodes[0].data.y).not.toEqual(positions.nodes[1].data.y);
  });

  it('should use tick method to manually step simulation', () => {
    const layout = new ForceLayout({ maxIteration: 1000 });
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    expect(positions.nodes.length).toBeGreaterThan(0);
    expect(positions.nodes[0].data.x).toBeDefined();
    expect(positions.nodes[0].data.y).toBeDefined();
  });

  it('should stop simulation', async () => {
    const layout = new ForceLayout({ maxIteration: 1000 });
    layout.execute(graph);
    layout.stop();
    expect(layout['running']).toBe(false);
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
    const layout = new ForceLayout({ maxIteration: 50 });
    await layout.assign(testGraph, {});
    const allNodes = testGraph.getAllNodes();
    allNodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
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
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(completeGraph);
    layout.stop();
    const positions = layout.tick(100);
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
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(starGraph);
    layout.stop();
    const positions = layout.tick(100);
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
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(pathGraph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'path-graph');
  });

  it('should handle fixed node positions', async () => {
    const fixedGraph = new Graph({
      nodes: [
        { id: 'a', data: { fx: 100, fy: 100 } },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
      ],
    });
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(fixedGraph);
    layout.stop();
    const positions = layout.tick(100);
    // Fixed node should stay at its position
    expect(positions.nodes[0].data.x).toBe(100);
    expect(positions.nodes[0].data.y).toBe(100);
  });

  it('should render with low maxIteration', async () => {
    const layout = new ForceLayout({ maxIteration: 10 });
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(10);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'max-iteration-10');
  });

  it('should render disconnected components', async () => {
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
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(disconnectedGraph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'disconnected-components');
  });

  it('should verify all positions are valid numbers', async () => {
    force.execute(graph);
    force.stop();
    const positions = force.tick(100);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should handle nodes without initial positions', async () => {
    const noPositionGraph = new Graph({
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
      ],
    });
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(noPositionGraph);
    layout.stop();
    const positions = layout.tick(100);
    positions.nodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
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
    const layout = new ForceLayout({ maxIteration: 100 });
    layout.execute(loopGraph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
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
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
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
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
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
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
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
    layout.execute(graph);
    layout.stop();
    const positions = layout.tick(100);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'threshold-min');
  });
});

import { CircularLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { Graph } from '@antv/graphlib';
import { countries } from '../dataset';
import { renderNodes } from '../utils';
import { renderNodesAndEdges } from '../utils/render';

describe('layout circular', () => {
  let canvas: Canvas;
  let graph: Graph<any, any>;
  let circular: CircularLayout;

  beforeEach(() => {
    canvas = createCanvas();
    const { nodes, edges } = countries;
    graph = new Graph({ nodes, edges });
    circular = new CircularLayout({
      center: [250, 250],
      radius: 200,
    });
  });

  afterEach(() => {
    canvas.destroy();
  });

  it('should render with default config', async () => {
    const positions = await circular.execute(graph);
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom radius', async () => {
    const positions = await circular.execute(graph, { radius: 180 });
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'radius-180');
  });

  it('should render with startRadius and endRadius', async () => {
    const positions = await circular.execute(graph, {
      radius: 0,
      startRadius: 100,
      endRadius: 200,
    });
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'startRadius-100-endRadius-200',
    );
  });

  it('should render with custom angle range', async () => {
    const positions = await circular.execute(graph, {
      startAngle: Math.PI,
      endAngle: Math.PI * 2,
    });
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'startAngle-PI-endAngle-2PI',
    );
  });

  it('should render counterclockwise with radius range', async () => {
    const positions = await circular.execute(graph, {
      clockwise: false,
      radius: 0,
      startRadius: 100,
      endRadius: 200,
    });
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'counterclockwise-radius-range',
    );
  });

  it('should render with divisions', async () => {
    const positions = await circular.execute(graph, {
      divisions: 5,
      radius: 200,
      startAngle: Math.PI / 4,
      endAngle: Math.PI,
    });
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'divisions-5');
  });

  it('should render with custom center', async () => {
    const positions = await circular.execute(graph, {
      center: [300, 300],
    });
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('should render with zero radius', async () => {
    await circular.assign(graph, {
      radius: 0,
    });
    const allNodes = graph.getAllNodes();
    allNodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('returns empty positionsult for empty graph', async () => {
    const graph = new Graph({ nodes: [], edges: [] });
    const layout = new CircularLayout({ center: [0, 0], radius: 100 });
    const positions = await layout.execute(graph, {} as any);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('assign places single node at center', async () => {
    const graph = new Graph({
      nodes: [{ id: 'a', data: {} }],
      edges: [] as any,
    });
    const layout = new CircularLayout();
    await layout.assign(graph, { center: [10, 20] } as any);
    const n = graph.getAllNodes()[0];
    expect((n.data as any).x).toBe(10);
    expect((n.data as any).y).toBe(20);
  });

  it('degree ordering places highest degree at the end', async () => {
    const nodes = [
      { id: 'A', data: {} },
      { id: 'B', data: {} },
      { id: 'C', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'A', target: 'B', data: {} },
      { id: 'e2', source: 'A', target: 'C', data: {} },
    ];
    const graph = new Graph({ nodes: nodes as any, edges: edges as any });
    const layout = new CircularLayout({ center: [0, 0], radius: 100 });
    const positions = await layout.execute(graph, {
      ordering: 'degree',
    } as any);
    // A has degree 2, B and C have degree 1 -> A should be last (sorted ascending)
    expect(positions.nodes[positions.nodes.length - 1].id).toBe('A');
  });

  it('should layout according to the topology', async () => {
    const positions = await circular.execute(graph, {
      ordering: 'topology',
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'ordering-topology');
  });

  it('should layout according to the topology-directed', async () => {
    const positions = await circular.execute(graph, {
      ordering: 'topology-directed',
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'ordering-topology-directed',
    );
  });

  it('should layout according to the original order', async () => {
    const positions = await circular.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'ordering-original');
  });

  it('should layout according to degree', async () => {
    const positions = await circular.execute(graph, {
      ordering: 'degree',
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'ordering-degree');
  });

  it('nodeSpacing / nodeSize branch computes positions', async () => {
    const positions = await circular.execute(graph, {
      nodeSpacing: () => 5,
      nodeSize: () => 20,
    } as any);
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'nodeSize-nodeSpacing-fn');
  });

  it('startRadius only (without endRadius) should set endRadius equal to startRadius', async () => {
    const positions = await circular.execute(graph, {
      startRadius: 150,
      endRadius: undefined,
    });
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'startRadius-only');
  });

  it('endRadius only (without startRadius) should set startRadius equal to endRadius', async () => {
    const positions = await circular.execute(graph, {
      startRadius: undefined,
      endRadius: 150,
    });
    await renderNodes(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'endRadius-only');
  });

  it('assign mode should directly modify graph node positions', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const graph = new Graph({ nodes: nodes as any, edges: [] as any });
    const layout = new CircularLayout({ center: [100, 100], radius: 50 });
    await layout.assign(graph, {});
    const allNodes = graph.getAllNodes();
    allNodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
  });

  it('should calculate center when not provided', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ];
    const graph = new Graph({ nodes: nodes as any, edges: [] as any });
    const layout = new CircularLayout({ radius: 50 });
    // Don't provide center, it should be calculated
    const positions = await layout.execute(graph, {});
    expect(positions.nodes).toHaveLength(2);
    positions.nodes.forEach((n) => {
      expect(Number.isFinite(n.data.x)).toBe(true);
      expect(Number.isFinite(n.data.y)).toBe(true);
    });
  });
});

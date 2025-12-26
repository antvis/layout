import { DagreLayout, Point } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { combo as comboData, dagre as data } from '../dataset';
import { GraphRenderer } from '../utils';
import { calculatePositions } from '../utils';

describe('layout dagre', () => {
  let canvas: Canvas;
  let dagre: DagreLayout;
  let renderer: GraphRenderer;

  const renderLayout = async (layout: DagreLayout, options: any = {}) => {
    await renderer.render(layout, {
      nodeShape: 'rect',
      nodeSize: { width: 60, height: 30 },
      nodeStyle: { fill: '#A7E9AF', stroke: '#333', lineWidth: 1 },
      showLabel: true,
      edgeShape: 'polyline',
      ...options,
    });

    // Apply rect positioning for dagre
    layout.forEachNode((node) => {
      if (node.size) {
        renderer.updateNodeAttributes(node.id, {
          x: node.x - node.size[0] / 2,
          y: node.y - node.size[1] / 2,
          width: node.size[0],
          height: node.size[1],
        });
      }
    });
  };

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas(null, 900, 500);
    renderer = new GraphRenderer(canvas);
    dagre = new DagreLayout({
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
    });
  });

  afterEach(() => {
    clearMockRandom();
    canvas.destroy();
  });

  it('should return correct default config', () => {
    const layout = new DagreLayout();
    expect(layout.options).toEqual({
      directed: true,
      multigraph: true,
      rankdir: 'TB',
      align: undefined,
      nodesep: 50,
      edgesep: 10,
      ranksep: 50,
      marginx: 0,
      marginy: 0,
      acyclicer: undefined,
      ranker: 'network-simplex',
      nodeSize: [0, 0],
      edgeMinLen: 1,
      edgeWeight: 1,
      edgeLabelSize: [0, 0],
      edgeLabelPos: 'r',
      edgeLabelOffset: 10,
    });
  });

  it('should render with default config', async () => {
    await dagre.execute(data);
    await renderLayout(dagre);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with TB (top-bottom) direction', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'rankdir-TB');
  });

  it('should render with BT (bottom-top) direction', async () => {
    const layout = new DagreLayout({
      rankdir: 'BT',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'rankdir-BT');
  });

  it('should render with LR (left-right) direction', async () => {
    const layout = new DagreLayout({
      rankdir: 'LR',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'rankdir-LR');
  });

  it('should render with RL (right-left) direction', async () => {
    const layout = new DagreLayout({
      rankdir: 'RL',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'rankdir-RL');
  });

  it('should render with custom nodesep', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 20,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'nodesep-20');
  });

  it('should render with custom ranksep', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 20,
      nodesep: 50,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'ranksep-20');
  });

  it('should render with custom edgesep', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      edgesep: 30,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'edgesep-30');
  });

  it('should render with align UL', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      align: 'UL',
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'align-UL');
  });

  it('should render with align UR', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      align: 'UR',
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'align-UR');
  });

  it('should render with align DL', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      align: 'DL',
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'align-DL');
  });

  it('should render with align DR', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      align: 'DR',
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'align-DR');
  });

  it('should render with margins', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      marginx: 50,
      marginy: 50,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'margins-50');
  });

  it('should render with compound groups', async () => {
    // Prepare data with combos
    const processedData = {
      ...comboData,
      nodes: [
        ...comboData.nodes,
        ...comboData.combos.map((combo: any) => ({
          id: combo.id,
          isCombo: true,
        })),
      ],
    };

    const layout = new DagreLayout({
      node: (d) => ({
        parentId: d.comboId,
      }),
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      compound: true,
    });

    await layout.execute(processedData);
    await renderLayout(layout);

    // Update group node styles
    layout.forEachNode((node) => {
      if (node._original.isCombo) {
        renderer.updateNodeAttributes(node.id, {
          zIndex: 0,
          fillOpacity: 0.3,
        });
      }
    });

    await expect(canvas).toMatchSnapshot(__filename, 'compound-groups');
  });

  it('should render undirected graph', async () => {
    const layout = new DagreLayout({
      directed: false,
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'undirected');
  });

  it('should render with function nodeSize', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: (d) => [Math.random() * 40 + 20, Math.random() * 20 + 10],
      ranksep: 0,
      nodesep: 0,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'nodeSize-function');
  });

  it('should render with custom edge properties', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      edgeMinLen: 2,
      edgeWeight: 2,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-edge-properties');
  });

  it('should render with function edge properties', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      edgeMinLen: (d) => (d?.weight ? 2 : 1),
      edgeWeight: (d) => d?.weight || 1,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'edge-properties-function',
    );
  });

  it('should render with edge labels', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      edgeLabelSize: [40, 20],
      edgeLabelPos: 'c',
      edgeLabelOffset: 5,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'edge-labels');
  });

  it('should render with function edge label properties', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      edgeLabelSize: (d) => [50, 20],
      edgeLabelPos: (d) => 'c',
      edgeLabelOffset: (d) => 10,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'edge-labels-function');
  });

  it('should render with tight-tree ranker', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      ranker: 'tight-tree',
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'ranker-tight-tree');
  });

  it('should render with longest-path ranker', async () => {
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      ranker: 'longest-path',
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'ranker-longest-path');
  });

  it('returns empty result for empty graph', async () => {
    const layout = new DagreLayout();
    await layout.execute({ nodes: [], edges: [] });
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should handle single node graph', async () => {
    const layout = new DagreLayout({
      nodeSize: [60, 30],
    });
    await layout.execute({
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    });
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(1);
    expect(typeof positions.nodes[0].x).toBe('number');
    expect(typeof positions.nodes[0].y).toBe('number');
    expect(positions.nodes[0].size).toEqual([60, 30]);
  });

  it('should handle simple chain graph', async () => {
    const chainGraph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
      ],
    };
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
    });
    await layout.execute(chainGraph);
    await renderLayout(layout);

    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(3);
    expect(positions.edges).toHaveLength(2);

    // In TB direction, y positions should increase
    const nodeA = positions.nodes.find((n) => n.id === 'a');
    const nodeB = positions.nodes.find((n) => n.id === 'b');
    const nodeC = positions.nodes.find((n) => n.id === 'c');
    expect(nodeA.y).toBeLessThan(nodeB.y);
    expect(nodeB.y).toBeLessThan(nodeC.y);

    await expect(canvas).toMatchSnapshot(__filename, 'simple-chain');
  });

  it('should handle tree structure', async () => {
    const treeGraph = {
      nodes: [
        { id: 'root', data: {} },
        { id: 'child1', data: {} },
        { id: 'child2', data: {} },
        { id: 'child3', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'root', target: 'child1', data: {} },
        { id: 'e2', source: 'root', target: 'child2', data: {} },
        { id: 'e3', source: 'root', target: 'child3', data: {} },
      ],
    };
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
    });
    await layout.execute(treeGraph);
    await renderLayout(layout);

    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(4);
    expect(positions.edges).toHaveLength(3);

    await expect(canvas).toMatchSnapshot(__filename, 'tree-structure');
  });

  it('should handle graph with cycles', async () => {
    const cyclicGraph = {
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
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
    });
    await layout.execute(cyclicGraph);
    await renderLayout(layout);

    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(4);
    expect(positions.edges).toHaveLength(4);

    await expect(canvas).toMatchSnapshot(__filename, 'cyclic-graph');
  });

  it('should verify all positions are valid numbers', async () => {
    await dagre.execute(data);
    const positions = calculatePositions(dagre);
    positions.nodes.forEach((node) => {
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
      if (node.size) {
        expect(Array.isArray(node.size)).toBe(true);
        expect(node.size.length).toBe(2);
        expect(Number.isFinite(node.size[0])).toBe(true);
        expect(Number.isFinite(node.size[1])).toBe(true);
      }
    });
  });

  it('should verify edge points are calculated', async () => {
    await dagre.execute(data);
    const positions = calculatePositions(dagre);
    positions.edges.forEach((edge) => {
      if (edge.points) {
        expect(Array.isArray(edge.points)).toBe(true);
        edge.points.forEach((point: Point) => {
          expect(Number.isFinite(point[0])).toBe(true);
          expect(Number.isFinite(point[1])).toBe(true);
        });
      }
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
    const layout = new DagreLayout({
      rankdir: 'TB',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
    });

    await layout.execute(disconnectedGraph);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'disconnected-components');
  });

  it('should handle multigraph with multiple edges between same nodes', async () => {
    const multigraph = {
      nodes: [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'a', target: 'b', data: {} },
        { id: 'e3', source: 'b', target: 'a', data: {} },
      ],
    };
    const layout = new DagreLayout({
      rankdir: 'LR',
      nodeSize: [60, 30],
      ranksep: 50,
      nodesep: 50,
      multigraph: true,
    });

    await layout.execute(multigraph);
    await renderLayout(layout);

    const positions = calculatePositions(layout);
    expect(positions.edges).toHaveLength(3);

    await expect(canvas).toMatchSnapshot(__filename, 'multigraph');
  });
});

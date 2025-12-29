import { D3ForceLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { clear as clearMockRandom, mock as mockRandom } from 'jest-random-mock';
import { d3Force as data } from '../dataset';
import { calculatePositions, GraphRenderer } from '../utils';

describe('layout d3-force', () => {
  let canvas: Canvas;
  let width: number;
  let height: number;
  let renderer: GraphRenderer;

  const renderLayout = async (layout: D3ForceLayout) => {
    await renderer.render(layout, {
      nodeRadius: 5,
      nodeStyle: { lineWidth: 1 },
    });
  };

  beforeEach(() => {
    mockRandom();
    canvas = createCanvas(null, 700, 700);
    renderer = new GraphRenderer(canvas);
    width = canvas.getConfig().width;
    height = canvas.getConfig().height;
  });

  afterEach(() => {
    clearMockRandom();
    canvas.destroy();
  });

  it('should render with correct config', async () => {
    const d3Force = new D3ForceLayout();
    await d3Force.execute(data, {
      width,
      height,
      x: {},
      y: {},
    });

    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render inside specified viewport', async () => {
    const constrainBox = { x: 60, y: 50, width: 500, height: 150 };

    const onTick = (layout) => {
      let minx = 99999999;
      let maxx = -99999999;
      let miny = 99999999;
      let maxy = -99999999;
      let maxsize = -9999999;
      layout.forEachNode((node) => {
        if (minx > node.x) {
          minx = node.x;
        }
        if (maxx < node.x) {
          maxx = node.x;
        }
        if (miny > node.y) {
          miny = node.y;
        }
        if (maxy < node.y) {
          maxy = node.y;
        }
        if (maxsize < node.size) {
          maxsize = node.size;
        }
      });
      const scalex = (constrainBox.width - maxsize) / (maxx - minx);
      const scaley = (constrainBox.height - maxsize) / (maxy - miny);
      layout.forEachNode((node) => {
        node.x = (node.x - minx) * scalex + constrainBox.x;
        node.y = (node.y - miny) * scaley + constrainBox.y;
      });
    };

    const d3Force = new D3ForceLayout();
    await d3Force.execute(data, {
      width,
      height,
      onTick,
      x: {},
      y: {},
    });
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'specified-viewport');
  });

  it('should render with manyBody force', async () => {
    const d3Force = new D3ForceLayout({
      width,
      height,
      nodeStrength: -20,
      x: {},
      y: {},
    });
    await d3Force.execute(data);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'manyBody-strength');
  });

  it('should render with link force', async () => {
    const d3Force = new D3ForceLayout({
      linkDistance: 100,
      width,
      height,
      x: {},
      y: {},
    });
    await d3Force.execute(data);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'link-distance');
  });

  it('should render with collide force', async () => {
    const d3Force = new D3ForceLayout({
      width,
      height,
      preventOverlap: true,
      nodeSize: 20,
      x: {},
      y: {},
    });
    await d3Force.execute(data);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'collide-radius');
  });

  it('should render with radial force', async () => {
    const radialGraph = {
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
    const d3Force = new D3ForceLayout({
      width,
      height,
      radialRadius: 100,
      radialX: 250,
      radialY: 250,
      x: {},
      y: {},
    });
    await d3Force.execute(radialGraph);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'radial-force');
  });

  it('returns empty result for empty graph', async () => {
    const emptyGraph = { nodes: [], edges: [] };
    const d3Force = new D3ForceLayout();
    await d3Force.execute(emptyGraph);
    const positions = calculatePositions(d3Force);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should handle single node graph', async () => {
    const singleGraph = {
      nodes: [{ id: 'node', data: {} }],
      edges: [],
    };
    const d3Force = new D3ForceLayout();
    await d3Force.execute(singleGraph);
    const positions = calculatePositions(d3Force);
    expect(positions.nodes).toHaveLength(1);
    expect(positions.nodes[0].x).toBeDefined();
    expect(positions.nodes[0].y).toBeDefined();
  });

  it('should set fixed position', async () => {
    const d3Force = new D3ForceLayout();
    await d3Force.execute(data);
    const nodeId = data.nodes[0].id;
    d3Force.setFixedPosition(nodeId, [100, 200]);
    const positions = calculatePositions(d3Force);
    const node = positions.nodes.find((n) => n.id === nodeId);
    expect(node?.fx).toBe(100);
    expect(node?.fy).toBe(200);
  });

  it('should unset fixed position with null', async () => {
    const d3Force = new D3ForceLayout();
    await d3Force.execute(data);
    const nodeId = data.nodes[0].id;
    d3Force.setFixedPosition(nodeId, [100, 200]);
    d3Force.setFixedPosition(nodeId, [null, null]);
    const positions = calculatePositions(d3Force);
    const node = positions.nodes.find((n) => n.id === nodeId);
    expect(node?.fx).toBe(null);
    expect(node?.fy).toBe(null);
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
    const d3Force = new D3ForceLayout();
    await d3Force.execute(starGraph, {
      width,
      height,
      x: {},
      y: {},
    });
    renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'star-graph');
  });

  it('should use tick method to manually step simulation', async () => {
    const d3Force = new D3ForceLayout();
    d3Force.execute(data);
    d3Force.stop();
    d3Force.tick(10);
    const positions = calculatePositions(d3Force);
    expect(positions.nodes.length).toBeGreaterThan(0);
    expect(positions.nodes[0].x).toBeDefined();
    expect(positions.nodes[0].y).toBeDefined();
  });

  it('should stop simulation', async () => {
    const d3Force = new D3ForceLayout();
    d3Force.execute(data);
    d3Force.stop();
    // Simulation should be stopped
    expect(d3Force.simulation).toBeDefined();
  });

  it('should restart simulation', async () => {
    const d3Force = new D3ForceLayout();
    d3Force.execute(data);
    d3Force.stop();
    d3Force.restart();
    // Should be able to restart
    expect(d3Force.simulation).toBeDefined();
  });

  it('should handle nodes with initial positions', async () => {
    const positionGraph = {
      nodes: [
        { id: 'a', data: { x: 100, y: 100 } },
        { id: 'b', data: { x: 200, y: 100 } },
        { id: 'c', data: { x: 150, y: 200 } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
      ],
    };
    const d3Force = new D3ForceLayout();
    await d3Force.execute(positionGraph, {
      node: (d) => ({
        id: d.id,
        x: d.data.x,
        y: d.data.y,
      }),
      x: {},
      y: {},
    });
    d3Force.forEachNode((node) => {
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
    });
  });

  it('should render with clustering force', async () => {
    const clusterGraph = {
      nodes: [
        { id: 'a', data: { cluster: 'group1' } },
        { id: 'b', data: { cluster: 'group1' } },
        { id: 'c', data: { cluster: 'group2' } },
        { id: 'd', data: { cluster: 'group2' } },
        { id: 'e', data: { cluster: 'group3' } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
        { id: 'e3', source: 'c', target: 'd', data: {} },
        { id: 'e4', source: 'd', target: 'e', data: {} },
        { id: 'e5', source: 'e', target: 'a', data: {} },
      ],
    };
    const d3Force = new D3ForceLayout({
      width,
      height,
      clustering: true,
      clusterBy: (d) => d.data.cluster,
      clusterNodeStrength: -2,
      clusterEdgeStrength: 0.2,
      clusterEdgeDistance: 150,
      clusterFociStrength: 0.9,
      clusterNodeSize: 15,
      x: {},
      y: {},
    });
    await d3Force.execute(clusterGraph);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'clustering-force');
  });

  it('should render with X and Y forces', async () => {
    const d3Force = new D3ForceLayout({
      width,
      height,
      forceXPosition: 350,
      forceXStrength: 0.3,
      forceYPosition: 350,
      forceYStrength: 0.3,
      x: {},
      y: {},
    });
    await d3Force.execute(data);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'xy-forces');
  });

  it('should handle alpha methods', async () => {
    const d3Force = new D3ForceLayout();
    await d3Force.execute(data);

    // Test getAlpha
    const alpha = d3Force.getAlpha();
    expect(typeof alpha).toBe('number');

    // Test setAlpha
    d3Force.setAlpha(0.5);
    expect(d3Force.getAlpha()).toBe(0.5);

    // Test reheat
    d3Force.reheat();
    expect(d3Force.getAlpha()).toBe(1);
  });

  it('should use custom simulation', async () => {
    const { forceSimulation } = require('d3-force');
    const customSimulation = forceSimulation();

    const d3Force = new D3ForceLayout({
      width,
      height,
      forceSimulation: customSimulation,
      x: {},
      y: {},
    });

    await d3Force.execute(data);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-simulation');
  });

  it('should handle force options as objects', async () => {
    const d3Force = new D3ForceLayout({
      width,
      height,
      center: { x: 300, y: 300, strength: 1 },
      manyBody: { strength: -50, theta: 0.8 },
      link: { distance: 30, strength: 0.5 },
      collide: { radius: 10, strength: 1 },
      radial: { radius: 120, strength: 0.6, x: 350, y: 350 },
      x: { x: 300, strength: 0.4 },
      y: { y: 300, strength: 0.4 },
    });

    await d3Force.execute(data);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'force-options');
  });

  it('should handle disabled forces', async () => {
    const d3Force = new D3ForceLayout({
      width,
      height,
      center: false,
      manyBody: false,
      collide: false,
      radial: false,
      x: false,
      y: false,
    });

    await d3Force.execute(data);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'disabled-forces');
  });

  it('should handle function-based options', async () => {
    const d3Force = new D3ForceLayout({
      width,
      height,
      nodeSize: (d) => (d.id === 'a' ? 20 : 10),
      nodeSpacing: (d) => (d.id === 'a' ? 5 : 2),
      nodeStrength: (d) => (d.id === 'a' ? -50 : -30),
      linkDistance: (d) => (d.source === 'a' ? 100 : 50),
      edgeStrength: (d) => (d.source === 'a' ? 0.8 : 0.5),
      x: {},
      y: {},
    });

    await d3Force.execute(data);
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'function-options');
  });

  it('should render lattice', async () => {
    function getData(size = 10) {
      const nodes = Array.from({ length: size * size }, (_, i) => ({
        id: `${i}`,
      }));
      const edges = [];
      for (let y = 0; y < size; ++y) {
        for (let x = 0; x < size; ++x) {
          if (y > 0)
            edges.push({
              source: `${(y - 1) * size + x}`,
              target: `${y * size + x}`,
            });
          if (x > 0)
            edges.push({
              source: `${y * size + (x - 1)}`,
              target: `${y * size + x}`,
            });
        }
      }
      return { nodes, edges };
    }

    const d3Force = new D3ForceLayout({
      width,
      height,
      manyBody: {
        strength: -30,
      },
      link: {
        strength: 1,
        distance: 20,
        iterations: 10,
      },
    });
    await d3Force.execute(getData());
    await renderLayout(d3Force);
    await expect(canvas).toMatchSnapshot(__filename, 'lattice');
  });
});

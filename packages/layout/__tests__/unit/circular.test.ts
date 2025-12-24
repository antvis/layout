import { CircularLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { countries as data } from '../dataset';
import { GraphRenderer } from '../utils';
import { calculatePositions } from '../utils';

describe('layout circular', () => {
  let canvas: Canvas;
  let circular: CircularLayout;
  let renderer: GraphRenderer;

  const renderLayout = async (layout: CircularLayout) => {
    await renderer.render(layout, {
      nodeRadius: 10,
      nodeStyle: { lineWidth: 2 },
    });
  };

  beforeEach(() => {
    canvas = createCanvas();
    renderer = new GraphRenderer(canvas);
    circular = new CircularLayout({
      center: [250, 250],
      radius: 200,
    });
  });

  afterEach(() => {
    canvas.destroy();
  });

  it('should return correct default config', () => {
    const layout = new CircularLayout();
    expect(layout.options).toEqual({
      radius: null,
      startRadius: null,
      endRadius: null,
      startAngle: 0,
      endAngle: 2 * Math.PI,
      clockwise: true,
      divisions: 1,
      ordering: null,
      angleRatio: 1,
      nodeSize: 10,
    });
  });

  it('should render with default config', async () => {
    await circular.execute(data);
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom radius', async () => {
    await circular.execute(data, { radius: 180 });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename, 'radius-180');
  });

  it('should render with startRadius and endRadius', async () => {
    await circular.execute(data, {
      radius: 0,
      startRadius: 100,
      endRadius: 200,
    });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'startRadius-100-endRadius-200',
    );
  });

  it('should render with custom angle range', async () => {
    await circular.execute(data, {
      startAngle: Math.PI,
      endAngle: Math.PI * 2,
    });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'startAngle-PI-endAngle-2PI',
    );
  });

  it('should render counterclockwise with radius range', async () => {
    await circular.execute(data, {
      clockwise: false,
      radius: 0,
      startRadius: 100,
      endRadius: 200,
    });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'counterclockwise-radius-range',
    );
  });

  it('should render with divisions', async () => {
    await circular.execute(data, {
      divisions: 5,
      radius: 200,
      startAngle: Math.PI / 4,
      endAngle: Math.PI,
    });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename, 'divisions-5');
  });

  it('should render with custom center', async () => {
    await circular.execute(data, {
      center: [300, 300],
    });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('returns empty positions for empty graph', async () => {
    const layout = new CircularLayout({ center: [0, 0], radius: 100 });
    await layout.execute({ nodes: [], edges: [] });
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('degree ordering places highest degree at the begin', async () => {
    const nodes = [
      { id: 'A', data: {} },
      { id: 'B', data: {} },
      { id: 'C', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'A', target: 'B', data: {} },
      { id: 'e2', source: 'A', target: 'C', data: {} },
    ];
    const data = { nodes, edges };
    const layout = new CircularLayout({ center: [0, 0], radius: 100 });
    await layout.execute(data, { ordering: 'degree' });
    const positions = calculatePositions(layout);
    // A has degree 2, B and C have degree 1 -> C should be last (sorted descending)
    expect(positions.nodes[positions.nodes.length - 1].id).toBe('C');
  });

  it('should layout according to the topology', async () => {
    await circular.execute(data, {
      ordering: 'topology',
    });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename, 'ordering-topology');
  });

  it('should layout according to the topology-directed', async () => {
    await circular.execute(data, {
      ordering: 'topology-directed',
    });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'ordering-topology-directed',
    );
  });

  it('should layout according to the original order', async () => {
    await circular.execute(data);
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename, 'ordering-original');
  });

  it('should layout according to degree', async () => {
    await circular.execute(data, { ordering: 'degree' });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename, 'ordering-degree');
  });

  it('nodeSpacing / nodeSize branch computes positions', async () => {
    await circular.execute(data, {
      nodeSpacing: () => 5,
      nodeSize: () => 20,
    } as any);
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename, 'nodeSize-nodeSpacing-fn');
  });

  it('startRadius only (without endRadius) should set endRadius equal to startRadius', async () => {
    await circular.execute(data, {
      startRadius: 150,
      endRadius: undefined,
    });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename, 'startRadius-only');
  });

  it('endRadius only (without startRadius) should set startRadius equal to endRadius', async () => {
    await circular.execute(data, {
      startRadius: undefined,
      endRadius: 150,
    });
    await renderLayout(circular);
    await expect(canvas).toMatchSnapshot(__filename, 'endRadius-only');
  });

  it('should calculate center when not provided', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ];
    const data = { nodes: nodes as any, edges: [] as any };
    const layout = new CircularLayout({ radius: 50 });
    // Don't provide center, it should be calculated
    await layout.execute(data, {});
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(2);
    positions.nodes.forEach((n) => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
  });
});

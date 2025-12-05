import { ConcentricLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { countries as data } from '../dataset';
import { GraphRenderer, RenderOptions } from '../utils';
import { calculatePositions } from '../utils/render-update';

describe('layout concentric', () => {
  let canvas: Canvas;
  let concentricLayout: ConcentricLayout;
  let renderer: GraphRenderer;

  const renderLayout = async (
    layout: ConcentricLayout,
    options: RenderOptions = {},
  ) => {
    await renderer.render(layout, {
      nodeRadius: 10,
      nodeStyle: { lineWidth: 2 },
      ...options,
    });
  };

  beforeEach(() => {
    canvas = createCanvas();
    const { width, height } = canvas.getConfig();
    concentricLayout = new ConcentricLayout({
      center: [width / 2, height / 2],
    });
    renderer = new GraphRenderer(canvas);
  });

  afterEach(() => {
    canvas.destroy();
  });

  it('should render with default config', async () => {
    await concentricLayout.execute(data);
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom center', async () => {
    await concentricLayout.execute(data, { center: [300, 300] });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('should render with clockwise false', async () => {
    await concentricLayout.execute(data, {
      clockwise: false,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'counterclockwise');
  });

  it('should render with equidistant enabled', async () => {
    await concentricLayout.execute(data, {
      equidistant: true,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'equidistant');
  });

  it('should render with custom startAngle', async () => {
    await concentricLayout.execute(data, {
      startAngle: 0,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'startAngle-0');
  });

  it('should render with custom startAngle and counterclockwise', async () => {
    await concentricLayout.execute(data, {
      startAngle: Math.PI / 2,
      clockwise: false,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'startAngle-PI-2-counterclockwise',
    );
  });

  it('should render with custom sweep', async () => {
    await concentricLayout.execute(data, {
      sweep: Math.PI,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'sweep-PI');
  });

  it('should render with sweep and startAngle', async () => {
    await concentricLayout.execute(data, {
      startAngle: Math.PI / 4,
      sweep: (3 * Math.PI) / 2,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'sweep-startAngle');
  });

  it('should render with preventOverlap enabled', async () => {
    await concentricLayout.execute(data, {
      preventOverlap: true,
      nodeSize: 20,
      nodeSpacing: 10,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'preventOverlap');
  });

  it('should render with preventOverlap and large nodeSize', async () => {
    await concentricLayout.execute(data, {
      preventOverlap: true,
      nodeSize: 30,
      nodeSpacing: 15,
    });
    await renderLayout(concentricLayout, { nodeRadius: 15 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-large-nodeSize',
    );
  });

  it('should render with preventOverlap and array nodeSize', async () => {
    await concentricLayout.execute(data, {
      preventOverlap: true,
      nodeSize: [40, 20],
      nodeSpacing: 10,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-array-nodeSize',
    );
  });

  it('should render with preventOverlap and function nodeSpacing', async () => {
    await concentricLayout.execute(data, {
      preventOverlap: true,
      nodeSize: 30,
      nodeSpacing: () => 15,
    });
    await renderLayout(concentricLayout, { nodeRadius: 15 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-fn-nodeSpacing',
    );
  });

  it('should render with preventOverlap and array nodeSpacing', async () => {
    await concentricLayout.execute(data, {
      preventOverlap: true,
      nodeSize: 30,
      nodeSpacing: 15,
    });
    await renderLayout(concentricLayout, { nodeRadius: 15 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-array-nodeSpacing',
    );
  });

  it('should render with sortBy degree', async () => {
    await concentricLayout.execute(data, {
      sortBy: 'degree',
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-degree');
  });

  it('should render with custom maxLevelDiff', async () => {
    await concentricLayout.execute(data, {
      maxLevelDiff: 0.5,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'maxLevelDiff-05');
  });

  it('should render with equidistant and preventOverlap', async () => {
    await concentricLayout.execute(data, {
      equidistant: true,
      preventOverlap: true,
      nodeSize: 20,
      nodeSpacing: 10,
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'equidistant-preventOverlap',
    );
  });

  it('should render with function nodeSize', async () => {
    await concentricLayout.execute(data, {
      nodeSize: () => 30,
      preventOverlap: true,
    });
    await renderLayout(concentricLayout, { nodeRadius: 15 });
    await expect(canvas).toMatchSnapshot(__filename, 'function-nodeSize');
  });

  it('should render with combined options', async () => {
    await concentricLayout.execute(data, {
      startAngle: Math.PI / 6,
      sweep: (4 * Math.PI) / 3,
      clockwise: false,
      equidistant: false,
      preventOverlap: true,
      nodeSize: 22,
      nodeSpacing: 8,
      sortBy: 'degree',
      maxLevelDiff: 10 / 4,
    });
    await renderLayout(concentricLayout, { nodeRadius: 11 });
    await expect(canvas).toMatchSnapshot(__filename, 'combined-options');
  });

  it('returns empty result for empty graph', async () => {
    await concentricLayout.execute({ nodes: [], edges: [] }, {} as any);
    const positions = calculatePositions(concentricLayout);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should handle nodes with size in data', async () => {
    const nodesWithSize = data.nodes.map((node) => ({
      id: node.id,
      data: { ...node.data, size: [30, 30] },
    }));
    const dataWithSize = {
      nodes: nodesWithSize as any,
      edges: data.edges,
    };
    await concentricLayout.execute(dataWithSize, {
      preventOverlap: true,
      nodeSize: (d) => d.data.size,
    });
    await renderLayout(concentricLayout, { nodeRadius: 15 });

    await expect(canvas).toMatchSnapshot(__filename, 'node-size-from-data');
  });

  it('should handle nodes with object size in data', async () => {
    const nodesWithSize = data.nodes.map((node) => ({
      id: node.id,
      data: { ...node.data, size: { width: 40, height: 25 } },
    }));
    const dataWithSize = {
      nodes: nodesWithSize as any,
      edges: data.edges,
    };
    await concentricLayout.execute(dataWithSize, {
      preventOverlap: true,
      nodeSize: (d) => [d.data.size.width, d.data.size.height],
    });
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'node-size-object-data');
  });

  it('should work with minimal graph', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'c', data: {} },
    ];
    const minimalData = { nodes, edges };
    await concentricLayout.execute(minimalData);
    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'minimal-graph');
  });

  it('should sort nodes by numeric property with negative values', async () => {
    const nodesWithNegativeValues = [
      { id: 'a', data: { score: -10 } },
      { id: 'b', data: { score: 20 } },
      { id: 'c', data: { score: -5 } },
      { id: 'd', data: { score: 0 } },
      { id: 'e', data: { score: 15 } },
    ];
    const edges: any[] = [];
    const negativeGraph = {
      nodes: nodesWithNegativeValues as any,
      edges: edges as any,
    };
    await concentricLayout.execute(negativeGraph, {
      sortBy: (d) => d.data.score,
    });

    const positions = calculatePositions(concentricLayout);
    // Verify sorting: 20, 15, 0, -5, -10
    expect(positions.nodes[0].id).toBe('b'); // score: 20
    expect(positions.nodes[1].id).toBe('e'); // score: 15
    expect(positions.nodes[2].id).toBe('d'); // score: 0
    expect(positions.nodes[3].id).toBe('c'); // score: -5
    expect(positions.nodes[4].id).toBe('a'); // score: -10

    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-negative-values');
  });

  it('should sort nodes by property with equal values', async () => {
    const nodesWithEqualValues = [
      { id: 'a', data: { rank: 100 } },
      { id: 'b', data: { rank: 100 } },
      { id: 'c', data: { rank: 200 } },
      { id: 'd', data: { rank: 100 } },
    ];
    const edges: any[] = [];
    const equalGraph = {
      nodes: nodesWithEqualValues as any,
      edges: edges as any,
    };
    await concentricLayout.execute(equalGraph, {
      sortBy: (d) => d.data.rank,
    });

    const positions = calculatePositions(concentricLayout);
    // First node should have highest rank
    expect(positions.nodes[0].id).toBe('c'); // rank: 200

    await renderLayout(concentricLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-equal-values');
  });
});

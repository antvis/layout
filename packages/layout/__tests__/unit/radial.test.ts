import { RadialLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { radial as data } from '../dataset';
import { getEuclideanDistance, mathEqual } from '../utils';
import { calculatePositions } from '../utils/render-update';
import { GraphRenderer, RenderOptions } from '../utils/renderer';

describe('layout radial', () => {
  let canvas: Canvas;
  let radial: RadialLayout;
  let renderer: GraphRenderer;

  beforeEach(() => {
    canvas = createCanvas();
    renderer = new GraphRenderer(canvas);
    radial = new RadialLayout({
      unitRadius: 50,
      nodeSize: 20,
      center: [250, 250],
    });
  });

  afterEach(() => {
    canvas.destroy();
  });

  const renderLayout = async (
    layout: RadialLayout,
    options: RenderOptions = {},
  ) => {
    await renderer.render(layout, {
      nodeRadius: 10,
      nodeStyle: { lineWidth: 2 },
      showLabel: true,
      ...options,
    });
  };

  it('should render with default config', async () => {
    await radial.execute(data);
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with different focusNode', async () => {
    await radial.execute(data, { focusNode: '1' });
    await renderLayout(radial, { showLabel: true });
    await expect(canvas).toMatchSnapshot(__filename, 'focusNode-1');
  });

  it('should render with custom center', async () => {
    await radial.execute(data, { center: [300, 300] });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('should render with custom linkDistance', async () => {
    await radial.execute(data, { linkDistance: 30 });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'linkDistance-30');
  });

  it('should render with preventOverlap enabled', async () => {
    await radial.execute(data, {
      preventOverlap: true,
      nodeSize: 20,
      nodeSpacing: 10,
      maxPreventOverlapIteration: 500,
    });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'preventOverlap-enabled');
  });

  it('should render with preventOverlap and large nodeSize', async () => {
    await radial.execute(data, {
      preventOverlap: true,
      nodeSize: 30,
      nodeSpacing: 15,
      maxPreventOverlapIteration: 500,
    });
    await renderLayout(radial, { nodeRadius: 15 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-large-nodeSize',
    );
  });

  it('should render with preventOverlap and function nodeSpacing', async () => {
    await radial.execute(data, {
      preventOverlap: true,
      nodeSize: 30,
      nodeSpacing: () => 15,
      maxPreventOverlapIteration: 500,
    });
    await renderLayout(radial, { nodeRadius: 15 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-large-nodeSize',
    );
  });

  it('should handle function nodeSize', async () => {
    await radial.execute(data, {
      preventOverlap: true,
      nodeSize: () => 30,
      nodeSpacing: 15,
      maxPreventOverlapIteration: 500,
    });
    await renderLayout(radial, { nodeRadius: 15 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-large-nodeSize',
    );
  });

  it('should render with strictRadial disabled', async () => {
    await radial.execute(data, {
      strictRadial: false,
      preventOverlap: true,
      nodeSize: 20,
    });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'strictRadial-false');
  });

  it('should render with strictRadial enabled', async () => {
    await radial.execute(data, {
      strictRadial: true,
      preventOverlap: true,
      nodeSize: 20,
    });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'strictRadial-true');
  });

  it('should render with sortBy data', async () => {
    await radial.execute(data, { sortBy: 'data' });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-data');
  });

  it('should render with sortBy id', async () => {
    await radial.execute(data, { sortBy: (d) => d.id });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-id');
  });

  it('should render with custom sortStrength', async () => {
    await radial.execute(data, { sortBy: (d) => d.id, sortStrength: 50 });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'sortStrength-50');
  });

  it('should render with custom maxIteration', async () => {
    await radial.execute(data, { maxIteration: 2000 });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'maxIteration-2000');
  });

  it('should render with small unitRadius', async () => {
    await radial.execute(data, { unitRadius: 100 });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'unitRadius-100');
  });

  it('should render with combined options', async () => {
    await radial.execute(data, {
      focusNode: '5',
      unitRadius: 60,
      linkDistance: 80,
      preventOverlap: true,
      nodeSize: 25,
      nodeSpacing: 12,
      sortBy: (d) => d.id,
      sortStrength: 20,
      maxIteration: 800,
    });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'combined-options');
  });

  it('returns empty result for empty graph', async () => {
    const empty = { nodes: [], edges: [] };
    const layout = new RadialLayout({ center: [0, 0], unitRadius: 100 });
    await layout.execute(empty);
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should calculate center when not provided', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'c', data: {} },
    ];
    const graph = { nodes: nodes as any, edges: edges as any };
    const layout = new RadialLayout({ unitRadius: 50 });
    // Don't provide center, it should be calculated
    await layout.execute(graph);
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(3);
    positions.nodes.forEach((n) => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
  });

  it('should handle inexistent focusNode by using first node', async () => {
    await radial.execute(data, { focusNode: 'NonExistentNode' });
    await renderLayout(radial);
    await expect(canvas).toMatchSnapshot(__filename, 'inexistent-focusNode');
  });

  it('should handle disconnected components', async () => {
    const nodes = [
      { id: '1', data: {} },
      { id: '2', data: {} },
      { id: '3', data: {} },
      { id: '4', data: {} },
      { id: '5', data: {} },
    ];
    const edges = [
      { id: 'e1', source: '1', target: '2', data: {} },
      { id: 'e2', source: '4', target: '5', data: {} },
    ];
    const disconnectedGraph = { nodes, edges };
    const layout = new RadialLayout({
      center: [250, 250],
      focusNode: '1',
      unitRadius: 60,
    });
    await layout.execute(disconnectedGraph);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'disconnected-components');
  });

  it('should render with preventOverlap and sortBy', async () => {
    const layout = new RadialLayout({
      center: [250, 250],
      preventOverlap: true,
      nodeSize: 20,
      nodeSpacing: 10,
      sortBy: (d) => d.id,
      sortStrength: 25,
      maxPreventOverlapIteration: 500,
    });
    await layout.execute(data);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-with-sortBy',
    );
  });

  it('should work with minimal graph', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ];
    const edges = [{ id: 'e1', source: 'a', target: 'b', data: {} }];
    const minimalGraph = {
      nodes: nodes as any,
      edges: edges as any,
    };
    const layout = new RadialLayout({
      center: [250, 250],
      focusNode: 'a',
      unitRadius: 80,
    });
    await layout.execute(minimalGraph);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'minimal-graph');
  });

  it('should handle zero width (semiWidth = 0)', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'c', data: {} },
    ];
    const smallGraph = { nodes, edges };
    const layout = new RadialLayout({
      width: 0,
      height: 500,
      center: [0, 250],
      focusNode: 'a',
      unitRadius: 50,
    });
    await layout.execute(smallGraph);
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(3);
    positions.nodes.forEach((n) => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
  });

  it('should handle zero height (semiHeight = 0)', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'c', data: {} },
    ];
    const smallGraph = { nodes: nodes, edges: edges };
    const layout = new RadialLayout({
      width: 500,
      height: 0,
      center: [250, 0],
      focusNode: 'a',
      unitRadius: 50,
    });
    await layout.execute(smallGraph);
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(3);
    positions.nodes.forEach((n) => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
  });

  it('should handle zero width and height', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ];
    const edges = [{ id: 'e1', source: 'a', target: 'b', data: {} }];
    const smallGraph = {
      nodes: nodes as any,
      edges: edges as any,
    };
    const layout = new RadialLayout({
      width: 0,
      height: 0,
      center: [0, 0],
      focusNode: 'a',
      unitRadius: 50,
    });
    await layout.execute(smallGraph);
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(2);
    positions.nodes.forEach((n) => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
  });

  it('should handle mds failure with invalid distances', async () => {
    // Create a graph structure that might cause MDS to fail
    const nodes = [
      { id: '1', data: {} },
      { id: '2', data: {} },
      { id: '3', data: {} },
      { id: '4', data: {} },
    ];
    const edges = [
      { id: 'e1', source: '1', target: '2', data: {} },
      { id: 'e2', source: '2', target: '3', data: {} },
      { id: 'e3', source: '3', target: '4', data: {} },
    ];
    const testGraph = {
      nodes: nodes as any,
      edges: edges as any,
    };
    const layout = new RadialLayout({
      center: [250, 250],
      focusNode: '1',
      unitRadius: 50,
      linkDistance: 60,
    });
    await layout.execute(testGraph);
    const positions = calculatePositions(layout);
    // Even if MDS fails, random positions should be generated
    expect(positions.nodes).toHaveLength(4);
    positions.nodes.forEach((n) => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
  });

  it('should handle overlapping nodes at same position (vecLength = 0)', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
      { id: 'd', data: {} },
    ];
    // Create a star pattern where multiple nodes might overlap
    const edges = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'a', target: 'c', data: {} },
      { id: 'e3', source: 'a', target: 'd', data: {} },
    ];
    const starGraph = {
      nodes: nodes as any,
      edges: edges as any,
    };
    const layout = new RadialLayout({
      center: [250, 250],
      focusNode: 'a',
      unitRadius: 0.001, // Very small radius to force overlap
      preventOverlap: true,
      nodeSize: 30,
      nodeSpacing: 5,
      maxPreventOverlapIteration: 100,
    });
    await layout.execute(starGraph);
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(4);
    positions.nodes.forEach((n) => {
      expect(Number.isFinite(n.x)).toBe(true);
      expect(Number.isFinite(n.y)).toBe(true);
    });
  });

  it('should handle nodes with identical positions during overlap prevention', async () => {
    // Create nodes that will be on the same circle
    const nodes = [
      { id: '1', data: {} },
      { id: '2', data: {} },
      { id: '3', data: {} },
      { id: '4', data: {} },
      { id: '5', data: {} },
    ];
    const edges = [
      { id: 'e1', source: '1', target: '2', data: {} },
      { id: 'e2', source: '1', target: '3', data: {} },
      { id: 'e3', source: '1', target: '4', data: {} },
      { id: 'e4', source: '1', target: '5', data: {} },
    ];
    const sameCircleGraph = {
      nodes: nodes as any,
      edges: edges as any,
    };
    const layout = new RadialLayout({
      center: [250, 250],
      focusNode: '1',
      unitRadius: 10, // Very small to force tight clustering
      preventOverlap: true,
      nodeSize: 50, // Large node size
      nodeSpacing: 10,
      strictRadial: true,
      maxPreventOverlapIteration: 200,
    });
    await layout.execute(sameCircleGraph);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'overlapping-same-position',
    );
  });

  it('should handle preventOverlap with nodes at exact same position', async () => {
    const nodes = [
      { id: 'center', data: {} },
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'center', target: 'a', data: {} },
      { id: 'e2', source: 'center', target: 'b', data: {} },
      { id: 'e3', source: 'center', target: 'c', data: {} },
    ];
    const testGraph = {
      nodes: nodes as any,
      edges: edges as any,
    };
    const layout = new RadialLayout({
      center: [250, 250],
      focusNode: 'center',
      unitRadius: 5, // Very small radius
      preventOverlap: true,
      nodeSize: 40,
      nodeSpacing: 10,
      maxPreventOverlapIteration: 300,
    });
    await layout.execute(testGraph);
    await renderLayout(layout);
    await expect(canvas).toMatchSnapshot(__filename, 'exact-same-position');
  });

  it('should do radial layout with unitRadius and linkDistance', async () => {
    const data: any = {
      nodes: [
        { id: '0', label: '0', data: {} },
        { id: '1', label: '1', data: {} },
        { id: '2', label: '2', data: {} },
        { id: '3', label: '3', data: {} },
        { id: '4', label: '4', data: {} },
        { id: '5', label: '5', data: {} },
      ],
      edges: [
        { id: 'edge0', source: '0', target: '1', data: {} },
        { id: 'edge1', source: '0', target: '2', data: {} },
        { id: 'edge2', source: '3', target: '4', data: {} },
      ],
    };
    const unitRadius = 100;
    const fnIndex = 1;
    const focusNode = data.nodes[fnIndex];
    const focusId = focusNode.id;
    const center: any = [250, 250];

    const radial = new RadialLayout({
      width: 500,
      height: 600,
      center,
      maxIteration: 100,
      focusNode: focusId,
      unitRadius,
      linkDistance: 100,
    });
    await radial.execute(data);

    const positions = calculatePositions(radial);

    const focusPos = positions.nodes[fnIndex];
    const oneStepNode = positions.nodes[0];
    const twoStepNode = positions.nodes[2];
    const descreteNode1 = positions.nodes[3];
    const descreteNode2 = positions.nodes[5];
    const descreteNode3 = positions.nodes[4];

    const distToOneStepNode = getEuclideanDistance(focusPos, oneStepNode);
    const distToTwoStepNode = getEuclideanDistance(focusPos, twoStepNode);
    const distToDescreteNode1 = getEuclideanDistance(focusPos, descreteNode1);
    const distToDescreteNode2 = getEuclideanDistance(focusPos, descreteNode2);
    const distToDescreteNode3 = getEuclideanDistance(focusPos, descreteNode3);

    expect(mathEqual(distToOneStepNode, unitRadius)).toEqual(true);
    expect(mathEqual(distToTwoStepNode, 2 * unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode1, 3 * unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode2, 3 * unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode3, 4 * unitRadius)).toEqual(true);
  });

  it('should do radial layout with focusNode which is a descrete node', async () => {
    const data: any = {
      nodes: [
        { id: '0', label: '0', data: {} },
        { id: '1', label: '1', data: {} },
        { id: '2', label: '2', data: {} },
        { id: '3', label: '3', data: {} },
        { id: '4', label: '4', data: {} },
        { id: '5', label: '5', data: {} },
      ],
      edges: [
        { id: 'edge0', source: '0', target: '1', data: {} },
        { id: 'edge1', source: '0', target: '2', data: {} },
        { id: 'edge2', source: '3', target: '4', data: {} },
      ],
    };
    const unitRadius = 100;
    const focusNodeId = '5';

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      unitRadius,
    });
    await radial.execute(data);

    const positions = calculatePositions(radial);

    const focusNode = positions.nodes.find((node) => node.id === focusNodeId);
    const descreteNode1 = positions.nodes[0];
    const descreteNode2 = positions.nodes[1];
    const descreteNode3 = positions.nodes[3];
    const descreteNode4 = positions.nodes[4];

    const distToDescreteNode1 = getEuclideanDistance(focusNode, descreteNode1);
    const distToDescreteNode2 = getEuclideanDistance(focusNode, descreteNode2);
    const distToDescreteNode3 = getEuclideanDistance(focusNode, descreteNode3);
    const distToDescreteNode4 = getEuclideanDistance(focusNode, descreteNode4);

    expect(mathEqual(distToDescreteNode1, unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode2, 2 * unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode3, unitRadius)).toEqual(true);
    expect(mathEqual(distToDescreteNode4, 2 * unitRadius)).toEqual(true);
  });

  it('should do radial layout with preventOverlap, number nodeSpacing, and array nodeSize', async () => {
    const data: any = {
      nodes: [
        { id: '0', label: '0', data: {} },
        { id: '1', label: '1', data: {} },
        { id: '2', label: '2', data: {} },
        { id: '3', label: '3', data: {} },
        { id: '4', label: '4', data: {} },
        { id: '5', label: '5', data: {} },
      ],
      edges: [
        { id: 'edge0', source: '0', target: '1', data: {} },
        { id: 'edge1', source: '0', target: '2', data: {} },
        { id: 'edge2', source: '3', target: '4', data: {} },
      ],
    };
    const unitRadius = 100;
    const focusNodeId = '5';
    const nodeSpacing = 10;

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      preventOverlap: true,
      maxPreventOverlapIteration: 2000,
      unitRadius,
      nodeSpacing,
      nodeSize: [40, 20],
    });
    await radial.execute(data);
    const positions = calculatePositions(radial);
    const overlapNode1 = positions.nodes[2];
    const overlapNode2 = positions.nodes[4];
    const dist = getEuclideanDistance(overlapNode1, overlapNode2);

    expect(dist > nodeSpacing + Math.max(40, 20)).toEqual(true);
  });

  it('should do radial layout with preventOverlap, function nodeSpacing, and size in data', async () => {
    const data: any = {
      nodes: [
        { id: '0', label: '0', data: {} },
        { id: '1', label: '1', data: {} },
        { id: '2', label: '2', data: {} },
        { id: '3', label: '3', data: {} },
        { id: '4', label: '4', data: {} },
        { id: '5', label: '5', data: {} },
      ],
      edges: [
        { id: 'edge0', source: '0', target: '1', data: {} },
        { id: 'edge1', source: '0', target: '2', data: {} },
        { id: 'edge2', source: '3', target: '4', data: {} },
      ],
    };
    const graph = {
      nodes: data.nodes.map((node: any) => ({
        ...node,
        data: {
          ...node.data,
          size: [40, 20],
        },
      })),
      edges: [...data.edges],
    };
    const unitRadius = 100;
    const focusNodeId = '5';
    const nodeSpacing = (d: any) => {
      return 5;
    };

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      preventOverlap: true,
      maxPreventOverlapIteration: 2000,
      unitRadius,
      nodeSpacing,
      nodeSize: (d: any) => {
        return d.data.size;
      },
    });
    await radial.execute(graph);
    const positions = calculatePositions(radial);
    const overlapNode1 = positions.nodes[2];
    const overlapNode2 = positions.nodes[4];
    const dist = getEuclideanDistance(overlapNode1, overlapNode2);
    expect(dist > 5 + 40).toEqual(true);
  });

  it("should do radial layout with sortBy: 'data' ", async () => {
    const data: any = {
      nodes: [
        { id: '0', label: '0', data: {} },
        { id: '1', label: '1', data: {} },
        { id: '2', label: '2', data: {} },
        { id: '3', label: '3', data: {} },
        { id: '4', label: '4', data: {} },
        { id: '5', label: '5', data: {} },
      ],
      edges: [
        { id: 'edge0', source: '0', target: '1', data: {} },
        { id: 'edge1', source: '0', target: '2', data: {} },
        { id: 'edge2', source: '3', target: '4', data: {} },
      ],
    };

    const focusNodeId = '5';

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      sortBy: 'data',
    });
    await radial.execute(data);
    const positions = calculatePositions(radial);
    // keeps relative order in data.nodes
    if (positions.nodes[4].y < positions.nodes[2].y) {
      expect(positions.nodes[2].y < positions.nodes[1].y).toBe(true);
    } else {
      expect(positions.nodes[2].y > positions.nodes[1].y).toBe(true);
    }
  });

  it("should do radial layout with sortBy: 'sortProperty' ", async () => {
    const data: any = {
      nodes: [
        { id: '0', label: '0', data: {} },
        { id: '1', label: '1', data: {} },
        { id: '2', label: '2', data: {} },
        { id: '3', label: '3', data: {} },
        { id: '4', label: '4', data: {} },
        { id: '5', label: '5', data: {} },
      ],
      edges: [
        { id: 'edge0', source: '0', target: '1', data: {} },
        { id: 'edge1', source: '0', target: '2', data: {} },
        { id: 'edge2', source: '3', target: '4', data: {} },
      ],
    };
    const graph = {
      nodes: data.nodes.map((node: any, i: number) => ({
        ...node,
        data: {
          ...node.data,
          sortProperty: i % 2,
        },
      })),
      edges: [...data.edges],
    };
    const focusNodeId = '5';

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      sortBy: (d) => d.data.sortProperty,
      sortStrength: 1000,
      preventOverlap: true,
      maxPreventOverlapIteration: 2000,
      nodeSize: 50,
    });
    await radial.execute(graph);

    const positions = calculatePositions(radial);
    const sameClusterNodeDist = getEuclideanDistance(
      positions.nodes[4],
      positions.nodes[2],
    );
    const differentClusterNodeDist1 = getEuclideanDistance(
      positions.nodes[2],
      positions.nodes[1],
    );
    const differentClusterNodeDist2 = getEuclideanDistance(
      positions.nodes[4],
      positions.nodes[1],
    );
    expect(mathEqual(sameClusterNodeDist, 50)).toBe(true);
    expect(sameClusterNodeDist < differentClusterNodeDist1).toBe(true);
    expect(sameClusterNodeDist < differentClusterNodeDist2).toBe(true);
  });

  it('should not do radial layout with inexistent focusNode', async () => {
    const data: any = {
      nodes: [
        { id: '0', label: '0', data: {} },
        { id: '1', label: '1', data: {} },
        { id: '2', label: '2', data: {} },
        { id: '3', label: '3', data: {} },
        { id: '4', label: '4', data: {} },
        { id: '5', label: '5', data: {} },
      ],
      edges: [
        { id: 'edge0', source: '0', target: '1', data: {} },
        { id: 'edge1', source: '0', target: '2', data: {} },
        { id: 'edge2', source: '3', target: '4', data: {} },
      ],
    };
    const radial = new RadialLayout({
      focusNode: 'id-inexistent',
      center: [10, 20],
    });
    await radial.execute(data);
    const positions = calculatePositions(radial);

    // focusNode will be the first node
    expect(positions.nodes[0].x).toBe(10);
    expect(positions.nodes[0].y).toBe(20);
  });

  it('should handle large nodeSize with small linkDistance when preventOverlap is enabled', async () => {
    const data: any = {
      nodes: [
        { id: '0', label: '0', data: {} },
        { id: '1', label: '1', data: {} },
        { id: '2', label: '2', data: {} },
        { id: '3', label: '3', data: {} },
        { id: '4', label: '4', data: {} },
        { id: '5', label: '5', data: {} },
      ],
      edges: [
        { id: 'edge0', source: '0', target: '1', data: {} },
        { id: 'edge1', source: '0', target: '2', data: {} },
        { id: 'edge2', source: '3', target: '4', data: {} },
      ],
    };
    const unitRadius = 100;
    const focusNodeId = '5';
    const nodeSize = 80; // Large node size
    const linkDistance = 10; // Small link distance
    const nodeSpacing = 10;

    const radial = new RadialLayout({
      focusNode: focusNodeId,
      preventOverlap: true,
      maxPreventOverlapIteration: 500,
      unitRadius,
      linkDistance,
      nodeSize,
      nodeSpacing,
    });
    await radial.execute(data);
    const positions = calculatePositions(radial);

    // Check that nodes on the same circle don't overlap
    const node0 = positions.nodes.find((n) => n.id === '0');
    const node1 = positions.nodes.find((n) => n.id === '1');
    const node3 = positions.nodes.find((n) => n.id === '3');
    const node4 = positions.nodes.find((n) => n.id === '4');

    // Nodes 0 and 1 are on the same circle (both connect to focus node 5)
    const dist01 = getEuclideanDistance(node0, node1);
    const minDist01 = nodeSize + nodeSpacing;
    expect(dist01).toBeGreaterThan(minDist01 * 0.95); // Allow 5% tolerance

    // Nodes 3 and 4 are on the same circle
    const dist34 = getEuclideanDistance(node3, node4);
    const minDist34 = nodeSize + nodeSpacing;
    expect(dist34).toBeGreaterThan(minDist34 * 0.95); // Allow 5% tolerance
  });
});

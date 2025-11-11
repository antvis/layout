import { ConcentricLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { Graph } from '@antv/graphlib';
import { countries as data } from '../dataset';
import { renderNodesAndEdges } from '../utils';

describe('layout concentric', () => {
  let canvas: Canvas;
  let graph: Graph<any, any>;
  let concentricLayout: ConcentricLayout;

  beforeEach(() => {
    canvas = createCanvas();
    const { nodes, edges } = data as any;
    graph = new Graph({ nodes, edges });
    concentricLayout = new ConcentricLayout({
      center: [500, 500],
    });
  });

  afterEach(() => {
    canvas.destroy();
  });

  it('should render with default config', async () => {
    const positions = await concentricLayout.execute(graph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom center', async () => {
    const positions = await concentricLayout.execute(graph, {
      center: [300, 300],
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  });

  it('should render with clockwise false', async () => {
    const positions = await concentricLayout.execute(graph, {
      clockwise: false,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'counterclockwise');
  });

  it('should render with equidistant enabled', async () => {
    const positions = await concentricLayout.execute(graph, {
      equidistant: true,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'equidistant');
  });

  it('should render with custom startAngle', async () => {
    const positions = await concentricLayout.execute(graph, {
      startAngle: 0,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'startAngle-0');
  });

  it('should render with custom startAngle and counterclockwise', async () => {
    const positions = await concentricLayout.execute(graph, {
      startAngle: Math.PI / 2,
      clockwise: false,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'startAngle-PI-2-counterclockwise',
    );
  });

  it('should render with custom sweep', async () => {
    const positions = await concentricLayout.execute(graph, {
      sweep: Math.PI,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'sweep-PI');
  });

  it('should render with sweep and startAngle', async () => {
    const positions = await concentricLayout.execute(graph, {
      startAngle: Math.PI / 4,
      sweep: (3 * Math.PI) / 2,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'sweep-startAngle');
  });

  it('should render with preventOverlap enabled', async () => {
    const positions = await concentricLayout.execute(graph, {
      preventOverlap: true,
      nodeSize: 20,
      nodeSpacing: 10,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'preventOverlap');
  });

  it('should render with preventOverlap and large nodeSize', async () => {
    const positions = await concentricLayout.execute(graph, {
      preventOverlap: true,
      nodeSize: 30,
      nodeSpacing: 15,
    });
    await renderNodesAndEdges(canvas, positions, false, { r: 15 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-large-nodeSize',
    );
  });

  it('should render with preventOverlap and array nodeSize', async () => {
    const positions = await concentricLayout.execute(graph, {
      preventOverlap: true,
      nodeSize: [40, 20],
      nodeSpacing: 10,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-array-nodeSize',
    );
  });

  it('should render with preventOverlap and function nodeSpacing', async () => {
    const positions = await concentricLayout.execute(graph, {
      preventOverlap: true,
      nodeSize: 30,
      nodeSpacing: () => 15,
    });
    await renderNodesAndEdges(canvas, positions, false, { r: 15 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-fn-nodeSpacing',
    );
  });

  it('should render with preventOverlap and array nodeSpacing', async () => {
    const positions = await concentricLayout.execute(graph, {
      preventOverlap: true,
      nodeSize: 30,
      nodeSpacing: [10, 15],
    });
    await renderNodesAndEdges(canvas, positions, false, { r: 15 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-array-nodeSpacing',
    );
  });

  it('should render with sortBy degree', async () => {
    const positions = await concentricLayout.execute(graph, {
      sortBy: 'degree',
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-degree');
  });

  it('should render with sortBy custom property', async () => {
    const positions = await concentricLayout.execute(graph, {
      sortBy: 'rank',
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-rank');
  });

  it('should render with custom maxLevelDiff', async () => {
    const positions = await concentricLayout.execute(graph, {
      maxLevelDiff: 5,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'maxLevelDiff-5');
  });

  it('should render with equidistant and preventOverlap', async () => {
    const positions = await concentricLayout.execute(graph, {
      equidistant: true,
      preventOverlap: true,
      nodeSize: 20,
      nodeSpacing: 10,
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'equidistant-preventOverlap',
    );
  });

  it('should render with function nodeSize', async () => {
    const positions = await concentricLayout.execute(graph, {
      nodeSize: () => 30,
      preventOverlap: true,
    });
    await renderNodesAndEdges(canvas, positions, false, { r: 15 });
    await expect(canvas).toMatchSnapshot(__filename, 'function-nodeSize');
  });

  it('should render with combined options', async () => {
    const positions = await concentricLayout.execute(graph, {
      startAngle: Math.PI / 6,
      sweep: (4 * Math.PI) / 3,
      clockwise: false,
      equidistant: false,
      preventOverlap: true,
      nodeSize: 22,
      nodeSpacing: 8,
      sortBy: 'cited',
      maxLevelDiff: 10,
    });
    await renderNodesAndEdges(canvas, positions, false, { r: 11 });
    await expect(canvas).toMatchSnapshot(__filename, 'combined-options');
  });

  it('returns empty result for empty graph', async () => {
    const graph = new Graph({ nodes: [], edges: [] });
    const layout = new ConcentricLayout({ center: [0, 0] });
    const positions = await layout.execute(graph, {} as any);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('assign places single node at center', async () => {
    const graph = new Graph({
      nodes: [{ id: 'a', data: {} }],
      edges: [] as any,
    });
    const layout = new ConcentricLayout();
    await layout.assign(graph, { center: [10, 20] } as any);
    const n = graph.getAllNodes()[0];
    expect((n.data as any).x).toBe(10);
    expect((n.data as any).y).toBe(20);
  });

  it('assign mode should directly modify graph node positions', async () => {
    // FIXME: enable the test after fixing assign method
    // await concentricLayout.assign(graph);
    // const allNodes = graph.getAllNodes();
    // allNodes.forEach((node) => {
    //   expect(typeof node.data.x).toBe('number');
    //   expect(typeof node.data.y).toBe('number');
    //   expect(Number.isFinite(node.data.x)).toBe(true);
    //   expect(Number.isFinite(node.data.y)).toBe(true);
    // });
  });

  it('should calculate center when not provided', async () => {
    // Don't provide center, it should be calculated
    const positions = await concentricLayout.execute(graph, {
      center: undefined,
    });
    expect(positions.nodes.length).toBeGreaterThan(0);
    positions.nodes.forEach((n) => {
      expect(Number.isFinite(n.data.x)).toBe(true);
      expect(Number.isFinite(n.data.y)).toBe(true);
    });
  });

  it('should handle nodes with size in data', async () => {
    const nodesWithSize = graph.getAllNodes().map((node) => ({
      id: node.id,
      data: { ...node.data, size: [30, 30] },
    }));
    const graphWithSize = new Graph({
      nodes: nodesWithSize as any,
      edges: graph.getAllEdges() as any,
    });
    const layout = new ConcentricLayout({
      center: [500, 500],
      preventOverlap: true,
    });
    const positions = await layout.execute(graphWithSize);
    await renderNodesAndEdges(canvas, positions, false, { r: 15 });
    await expect(canvas).toMatchSnapshot(__filename, 'node-size-from-data');
  });

  it('should handle nodes with object size in data', async () => {
    const nodesWithSize = graph.getAllNodes().map((node) => ({
      id: node.id,
      data: { ...node.data, size: { width: 40, height: 25 } },
    }));
    const graphWithSize = new Graph({
      nodes: nodesWithSize as any,
      edges: graph.getAllEdges() as any,
    });
    const layout = new ConcentricLayout({
      center: [500, 500],
      preventOverlap: true,
    });
    const positions = await layout.execute(graphWithSize);
    await renderNodesAndEdges(canvas, positions);
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
    const minimalGraph = new Graph({
      nodes: nodes as any,
      edges: edges as any,
    });
    const layout = new ConcentricLayout({
      center: [500, 500],
    });
    const positions = await layout.execute(minimalGraph);
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'minimal-graph');
  });

  it('should render with sortBy fallback to degree when property undefined', async () => {
    const nodes = data.nodes.map((node: any) => ({
      ...node,
      data: {},
    }));
    const edges = data.edges;
    const graphWithoutProperty = new Graph({
      nodes: nodes as any,
      edges: edges as any,
    });
    const positions = await concentricLayout.execute(graphWithoutProperty, {
      sortBy: 'nonexistent',
    });
    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-fallback-degree');
  });

  // Test case 1: node.data.size as number
  it('should handle nodes with number size in data', async () => {
    const nodesWithNumberSize = graph.getAllNodes().map((node) => ({
      id: node.id,
      data: { ...node.data, size: 35 }, // number size
    }));
    const graphWithNumberSize = new Graph({
      nodes: nodesWithNumberSize as any,
      edges: graph.getAllEdges() as any,
    });
    const layout = new ConcentricLayout({
      center: [500, 500],
      preventOverlap: true,
      nodeSpacing: 10,
    });
    const positions = await layout.execute(graphWithNumberSize);

    // Verify all nodes have positions
    positions.nodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });

    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'node-number-size-data');
  });

  it('should handle mixed node sizes in data', async () => {
    const nodesMixedSize = graph.getAllNodes().map((node, i) => {
      let size;
      if (i % 3 === 0) {
        size = 40; // number
      } else if (i % 3 === 1) {
        size = [35, 25]; // array
      } else {
        size = { width: 30, height: 30 }; // object
      }
      return {
        id: node.id,
        data: { ...node.data, size },
      };
    });
    const graphMixedSize = new Graph({
      nodes: nodesMixedSize as any,
      edges: graph.getAllEdges() as any,
    });
    const layout = new ConcentricLayout({
      center: [500, 500],
      preventOverlap: true,
    });
    const positions = await layout.execute(graphMixedSize);

    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'node-mixed-size-types');
  });

  // Test case 2: sort nodes by custom property value
  it('should sort nodes by custom property value', async () => {
    const nodesWithCustomValue = [
      { id: 'a', data: { priority: 100 } },
      { id: 'b', data: { priority: 50 } },
      { id: 'c', data: { priority: 200 } },
      { id: 'd', data: { priority: 75 } },
      { id: 'e', data: { priority: 150 } },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'c', data: {} },
    ];
    const customGraph = new Graph({
      nodes: nodesWithCustomValue as any,
      edges: edges as any,
    });
    const layout = new ConcentricLayout({
      center: [500, 500],
      sortBy: 'priority',
    });
    const positions = await layout.execute(customGraph);

    // Verify nodes are sorted by priority in descending order
    // The highest priority should be at center (first in layout)
    expect(positions.nodes[0].id).toBe('c'); // priority: 200
    expect(positions.nodes[1].id).toBe('e'); // priority: 150
    expect(positions.nodes[2].id).toBe('a'); // priority: 100
    expect(positions.nodes[3].id).toBe('d'); // priority: 75
    expect(positions.nodes[4].id).toBe('b'); // priority: 50

    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-custom-value');
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
    const negativeGraph = new Graph({
      nodes: nodesWithNegativeValues as any,
      edges: edges as any,
    });
    const layout = new ConcentricLayout({
      center: [500, 500],
      sortBy: 'score',
    });
    const positions = await layout.execute(negativeGraph);

    // Verify sorting: 20, 15, 0, -5, -10
    expect(positions.nodes[0].id).toBe('b'); // score: 20
    expect(positions.nodes[1].id).toBe('e'); // score: 15
    expect(positions.nodes[2].id).toBe('d'); // score: 0
    expect(positions.nodes[3].id).toBe('c'); // score: -5
    expect(positions.nodes[4].id).toBe('a'); // score: -10

    await renderNodesAndEdges(canvas, positions);
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
    const equalGraph = new Graph({
      nodes: nodesWithEqualValues as any,
      edges: edges as any,
    });
    const layout = new ConcentricLayout({
      center: [500, 500],
      sortBy: 'rank',
    });
    const positions = await layout.execute(equalGraph);

    // First node should have highest rank
    expect(positions.nodes[0].id).toBe('c'); // rank: 200
    // Others have same rank (100)
    const rank100Nodes = positions.nodes.slice(1);
    rank100Nodes.forEach((node) => {
      expect((node.data as any).rank).toBe(100);
    });

    await renderNodesAndEdges(canvas, positions);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-equal-values');
  });

  it('should verify assign mode modifies original graph', async () => {
    const nodes = [
      { id: 'node1', data: {} },
      { id: 'node2', data: {} },
      { id: 'node3', data: {} },
    ];
    const edges = [{ id: 'e1', source: 'node1', target: 'node2', data: {} }];
    const testGraph = new Graph({ nodes: nodes as any, edges: edges as any });

    // Before assign, nodes should not have x, y
    const beforeNodes = testGraph.getAllNodes();
    beforeNodes.forEach((node) => {
      expect(node.data.x).toBeUndefined();
      expect(node.data.y).toBeUndefined();
    });

    const layout = new ConcentricLayout({
      center: [500, 500],
    });

    // Call assign
    await layout.assign(testGraph, {});

    // After assign, nodes should have x, y
    const afterNodes = testGraph.getAllNodes();
    afterNodes.forEach((node) => {
      expect(node.data.x).toBeDefined();
      expect(node.data.y).toBeDefined();
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
    });
  });

  // FIXME: enable the test
  // it('should handle assign mode with complex layout options', async () => {
  //   await concentricLayout.assign(graph, {
  //     center: [500,500],
  //     preventOverlap: true,
  //     nodeSize: 25,
  //     nodeSpacing: 12,
  //     equidistant: true,
  //     clockwise: false,
  //     startAngle: Math.PI / 4,
  //     sortBy: 'cited',
  //   });

  //   const assignedNodes = graph.getAllNodes();
  //   assignedNodes.forEach((node) => {
  //     expect(typeof node.data.x).toBe('number');
  //     expect(typeof node.data.y).toBe('number');
  //     expect(Number.isFinite(node.data.x)).toBe(true);
  //     expect(Number.isFinite(node.data.y)).toBe(true);

  //     // Check that positions are within reasonable bounds
  //     expect(node.data.x).toBeGreaterThan(0);
  //     expect(node.data.x).toBeLessThan(1000);
  //     expect(node.data.y).toBeGreaterThan(0);
  //     expect(node.data.y).toBeLessThan(1000);
  //   });
  // });
});

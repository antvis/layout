import { RadialLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { Graph } from '@antv/graphlib';
import { countries as data } from '../dataset';

describe('layout radial', () => {
  let canvas: Canvas;
  let graph: Graph<any, any>;
  let radial: RadialLayout;

  beforeEach(() => {
    canvas = createCanvas(null, 800, 800);
    const { nodes, edges } = data;
    graph = new Graph({ nodes, edges });
    radial = new RadialLayout({
      center: [250, 250],
      focusNode: 'Brazil',
      unitRadius: 50,
    });
  });

  afterEach(() => {
    canvas.destroy();
  });

  it('should initialize correctly', () => {});

  // it('should render with default config', async () => {
  //   const positions = await radial.execute(graph);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename);
  // });

  // it('should render with different focusNode', async () => {
  //   const positions = await radial.execute(graph, {
  //     focusNode: 'Argentina',
  //   });
  //   await renderNodesAndEdges(canvas, positions, true);
  //   await expect(canvas).toMatchSnapshot(__filename, 'focusNode-Argentina');
  // });

  // it('should render with custom center', async () => {
  //   const positions = await radial.execute(graph, {
  //     center: [300, 300],
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'custom-center');
  // });

  // it('should render with custom linkDistance', async () => {
  //   const positions = await radial.execute(graph, {
  //     linkDistance: 100,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'linkDistance-100');
  // });

  // it('should render with preventOverlap enabled', async () => {
  //   const positions = await radial.execute(graph, {
  //     preventOverlap: true,
  //     nodeSize: 20,
  //     nodeSpacing: 10,
  //     maxPreventOverlapIteration: 500,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'preventOverlap-enabled');
  // });

  // it('should render with preventOverlap and large nodeSize', async () => {
  //   const positions = await radial.execute(graph, {
  //     preventOverlap: true,
  //     nodeSize: 30,
  //     nodeSpacing: 15,
  //     maxPreventOverlapIteration: 500,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(
  //     __filename,
  //     'preventOverlap-large-nodeSize',
  //   );
  // });

  // it('should render with preventOverlap and array nodeSize', async () => {
  //   const positions = await radial.execute(graph, {
  //     preventOverlap: true,
  //     nodeSize: [40, 20],
  //     nodeSpacing: 10,
  //     maxPreventOverlapIteration: 500,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(
  //     __filename,
  //     'preventOverlap-array-nodeSize',
  //   );
  // });

  // it('should render with preventOverlap and function nodeSpacing', async () => {
  //   const positions = await radial.execute(graph, {
  //     preventOverlap: true,
  //     nodeSize: 25,
  //     nodeSpacing: () => 20,
  //     maxPreventOverlapIteration: 500,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(
  //     __filename,
  //     'preventOverlap-fn-nodeSpacing',
  //   );
  // });

  // it('should render with strictRadial disabled', async () => {
  //   const positions = await radial.execute(graph, {
  //     strictRadial: false,
  //     preventOverlap: true,
  //     nodeSize: 20,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'strictRadial-false');
  // });

  // it('should render with sortBy data', async () => {
  //   const positions = await radial.execute(graph, {
  //     sortBy: 'data',
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'sortBy-data');
  // });

  // it('should render with sortBy id', async () => {
  //   const positions = await radial.execute(graph, {
  //     sortBy: 'id',
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'sortBy-id');
  // });

  // it('should render with custom sortStrength', async () => {
  //   const positions = await radial.execute(graph, {
  //     sortBy: 'id',
  //     sortStrength: 50,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'sortStrength-50');
  // });

  // it('should render with custom maxIteration', async () => {
  //   const positions = await radial.execute(graph, {
  //     maxIteration: 500,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'maxIteration-500');
  // });

  // it('should render with edges', async () => {
  //   const positions = await radial.execute(graph);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'with-edges');
  // });

  // it('should render with different focusNode and edges', async () => {
  //   const positions = await radial.execute(graph, {
  //     focusNode: 'Germany',
  //   });
  //   await renderNodesAndEdges(canvas, positions, true);
  //   await expect(canvas).toMatchSnapshot(
  //     __filename,
  //     'focusNode-Germany-with-edges',
  //   );
  // });

  // it('should render with small unitRadius', async () => {
  //   const positions = await radial.execute(graph, {
  //     unitRadius: 30,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'unitRadius-30');
  // });

  // it('should render with preventOverlap and strictRadial', async () => {
  //   const positions = await radial.execute(graph, {
  //     preventOverlap: true,
  //     strictRadial: true,
  //     nodeSize: 20,
  //     nodeSpacing: 10,
  //     maxPreventOverlapIteration: 500,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(
  //     __filename,
  //     'preventOverlap-strictRadial',
  //   );
  // });

  // it('should render with combined options', async () => {
  //   const positions = await radial.execute(graph, {
  //     focusNode: 'France',
  //     unitRadius: 60,
  //     linkDistance: 80,
  //     preventOverlap: true,
  //     nodeSize: 25,
  //     nodeSpacing: 12,
  //     sortBy: 'id',
  //     sortStrength: 20,
  //     maxIteration: 800,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'combined-options');
  // });

  // it('returns empty result for empty graph', async () => {
  //   const graph = new Graph({ nodes: [], edges: [] });
  //   const layout = new RadialLayout({ center: [0, 0], unitRadius: 100 });
  //   const positions = await layout.execute(graph, {} as any);
  //   expect(positions.nodes).toHaveLength(0);
  //   expect(positions.edges).toHaveLength(0);
  // });

  // it('assign places single node at center', async () => {
  //   const graph = new Graph({
  //     nodes: [{ id: 'a', data: {} }],
  //     edges: [] as any,
  //   });
  //   const layout = new RadialLayout();
  //   await layout.assign(graph, { center: [10, 20] } as any);
  //   const n = graph.getAllNodes()[0];
  //   expect((n.data as any).x).toBe(10);
  //   expect((n.data as any).y).toBe(20);
  // });

  // it('assign mode should directly modify graph node positions', async () => {
  //   const nodes = [
  //     { id: 'a', data: {} },
  //     { id: 'b', data: {} },
  //     { id: 'c', data: {} },
  //   ];
  //   const edges = [
  //     { id: 'e1', source: 'a', target: 'b', data: {} },
  //     { id: 'e2', source: 'b', target: 'c', data: {} },
  //   ];
  //   const graph = new Graph({ nodes: nodes as any, edges: edges as any });
  //   const layout = new RadialLayout({
  //     center: [100, 100],
  //     focusNode: 'b',
  //     unitRadius: 50,
  //   });
  //   await layout.assign(graph, {});
  //   const allNodes = graph.getAllNodes();
  //   allNodes.forEach((node) => {
  //     expect(typeof node.data.x).toBe('number');
  //     expect(typeof node.data.y).toBe('number');
  //     expect(Number.isFinite(node.data.x)).toBe(true);
  //     expect(Number.isFinite(node.data.y)).toBe(true);
  //   });
  // });

  // it('should calculate center when not provided', async () => {
  //   const nodes = [
  //     { id: 'a', data: {} },
  //     { id: 'b', data: {} },
  //     { id: 'c', data: {} },
  //   ];
  //   const edges = [
  //     { id: 'e1', source: 'a', target: 'b', data: {} },
  //     { id: 'e2', source: 'b', target: 'c', data: {} },
  //   ];
  //   const graph = new Graph({ nodes: nodes as any, edges: edges as any });
  //   const layout = new RadialLayout({ unitRadius: 50 });
  //   // Don't provide center, it should be calculated
  //   const positions = await layout.execute(graph, {});
  //   expect(positions.nodes).toHaveLength(3);
  //   positions.nodes.forEach((n) => {
  //     expect(Number.isFinite(n.data.x)).toBe(true);
  //     expect(Number.isFinite(n.data.y)).toBe(true);
  //   });
  // });

  // it('should handle inexistent focusNode by using first node', async () => {
  //   const positions = await radial.execute(graph, {
  //     focusNode: 'NonExistentNode',
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'inexistent-focusNode');
  // });

  // it('should work with focusNode as first node when not specified', async () => {
  //   const layout = new RadialLayout({
  //     center: [250, 250],
  //     unitRadius: 50,
  //   });
  //   const positions = await layout.execute(graph);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'default-focusNode');
  // });

  // it('should handle graph with custom node data', async () => {
  //   const customNodes = [
  //     { id: '1', data: { sortProperty: 1 } },
  //     { id: '2', data: { sortProperty: 2 } },
  //     { id: '3', data: { sortProperty: 3 } },
  //     { id: '4', data: { sortProperty: 1 } },
  //   ];
  //   const customEdges = [
  //     { id: 'e1', source: '1', target: '2', data: {} },
  //     { id: 'e2', source: '2', target: '3', data: {} },
  //     { id: 'e3', source: '3', target: '4', data: {} },
  //   ];
  //   const customGraph = new Graph({
  //     nodes: customNodes as any,
  //     edges: customEdges as any,
  //   });
  //   const layout = new RadialLayout({
  //     center: [250, 250],
  //     focusNode: '2',
  //     unitRadius: 60,
  //     sortBy: 'sortProperty',
  //     sortStrength: 30,
  //   });
  //   const positions = await layout.execute(customGraph);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'custom-node-data');
  // });

  // it('should handle disconnected components', async () => {
  //   const nodes = [
  //     { id: '1', data: {} },
  //     { id: '2', data: {} },
  //     { id: '3', data: {} },
  //     { id: '4', data: {} },
  //     { id: '5', data: {} },
  //   ];
  //   const edges = [
  //     { id: 'e1', source: '1', target: '2', data: {} },
  //     { id: 'e2', source: '4', target: '5', data: {} },
  //   ];
  //   const disconnectedGraph = new Graph({
  //     nodes: nodes as any,
  //     edges: edges as any,
  //   });
  //   const layout = new RadialLayout({
  //     center: [250, 250],
  //     focusNode: '1',
  //     unitRadius: 60,
  //   });
  //   const positions = await layout.execute(disconnectedGraph);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'disconnected-components');
  // });

  // it('should render with preventOverlap and sortBy', async () => {
  //   const positions = await radial.execute(graph, {
  //     preventOverlap: true,
  //     nodeSize: 20,
  //     nodeSpacing: 10,
  //     sortBy: 'id',
  //     sortStrength: 25,
  //     maxPreventOverlapIteration: 500,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(
  //     __filename,
  //     'preventOverlap-with-sortBy',
  //   );
  // });

  // it('should handle node size from data', async () => {
  //   const nodesWithSize = graph.getAllNodes().map((node) => ({
  //     id: node.id,
  //     data: { ...node.data, size: [30, 30] },
  //   }));
  //   const graphWithSize = new Graph({
  //     nodes: nodesWithSize as any,
  //     edges: graph.getAllEdges() as any,
  //   });
  //   const layout = new RadialLayout({
  //     center: [250, 250],
  //     focusNode: 'Brazil',
  //     unitRadius: 50,
  //     preventOverlap: true,
  //     maxPreventOverlapIteration: 500,
  //   });
  //   const positions = await layout.execute(graphWithSize);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'node-size-from-data');
  // });

  // it('should handle function nodeSize', async () => {
  //   const positions = await radial.execute(graph, {
  //     preventOverlap: true,
  //     nodeSize: () => 25,
  //     nodeSpacing: 10,
  //     maxPreventOverlapIteration: 500,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'function-nodeSize');
  // });

  // it('should work with minimal graph', async () => {
  //   const nodes = [
  //     { id: 'a', data: {} },
  //     { id: 'b', data: {} },
  //   ];
  //   const edges = [{ id: 'e1', source: 'a', target: 'b', data: {} }];
  //   const minimalGraph = new Graph({
  //     nodes: nodes as any,
  //     edges: edges as any,
  //   });
  //   const layout = new RadialLayout({
  //     center: [250, 250],
  //     focusNode: 'a',
  //     unitRadius: 80,
  //   });
  //   const positions = await layout.execute(minimalGraph);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'minimal-graph');
  // });

  // it('should render with all options combined', async () => {
  //   const positions = await radial.execute(graph, {
  //     center: [250, 250],
  //     focusNode: 'Spain',
  //     unitRadius: 55,
  //     linkDistance: 70,
  //     preventOverlap: true,
  //     nodeSize: 22,
  //     nodeSpacing: 8,
  //     strictRadial: false,
  //     maxPreventOverlapIteration: 400,
  //     sortBy: 'data',
  //     sortStrength: 15,
  //     maxIteration: 600,
  //   });
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'all-options-combined');
  // });

  // it('should handle zero width (semiWidth = 0)', async () => {
  //   const nodes = [
  //     { id: 'a', data: {} },
  //     { id: 'b', data: {} },
  //     { id: 'c', data: {} },
  //   ];
  //   const edges = [
  //     { id: 'e1', source: 'a', target: 'b', data: {} },
  //     { id: 'e2', source: 'b', target: 'c', data: {} },
  //   ];
  //   const smallGraph = new Graph({
  //     nodes: nodes as any,
  //     edges: edges as any,
  //   });
  //   const layout = new RadialLayout({
  //     width: 0,
  //     height: 500,
  //     center: [0, 250],
  //     focusNode: 'a',
  //     unitRadius: 50,
  //   });
  //   const positions = await layout.execute(smallGraph);
  //   expect(positions.nodes).toHaveLength(3);
  //   positions.nodes.forEach((n) => {
  //     expect(Number.isFinite(n.data.x)).toBe(true);
  //     expect(Number.isFinite(n.data.y)).toBe(true);
  //   });
  // });

  // it('should handle zero height (semiHeight = 0)', async () => {
  //   const nodes = [
  //     { id: 'a', data: {} },
  //     { id: 'b', data: {} },
  //     { id: 'c', data: {} },
  //   ];
  //   const edges = [
  //     { id: 'e1', source: 'a', target: 'b', data: {} },
  //     { id: 'e2', source: 'b', target: 'c', data: {} },
  //   ];
  //   const smallGraph = new Graph({
  //     nodes: nodes as any,
  //     edges: edges as any,
  //   });
  //   const layout = new RadialLayout({
  //     width: 500,
  //     height: 0,
  //     center: [250, 0],
  //     focusNode: 'a',
  //     unitRadius: 50,
  //   });
  //   const positions = await layout.execute(smallGraph);
  //   expect(positions.nodes).toHaveLength(3);
  //   positions.nodes.forEach((n) => {
  //     expect(Number.isFinite(n.data.x)).toBe(true);
  //     expect(Number.isFinite(n.data.y)).toBe(true);
  //   });
  // });

  // it('should handle zero width and height', async () => {
  //   const nodes = [
  //     { id: 'a', data: {} },
  //     { id: 'b', data: {} },
  //   ];
  //   const edges = [{ id: 'e1', source: 'a', target: 'b', data: {} }];
  //   const smallGraph = new Graph({
  //     nodes: nodes as any,
  //     edges: edges as any,
  //   });
  //   const layout = new RadialLayout({
  //     width: 0,
  //     height: 0,
  //     center: [0, 0],
  //     focusNode: 'a',
  //     unitRadius: 50,
  //   });
  //   const positions = await layout.execute(smallGraph);
  //   expect(positions.nodes).toHaveLength(2);
  //   positions.nodes.forEach((n) => {
  //     expect(Number.isFinite(n.data.x)).toBe(true);
  //     expect(Number.isFinite(n.data.y)).toBe(true);
  //   });
  // });

  // it('should handle mds failure with invalid distances', async () => {
  //   // Create a graph structure that might cause MDS to fail
  //   const nodes = [
  //     { id: '1', data: {} },
  //     { id: '2', data: {} },
  //     { id: '3', data: {} },
  //     { id: '4', data: {} },
  //   ];
  //   const edges = [
  //     { id: 'e1', source: '1', target: '2', data: {} },
  //     { id: 'e2', source: '2', target: '3', data: {} },
  //     { id: 'e3', source: '3', target: '4', data: {} },
  //   ];
  //   const testGraph = new Graph({
  //     nodes: nodes as any,
  //     edges: edges as any,
  //   });
  //   const layout = new RadialLayout({
  //     center: [250, 250],
  //     focusNode: '1',
  //     unitRadius: 50,
  //     linkDistance: 60,
  //   });
  //   const positions = await layout.execute(testGraph);
  //   // Even if MDS fails, random positions should be generated
  //   expect(positions.nodes).toHaveLength(4);
  //   positions.nodes.forEach((n) => {
  //     expect(Number.isFinite(n.data.x)).toBe(true);
  //     expect(Number.isFinite(n.data.y)).toBe(true);
  //   });
  // });

  // it('should handle overlapping nodes at same position (vecLength = 0)', async () => {
  //   const nodes = [
  //     { id: 'a', data: {} },
  //     { id: 'b', data: {} },
  //     { id: 'c', data: {} },
  //     { id: 'd', data: {} },
  //   ];
  //   // Create a star pattern where multiple nodes might overlap
  //   const edges = [
  //     { id: 'e1', source: 'a', target: 'b', data: {} },
  //     { id: 'e2', source: 'a', target: 'c', data: {} },
  //     { id: 'e3', source: 'a', target: 'd', data: {} },
  //   ];
  //   const starGraph = new Graph({
  //     nodes: nodes as any,
  //     edges: edges as any,
  //   });
  //   const layout = new RadialLayout({
  //     center: [250, 250],
  //     focusNode: 'a',
  //     unitRadius: 0.001, // Very small radius to force overlap
  //     preventOverlap: true,
  //     nodeSize: 30,
  //     nodeSpacing: 5,
  //     maxPreventOverlapIteration: 100,
  //   });
  //   const positions = await layout.execute(starGraph);
  //   expect(positions.nodes).toHaveLength(4);
  //   positions.nodes.forEach((n) => {
  //     expect(Number.isFinite(n.data.x)).toBe(true);
  //     expect(Number.isFinite(n.data.y)).toBe(true);
  //   });
  // });

  // it('should handle nodes with identical positions during overlap prevention', async () => {
  //   // Create nodes that will be on the same circle
  //   const nodes = [
  //     { id: '1', data: {} },
  //     { id: '2', data: {} },
  //     { id: '3', data: {} },
  //     { id: '4', data: {} },
  //     { id: '5', data: {} },
  //   ];
  //   const edges = [
  //     { id: 'e1', source: '1', target: '2', data: {} },
  //     { id: 'e2', source: '1', target: '3', data: {} },
  //     { id: 'e3', source: '1', target: '4', data: {} },
  //     { id: 'e4', source: '1', target: '5', data: {} },
  //   ];
  //   const sameCircleGraph = new Graph({
  //     nodes: nodes as any,
  //     edges: edges as any,
  //   });
  //   const layout = new RadialLayout({
  //     center: [250, 250],
  //     focusNode: '1',
  //     unitRadius: 10, // Very small to force tight clustering
  //     preventOverlap: true,
  //     nodeSize: 50, // Large node size
  //     nodeSpacing: 10,
  //     strictRadial: true,
  //     maxPreventOverlapIteration: 200,
  //   });
  //   const positions = await layout.execute(sameCircleGraph);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(
  //     __filename,
  //     'overlapping-same-position',
  //   );
  // });

  // it('should handle preventOverlap with nodes at exact same position', async () => {
  //   const nodes = [
  //     { id: 'center', data: {} },
  //     { id: 'a', data: {} },
  //     { id: 'b', data: {} },
  //     { id: 'c', data: {} },
  //   ];
  //   const edges = [
  //     { id: 'e1', source: 'center', target: 'a', data: {} },
  //     { id: 'e2', source: 'center', target: 'b', data: {} },
  //     { id: 'e3', source: 'center', target: 'c', data: {} },
  //   ];
  //   const testGraph = new Graph({
  //     nodes: nodes as any,
  //     edges: edges as any,
  //   });
  //   const layout = new RadialLayout({
  //     center: [250, 250],
  //     focusNode: 'center',
  //     unitRadius: 5, // Very small radius
  //     preventOverlap: true,
  //     nodeSize: 40,
  //     nodeSpacing: 10,
  //     maxPreventOverlapIteration: 300,
  //   });
  //   const positions = await layout.execute(testGraph);
  //   await renderNodesAndEdges(canvas, positions);
  //   await expect(canvas).toMatchSnapshot(__filename, 'exact-same-position');
  // });

  // it('should do radial layout with unitRadius and linkDistance', async () => {
  //   const data: any = {
  //     nodes: [
  //       { id: '0', label: '0', data: {} },
  //       { id: '1', label: '1', data: {} },
  //       { id: '2', label: '2', data: {} },
  //       { id: '3', label: '3', data: {} },
  //       { id: '4', label: '4', data: {} },
  //       { id: '5', label: '5', data: {} },
  //     ],
  //     edges: [
  //       { id: 'edge0', source: '0', target: '1', data: {} },
  //       { id: 'edge1', source: '0', target: '2', data: {} },
  //       { id: 'edge2', source: '3', target: '4', data: {} },
  //     ],
  //   };
  //   const graph = new Graph<any, any>({
  //     nodes: [...data.nodes],
  //     edges: [...data.edges],
  //   });
  //   const unitRadius = 100;
  //   const fnIndex = 1;
  //   const focusNode = data.nodes[fnIndex];
  //   const center: any = [250, 250];

  //   const radial = new RadialLayout({
  //     width: 500,
  //     height: 600,
  //     center,
  //     maxIteration: 100,
  //     focusNode,
  //     unitRadius,
  //     linkDistance: 100,
  //   });
  //   const positions = await radial.execute(graph);

  //   const focusPos = positions.nodes[fnIndex];
  //   const oneStepNode = positions.nodes[0];
  //   const twoStepNode = positions.nodes[2];
  //   const descreteNode1 = positions.nodes[3];
  //   const descreteNode2 = positions.nodes[5];
  //   const descreteNode3 = positions.nodes[4];

  //   const distToOneStepNode = getEuclideanDistance(focusPos, oneStepNode);
  //   const distToTwoStepNode = getEuclideanDistance(focusPos, twoStepNode);
  //   const distToDescreteNode1 = getEuclideanDistance(focusPos, descreteNode1);
  //   const distToDescreteNode2 = getEuclideanDistance(focusPos, descreteNode2);
  //   const distToDescreteNode3 = getEuclideanDistance(focusPos, descreteNode3);

  //   expect(mathEqual(distToOneStepNode, unitRadius)).toEqual(true);
  //   expect(mathEqual(distToTwoStepNode, 2 * unitRadius)).toEqual(true);
  //   expect(mathEqual(distToDescreteNode1, 3 * unitRadius)).toEqual(true);
  //   expect(mathEqual(distToDescreteNode2, 3 * unitRadius)).toEqual(true);
  //   expect(mathEqual(distToDescreteNode3, 4 * unitRadius)).toEqual(true);
  // });

  // it('should do radial layout with focusNode which is a descrete node', async () => {
  //   const data: any = {
  //     nodes: [
  //       { id: '0', label: '0', data: {} },
  //       { id: '1', label: '1', data: {} },
  //       { id: '2', label: '2', data: {} },
  //       { id: '3', label: '3', data: {} },
  //       { id: '4', label: '4', data: {} },
  //       { id: '5', label: '5', data: {} },
  //     ],
  //     edges: [
  //       { id: 'edge0', source: '0', target: '1', data: {} },
  //       { id: 'edge1', source: '0', target: '2', data: {} },
  //       { id: 'edge2', source: '3', target: '4', data: {} },
  //     ],
  //   };
  //   const graph = new Graph<any, any>({
  //     nodes: [...data.nodes],
  //     edges: [...data.edges],
  //   });
  //   const unitRadius = 100;
  //   const focusNodeId = '5';

  //   const radial = new RadialLayout({
  //     focusNode: focusNodeId,
  //     unitRadius,
  //   });
  //   const positions = await radial.execute(graph);

  //   const focusNode = positions.nodes.find((node) => node.id === focusNodeId);
  //   const descreteNode1 = positions.nodes[0];
  //   const descreteNode2 = positions.nodes[1];
  //   const descreteNode3 = positions.nodes[3];
  //   const descreteNode4 = positions.nodes[4];

  //   const distToDescreteNode1 = getEuclideanDistance(focusNode, descreteNode1);
  //   const distToDescreteNode2 = getEuclideanDistance(focusNode, descreteNode2);
  //   const distToDescreteNode3 = getEuclideanDistance(focusNode, descreteNode3);
  //   const distToDescreteNode4 = getEuclideanDistance(focusNode, descreteNode4);

  //   expect(mathEqual(distToDescreteNode1, unitRadius)).toEqual(true);
  //   expect(mathEqual(distToDescreteNode2, 2 * unitRadius)).toEqual(true);
  //   expect(mathEqual(distToDescreteNode3, unitRadius)).toEqual(true);
  //   expect(mathEqual(distToDescreteNode4, 2 * unitRadius)).toEqual(true);
  // });

  // it('should do radial layout with preventOverlap, number nodeSpacing, and array nodeSize', async () => {
  //   const data: any = {
  //     nodes: [
  //       { id: '0', label: '0', data: {} },
  //       { id: '1', label: '1', data: {} },
  //       { id: '2', label: '2', data: {} },
  //       { id: '3', label: '3', data: {} },
  //       { id: '4', label: '4', data: {} },
  //       { id: '5', label: '5', data: {} },
  //     ],
  //     edges: [
  //       { id: 'edge0', source: '0', target: '1', data: {} },
  //       { id: 'edge1', source: '0', target: '2', data: {} },
  //       { id: 'edge2', source: '3', target: '4', data: {} },
  //     ],
  //   };
  //   const graph = new Graph<any, any>({
  //     nodes: [...data.nodes],
  //     edges: [...data.edges],
  //   });
  //   const unitRadius = 100;
  //   const focusNodeId = '5';
  //   const nodeSize = [40, 20];
  //   const nodeSpacing = 10;

  //   const radial = new RadialLayout({
  //     focusNode: focusNodeId,
  //     preventOverlap: true,
  //     maxPreventOverlapIteration: 2000,
  //     unitRadius,
  //     nodeSpacing,
  //     nodeSize,
  //   });
  //   const positions = await radial.execute(graph);

  //   // const focusNode = positions.nodes.find(node => node.id === focusNodeId);
  //   const overlapNode1 = positions.nodes[2];
  //   const overlapNode2 = positions.nodes[4];
  //   const dist = getEuclideanDistance(overlapNode1, overlapNode2);
  //   expect(dist > nodeSpacing + Math.max(...nodeSize)).toEqual(true);
  // });

  // it('should do radial layout with preventOverlap, function nodeSpacing, and size in data', async () => {
  //   const data: any = {
  //     nodes: [
  //       { id: '0', label: '0', data: {} },
  //       { id: '1', label: '1', data: {} },
  //       { id: '2', label: '2', data: {} },
  //       { id: '3', label: '3', data: {} },
  //       { id: '4', label: '4', data: {} },
  //       { id: '5', label: '5', data: {} },
  //     ],
  //     edges: [
  //       { id: 'edge0', source: '0', target: '1', data: {} },
  //       { id: 'edge1', source: '0', target: '2', data: {} },
  //       { id: 'edge2', source: '3', target: '4', data: {} },
  //     ],
  //   };
  //   const graph = new Graph<any, any>({
  //     nodes: data.nodes.map((node: any) => ({
  //       ...node,
  //       data: {
  //         ...node.data,
  //         size: [40, 20],
  //       },
  //     })),
  //     edges: [...data.edges],
  //   });
  //   const unitRadius = 100;
  //   const focusNodeId = '5';
  //   const nodeSpacing = (d: any) => {
  //     return 5;
  //   };

  //   const radial = new RadialLayout({
  //     focusNode: focusNodeId,
  //     preventOverlap: true,
  //     maxPreventOverlapIteration: 2000,
  //     unitRadius,
  //     nodeSpacing,
  //   });
  //   const positions = await radial.execute(graph);

  //   const overlapNode1 = positions.nodes[2];
  //   const overlapNode2 = positions.nodes[4];
  //   const dist = getEuclideanDistance(overlapNode1, overlapNode2);
  //   expect(dist > 5 + 40).toEqual(true);
  // });

  // it("should do radial layout with sortBy: 'data' ", async () => {
  //   const data: any = {
  //     nodes: [
  //       { id: '0', label: '0', data: {} },
  //       { id: '1', label: '1', data: {} },
  //       { id: '2', label: '2', data: {} },
  //       { id: '3', label: '3', data: {} },
  //       { id: '4', label: '4', data: {} },
  //       { id: '5', label: '5', data: {} },
  //     ],
  //     edges: [
  //       { id: 'edge0', source: '0', target: '1', data: {} },
  //       { id: 'edge1', source: '0', target: '2', data: {} },
  //       { id: 'edge2', source: '3', target: '4', data: {} },
  //     ],
  //   };
  //   const graph = new Graph<any, any>({
  //     nodes: [...data.nodes],
  //     edges: [...data.edges],
  //   });
  //   const focusNodeId = '5';

  //   const radial = new RadialLayout({
  //     focusNode: focusNodeId,
  //     sortBy: 'data',
  //   });
  //   const positions = await radial.execute(graph);
  //   // keeps relative order in data.nodes
  //   if (positions.nodes[4].data.y < positions.nodes[2].data.y) {
  //     expect(positions.nodes[2].data.y < positions.nodes[1].data.y).toBe(true);
  //   } else {
  //     expect(positions.nodes[2].data.y > positions.nodes[1].data.y).toBe(true);
  //   }
  // });

  // it("should do radial layout with sortBy: 'sortProperty' ", async () => {
  //   const data: any = {
  //     nodes: [
  //       { id: '0', label: '0', data: {} },
  //       { id: '1', label: '1', data: {} },
  //       { id: '2', label: '2', data: {} },
  //       { id: '3', label: '3', data: {} },
  //       { id: '4', label: '4', data: {} },
  //       { id: '5', label: '5', data: {} },
  //     ],
  //     edges: [
  //       { id: 'edge0', source: '0', target: '1', data: {} },
  //       { id: 'edge1', source: '0', target: '2', data: {} },
  //       { id: 'edge2', source: '3', target: '4', data: {} },
  //     ],
  //   };
  //   const graph = new Graph<any, any>({
  //     nodes: data.nodes.map((node: any, i: number) => ({
  //       ...node,
  //       data: {
  //         ...node.data,
  //         sortProperty: i % 2,
  //       },
  //     })),
  //     edges: [...data.edges],
  //   });
  //   const focusNodeId = '5';

  //   const radial = new RadialLayout({
  //     focusNode: focusNodeId,
  //     sortBy: 'sortProperty',
  //     sortStrength: 1000,
  //     preventOverlap: true,
  //     maxPreventOverlapIteration: 2000,
  //     nodeSize: 50,
  //   });
  //   const positions = await radial.execute(graph);

  //   const sameClusterNodeDist = getEuclideanDistance(
  //     positions.nodes[4],
  //     positions.nodes[2],
  //   );
  //   const differentClusterNodeDist1 = getEuclideanDistance(
  //     positions.nodes[2],
  //     positions.nodes[1],
  //   );
  //   const differentClusterNodeDist2 = getEuclideanDistance(
  //     positions.nodes[4],
  //     positions.nodes[1],
  //   );
  //   expect(mathEqual(sameClusterNodeDist, 50)).toBe(true);
  //   expect(sameClusterNodeDist < differentClusterNodeDist1).toBe(true);
  //   expect(sameClusterNodeDist < differentClusterNodeDist2).toBe(true);
  // });

  // it('should not do radial layout with inexistent focusNode', async () => {
  //   const data: any = {
  //     nodes: [
  //       { id: '0', label: '0', data: {} },
  //       { id: '1', label: '1', data: {} },
  //       { id: '2', label: '2', data: {} },
  //       { id: '3', label: '3', data: {} },
  //       { id: '4', label: '4', data: {} },
  //       { id: '5', label: '5', data: {} },
  //     ],
  //     edges: [
  //       { id: 'edge0', source: '0', target: '1', data: {} },
  //       { id: 'edge1', source: '0', target: '2', data: {} },
  //       { id: 'edge2', source: '3', target: '4', data: {} },
  //     ],
  //   };
  //   const graph = new Graph<any, any>({
  //     nodes: [...data.nodes],
  //     edges: [...data.edges],
  //   });

  //   const radial = new RadialLayout({
  //     focusNode: 'id-inexistent',
  //     center: [10, 20],
  //   });
  //   const positions = await radial.execute(graph);

  //   // focusNode will be the first node
  //   expect(positions.nodes[0].data.x).toBe(10);
  //   expect(positions.nodes[0].data.y).toBe(20);
  // });
});

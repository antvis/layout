import { GridLayout } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { Graph } from '@antv/graphlib';
import { countries } from '../dataset';
import { renderNodesAndEdges } from '../utils';

describe('layout grid', () => {
  let canvas: Canvas;
  let graph: Graph<any, any>;
  let gridLayout: GridLayout;

  beforeEach(() => {
    canvas = createCanvas();
    const { nodes, edges } = countries;
    graph = new Graph({ nodes: nodes, edges });
    gridLayout = new GridLayout({
      begin: [50, 50],
      nodeSize: 20,
    });
  });

  afterEach(() => {
    canvas.destroy();
  });

  it('should render with default config', async () => {
    const positions = await gridLayout.execute(graph);
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom begin position', async () => {
    const positions = await gridLayout.execute(graph, {
      begin: [100, 100],
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-begin');
  });

  it('should render with fixed cols', async () => {
    const positions = await gridLayout.execute(graph, {
      cols: 5,
      sortBy: 'id',
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'fixed-cols-5');
  });

  it('should render with fixed rows', async () => {
    const positions = await gridLayout.execute(graph, {
      rows: 5,
      sortBy: 'id',
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'fixed-rows-5');
  });

  it('should render with fixed rows and cols', async () => {
    const positions = await gridLayout.execute(graph, {
      rows: 6,
      cols: 6,
      sortBy: 'id',
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'fixed-rows-cols-6');
  });

  it('should render with condense enabled', async () => {
    const positions = await gridLayout.execute(graph, {
      condense: true,
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'condense');
  });

  it('should render with preventOverlap disabled', async () => {
    const positions = await gridLayout.execute(graph, {
      preventOverlap: false,
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'preventOverlap-false');
  });

  it('should render with preventOverlap and large nodeSize', async () => {
    const positions = await gridLayout.execute(graph, {
      preventOverlap: true,
      nodeSize: 40,
      preventOverlapPadding: 15,
    });
    await renderNodesAndEdges(canvas, positions, true, { r: 20 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-large-nodeSize',
    );
  });

  it('should render with preventOverlap and array nodeSize', async () => {
    const positions = await gridLayout.execute(graph, {
      preventOverlap: true,
      nodeSize: [50, 30],
      preventOverlapPadding: 10,
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-array-nodeSize',
    );
  });

  it('should render with sortBy degree', async () => {
    const positions = await gridLayout.execute(graph, {
      sortBy: 'degree',
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-degree');
  });

  it('should render with sortBy id', async () => {
    const positions = await gridLayout.execute(graph, {
      sortBy: 'id',
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-id');
  });

  it('should render with custom width and height', async () => {
    const positions = await gridLayout.execute(graph, {
      width: 600,
      height: 600,
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-width-height');
  });

  it('should render with cols more than nodes', async () => {
    const positions = await gridLayout.execute(graph, {
      cols: 50,
      sortBy: 'id',
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'cols-more-than-nodes');
  });

  it('should render with rows more than nodes', async () => {
    const positions = await gridLayout.execute(graph, {
      rows: 50,
      sortBy: 'id',
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'rows-more-than-nodes');
  });

  it('should render with rows and cols product less than nodes', async () => {
    const positions = await gridLayout.execute(graph, {
      rows: 3,
      cols: 3,
      sortBy: 'id',
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'rows-cols-less-nodes');
  });

  it('should render with condense and fixed cols', async () => {
    const positions = await gridLayout.execute(graph, {
      condense: true,
      cols: 8,
    });
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'condense-fixed-cols');
  });

  it('returns empty result for empty graph', async () => {
    const graph = new Graph({ nodes: [], edges: [] });
    const layout = new GridLayout({ begin: [0, 0] });
    const positions = await layout.execute(graph, {} as any);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('assign places single node at begin position', async () => {
    const graph = new Graph({
      nodes: [{ id: 'a', data: {} }],
      edges: [] as any,
    });
    const layout = new GridLayout();
    await layout.assign(graph, { begin: [10, 20] } as any);
    const n = graph.getAllNodes()[0];
    expect((n.data as any).x).toBe(10);
    expect((n.data as any).y).toBe(20);
  });

  it('assign mode should directly modify graph node positions', async () => {
    await gridLayout.assign(graph, {});
    const allNodes = graph.getAllNodes();
    allNodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });
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
    const layout = new GridLayout({
      begin: [100, 100],
      cols: 2,
    });
    const positions = await layout.execute(minimalGraph);
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'minimal-graph');
  });

  it('should render with position function', async () => {
    const nodesWithPosition = graph.getAllNodes().map((node, i) => ({
      id: node.id,
      data: {
        ...node.data,
        row: Math.floor(i / 4),
        col: i % 4,
      },
    }));
    const graphWithPosition = new Graph({
      nodes: nodesWithPosition as any,
      edges: graph.getAllEdges() as any,
    });
    const layout = new GridLayout({
      begin: [50, 50],
      position: (d: any) => ({
        row: d.data.row,
        col: d.data.col,
      }),
    });
    const positions = await layout.execute(graphWithPosition);
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'position-function');
  });

  it('should handle nodes with size in data', async () => {
    const nodesWithSize = graph.getAllNodes().map((node) => ({
      id: node.id,
      data: { ...node.data, size: [40, 40] },
    }));
    const graphWithSize = new Graph({
      nodes: nodesWithSize as any,
      edges: graph.getAllEdges() as any,
    });
    const layout = new GridLayout({
      begin: [50, 50],
      preventOverlap: true,
      rows: 4,
      cols: 5,
    });
    const positions = await layout.execute(graphWithSize);
    await renderNodesAndEdges(canvas, positions, true, { r: 20 });
    await expect(canvas).toMatchSnapshot(__filename, 'node-size-from-data');
  });

  it('should render with function nodeSize', async () => {
    const positions = await gridLayout.execute(graph, {
      nodeSize: () => 40,
      preventOverlap: true,
    });
    await renderNodesAndEdges(canvas, positions, true, { r: 20 });
    await expect(canvas).toMatchSnapshot(__filename, 'function-nodeSize');
  });

  it('should handle condense with preventOverlap', async () => {
    const positions = await gridLayout.execute(graph, {
      condense: true,
      preventOverlap: true,
      nodeSize: 30,
      preventOverlapPadding: 10,
    });
    await renderNodesAndEdges(canvas, positions, true, { r: 15 });
    await expect(canvas).toMatchSnapshot(__filename, 'condense-preventOverlap');
  });

  it('should render with sortBy custom property', async () => {
    const nodesWithProperty = graph.getAllNodes().map((node, i) => ({
      id: node.id,
      data: { ...node.data, customSort: i % 3 },
    }));
    const graphWithProperty = new Graph({
      nodes: nodesWithProperty as any,
      edges: graph.getAllEdges() as any,
    });
    const layout = new GridLayout({
      begin: [50, 50],
      sortBy: 'customSort',
      rows: 4,
      cols: 5,
    });
    const positions = await layout.execute(graphWithProperty);
    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-custom-property');
  });

  // Test case 1: sortBy id with mixed number and string IDs
  it('should sort by id with number ids', async () => {
    const nodes = [
      { id: 5, data: {} },
      { id: 2, data: {} },
      { id: 8, data: {} },
      { id: 1, data: {} },
      { id: 3, data: {} },
    ];
    const edges = [
      { id: 'e1', source: 5, target: 2, data: {} },
      { id: 'e2', source: 2, target: 8, data: {} },
    ];
    const graphWithNumberIds = new Graph({
      nodes: nodes as any,
      edges: edges as any,
    });
    const layout = new GridLayout({
      begin: [50, 50],
      sortBy: 'id',
      cols: 3,
    });
    const positions = await layout.execute(graphWithNumberIds);

    // Verify nodes are sorted by id in descending order (8, 5, 3, 2, 1)
    expect(positions.nodes[0].id).toBe(8);
    expect(positions.nodes[1].id).toBe(5);
    expect(positions.nodes[2].id).toBe(3);
    expect(positions.nodes[3].id).toBe(2);
    expect(positions.nodes[4].id).toBe(1);

    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-id-numbers');
  });

  it('should sort by id with string ids using localeCompare', async () => {
    const nodes = [
      { id: 'zebra', data: {} },
      { id: 'apple', data: {} },
      { id: 'mango', data: {} },
      { id: 'banana', data: {} },
    ];
    const edges = [{ id: 'e1', source: 'apple', target: 'banana', data: {} }];
    const graphWithStringIds = new Graph({
      nodes: nodes as any,
      edges: edges as any,
    });
    const layout = new GridLayout({
      begin: [50, 50],
      sortBy: 'id',
      cols: 2,
    });
    const positions = await layout.execute(graphWithStringIds);

    // Verify nodes are sorted alphabetically (localeCompare returns ascending)
    const sortedIds = positions.nodes.map((n) => n.id);
    expect(sortedIds).toEqual(['apple', 'banana', 'mango', 'zebra']);

    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-id-strings');
  });

  // Test case 2: rows*cols > cells, reducing small side
  it('should reduce small side when rows*cols > cells', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
      { id: 'd', data: {} },
      { id: 'e', data: {} },
    ];
    const edges: any[] = [];
    const smallGraph = new Graph({
      nodes: nodes as any,
      edges: edges as any,
    });

    // Set rows=3, cols=3, but only 5 nodes (3*3=9 > 5)
    // Should reduce to optimize grid
    const layout = new GridLayout({
      begin: [50, 50],
      rows: 3,
      cols: 3,
      sortBy: 'id',
    });
    const positions = await layout.execute(smallGraph);

    // Verify all nodes have positions
    positions.nodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });

    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'reduce-small-side');
  });

  // Test case 3 & 4: position function with undefined col or row
  it('should handle position function with undefined col', async () => {
    const nodes = [
      { id: 'a', data: { row: 0 } }, // col undefined
      { id: 'b', data: { row: 1 } }, // col undefined
      { id: 'c', data: { row: 0 } }, // col undefined
      { id: 'd', data: { row: 2, col: 1 } }, // both defined
    ];
    const edges: any[] = [];
    const graphWithPartialPos = new Graph({
      nodes: nodes as any,
      edges: edges as any,
    });

    const layout = new GridLayout({
      begin: [50, 50],
      position: (node: any) => ({
        row: node.data.row,
        col: node.data.col,
      }),
    });
    const positions = await layout.execute(graphWithPartialPos);

    // Find nodes by id
    const nodeA = positions.nodes.find((n) => n.id === 'a');
    const nodeB = positions.nodes.find((n) => n.id === 'b');
    const nodeC = positions.nodes.find((n) => n.id === 'c');
    const nodeD = positions.nodes.find((n) => n.id === 'd');

    // nodeA and nodeC have row 0 but no col, should get col 0 and 1
    // nodeB has row 1 but no col, should get col 0
    // nodeD has both row 2 and col 1 specified
    expect(nodeA!.data.x).not.toBe(nodeC!.data.x); // Different cols
    expect(nodeB!.data.y).not.toBe(nodeA!.data.y); // Different rows

    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'position-undefined-col');
  });

  it('should handle position function with undefined row', async () => {
    const nodes = [
      { id: 'a', data: { col: 0 } }, // row undefined
      { id: 'b', data: { col: 1 } }, // row undefined
      { id: 'c', data: { col: 0 } }, // row undefined
      { id: 'd', data: { row: 2, col: 2 } }, // both defined
    ];
    const edges: any[] = [];
    const graphWithPartialPos = new Graph({
      nodes: nodes as any,
      edges: edges as any,
    });

    const layout = new GridLayout({
      begin: [50, 50],
      position: (node: any) => ({
        row: node.data.row,
        col: node.data.col,
      }),
    });
    const positions = await layout.execute(graphWithPartialPos);

    // Find nodes by id
    const nodeA = positions.nodes.find((n) => n.id === 'a');
    const nodeB = positions.nodes.find((n) => n.id === 'b');
    const nodeC = positions.nodes.find((n) => n.id === 'c');
    const nodeD = positions.nodes.find((n) => n.id === 'd');

    // nodeA and nodeC have col 0 but no row, should get row 0 and 1
    // nodeB has col 1 but no row, should get row 0
    // nodeD has both row 2 and col 2 specified
    expect(nodeA!.data.y).not.toBe(nodeC!.data.y); // Different rows
    expect(nodeB!.data.x).not.toBe(nodeA!.data.x); // Different cols

    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'position-undefined-row');
  });

  // Test case 5: cell already used, move to next cell
  it('should move to next cell when current cell is used', async () => {
    const nodes = [
      { id: 'a', data: { row: 0, col: 0 } }, // Manually positioned
      { id: 'b', data: {} }, // Auto positioned, should skip (0,0)
      { id: 'c', data: { row: 0, col: 1 } }, // Manually positioned
      { id: 'd', data: {} }, // Auto positioned, should skip (0,0) and (0,1)
      { id: 'e', data: {} }, // Auto positioned
    ];
    const edges: any[] = [];
    const graphWithUsedCells = new Graph({
      nodes: nodes as any,
      edges: edges as any,
    });

    const layout = new GridLayout({
      begin: [50, 50],
      cols: 3,
      position: (node: any) => {
        if (node.data.row !== undefined || node.data.col !== undefined) {
          return {
            row: node.data.row,
            col: node.data.col,
          };
        }
        return undefined;
      },
    });
    const positions = await layout.execute(graphWithUsedCells);

    // Find nodes by id
    const nodeA = positions.nodes.find((n) => n.id === 'a');
    const nodeB = positions.nodes.find((n) => n.id === 'b');
    const nodeC = positions.nodes.find((n) => n.id === 'c');
    const nodeD = positions.nodes.find((n) => n.id === 'd');
    const nodeE = positions.nodes.find((n) => n.id === 'e');

    // Verify manual positions
    expect(nodeA!.data.x).toBeLessThan(nodeC!.data.x); // A is at col 0, C is at col 1

    // Auto-positioned nodes should not overlap with manually positioned ones
    expect(nodeB!.data.x).not.toBe(nodeA!.data.x);
    expect(nodeD!.data.x).not.toBe(nodeA!.data.x);
    expect(nodeD!.data.x).not.toBe(nodeC!.data.x);

    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'skip-used-cells');
  });

  it('should handle complex cell occupation pattern', async () => {
    const nodes = [
      { id: 'manual1', data: { row: 1, col: 1 } },
      { id: 'manual2', data: { row: 0, col: 2 } },
      { id: 'auto1', data: {} },
      { id: 'manual3', data: { row: 2, col: 0 } },
      { id: 'auto2', data: {} },
      { id: 'auto3', data: {} },
      { id: 'manual4', data: { row: 1, col: 2 } },
      { id: 'auto4', data: {} },
    ];
    const edges: any[] = [];
    const complexGraph = new Graph({
      nodes: nodes as any,
      edges: edges as any,
    });

    const layout = new GridLayout({
      begin: [50, 50],
      cols: 3,
      rows: 3,
      position: (node: any) => {
        if (node.data.row !== undefined && node.data.col !== undefined) {
          return {
            row: node.data.row,
            col: node.data.col,
          };
        }
        return undefined;
      },
    });
    const positions = await layout.execute(complexGraph);

    // All nodes should have valid positions
    positions.nodes.forEach((node) => {
      expect(typeof node.data.x).toBe('number');
      expect(typeof node.data.y).toBe('number');
      expect(Number.isFinite(node.data.x)).toBe(true);
      expect(Number.isFinite(node.data.y)).toBe(true);
    });

    // Check that manually positioned nodes are at correct locations
    const manual1 = positions.nodes.find((n) => n.id === 'manual1');
    const manual2 = positions.nodes.find((n) => n.id === 'manual2');
    const manual3 = positions.nodes.find((n) => n.id === 'manual3');
    const manual4 = positions.nodes.find((n) => n.id === 'manual4');

    // manual1 (1,1) and manual4 (1,2) should be in same row
    expect(manual1!.data.y).toBe(manual4!.data.y);
    // manual4 should be to the right of manual1
    expect(manual4!.data.x).toBeGreaterThan(manual1!.data.x);

    await renderNodesAndEdges(canvas, positions, true);
    await expect(canvas).toMatchSnapshot(__filename, 'complex-cell-occupation');
  });
});

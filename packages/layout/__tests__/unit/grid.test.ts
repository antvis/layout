import { GridLayout, type NodeData } from '@/src';
import { createCanvas } from '@@/utils/create';
import type { Canvas } from '@antv/g';
import { deepMix } from '@antv/util';
import { grid as data } from '../dataset';
import { calculatePositions, GraphRenderer, RenderOptions } from '../utils';

describe('layout grid', () => {
  let canvas: Canvas;
  let renderer: GraphRenderer;
  let gridLayout: GridLayout;

  beforeEach(() => {
    canvas = createCanvas();
    renderer = new GraphRenderer(canvas);
    const { width, height } = canvas.getConfig();
    gridLayout = new GridLayout({
      width,
      height,
      begin: [0, 0],
      nodeSize: 30,
    });
  });

  afterEach(() => {
    canvas.destroy();
  });

  const renderLayout = async (
    layout: GridLayout,
    options: RenderOptions = {},
  ) => {
    const opts = deepMix(
      {},
      {
        nodeRadius: 15,
        nodeStyle: { lineWidth: 2 },
        showLabel: true,
        labelStyle: {
          fill: '#fff',
          fontWeight: 'bolder',
          fontSize: 11,
          fontFamily: 'Roboto',
          textAlign: 'center',
          textBaseline: 'middle',
        },
      },
      options,
    );
    await renderer.render(layout, opts);
  };

  it('should render with default config', async () => {
    await gridLayout.execute(data);
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename);
  });

  it('should render with custom begin position', async () => {
    await gridLayout.execute(data, {
      begin: [100, 100],
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-begin');
  });

  it('should render with fixed cols', async () => {
    await gridLayout.execute(data, {
      cols: 5,
      sortBy: 'id',
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'fixed-cols-5');
  });

  it('should render with fixed rows', async () => {
    await gridLayout.execute(data, {
      rows: 5,
      sortBy: 'id',
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'fixed-rows-5');
  });

  it('should render with fixed rows and cols', async () => {
    await gridLayout.execute(data, {
      rows: 6,
      cols: 6,
      sortBy: 'id',
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'fixed-rows-cols-6');
  });

  it('should render with condense enabled', async () => {
    await gridLayout.execute(data, {
      condense: true,
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'condense');
  });

  it('should render with preventOverlap disabled', async () => {
    await gridLayout.execute(data, {
      preventOverlap: false,
      nodeSize: 100,
    });
    await renderLayout(gridLayout, { nodeRadius: 50 });
    await expect(canvas).toMatchSnapshot(__filename, 'preventOverlap-false');
  });

  it('should render with preventOverlap and large nodeSize', async () => {
    await gridLayout.execute(data, {
      preventOverlap: true,
      nodeSize: 60,
      preventOverlapPadding: 15,
    });
    await renderLayout(gridLayout, { nodeRadius: 30 });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-large-nodeSize',
    );
  });

  it('should render with preventOverlap and array nodeSize', async () => {
    await gridLayout.execute(data, {
      preventOverlap: true,
      nodeSize: [100, 50],
      preventOverlapPadding: 15,
    });
    await renderLayout(gridLayout, {
      nodeShape: 'rect',
      nodeSize: { width: 100, height: 50 },
      labelStyle: { x: 50, y: 25 },
    });
    await expect(canvas).toMatchSnapshot(
      __filename,
      'preventOverlap-array-nodeSize',
    );
  });

  it('should render with sortBy degree', async () => {
    await gridLayout.execute(data, {
      sortBy: 'degree',
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-degree');
  });

  it('should render with sortBy id', async () => {
    await gridLayout.execute(data, {
      sortBy: 'id',
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'sortBy-id');
  });

  it('should render with custom width and height', async () => {
    await gridLayout.execute(data, {
      width: 200,
      height: 200,
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'custom-width-height');
  });

  it('should render with cols more than nodes', async () => {
    await gridLayout.execute(data, {
      cols: 50,
      sortBy: 'id',
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'cols-more-than-nodes');
  });

  it('should render with rows more than nodes', async () => {
    await gridLayout.execute(data, {
      rows: 50,
      sortBy: 'id',
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'rows-more-than-nodes');
  });

  it('should render with rows and cols product less than nodes', async () => {
    await gridLayout.execute(data, {
      rows: 3,
      cols: 3,
      sortBy: 'id',
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'rows-cols-less-nodes');
  });

  it('should render with condense and fixed cols', async () => {
    await gridLayout.execute(data, {
      condense: true,
      cols: 8,
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'condense-fixed-cols');
  });

  it('returns empty result for empty data', async () => {
    const data = { nodes: [], edges: [] };
    const layout = new GridLayout();
    await layout.execute(data, {} as any);
    const positions = calculatePositions(layout);
    expect(positions.nodes).toHaveLength(0);
    expect(positions.edges).toHaveLength(0);
  });

  it('should work with minimal data', async () => {
    const nodes = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'c', data: {} },
    ];
    const minimalGraph = {
      nodes: nodes as any,
      edges: edges as any,
    };
    await gridLayout.execute(minimalGraph, {
      cols: 2,
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'minimal-data');
  });

  it('should render with position function', async () => {
    const nodesWithPosition = data.nodes.map((node: any, i: number) => ({
      id: node.id,
      data: {
        row: Math.floor(i / 4),
        col: i % 4,
      },
    }));
    const graphWithPosition = {
      nodes: nodesWithPosition as any,
      edges: data.edges as any,
    };
    await gridLayout.execute(graphWithPosition, {
      position: (d: any) => ({
        row: d.data.row,
        col: d.data.col,
      }),
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'position-function');
  });

  it('should handle nodes with size in data', async () => {
    const nodesWithSize = data.nodes.map((node: any) => ({
      id: node.id,
      data: { size: [40, 40] },
    }));
    const graphWithSize = {
      nodes: nodesWithSize,
      edges: data.edges,
    };
    await gridLayout.execute(graphWithSize, {
      preventOverlap: true,
      rows: 4,
      cols: 5,
    });
    await renderLayout(gridLayout, {
      nodeShape: 'rect',
      nodeSize: { width: 40, height: 40 },
      labelStyle: { x: 20, y: 20 },
    });
    await expect(canvas).toMatchSnapshot(__filename, 'node-size-from-data');
  });

  it('should render with function nodeSize', async () => {
    await gridLayout.execute(data, {
      nodeSize: () => 40,
      preventOverlap: true,
    });
    await renderLayout(gridLayout, { nodeRadius: 20 });
    await expect(canvas).toMatchSnapshot(__filename, 'function-nodeSize');
  });

  it('should handle condense with preventOverlap', async () => {
    await gridLayout.execute(data, {
      condense: true,
      preventOverlap: true,
      nodeSize: 30,
      preventOverlapPadding: 10,
    });
    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'condense-preventOverlap');
  });

  it('should render with sortBy custom property', async () => {
    const nodesWithProperty = data.nodes.map((node: any, i: number) => ({
      id: node.id,
      data: { customSort: i % 3 },
    }));
    const graphWithProperty = {
      nodes: nodesWithProperty,
      edges: data.edges,
    };
    await gridLayout.execute(graphWithProperty, {
      sortBy: (node1, node2) => {
        const a = node1.data.customSort;
        const b = node2.data.customSort;
        return a < b ? -1 : a > b ? 1 : 0;
      },
      rows: 4,
      cols: 5,
    });
    await renderLayout(gridLayout);
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
    const graphWithNumberIds = {
      nodes: nodes as any,
      edges: edges as any,
    };
    await gridLayout.execute(graphWithNumberIds, {
      sortBy: 'id',
      cols: 3,
    });

    await renderLayout(gridLayout);
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
    const graphWithStringIds = {
      nodes: nodes as any,
      edges: edges as any,
    };
    await gridLayout.execute(graphWithStringIds, {
      sortBy: 'id',
      cols: 2,
    });

    await renderLayout(gridLayout);
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
    const smallGraph = {
      nodes: nodes as any,
      edges: edges as any,
    };

    // Set rows=3, cols=3, but only 5 nodes (3*3=9 > 5)
    // Should reduce to optimize grid
    await gridLayout.execute(smallGraph, {
      rows: 3,
      cols: 3,
      sortBy: 'id',
    });

    const positions = calculatePositions(gridLayout);

    // Verify all nodes have positions
    positions.nodes.forEach((node) => {
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    });

    await renderLayout(gridLayout);
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
    const graphWithPartialPos = {
      nodes: nodes as any,
      edges: edges as any,
    };

    await gridLayout.execute(graphWithPartialPos, {
      position: (node: any) => ({
        row: node.data.row,
        col: node.data.col,
      }),
    });

    const calculatedPositions = calculatePositions(gridLayout);
    // Find nodes by id
    const nodeA = calculatedPositions.nodes.find((n: NodeData) => n.id === 'a');
    const nodeB = calculatedPositions.nodes.find((n: NodeData) => n.id === 'b');
    const nodeC = calculatedPositions.nodes.find((n: NodeData) => n.id === 'c');
    const nodeD = calculatedPositions.nodes.find((n: NodeData) => n.id === 'd');

    // nodeA and nodeC have row 0 but no col, should get col 0 and 1
    // nodeB has row 1 but no col, should get col 0
    // nodeD has both row 2 and col 1 specified
    expect(nodeA!.x).not.toBe(nodeC!.x); // Different cols
    expect(nodeB!.y).not.toBe(nodeA!.y); // Different rows

    await renderLayout(gridLayout);
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
    const graphWithPartialPos = {
      nodes: nodes as any,
      edges: edges as any,
    };

    await gridLayout.execute(graphWithPartialPos, {
      position: (node: any) => ({
        row: node.data.row,
        col: node.data.col,
      }),
    });
    const positions = calculatePositions(gridLayout);
    // Find nodes by id
    const nodeA = positions.nodes.find((n: NodeData) => n.id === 'a');
    const nodeB = positions.nodes.find((n: NodeData) => n.id === 'b');
    const nodeC = positions.nodes.find((n: NodeData) => n.id === 'c');
    const nodeD = positions.nodes.find((n: NodeData) => n.id === 'd');

    // nodeA and nodeC have col 0 but no row, should get row 0 and 1
    // nodeB has col 1 but no row, should get row 0
    // nodeD has both row 2 and col 2 specified
    expect(nodeA!.y).not.toBe(nodeC!.y); // Different rows
    expect(nodeB!.x).not.toBe(nodeA!.x); // Different cols

    await renderLayout(gridLayout);
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
    const graphWithUsedCells = {
      nodes: nodes as any,
      edges: edges as any,
    };

    await gridLayout.execute(graphWithUsedCells, {
      cols: 3,
      position: (node: any) => {
        if (node.data.row !== undefined || node.data.col !== undefined) {
          return {
            row: node.data.row,
            col: node.data.col,
          };
        }
        return {
          row: undefined,
          col: undefined,
        };
      },
    });
    const positions = calculatePositions(gridLayout);
    // Find nodes by id
    const nodeA = positions.nodes.find((n: NodeData) => n.id === 'a');
    const nodeB = positions.nodes.find((n: NodeData) => n.id === 'b');
    const nodeC = positions.nodes.find((n: NodeData) => n.id === 'c');
    const nodeD = positions.nodes.find((n: NodeData) => n.id === 'd');
    const nodeE = positions.nodes.find((n: NodeData) => n.id === 'e');

    // Verify manual positions
    expect(nodeA!.x).toBeLessThan(nodeC!.x); // A is at col 0, C is at col 1

    // Auto-positioned nodes should not overlap with manually positioned ones
    expect(nodeB!.x).not.toBe(nodeA!.x);
    expect(nodeD!.x).not.toBe(nodeA!.x);
    expect(nodeD!.x).not.toBe(nodeC!.x);

    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'skip-used-cells');
  });

  it('should handle complex cell occupation pattern', async () => {
    const nodes = [
      { id: 'M1-1', data: { row: 1, col: 1 } },
      { id: 'M0-2', data: { row: 0, col: 2 } },
      { id: 'A1', data: {} },
      { id: 'M2-0', data: { row: 2, col: 0 } },
      { id: 'A2', data: {} },
      { id: 'A3', data: {} },
      { id: 'M1-2', data: { row: 1, col: 2 } },
      { id: 'A4', data: {} },
    ];
    const edges: any[] = [];
    const complexGraph = {
      nodes: nodes as any,
      edges: edges as any,
    };

    await gridLayout.execute(complexGraph, {
      cols: 3,
      rows: 3,
      position: (node: any) => {
        if (node.data.row !== undefined && node.data.col !== undefined) {
          return {
            row: node.data.row,
            col: node.data.col,
          };
        }
        return {
          row: undefined,
          col: undefined,
        };
      },
    });

    // All nodes should have valid positions
    gridLayout.forEachNode((node) => {
      expect(typeof node.x).toBe('number');
      expect(typeof node.y).toBe('number');
      expect(Number.isFinite(node.x)).toBe(true);
      expect(Number.isFinite(node.y)).toBe(true);
    });

    const positions = calculatePositions(gridLayout);
    // Check that manually positioned nodes are at correct locations
    const manual1 = positions.nodes.find((n: NodeData) => n.id === 'M1-1');
    const manual2 = positions.nodes.find((n: NodeData) => n.id === 'M0-2');
    const manual3 = positions.nodes.find((n: NodeData) => n.id === 'M2-0');
    const manual4 = positions.nodes.find((n: NodeData) => n.id === 'M1-2');

    // manual1 (1,1) and manual4 (1,2) should be in same row
    expect(manual1!.y).toBe(manual4!.y);
    // manual4 should be to the right of manual1
    expect(manual4!.x).toBeGreaterThan(manual1!.x);

    await renderLayout(gridLayout);
    await expect(canvas).toMatchSnapshot(__filename, 'complex-cell-occupation');
  });
});

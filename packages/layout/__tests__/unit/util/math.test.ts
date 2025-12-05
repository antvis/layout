import type { Edge, Node, OutNode, Point } from '@/src/types';
import {
  floydWarshall,
  getAdjMatrix,
  getEuclideanDistance,
  getLayoutBBox,
  johnsonAPSP,
  scaleMatrix,
} from '@/src/util/math';
import { LayoutModel } from '@/src/util/model';

describe('getAdjMatrix', () => {
  test('should create adjacency matrix for undirected graph', () => {
    const nodes: Node[] = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'c', data: {} },
    ];

    const model = new LayoutModel({ nodes, edges });
    const matrix = getAdjMatrix(model, false);

    expect(matrix).toEqual([
      [undefined, 1, undefined],
      [1, undefined, 1],
      [undefined, 1, undefined],
    ]);
  });

  test('should create adjacency matrix for directed graph', () => {
    const nodes: Node[] = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'c', data: {} },
    ];

    const model = new LayoutModel({ nodes, edges });
    const matrix = getAdjMatrix(model, true);

    expect(matrix).toEqual([
      [undefined, 1, undefined],
      [undefined, undefined, 1],
      [undefined, undefined, undefined],
    ]);
  });

  test('should handle empty edges', () => {
    const nodes: Node[] = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ];
    const edges: Edge[] = [];

    const model = new LayoutModel({ nodes, edges });
    const matrix = getAdjMatrix(model, false);

    expect(matrix).toEqual([[], []]);
  });

  test('should handle single node', () => {
    const nodes: Node[] = [{ id: 'a', data: {} }];
    const edges: Edge[] = [];

    const model = new LayoutModel({ nodes, edges });
    const matrix = getAdjMatrix(model, false);

    expect(matrix).toEqual([[]]);
  });

  test('should handle self-loop edge', () => {
    const nodes: Node[] = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'a', data: {} },
      { id: 'e2', source: 'a', target: 'b', data: {} },
    ];

    const model = new LayoutModel({ nodes, edges });
    const matrix = getAdjMatrix(model, false);

    expect(matrix[0][0]).toBe(1); // self-loop
    expect(matrix[0][1]).toBe(1);
    expect(matrix[1][0]).toBe(1);
  });

  test('should ignore edges with invalid source or target', () => {
    const nodes: Node[] = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'a', target: 'nonexistent', data: {} },
      { id: 'e3', source: 'nonexistent', target: 'b', data: {} },
    ];

    const model = new LayoutModel({ nodes, edges });
    const matrix = getAdjMatrix(model, false);

    expect(matrix).toEqual([
      [undefined, 1],
      [1, undefined],
    ]);
  });

  test('should handle undefined edges', () => {
    const nodes: Node[] = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ];

    const model = new LayoutModel({ nodes, edges: undefined as any });
    const matrix = getAdjMatrix(model, false);

    expect(matrix).toEqual([[], []]);
  });

  test('should handle empty nodes', () => {
    const model = new LayoutModel({ nodes: [], edges: [] });
    const matrix = getAdjMatrix(model, false);

    expect(matrix).toEqual([]);
  });

  test('should handle complete graph', () => {
    const nodes: Node[] = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'a', target: 'c', data: {} },
      { id: 'e3', source: 'b', target: 'c', data: {} },
    ];

    const model = new LayoutModel({ nodes, edges });
    const matrix = getAdjMatrix(model, false);

    expect(matrix).toEqual([
      [undefined, 1, 1],
      [1, undefined, 1],
      [1, 1, undefined],
    ]);
  });

  test('should handle directed graph with multiple edges from same node', () => {
    const nodes: Node[] = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
      { id: 'c', data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'a', target: 'c', data: {} },
    ];

    const model = new LayoutModel({ nodes, edges });
    const matrix = getAdjMatrix(model, true);

    expect(matrix).toEqual([
      [undefined, 1, 1],
      [undefined, undefined, undefined],
      [undefined, undefined, undefined],
    ]);
  });

  test('should handle bidirectional edges in directed graph', () => {
    const nodes: Node[] = [
      { id: 'a', data: {} },
      { id: 'b', data: {} },
    ];
    const edges: Edge[] = [
      { id: 'e1', source: 'a', target: 'b', data: {} },
      { id: 'e2', source: 'b', target: 'a', data: {} },
    ];

    const model = new LayoutModel({ nodes, edges });
    const matrix = getAdjMatrix(model, true);

    expect(matrix).toEqual([
      [undefined, 1],
      [1, undefined],
    ]);
  });
});

describe('floydWarshall', () => {
  test('should compute shortest paths for simple graph', () => {
    const adjMatrix = [
      [0, 1, Infinity],
      [1, 0, 1],
      [Infinity, 1, 0],
    ];

    const result = floydWarshall(adjMatrix);

    expect(result).toEqual([
      [0, 1, 2],
      [1, 0, 1],
      [2, 1, 0],
    ]);
  });

  test('should handle single node', () => {
    const adjMatrix = [[0]];

    const result = floydWarshall(adjMatrix);

    expect(result).toEqual([[0]]);
  });

  test('should handle disconnected graph', () => {
    const adjMatrix = [
      [0, 1, Infinity],
      [1, 0, Infinity],
      [Infinity, Infinity, 0],
    ];

    const result = floydWarshall(adjMatrix);

    expect(result).toEqual([
      [0, 1, Infinity],
      [1, 0, Infinity],
      [Infinity, Infinity, 0],
    ]);
  });

  test('should handle weighted graph', () => {
    const adjMatrix = [
      [0, 4, Infinity, 5],
      [4, 0, 1, Infinity],
      [Infinity, 1, 0, 3],
      [5, Infinity, 3, 0],
    ];

    const result = floydWarshall(adjMatrix);

    expect(result).toEqual([
      [0, 4, 5, 5],
      [4, 0, 1, 4],
      [5, 1, 0, 3],
      [5, 4, 3, 0],
    ]);
  });
});

describe('scaleMatrix', () => {
  test('should scale matrix by ratio', () => {
    const matrix = [
      [1, 2, 3],
      [4, 5, 6],
    ];

    const result = scaleMatrix(matrix, 2);

    expect(result).toEqual([
      [2, 4, 6],
      [8, 10, 12],
    ]);
  });

  test('should handle zero ratio', () => {
    const matrix = [
      [1, 2],
      [3, 4],
    ];

    const result = scaleMatrix(matrix, 0);

    expect(result).toEqual([
      [0, 0],
      [0, 0],
    ]);
  });

  test('should handle negative ratio', () => {
    const matrix = [
      [1, 2],
      [3, 4],
    ];

    const result = scaleMatrix(matrix, -1);

    expect(result).toEqual([
      [-1, -2],
      [-3, -4],
    ]);
  });

  test('should handle empty matrix', () => {
    const matrix: number[][] = [];

    const result = scaleMatrix(matrix, 2);

    expect(result).toEqual([]);
  });

  test('should handle decimal ratio', () => {
    const matrix = [
      [10, 20],
      [30, 40],
    ];

    const result = scaleMatrix(matrix, 0.5);

    expect(result).toEqual([
      [5, 10],
      [15, 20],
    ]);
  });
});

describe('getEuclideanDistance', () => {
  test('should calculate distance between two points', () => {
    const p1: Point = { x: 0, y: 0 };
    const p2: Point = { x: 3, y: 4 };

    const distance = getEuclideanDistance(p1, p2);

    expect(distance).toBe(5);
  });

  test('should return zero for same point', () => {
    const p1: Point = { x: 5, y: 10 };
    const p2: Point = { x: 5, y: 10 };

    const distance = getEuclideanDistance(p1, p2);

    expect(distance).toBe(0);
  });

  test('should handle negative coordinates', () => {
    const p1: Point = { x: -3, y: -4 };
    const p2: Point = { x: 0, y: 0 };

    const distance = getEuclideanDistance(p1, p2);

    expect(distance).toBe(5);
  });

  test('should calculate horizontal distance', () => {
    const p1: Point = { x: 0, y: 5 };
    const p2: Point = { x: 10, y: 5 };

    const distance = getEuclideanDistance(p1, p2);

    expect(distance).toBe(10);
  });

  test('should calculate vertical distance', () => {
    const p1: Point = { x: 5, y: 0 };
    const p2: Point = { x: 5, y: 10 };

    const distance = getEuclideanDistance(p1, p2);

    expect(distance).toBe(10);
  });
});

describe('getLayoutBBox', () => {
  test('should calculate bounding box for nodes with number size', () => {
    const nodes: OutNode[] = [
      { id: 'a', data: { x: 0, y: 0, size: 20 } },
      { id: 'b', data: { x: 100, y: 100, size: 20 } },
    ];

    const bbox = getLayoutBBox(nodes);

    expect(bbox).toEqual({
      minX: -10,
      minY: -10,
      maxX: 110,
      maxY: 110,
    });
  });

  test('should calculate bounding box for nodes with array size', () => {
    const nodes: OutNode[] = [
      { id: 'a', data: { x: 0, y: 0, size: [40, 20] } },
      { id: 'b', data: { x: 100, y: 100, size: [40, 20] } },
    ];

    const bbox = getLayoutBBox(nodes);

    expect(bbox).toEqual({
      minX: -20,
      minY: -10,
      maxX: 120,
      maxY: 110,
    });
  });

  test('should handle single element array size', () => {
    const nodes: OutNode[] = [{ id: 'a', data: { x: 0, y: 0, size: [30] } }];

    const bbox = getLayoutBBox(nodes);

    expect(bbox).toEqual({
      minX: -15,
      minY: -15,
      maxX: 15,
      maxY: 15,
    });
  });

  test('should use default size when size is undefined', () => {
    const nodes: OutNode[] = [
      { id: 'a', data: { x: 0, y: 0 } },
      { id: 'b', data: { x: 100, y: 100 } },
    ];

    const bbox = getLayoutBBox(nodes);

    expect(bbox).toEqual({
      minX: -15,
      minY: -15,
      maxX: 115,
      maxY: 115,
    });
  });

  test('should use default size when size is NaN', () => {
    const nodes: OutNode[] = [{ id: 'a', data: { x: 0, y: 0, size: NaN } }];

    const bbox = getLayoutBBox(nodes);

    expect(bbox).toEqual({
      minX: -15,
      minY: -15,
      maxX: 15,
      maxY: 15,
    });
  });

  test('should handle single node', () => {
    const nodes: OutNode[] = [{ id: 'a', data: { x: 50, y: 50, size: 40 } }];

    const bbox = getLayoutBBox(nodes);

    expect(bbox).toEqual({
      minX: 30,
      minY: 30,
      maxX: 70,
      maxY: 70,
    });
  });

  test('should handle nodes with negative coordinates', () => {
    const nodes: OutNode[] = [
      { id: 'a', data: { x: -50, y: -50, size: 20 } },
      { id: 'b', data: { x: 50, y: 50, size: 20 } },
    ];

    const bbox = getLayoutBBox(nodes);

    expect(bbox).toEqual({
      minX: -60,
      minY: -60,
      maxX: 60,
      maxY: 60,
    });
  });

  test('should handle nodes with different sizes', () => {
    const nodes: OutNode[] = [
      { id: 'a', data: { x: 0, y: 0, size: 20 } },
      { id: 'b', data: { x: 50, y: 50, size: [60, 40] } },
      { id: 'c', data: { x: 100, y: 100, size: 30 } },
    ];

    const bbox = getLayoutBBox(nodes);

    expect(bbox).toEqual({
      minX: -10,
      minY: -10,
      maxX: 115,
      maxY: 115,
    });
  });

  test('should handle empty node array', () => {
    const nodes: OutNode[] = [];

    const bbox = getLayoutBBox(nodes);

    expect(bbox).toEqual({
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    });
  });

  describe('johnsonAPSP', () => {
    test('should compute shortest paths for simple weighted graph', () => {
      const adjMatrix = [
        [0, 4, Infinity, 5],
        [4, 0, 1, Infinity],
        [Infinity, 1, 0, 3],
        [5, Infinity, 3, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 4, 5, 5],
        [4, 0, 1, 4],
        [5, 1, 0, 3],
        [5, 4, 3, 0],
      ]);
    });

    test('should handle empty graph', () => {
      const adjMatrix: number[][] = [];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([]);
    });

    test('should handle single node', () => {
      const adjMatrix = [[0]];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([[0]]);
    });

    test('should handle disconnected graph', () => {
      const adjMatrix = [
        [0, 1, Infinity],
        [1, 0, Infinity],
        [Infinity, Infinity, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 1, Infinity],
        [1, 0, Infinity],
        [Infinity, Infinity, 0],
      ]);
    });

    test('should produce same results as Floyd-Warshall', () => {
      const adjMatrix = [
        [0, 1, Infinity],
        [1, 0, 1],
        [Infinity, 1, 0],
      ];

      const johnsonResult = johnsonAPSP(adjMatrix);
      const floydResult = floydWarshall(adjMatrix);

      expect(johnsonResult).toEqual(floydResult);
    });

    test('should handle complete graph', () => {
      const adjMatrix = [
        [0, 1, 2],
        [1, 0, 3],
        [2, 3, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 1, 2],
        [1, 0, 3],
        [2, 3, 0],
      ]);
    });

    test('should handle graph with indirect shorter paths', () => {
      const adjMatrix = [
        [0, 10, Infinity, Infinity],
        [10, 0, 1, Infinity],
        [Infinity, 1, 0, 1],
        [Infinity, Infinity, 1, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 10, 11, 12],
        [10, 0, 1, 2],
        [11, 1, 0, 1],
        [12, 2, 1, 0],
      ]);
    });

    test('should handle two-node graph', () => {
      const adjMatrix = [
        [0, 5],
        [5, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 5],
        [5, 0],
      ]);
    });

    test('should handle directed graph (asymmetric matrix)', () => {
      const adjMatrix = [
        [0, 2, Infinity],
        [Infinity, 0, 3],
        [Infinity, Infinity, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 2, 5],
        [Infinity, 0, 3],
        [Infinity, Infinity, 0],
      ]);
    });

    test('should handle graph with varying edge weights', () => {
      const adjMatrix = [
        [0, 1, 100],
        [1, 0, 1],
        [100, 1, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 1, 2],
        [1, 0, 1],
        [2, 1, 0],
      ]);
    });

    test('should handle sparse graph efficiently', () => {
      const adjMatrix = [
        [0, 1, Infinity, Infinity, Infinity],
        [1, 0, 1, Infinity, Infinity],
        [Infinity, 1, 0, 1, Infinity],
        [Infinity, Infinity, 1, 0, 1],
        [Infinity, Infinity, Infinity, 1, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 1, 2, 3, 4],
        [1, 0, 1, 2, 3],
        [2, 1, 0, 1, 2],
        [3, 2, 1, 0, 1],
        [4, 3, 2, 1, 0],
      ]);
    });

    test('should handle graph where direct path is not shortest', () => {
      const adjMatrix = [
        [0, 10, 5, Infinity],
        [10, 0, Infinity, 1],
        [5, Infinity, 0, 3],
        [Infinity, 1, 3, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 9, 5, 8],
        [9, 0, 4, 1],
        [5, 4, 0, 3],
        [8, 1, 3, 0],
      ]);
    });

    test('should handle graph with self-loops ignored', () => {
      const adjMatrix = [
        [0, 2, Infinity],
        [2, 0, 3],
        [Infinity, 3, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 2, 5],
        [2, 0, 3],
        [5, 3, 0],
      ]);
    });

    test('should handle large weights', () => {
      const adjMatrix = [
        [0, 1000, Infinity],
        [1000, 0, 1],
        [Infinity, 1, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 1000, 1001],
        [1000, 0, 1],
        [1001, 1, 0],
      ]);
    });

    test('should handle multiple disconnected components', () => {
      const adjMatrix = [
        [0, 1, Infinity, Infinity],
        [1, 0, Infinity, Infinity],
        [Infinity, Infinity, 0, 2],
        [Infinity, Infinity, 2, 0],
      ];

      const result = johnsonAPSP(adjMatrix);

      expect(result).toEqual([
        [0, 1, Infinity, Infinity],
        [1, 0, Infinity, Infinity],
        [Infinity, Infinity, 0, 2],
        [Infinity, Infinity, 2, 0],
      ]);
    });
  });
});

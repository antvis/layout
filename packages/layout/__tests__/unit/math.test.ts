import type { OutNode } from '@/src/types';
import {
  floydWarshall,
  getAdjMatrix,
  getEuclideanDistance,
  getLayoutBBox,
  scaleMatrix,
} from '@/src/util/math';

describe('math utils', () => {
  describe('getAdjMatrix', () => {
    it('should create undirected adjacency matrix', () => {
      const nodes = [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
      ];
      const edges = [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
      ];

      const matrix = getAdjMatrix({ nodes, edges } as any, false);

      expect(matrix).toHaveLength(3);
      expect(matrix[0][1]).toBe(1); // a -> b
      expect(matrix[1][0]).toBe(1); // b -> a (undirected)
      expect(matrix[1][2]).toBe(1); // b -> c
      expect(matrix[2][1]).toBe(1); // c -> b (undirected)
    });

    it('should create directed adjacency matrix', () => {
      const nodes = [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
        { id: 'c', data: {} },
      ];
      const edges = [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'c', data: {} },
      ];

      const matrix = getAdjMatrix({ nodes, edges } as any, true);

      expect(matrix).toHaveLength(3);
      expect(matrix[0][1]).toBe(1); // a -> b
      expect(matrix[1][0]).toBeUndefined(); // no b -> a (directed)
      expect(matrix[1][2]).toBe(1); // b -> c
      expect(matrix[2][1]).toBeUndefined(); // no c -> b (directed)
    });

    it('should handle edges with non-existent nodes', () => {
      const nodes = [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
      ];
      const edges = [
        { id: 'e1', source: 'a', target: 'b', data: {} },
        { id: 'e2', source: 'b', target: 'nonexistent', data: {} },
        { id: 'e3', source: 'nonexistent', target: 'a', data: {} },
      ];

      const matrix = getAdjMatrix({ nodes, edges } as any, false);

      expect(matrix).toHaveLength(2);
      expect(matrix[0][1]).toBe(1); // a -> b exists
      expect(matrix[1][0]).toBe(1); // b -> a exists
      // Edges with non-existent nodes are ignored
    });

    it('should throw error for invalid nodes data', () => {
      expect(() => {
        getAdjMatrix({ nodes: null, edges: [] } as any, false);
      }).toThrow('invalid nodes data!');
    });

    it('should handle empty edges', () => {
      const nodes = [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
      ];

      const matrix = getAdjMatrix({ nodes, edges: [] } as any, false);

      expect(matrix).toHaveLength(2);
      expect(matrix[0].length).toBe(0);
      expect(matrix[1].length).toBe(0);
    });

    it('should handle undefined edges', () => {
      const nodes = [
        { id: 'a', data: {} },
        { id: 'b', data: {} },
      ];

      const matrix = getAdjMatrix({ nodes, edges: undefined } as any, false);

      expect(matrix).toHaveLength(2);
    });
  });

  describe('floydWarshall', () => {
    it('should compute shortest paths', () => {
      const adjMatrix = [
        [0, 1, 0],
        [0, 0, 1],
        [0, 0, 0],
      ];

      const distances = floydWarshall(adjMatrix);

      expect(distances[0][0]).toBe(0);
      expect(distances[0][1]).toBe(1);
      expect(distances[0][2]).toBe(2); // a -> b -> c
      expect(distances[1][2]).toBe(1);
    });

    it('should handle disconnected nodes', () => {
      const adjMatrix = [
        [0, 1, 0],
        [0, 0, 0],
        [0, 0, 0],
      ];

      const distances = floydWarshall(adjMatrix);

      expect(distances[0][1]).toBe(1);
      expect(distances[0][2]).toBe(Infinity);
      expect(distances[1][2]).toBe(Infinity);
    });
  });

  describe('scaleMatrix', () => {
    it('should scale matrix by ratio', () => {
      const matrix = [
        [1, 2, 3],
        [4, 5, 6],
      ];

      const scaled = scaleMatrix(matrix, 2);

      expect(scaled).toEqual([
        [2, 4, 6],
        [8, 10, 12],
      ]);
    });

    it('should handle zero ratio', () => {
      const matrix = [
        [1, 2],
        [3, 4],
      ];

      const scaled = scaleMatrix(matrix, 0);

      expect(scaled).toEqual([
        [0, 0],
        [0, 0],
      ]);
    });
  });

  describe('getEuclideanDistance', () => {
    it('should calculate distance between two points', () => {
      const p1 = { x: 0, y: 0 };
      const p2 = { x: 3, y: 4 };

      const distance = getEuclideanDistance(p1, p2);

      expect(distance).toBe(5);
    });

    it('should return 0 for same point', () => {
      const p1 = { x: 5, y: 5 };
      const p2 = { x: 5, y: 5 };

      const distance = getEuclideanDistance(p1, p2);

      expect(distance).toBe(0);
    });
  });

  describe('getLayoutBBox', () => {
    it('should calculate bounding box with number size', () => {
      const nodes: OutNode[] = [
        { id: 'a', data: { x: 0, y: 0, size: 20 } },
        { id: 'b', data: { x: 100, y: 100, size: 20 } },
      ];

      const bbox = getLayoutBBox(nodes);

      expect(bbox.minX).toBe(-10);
      expect(bbox.minY).toBe(-10);
      expect(bbox.maxX).toBe(110);
      expect(bbox.maxY).toBe(110);
    });

    it('should calculate bounding box with array size', () => {
      const nodes: OutNode[] = [
        { id: 'a', data: { x: 0, y: 0, size: [40, 20] } },
        { id: 'b', data: { x: 100, y: 100, size: [40, 20] } },
      ];

      const bbox = getLayoutBBox(nodes);

      expect(bbox.minX).toBe(-20);
      expect(bbox.minY).toBe(-10);
      expect(bbox.maxX).toBe(120);
      expect(bbox.maxY).toBe(110);
    });

    it('should handle single element array size', () => {
      const nodes: OutNode[] = [{ id: 'a', data: { x: 0, y: 0, size: [30] } }];

      const bbox = getLayoutBBox(nodes);

      expect(bbox.minX).toBe(-15);
      expect(bbox.minY).toBe(-15);
      expect(bbox.maxX).toBe(15);
      expect(bbox.maxY).toBe(15);
    });

    it('should use default size when undefined', () => {
      const nodes: OutNode[] = [{ id: 'a', data: { x: 0, y: 0 } }];

      const bbox = getLayoutBBox(nodes);

      expect(bbox.minX).toBe(-15);
      expect(bbox.minY).toBe(-15);
      expect(bbox.maxX).toBe(15);
      expect(bbox.maxY).toBe(15);
    });

    it('should use default size when NaN', () => {
      const nodes: OutNode[] = [
        { id: 'a', data: { x: 0, y: 0, size: NaN as any } },
      ];

      const bbox = getLayoutBBox(nodes);

      expect(bbox.minX).toBe(-15);
      expect(bbox.minY).toBe(-15);
      expect(bbox.maxX).toBe(15);
      expect(bbox.maxY).toBe(15);
    });
  });
});

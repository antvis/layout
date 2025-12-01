import type { Node } from '@/src/types';
import { getMaxNodeSize } from '@/src/util/node';;

describe('node', () => {
  describe('getMaxNodeSize', () => {
    test('should return maximum size from nodes with number sizes', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: 10 } },
        { id: 'node2', data: { size: 30 } },
        { id: 'node3', data: { size: 20 } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(30);
    });

    test('should return maximum size from nodes with array sizes', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: [10, 15] } },
        { id: 'node2', data: { size: [20, 25] } },
        { id: 'node3', data: { size: [5, 30] } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(30); // max of all array values
    });

    test('should handle mixed number and array sizes', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: 15 } },
        { id: 'node2', data: { size: [10, 20] } },
        { id: 'node3', data: { size: 25 } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(25);
    });

    test('should handle single node', () => {
      const nodes: Node[] = [{ id: 'node1', data: { size: 42 } }];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(42);
    });

    test('should handle empty nodes array', () => {
      const nodes: Node[] = [];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(-Infinity);
    });

    test('should handle nodes with zero size', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: 0 } },
        { id: 'node2', data: { size: 5 } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(5);
    });

    test('should handle all nodes with zero size', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: 0 } },
        { id: 'node2', data: { size: 0 } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(0);
    });

    test('should handle negative sizes', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: -10 } },
        { id: 'node2', data: { size: -5 } },
        { id: 'node3', data: { size: -20 } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(-5);
    });

    test('should handle custom node size function', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { width: 10, height: 15 } },
        { id: 'node2', data: { width: 20, height: 25 } },
        { id: 'node3', data: { width: 30, height: 5 } },
      ];

      const nodeSizeFn = (node: Node) => {
        const { width = 0, height = 0 } = node.data;
        return Math.max(width, height);
      };
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(30);
    });

    test('should handle nodes with array sizes containing single element', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: [10] } },
        { id: 'node2', data: { size: [20] } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(20);
    });

    test('should handle nodes with array sizes containing multiple elements', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: [10, 20, 15] } },
        { id: 'node2', data: { size: [25, 5, 30] } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(30);
    });

    test('should handle fractional sizes', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: 10.5 } },
        { id: 'node2', data: { size: 20.7 } },
        { id: 'node3', data: { size: 15.3 } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(20.7);
    });

    test('should handle nodes with undefined size using default from function', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: 10 } },
        { id: 'node2', data: {} },
        { id: 'node3', data: { size: 20 } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 5;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(20);
    });

    test('should handle very large sizes', () => {
      const nodes: Node[] = [
        { id: 'node1', data: { size: 1000000 } },
        { id: 'node2', data: { size: 999999 } },
      ];

      const nodeSizeFn = (node: Node) => node.data.size || 0;
      const maxSize = getMaxNodeSize(nodes, nodeSizeFn);

      expect(maxSize).toBe(1000000);
    });
  });
});

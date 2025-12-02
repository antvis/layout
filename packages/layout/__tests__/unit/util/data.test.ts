import type { EdgeData, NodeData } from '@/src/types/data';
import { getEdgeId, getNodeId } from '@/src/util/data';

describe('data', () => {
  describe('getNodeId', () => {
    test('should return node id', () => {
      const node: NodeData = { id: 'node1', data: {} };
      expect(getNodeId(node)).toBe('node1');
    });

    test('should handle numeric id', () => {
      const node: NodeData = { id: 123, data: {} };
      expect(getNodeId(node)).toBe(123);
    });
  });

  describe('getEdgeId', () => {
    test('should return edge id if present', () => {
      const edge: EdgeData = {
        id: 'edge1',
        source: 'node1',
        target: 'node2',
        data: {},
      };
      expect(getEdgeId(edge)).toBe('edge1');
    });

    test('should generate id from source and target if id not present', () => {
      const edge: EdgeData = {
        source: 'node1',
        target: 'node2',
        data: {},
      };
      expect(getEdgeId(edge)).toBe('node1-node2');
    });

    test('should handle numeric source and target', () => {
      const edge: EdgeData = {
        source: 1,
        target: 2,
        data: {},
      };
      expect(getEdgeId(edge)).toBe('1-2');
    });
  });
});

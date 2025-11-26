import { Graph, Node } from '@/src/types';
import {
  orderByDegree,
  orderById,
  orderByOriginal,
  orderByValue,
} from '@/src/util';

describe('Order Functions', () => {
  describe('orderByDegree', () => {
    it('should order nodes by degree from small to large', () => {
      const nodes: Node[] = [
        { id: '1', data: {} },
        { id: '2', data: {} },
        { id: '3', data: {} },
      ];

      const mockGraph = {
        getDegree: jest.fn((id: string) => {
          const degrees: Record<string, number> = { '1': 5, '2': 2, '3': 8 };
          return degrees[id];
        }),
      } as unknown as Graph;

      const result = orderByDegree(nodes, mockGraph);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('2'); // degree: 2
      expect(result[1].id).toBe('1'); // degree: 5
      expect(result[2].id).toBe('3'); // degree: 8
      expect(mockGraph.getDegree).toHaveBeenCalledTimes(6);
    });

    it('should handle nodes with same degree', () => {
      const nodes: Node[] = [
        { id: '1', data: {} },
        { id: '2', data: {} },
      ];

      const mockGraph = {
        getDegree: jest.fn(() => 3),
      } as unknown as Graph;

      const result = orderByDegree(nodes, mockGraph);

      expect(result).toHaveLength(2);
      expect(result.map((n) => n.id)).toEqual(['1', '2']);
    });

    it('should not mutate original nodes array', () => {
      const nodes: Node[] = [
        { id: '1', data: { value: 1 } },
        { id: '2', data: { value: 2 } },
      ];

      const mockGraph = {
        getDegree: jest.fn((id: string) => (id === '1' ? 5 : 2)),
      } as unknown as Graph;

      const originalNodes = [...nodes];
      orderByDegree(nodes, mockGraph);

      expect(nodes).toEqual(originalNodes);
    });
  });

  describe('orderById', () => {
    it('should order numeric ids from small to large', () => {
      const nodes: Node[] = [
        { id: 5, data: {} },
        { id: 1, data: {} },
        { id: 3, data: {} },
      ];

      const result = orderById(nodes);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(3);
      expect(result[2].id).toBe(5);
    });

    it('should order string ids alphabetically', () => {
      const nodes: Node[] = [
        { id: 'node-c', data: {} },
        { id: 'node-a', data: {} },
        { id: 'node-b', data: {} },
      ];

      const result = orderById(nodes);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('node-a');
      expect(result[1].id).toBe('node-b');
      expect(result[2].id).toBe('node-c');
    });

    it('should handle mixed numeric and string ids', () => {
      const nodes: Node[] = [
        { id: 'node-2', data: {} },
        { id: 1, data: {} },
        { id: 'node-1', data: {} },
        { id: 2, data: {} },
      ];

      const result = orderById(nodes);

      expect(result).toHaveLength(4);
      expect(result[0].id).toBe(1);
      expect(result[1].id).toBe(2);
      expect(result[2].id).toBe('node-1');
      expect(result[3].id).toBe('node-2');
    });

    it('should not mutate original nodes array', () => {
      const nodes: Node[] = [
        { id: 3, data: {} },
        { id: 1, data: {} },
      ];

      const originalNodes = [...nodes];
      orderById(nodes);

      expect(nodes).toEqual(originalNodes);
    });
  });

  describe('orderByOriginal', () => {
    it('should keep the original order of nodes', () => {
      const nodes: Node[] = [
        { id: '3', data: { name: 'third' } },
        { id: '1', data: { name: 'first' } },
        { id: '2', data: { name: 'second' } },
      ];

      const result = orderByOriginal(nodes);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('3');
      expect(result[1].id).toBe('1');
      expect(result[2].id).toBe('2');
    });

    it('should clone nodes instead of returning references', () => {
      const nodes: Node[] = [{ id: '1', data: { value: 1 } }];

      const result = orderByOriginal(nodes);

      expect(result[0]).not.toBe(nodes[0]);
      expect(result[0]).toEqual(nodes[0]);
    });

    it('should handle empty array', () => {
      const nodes: Node[] = [];
      const result = orderByOriginal(nodes);

      expect(result).toEqual([]);
    });
  });

  describe('orderByValue', () => {
    it('should order nodes by specified value key from small to large', () => {
      const nodes: Node[] = [
        { id: '1', data: { score: 80 } },
        { id: '2', data: { score: 50 } },
        { id: '3', data: { score: 95 } },
      ];

      const result = orderByValue(nodes, 'score');

      expect(result).toHaveLength(3);
      expect(result[0].data.score).toBe(50);
      expect(result[1].data.score).toBe(80);
      expect(result[2].data.score).toBe(95);
    });

    it('should handle negative values', () => {
      const nodes: Node[] = [
        { id: '1', data: { temperature: 10 } },
        { id: '2', data: { temperature: -5 } },
        { id: '3', data: { temperature: 0 } },
      ];

      const result = orderByValue(nodes, 'temperature');

      expect(result[0].data.temperature).toBe(-5);
      expect(result[1].data.temperature).toBe(0);
      expect(result[2].data.temperature).toBe(10);
    });

    it('should handle decimal values', () => {
      const nodes: Node[] = [
        { id: '1', data: { rating: 4.5 } },
        { id: '2', data: { rating: 3.2 } },
        { id: '3', data: { rating: 4.8 } },
      ];

      const result = orderByValue(nodes, 'rating');

      expect(result[0].data.rating).toBe(3.2);
      expect(result[1].data.rating).toBe(4.5);
      expect(result[2].data.rating).toBe(4.8);
    });

    it('should handle nodes with same value', () => {
      const nodes: Node[] = [
        { id: '1', data: { priority: 5 } },
        { id: '2', data: { priority: 5 } },
        { id: '3', data: { priority: 5 } },
      ];

      const result = orderByValue(nodes, 'priority');

      expect(result).toHaveLength(3);
      expect(result.every((n) => n.data.priority === 5)).toBe(true);
    });

    it('should not mutate original nodes array', () => {
      const nodes: Node[] = [
        { id: '1', data: { weight: 100 } },
        { id: '2', data: { weight: 50 } },
      ];

      const originalNodes = [...nodes];
      orderByValue(nodes, 'weight');

      expect(nodes).toEqual(originalNodes);
    });

    it('should handle missing value key gracefully', () => {
      const nodes: Node[] = [
        { id: '1', data: { score: 80 } },
        { id: '2', data: {} },
        { id: '3', data: { score: 50 } },
      ];

      const result = orderByValue(nodes, 'score');

      expect(result).toHaveLength(3);
    });
  });
});

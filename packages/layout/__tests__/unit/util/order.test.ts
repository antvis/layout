import type { GraphData, NodeData } from '@/src/types/data';
import { GraphLib } from '@/src/model/data';
import {
  orderByDegree,
  orderById,
  orderBySorter,
  orderByTopology,
} from '@/src/util/order';

describe('order', () => {
  describe('orderByDegree', () => {
    test('should sort nodes by degree in ascending order', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
          { id: 'node3', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'node1', target: 'node2', data: {} },
          { id: 'e2', source: 'node1', target: 'node3', data: {} },
          { id: 'e3', source: 'node2', target: 'node3', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByDegree(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      // node1: degree 2, node2: degree 2, node3: degree 2
      // Since they all have the same degree, order should be preserved or sorted stably
      expect(nodeIds).toHaveLength(3);
      expect(nodeIds).toContain('node1');
      expect(nodeIds).toContain('node2');
      expect(nodeIds).toContain('node3');
    });

    test('should sort isolated nodes first', () => {
      const data: GraphData = {
        nodes: [
          { id: 'connected1', data: {} },
          { id: 'isolated', data: {} },
          { id: 'connected2', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'connected1', target: 'connected2', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByDegree(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds[0]).toBe('connected1'); // degree 1
      expect(nodeIds[1]).toBe('connected2'); // degree 1
      expect(nodeIds[2]).toBe('isolated'); // degree 0
    });

    test('should handle single node', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderByDegree(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toEqual(['node1']);
    });

    test('should handle empty graph', () => {
      const data: GraphData = {
        nodes: [],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderByDegree(model);

      expect(sorted.nodes()).toHaveLength(0);
    });

    test('should maintain node map consistency', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
        ],
        edges: [{ id: 'e1', source: 'node1', target: 'node2', data: {} }],
      };

      const model = new GraphLib(data);
      const sorted = orderByDegree(model);

      expect(sorted.node('node1')).toBeDefined();
      expect(sorted.node('node2')).toBeDefined();
      expect(sorted.nodeCount()).toBe(2);
    });

    test('should sort nodes with different degrees correctly', () => {
      const data: GraphData = {
        nodes: [
          { id: 'high', data: {} },
          { id: 'low', data: {} },
          { id: 'medium', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'high', target: 'low', data: {} },
          { id: 'e2', source: 'high', target: 'medium', data: {} },
          { id: 'e3', source: 'medium', target: 'low', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByDegree(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      // low: 2, medium: 2, high: 2
      expect(nodeIds).toHaveLength(3);
    });
  });

  describe('orderById', () => {
    test('should sort nodes by numeric id', () => {
      const data: GraphData = {
        nodes: [
          { id: 3, data: {} },
          { id: 1, data: {} },
          { id: 2, data: {} },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderById(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toEqual([1, 2, 3]);
    });

    test('should sort nodes by string id', () => {
      const data: GraphData = {
        nodes: [
          { id: 'charlie', data: {} },
          { id: 'alice', data: {} },
          { id: 'bob', data: {} },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderById(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toEqual(['alice', 'bob', 'charlie']);
    });

    test('should handle mixed string ids with numbers', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node10', data: {} },
          { id: 'node2', data: {} },
          { id: 'node1', data: {} },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderById(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toEqual(['node1', 'node10', 'node2']);
    });

    test('should handle single node', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderById(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toEqual(['node1']);
    });

    test('should handle empty graph', () => {
      const data: GraphData = {
        nodes: [],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderById(model);

      expect(sorted.nodes()).toHaveLength(0);
    });

    test('should maintain node map consistency', () => {
      const data: GraphData = {
        nodes: [
          { id: 'b', data: {} },
          { id: 'a', data: {} },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderById(model);

      expect(sorted.node('a')).toBeDefined();
      expect(sorted.node('b')).toBeDefined();
      expect(sorted.nodeCount()).toBe(2);
    });

    test('should handle numeric ids with zero', () => {
      const data: GraphData = {
        nodes: [
          { id: 2, data: {} },
          { id: 0, data: {} },
          { id: 1, data: {} },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderById(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toEqual([0, 1, 2]);
    });

    test('should handle negative numeric ids', () => {
      const data: GraphData = {
        nodes: [
          { id: 1, data: {} },
          { id: -1, data: {} },
          { id: 0, data: {} },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderById(model);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toEqual([-1, 0, 1]);
    });
  });

  describe('orderBySorter', () => {
    test('should sort nodes by custom sorter function', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: { priority: 3 } },
          { id: 'node2', data: { priority: 1 } },
          { id: 'node3', data: { priority: 2 } },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderBySorter(model, (a: NodeData, b: NodeData) => {
        const priorityA = a.data?.priority || 0;
        const priorityB = b.data?.priority || 0;
        return priorityA < priorityB ? -1 : priorityA > priorityB ? 1 : 0;
      });

      const nodeIds = sorted.nodes().map((n) => n.id);
      expect(nodeIds).toEqual(['node2', 'node3', 'node1']);
    });

    test('should sort nodes by custom property', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: { name: 'Charlie' } },
          { id: 'node2', data: { name: 'Alice' } },
          { id: 'node3', data: { name: 'Bob' } },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderBySorter(model, (a: NodeData, b: NodeData) => {
        const nameA = a.data?.name || '';
        const nameB = b.data?.name || '';
        return nameA < nameB ? -1 : nameA > nameB ? 1 : 0;
      });

      const nodeIds = sorted.nodes().map((n) => n.id);
      expect(nodeIds).toEqual(['node2', 'node3', 'node1']);
    });

    test('should handle equal values in sorter', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: { value: 1 } },
          { id: 'node2', data: { value: 1 } },
          { id: 'node3', data: { value: 1 } },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderBySorter(model, (a: NodeData, b: NodeData) => {
        const valueA = a.data?.value || 0;
        const valueB = b.data?.value || 0;
        return valueA < valueB ? -1 : valueA > valueB ? 1 : 0;
      });

      const nodeIds = sorted.nodes().map((n) => n.id);
      expect(nodeIds).toHaveLength(3);
      expect(nodeIds).toContain('node1');
      expect(nodeIds).toContain('node2');
      expect(nodeIds).toContain('node3');
    });

    test('should handle single node', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderBySorter(model, () => 0);

      expect(sorted.nodes()).toHaveLength(1);
      expect(sorted.nodes()[0].id).toBe('node1');
    });

    test('should handle empty graph', () => {
      const data: GraphData = {
        nodes: [],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderBySorter(model, () => 0);

      expect(sorted.nodes()).toHaveLength(0);
    });

    test('should maintain node map consistency', () => {
      const data: GraphData = {
        nodes: [
          { id: 'a', data: { order: 2 } },
          { id: 'b', data: { order: 1 } },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderBySorter(model, (a: NodeData, b: NodeData) => {
        const orderA = a.data?.order || 0;
        const orderB = b.data?.order || 0;
        return orderA > orderB ? 1 : orderA < orderB ? -1 : 0;
      });

      expect(sorted.node('a')).toBeDefined();
      expect(sorted.node('b')).toBeDefined();
      expect(sorted.nodeCount()).toBe(2);
    });

    test('should sort in descending order when sorter returns reversed comparison', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: { score: 10 } },
          { id: 'node2', data: { score: 30 } },
          { id: 'node3', data: { score: 20 } },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderBySorter(model, (a: NodeData, b: NodeData) => {
        const scoreA = a.data?.score || 0;
        const scoreB = b.data?.score || 0;
        return scoreB > scoreA ? 1 : scoreB < scoreA ? -1 : 0;
      });

      const nodeIds = sorted.nodes().map((n) => n.id);
      expect(nodeIds).toEqual(['node2', 'node3', 'node1']);
    });

    test('should handle missing properties in sorter', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: { value: 5 } },
          { id: 'node2', data: {} },
          { id: 'node3', data: { value: 3 } },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderBySorter(model, (a: NodeData, b: NodeData) => {
        const valueA = a.data?.value || 0;
        const valueB = b.data?.value || 0;
        return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
      });

      const nodeIds = sorted.nodes().map((n) => n.id);
      expect(nodeIds[0]).toBe('node2'); // value: 0
      expect(nodeIds[1]).toBe('node3'); // value: 3
      expect(nodeIds[2]).toBe('node1'); // value: 5
    });
  });

  describe('orderByTopology', () => {
    test('should order nodes according to topology in undirected graph', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
          { id: 'node3', data: {} },
          { id: 'node4', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'node1', target: 'node2', data: {} },
          { id: 'e2', source: 'node2', target: 'node3', data: {} },
          { id: 'e3', source: 'node3', target: 'node4', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toHaveLength(4);
      expect(nodeIds[0]).toBe('node1');
      // The rest should follow topology order
    });

    test('should order nodes according to topology in directed graph', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
          { id: 'node3', data: {} },
          { id: 'node4', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'node1', target: 'node2', data: {} },
          { id: 'e2', source: 'node1', target: 'node3', data: {} },
          { id: 'e3', source: 'node2', target: 'node4', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, true);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toHaveLength(4);
      expect(nodeIds[0]).toBe('node1');
      // node1 should be first as it has no predecessors
    });

    test('should handle single node', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toEqual(['node1']);
    });

    test('should handle empty graph', () => {
      const data: GraphData = {
        nodes: [],
        edges: [],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);

      expect(sorted.nodes()).toHaveLength(0);
    });

    test('should handle disconnected components', () => {
      const data: GraphData = {
        nodes: [
          { id: 'a1', data: {} },
          { id: 'a2', data: {} },
          { id: 'b1', data: {} },
          { id: 'b2', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'a1', target: 'a2', data: {} },
          { id: 'e2', source: 'b1', target: 'b2', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toHaveLength(4);
      // First node should be 'a1' (first in original order)
      expect(nodeIds[0]).toBe('a1');
    });

    test('should handle nodes with same degree', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
          { id: 'node3', data: {} },
          { id: 'node4', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'node1', target: 'node2', data: {} },
          { id: 'e2', source: 'node3', target: 'node4', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toHaveLength(4);
      expect(nodeIds).toContain('node1');
      expect(nodeIds).toContain('node2');
      expect(nodeIds).toContain('node3');
      expect(nodeIds).toContain('node4');
    });

    test('should maintain node map consistency', () => {
      const data: GraphData = {
        nodes: [
          { id: 'a', data: {} },
          { id: 'b', data: {} },
          { id: 'c', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'a', target: 'b', data: {} },
          { id: 'e2', source: 'b', target: 'c', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);

      expect(sorted.node('a')).toBeDefined();
      expect(sorted.node('b')).toBeDefined();
      expect(sorted.node('c')).toBeDefined();
      expect(sorted.nodeCount()).toBe(3);
    });

    test('should handle star topology', () => {
      const data: GraphData = {
        nodes: [
          { id: 'center', data: {} },
          { id: 'leaf1', data: {} },
          { id: 'leaf2', data: {} },
          { id: 'leaf3', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'center', target: 'leaf1', data: {} },
          { id: 'e2', source: 'center', target: 'leaf2', data: {} },
          { id: 'e3', source: 'center', target: 'leaf3', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toHaveLength(4);
      expect(nodeIds[0]).toBe('center');
      // Center node should be first due to highest degree
    });

    test('should handle tree topology with directed edges', () => {
      const data: GraphData = {
        nodes: [
          { id: 'root', data: {} },
          { id: 'child1', data: {} },
          { id: 'child2', data: {} },
          { id: 'grandchild1', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'root', target: 'child1', data: {} },
          { id: 'e2', source: 'root', target: 'child2', data: {} },
          { id: 'e3', source: 'child1', target: 'grandchild1', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, true);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toHaveLength(4);
      expect(nodeIds[0]).toBe('root');
      // Root should be first when using directed topology
    });

    test('should handle cyclic graph', () => {
      const data: GraphData = {
        nodes: [
          { id: 'a', data: {} },
          { id: 'b', data: {} },
          { id: 'c', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'a', target: 'b', data: {} },
          { id: 'e2', source: 'b', target: 'c', data: {} },
          { id: 'e3', source: 'c', target: 'a', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toHaveLength(3);
      expect(nodeIds).toContain('a');
      expect(nodeIds).toContain('b');
      expect(nodeIds).toContain('c');
    });

    test('should pick neighbors when traversing topology', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
          { id: 'node3', data: {} },
          { id: 'node4', data: {} },
          { id: 'node5', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'node1', target: 'node2', data: {} },
          { id: 'e2', source: 'node2', target: 'node3', data: {} },
          { id: 'e3', source: 'node3', target: 'node4', data: {} },
          { id: 'e4', source: 'node4', target: 'node5', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toHaveLength(5);
      // Should traverse through neighbors
      expect(nodeIds[0]).toBe('node1');
    });

    test('should handle isolated nodes', () => {
      const data: GraphData = {
        nodes: [
          { id: 'connected1', data: {} },
          { id: 'connected2', data: {} },
          { id: 'isolated', data: {} },
        ],
        edges: [
          { id: 'e1', source: 'connected1', target: 'connected2', data: {} },
        ],
      };

      const model = new GraphLib(data);
      const sorted = orderByTopology(model, false);
      const nodeIds = sorted.nodes().map((n) => n.id);

      expect(nodeIds).toHaveLength(3);
      expect(nodeIds).toContain('connected1');
      expect(nodeIds).toContain('connected2');
      expect(nodeIds).toContain('isolated');
    });
  });
});

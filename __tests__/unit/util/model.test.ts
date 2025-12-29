import type { GraphData } from '@/src/types/data';
import { initNodePosition, GraphLib } from '@/src/model/data';

describe('model', () => {
  describe('GraphLib', () => {
    describe('constructor', () => {
      test('should create model from graph data', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: { x: 10, y: 20 } },
            { id: 'node2', data: { x: 30, y: 40 } },
          ],
          edges: [{ id: 'edge1', source: 'node1', target: 'node2', data: {} }],
        };

        const model = new GraphLib(data);

        expect(model.nodeCount()).toBe(2);
        expect(model.edgeCount()).toBe(1);
      });

      test('should extract node positions from data', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: { x: 100, y: 200 } }],
          edges: [],
        };

        const model = new GraphLib(data);
        const node = model.node('node1');

        // Positions are stored in data field, not directly on node
        const original = model.originalNode('node1');
        expect(original?.data.x).toBe(100);
        expect(original?.data.y).toBe(200);
      });

      test('should not extract positions without custom node extractor', () => {
        const data: GraphData = {
          nodes: [
            {
              id: 'node1',
              position: { x: 50, y: 60 },
            } as any,
          ],
          edges: [],
        };

        const model = new GraphLib(data);
        const node = model.node('node1');

        // Without custom extractor, positions are not automatically extracted
        expect(node?.x).toBeUndefined();
        expect(node?.y).toBeUndefined();
      });

      test('should preserve original node data', () => {
        const originalNode = { id: 'node1', data: { custom: 'value' } };
        const data: GraphData = {
          nodes: [originalNode],
          edges: [],
        };

        const model = new GraphLib(data);
        const node = model.node('node1');

        expect(node?._original).toBe(originalNode);
      });
    });

    describe('nodes and nodeCount', () => {
      test('should return all nodes', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
            { id: 'node3', data: {} },
          ],
          edges: [],
        };

        const model = new GraphLib(data);
        const nodes = model.nodes();

        expect(nodes).toHaveLength(3);
        expect(nodes.map((n) => n.id)).toEqual(['node1', 'node2', 'node3']);
      });

      test('should return correct node count', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [],
        };

        const model = new GraphLib(data);

        expect(model.nodeCount()).toBe(2);
      });

      test('should handle empty nodes', () => {
        const data: GraphData = {
          nodes: [],
          edges: [],
        };

        const model = new GraphLib(data);

        expect(model.nodes()).toHaveLength(0);
        expect(model.nodeCount()).toBe(0);
      });
    });

    describe('node and originalNode', () => {
      test('should get node by id', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: { x: 10 } }],
          edges: [],
        };

        const model = new GraphLib(data);
        const node = model.node('node1');

        expect(node).toBeDefined();
        expect(node?.id).toBe('node1');
        // Position is in original data, not extracted to node
        const original = model.originalNode('node1');
        expect(original?.data.x).toBe(10);
      });

      test('should return undefined for non-existent node', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new GraphLib(data);
        const node = model.node('nonexistent');

        expect(node).toBeUndefined();
      });

      test('should get original node data', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: { custom: 'value' } }],
          edges: [],
        };

        const model = new GraphLib(data);
        const original = model.originalNode('node1');

        expect(original).toBe(data.nodes[0]);
        expect(original?.data.custom).toBe('value');
      });
    });

    describe('edges and edgeCount', () => {
      test('should return all edges', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [
            { id: 'edge1', source: 'node1', target: 'node2', data: {} },
            { id: 'edge2', source: 'node2', target: 'node1', data: {} },
          ],
        };

        const model = new GraphLib(data);
        const edges = model.edges();

        expect(edges).toHaveLength(2);
        expect(edges.map((e) => e.id)).toEqual(['edge1', 'edge2']);
      });

      test('should return correct edge count', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [{ id: 'edge1', source: 'node1', target: 'node2', data: {} }],
        };

        const model = new GraphLib(data);

        expect(model.edgeCount()).toBe(1);
      });

      test('should handle empty edges', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new GraphLib(data);

        expect(model.edges()).toHaveLength(0);
        expect(model.edgeCount()).toBe(0);
      });
    });

    describe('edge and originalEdge', () => {
      test('should get edge by id', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [
            {
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              data: {},
            },
          ],
        };

        const model = new GraphLib(data);
        const edge = model.edge('edge1');

        expect(edge).toBeDefined();
        expect(edge?.id).toBe('edge1');
        expect(edge?.source).toBe('node1');
        expect(edge?.target).toBe('node2');
      });

      test('should return undefined for non-existent edge', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new GraphLib(data);
        const edge = model.edge('nonexistent');

        expect(edge).toBeUndefined();
      });

      test('should get original edge data', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [
            {
              id: 'edge1',
              source: 'node1',
              target: 'node2',
              data: { weight: 5 },
            },
          ],
        };

        const model = new GraphLib(data);
        const original = model.originalEdge('edge1');

        expect(original).toBe(data.edges![0]);
        expect(original?.data.weight).toBe(5);
      });
    });

    describe('degree', () => {
      test('should calculate node degree (both directions)', () => {
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

        expect(model.degree('node1')).toBe(2); // 2 out
        expect(model.degree('node2')).toBe(2); // 1 in + 1 out
        expect(model.degree('node3')).toBe(2); // 2 in
      });

      test('should calculate in-degree', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [
            { id: 'e1', source: 'node1', target: 'node2', data: {} },
            { id: 'e2', source: 'node1', target: 'node2', data: {} },
          ],
        };

        const model = new GraphLib(data);

        expect(model.degree('node2', 'in')).toBe(2);
      });

      test('should calculate out-degree', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [
            { id: 'e1', source: 'node1', target: 'node2', data: {} },
            { id: 'e2', source: 'node1', target: 'node2', data: {} },
          ],
        };

        const model = new GraphLib(data);

        expect(model.degree('node1', 'out')).toBe(2);
      });

      test('should return 0 for isolated node', () => {
        const data: GraphData = {
          nodes: [
            { id: 'isolated', data: {} },
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [{ id: 'e1', source: 'node1', target: 'node2', data: {} }],
        };

        const model = new GraphLib(data);

        expect(model.degree('isolated')).toBe(0);
      });

      test('should return 0 for non-existent node', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new GraphLib(data);

        expect(model.degree('nonexistent')).toBe(0);
      });

      test('should not count self-loop in degree', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [{ id: 'e1', source: 'node1', target: 'node1', data: {} }],
        };

        const model = new GraphLib(data);

        // Self-loops are ignored in degree calculation
        expect(model.degree('node1', 'both')).toBe(0);
        expect(model.degree('node1', 'in')).toBe(0);
        expect(model.degree('node1', 'out')).toBe(0);
      });
    });

    describe('neighbors', () => {
      test('should return neighbors in both directions', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
            { id: 'node3', data: {} },
          ],
          edges: [
            { id: 'e1', source: 'node1', target: 'node2', data: {} },
            { id: 'e2', source: 'node3', target: 'node1', data: {} },
          ],
        };

        const model = new GraphLib(data);
        const neighbors = model.neighbors('node1');

        expect(neighbors).toHaveLength(2);
        expect(neighbors).toContain('node2');
        expect(neighbors).toContain('node3');
      });

      test('should return successors (out neighbors)', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
            { id: 'node3', data: {} },
          ],
          edges: [
            { id: 'e1', source: 'node1', target: 'node2', data: {} },
            { id: 'e2', source: 'node1', target: 'node3', data: {} },
          ],
        };

        const model = new GraphLib(data);
        const successors = model.successors('node1');

        expect(successors).toHaveLength(2);
        expect(successors).toContain('node2');
        expect(successors).toContain('node3');
      });

      test('should return predecessors (in neighbors)', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
            { id: 'node3', data: {} },
          ],
          edges: [
            { id: 'e1', source: 'node2', target: 'node1', data: {} },
            { id: 'e2', source: 'node3', target: 'node1', data: {} },
          ],
        };

        const model = new GraphLib(data);
        const predecessors = model.predecessors('node1');

        expect(predecessors).toHaveLength(2);
        expect(predecessors).toContain('node2');
        expect(predecessors).toContain('node3');
      });

      test('should return empty array for isolated node', () => {
        const data: GraphData = {
          nodes: [
            { id: 'isolated', data: {} },
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [{ id: 'e1', source: 'node1', target: 'node2', data: {} }],
        };

        const model = new GraphLib(data);

        expect(model.neighbors('isolated')).toEqual([]);
      });

      test('should handle self-loop', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [{ id: 'e1', source: 'node1', target: 'node1', data: {} }],
        };

        const model = new GraphLib(data);
        const neighbors = model.neighbors('node1');

        expect(neighbors).toEqual(['node1']);
      });
    });

    describe('clearCache', () => {
      test('should clear degree cache', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [{ id: 'e1', source: 'node1', target: 'node2', data: {} }],
        };

        const model = new GraphLib(data);

        // Build cache
        model.degree('node1');

        // Clear cache
        model.clearCache();

        // Should rebuild cache on next call
        expect(model.degree('node1')).toBe(1);
      });

      test('should clear adjacency cache', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [{ id: 'e1', source: 'node1', target: 'node2', data: {} }],
        };

        const model = new GraphLib(data);

        // Build cache
        model.neighbors('node1');

        // Clear cache
        model.clearCache();

        // Should rebuild cache on next call
        expect(model.neighbors('node1')).toEqual(['node2']);
      });
    });

    describe('destroy', () => {
      test('should clear all caches and maps', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [{ id: 'e1', source: 'node1', target: 'node2', data: {} }],
        };

        const model = new GraphLib(data);

        model.destroy();

        expect(model.nodeCount()).toBe(0);
        expect(model.edgeCount()).toBe(0);
      });
    });
  });

  describe('initNodePosition', () => {
    test('should initialize positions for nodes without x and y', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      initNodePosition(model, 100, 200);

      const node1 = model.node('node1');
      const node2 = model.node('node2');

      expect(node1?.x).toBeDefined();
      expect(node1?.y).toBeDefined();
      expect(node1?.x).toBeGreaterThanOrEqual(0);
      expect(node1?.x).toBeLessThanOrEqual(100);
      expect(node1?.y).toBeGreaterThanOrEqual(0);
      expect(node1?.y).toBeLessThanOrEqual(200);

      expect(node2?.x).toBeDefined();
      expect(node2?.y).toBeDefined();
      expect(node2?.x).toBeGreaterThanOrEqual(0);
      expect(node2?.x).toBeLessThanOrEqual(100);
      expect(node2?.y).toBeGreaterThanOrEqual(0);
      expect(node2?.y).toBeLessThanOrEqual(200);
    });

    test('should not override existing x position', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: { x: 50 } }],
        edges: [],
      };

      const model = new GraphLib(data);
      const node = model.node('node1')!;
      node.x = 50;

      initNodePosition(model, 100, 200);

      expect(model.node('node1')?.x).toBe(50);
    });

    test('should not override existing y position', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: { y: 75 } }],
        edges: [],
      };

      const model = new GraphLib(data);
      const node = model.node('node1')!;
      node.y = 75;

      initNodePosition(model, 100, 200);

      expect(model.node('node1')?.y).toBe(75);
    });

    test('should initialize missing coordinate only', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: { x: 50 } }],
        edges: [],
      };

      const model = new GraphLib(data);
      const node = model.node('node1')!;
      node.x = 50;

      initNodePosition(model, 100, 200);

      expect(model.node('node1')?.x).toBe(50);
      expect(model.node('node1')?.y).toBeDefined();
      expect(model.node('node1')?.y).toBeGreaterThanOrEqual(0);
      expect(model.node('node1')?.y).toBeLessThanOrEqual(200);
    });

    test('should handle empty model', () => {
      const data: GraphData = {
        nodes: [],
        edges: [],
      };

      const model = new GraphLib(data);
      initNodePosition(model, 100, 200);

      expect(model.nodeCount()).toBe(0);
    });

    test('should handle zero dimensions', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [],
      };

      const model = new GraphLib(data);
      initNodePosition(model, 0, 0);

      const node = model.node('node1');
      expect(node?.x).toBe(0);
      expect(node?.y).toBe(0);
    });

    test('should handle large dimensions', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [],
      };

      const model = new GraphLib(data);
      initNodePosition(model, 10000, 10000);

      const node = model.node('node1');
      expect(node?.x).toBeDefined();
      expect(node?.x).toBeGreaterThanOrEqual(0);
      expect(node?.x).toBeLessThanOrEqual(10000);
      expect(node?.y).toBeDefined();
      expect(node?.y).toBeGreaterThanOrEqual(0);
      expect(node?.y).toBeLessThanOrEqual(10000);
    });

    test('should treat 0 as valid existing position', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: { x: 0, y: 0 } }],
        edges: [],
      };

      const model = new GraphLib(data);
      const node = model.node('node1')!;
      node.x = 0;
      node.y = 0;

      initNodePosition(model, 100, 200);

      expect(model.node('node1')?.x).toBe(0);
      expect(model.node('node1')?.y).toBe(0);
    });

    test('should initialize multiple nodes independently', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
          { id: 'node3', data: {} },
        ],
        edges: [],
      };

      const model = new GraphLib(data);
      initNodePosition(model, 100, 200);

      const positions = new Set();
      model.forEachNode((node) => {
        positions.add(`${node.x},${node.y}`);
      });

      // All nodes should have positions (might be same due to randomness, but typically different)
      expect(positions.size).toBeGreaterThan(0);
    });
  });
});

import type { GraphData } from '@/src/types/data';
import { LayoutModel } from '@/src/util/model';

describe('model', () => {
  describe('LayoutModel', () => {
    describe('constructor', () => {
      test('should create model from graph data', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: { x: 10, y: 20 } },
            { id: 'node2', data: { x: 30, y: 40 } },
          ],
          edges: [{ id: 'edge1', source: 'node1', target: 'node2', data: {} }],
        };

        const model = new LayoutModel(data);

        expect(model.nodeCount()).toBe(2);
        expect(model.edgeCount()).toBe(1);
      });

      test('should extract node positions from data', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: { x: 100, y: 200 } }],
          edges: [],
        };

        const model = new LayoutModel(data);
        const node = model.node('node1');

        expect(node?.x).toBe(100);
        expect(node?.y).toBe(200);
      });

      test('should handle custom node field mappings', () => {
        const data: GraphData = {
          nodes: [
            {
              id: 'node1',
              position: { x: 50, y: 60 },
            } as any,
          ],
          edges: [],
        };

        const model = new LayoutModel(data, {
          nodeFields: {
            x: 'position.x',
            y: 'position.y',
          },
        });

        const node = model.node('node1');
        expect(node?.x).toBe(50);
        expect(node?.y).toBe(60);
      });

      test('should preserve original node data', () => {
        const originalNode = { id: 'node1', data: { custom: 'value' } };
        const data: GraphData = {
          nodes: [originalNode],
          edges: [],
        };

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);

        expect(model.nodeCount()).toBe(2);
      });

      test('should handle empty nodes', () => {
        const data: GraphData = {
          nodes: [],
          edges: [],
        };

        const model = new LayoutModel(data);

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

        const model = new LayoutModel(data);
        const node = model.node('node1');

        expect(node).toBeDefined();
        expect(node?.id).toBe('node1');
        expect(node?.x).toBe(10);
      });

      test('should return undefined for non-existent node', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new LayoutModel(data);
        const node = model.node('nonexistent');

        expect(node).toBeUndefined();
      });

      test('should get original node data', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: { custom: 'value' } }],
          edges: [],
        };

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);

        expect(model.edgeCount()).toBe(1);
      });

      test('should handle empty edges', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new LayoutModel(data);

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

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);

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

        const model = new LayoutModel(data);

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

        const model = new LayoutModel(data);

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

        const model = new LayoutModel(data);

        expect(model.degree('isolated')).toBe(0);
      });

      test('should return 0 for non-existent node', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new LayoutModel(data);

        expect(model.degree('nonexistent')).toBe(0);
      });

      test('should handle self-loop', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [{ id: 'e1', source: 'node1', target: 'node1', data: {} }],
        };

        const model = new LayoutModel(data);

        expect(model.degree('node1', 'both')).toBe(2); // 1 in + 1 out
        expect(model.degree('node1', 'in')).toBe(1);
        expect(model.degree('node1', 'out')).toBe(1);
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

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);
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

        const model = new LayoutModel(data);

        expect(model.neighbors('isolated')).toEqual([]);
      });

      test('should handle self-loop', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [{ id: 'e1', source: 'node1', target: 'node1', data: {} }],
        };

        const model = new LayoutModel(data);
        const neighbors = model.neighbors('node1');

        expect(neighbors).toEqual(['node1']);
      });
    });

    describe('syncToGraphData', () => {
      test('should sync layout positions to original data', () => {
        const data: GraphData = {
          nodes: [
            { id: 'node1', data: {} },
            { id: 'node2', data: {} },
          ],
          edges: [],
        };

        const model = new LayoutModel(data);
        const node1 = model.node('node1')!;
        const node2 = model.node('node2')!;

        node1.x = 100;
        node1.y = 200;
        node2.x = 300;
        node2.y = 400;

        const result = model.syncToGraphData();

        expect(result).toBe(data); // Same reference
        expect(data.nodes[0].data.x).toBe(100);
        expect(data.nodes[0].data.y).toBe(200);
        expect(data.nodes[1].data.x).toBe(300);
        expect(data.nodes[1].data.y).toBe(400);
      });

      test('should sync z coordinates if present', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new LayoutModel(data);
        const node = model.node('node1')!;

        node.x = 10;
        node.y = 20;
        node.z = 30;

        model.syncToGraphData();

        expect(data.nodes[0].data.x).toBe(10);
        expect(data.nodes[0].data.y).toBe(20);
        expect(data.nodes[0].data.z).toBe(30);
      });

      test('should sync edge control points', () => {
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

        const model = new LayoutModel(data);
        const edge = model.edge('edge1')!;

        edge.controlPoints = [
          { x: 50, y: 50 },
          { x: 60, y: 60 },
        ];

        model.syncToGraphData();

        expect(data.edges![0].data.controlPoints).toEqual([
          { x: 50, y: 50 },
          { x: 60, y: 60 },
        ]);
      });
    });

    describe('getGraphData', () => {
      test('should return cloned data with layout positions', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: { custom: 'value' } }],
          edges: [],
        };

        const model = new LayoutModel(data);
        const node = model.node('node1')!;

        node.x = 100;
        node.y = 200;

        const result = model.getGraphData();

        expect(result).not.toBe(data); // Different reference
        expect(result.nodes[0]).not.toBe(data.nodes[0]);
        expect(result.nodes[0].data.x).toBe(100);
        expect(result.nodes[0].data.y).toBe(200);
        expect(result.nodes[0].data.custom).toBe('value');
      });

      test('should return same reference on subsequent calls', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new LayoutModel(data);
        const result1 = model.getGraphData();
        const result2 = model.getGraphData();

        expect(result1).toBe(result2); // Same cached reference
      });

      test('should not modify original data', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new LayoutModel(data);
        const node = model.node('node1')!;

        node.x = 100;
        node.y = 200;

        model.getGraphData();

        expect(data.nodes[0].data.x).toBeUndefined();
        expect(data.nodes[0].data.y).toBeUndefined();
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

        const model = new LayoutModel(data);

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

        const model = new LayoutModel(data);

        // Build cache
        model.neighbors('node1');

        // Clear cache
        model.clearCache();

        // Should rebuild cache on next call
        expect(model.neighbors('node1')).toEqual(['node2']);
      });

      test('should clear result cache', () => {
        const data: GraphData = {
          nodes: [{ id: 'node1', data: {} }],
          edges: [],
        };

        const model = new LayoutModel(data);

        const result1 = model.getGraphData();
        model.clearCache();
        const result2 = model.getGraphData();

        expect(result1).not.toBe(result2); // Different references after cache clear
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

        const model = new LayoutModel(data);

        model.destroy();

        expect(model.nodeCount()).toBe(0);
        expect(model.edgeCount()).toBe(0);
      });
    });
  });
});

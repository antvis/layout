import { handleSingleNodeGraph } from '@/src/util';
import { Graph } from '@antv/graphlib';

describe('handleSingleNodeGraph', () => {
  test('should handle empty graph', () => {
    const graph = new Graph<any, any>({
      nodes: [],
      edges: [],
    });

    const result = handleSingleNodeGraph(graph, false, [100, 200]);

    expect(result).toEqual({
      nodes: [],
      edges: [],
    });
  });

  test('should handle single node graph without assign', () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    });

    const result = handleSingleNodeGraph(graph, false, [100, 200]);

    expect(result?.nodes.length).toBe(1);
    expect(result?.nodes[0].id).toBe('node1');
    expect(result?.nodes[0].data.x).toBe(100);
    expect(result?.nodes[0].data.y).toBe(200);
    expect(result?.edges).toEqual([]);

    // Original graph should not be modified
    const originalNode = graph.getNode('node1');
    expect(originalNode?.data.x).toBeUndefined();
    expect(originalNode?.data.y).toBeUndefined();
  });

  test('should handle single node graph with assign', () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    });

    const result = handleSingleNodeGraph(graph, true, [100, 200]);

    expect(result?.nodes.length).toBe(1);
    expect(result?.nodes[0].id).toBe('node1');
    expect(result?.nodes[0].data.x).toBe(100);
    expect(result?.nodes[0].data.y).toBe(200);

    // Original graph should be modified
    const originalNode = graph.getNode('node1');
    expect(originalNode?.data.x).toBe(100);
    expect(originalNode?.data.y).toBe(200);
  });

  test('should handle single node graph with existing data', () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: 'node1', data: { color: 'red', size: 10 } }],
      edges: [],
    });

    const result = handleSingleNodeGraph(graph, false, [150, 250]);

    expect(result?.nodes[0].data).toEqual({
      color: 'red',
      size: 10,
      x: 150,
      y: 250,
    });
  });

  test('should return undefined for multi-node graph', () => {
    const graph = new Graph<any, any>({
      nodes: [
        { id: 'node1', data: {} },
        { id: 'node2', data: {} },
      ],
      edges: [],
    });

    const result = handleSingleNodeGraph(graph, false, [100, 200]);

    expect(result).toBeUndefined();
  });

  test('should handle different center coordinates', () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    });

    const result = handleSingleNodeGraph(graph, false, [0, 0]);

    expect(result?.nodes[0].data.x).toBe(0);
    expect(result?.nodes[0].data.y).toBe(0);
  });

  test('should handle negative center coordinates', () => {
    const graph = new Graph<any, any>({
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    });

    const result = handleSingleNodeGraph(graph, false, [-100, -200]);

    expect(result?.nodes[0].data.x).toBe(-100);
    expect(result?.nodes[0].data.y).toBe(-200);
  });
});

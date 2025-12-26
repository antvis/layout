import type { GraphData } from '@/src/types/data';
import { applySingleNodeLayout } from '@/src/util';
import { GraphLib } from '@/src/model/data';

describe('applySingleNodeLayout', () => {
  test('should not modify nodes when model has zero nodes', () => {
    const data: GraphData = {
      nodes: [],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [100, 200], 2);

    expect(model.nodeCount()).toBe(0);
  });

  test('should set position for single node in 2D', () => {
    const data: GraphData = {
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [100, 200], 2);

    const node = model.node('node1');
    expect(node?.x).toBe(100);
    expect(node?.y).toBe(200);
    expect(node?.z).toBeUndefined();
  });

  test('should set position for single node in 3D', () => {
    const data: GraphData = {
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [100, 200, 50], 3);

    const node = model.node('node1');
    expect(node?.x).toBe(100);
    expect(node?.y).toBe(200);
    expect(node?.z).toBe(50);
  });

  test('should set z to 0 when center has no z value in 3D', () => {
    const data: GraphData = {
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [100, 200] as any, 3);

    const node = model.node('node1');
    expect(node?.x).toBe(100);
    expect(node?.y).toBe(200);
    expect(node?.z).toBe(0);
  });

  test('should not modify existing node data except position', () => {
    const data: GraphData = {
      nodes: [{ id: 'node1', data: { color: 'red', size: 10 } }],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [150, 250], 2);

    const node = model.node('node1');
    const original = model.originalNode('node1');
    expect(node?.x).toBe(150);
    expect(node?.y).toBe(250);
    expect(original?.data?.color).toBe('red');
    expect(original?.data?.size).toBe(10);
  });

  test('should not modify nodes when model has multiple nodes', () => {
    const data: GraphData = {
      nodes: [
        { id: 'node1', data: {} },
        { id: 'node2', data: {} },
      ],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [100, 200], 2);

    const node1 = model.node('node1');
    const node2 = model.node('node2');
    // Positions should not be set for multi-node graphs
    expect(node1?.x).toBeUndefined();
    expect(node2?.x).toBeUndefined();
  });

  test('should handle zero coordinates', () => {
    const data: GraphData = {
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [0, 0], 2);

    const node = model.node('node1');
    expect(node?.x).toBe(0);
    expect(node?.y).toBe(0);
  });

  test('should handle negative coordinates', () => {
    const data: GraphData = {
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [-100, -200], 2);

    const node = model.node('node1');
    expect(node?.x).toBe(-100);
    expect(node?.y).toBe(-200);
  });

  test('should handle fractional coordinates', () => {
    const data: GraphData = {
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [100.5, 200.7], 2);

    const node = model.node('node1');
    expect(node?.x).toBe(100.5);
    expect(node?.y).toBe(200.7);
  });

  test('should handle 3D coordinates with fractional values', () => {
    const data: GraphData = {
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [100.5, 200.7, 50.3], 3);

    const node = model.node('node1');
    expect(node?.x).toBe(100.5);
    expect(node?.y).toBe(200.7);
    expect(node?.z).toBe(50.3);
  });

  test('should default to 2D when dimensions parameter not provided', () => {
    const data: GraphData = {
      nodes: [{ id: 'node1', data: {} }],
      edges: [],
    };
    const model = new GraphLib(data);

    applySingleNodeLayout(model, [100, 200]);

    const node = model.node('node1');
    expect(node?.x).toBe(100);
    expect(node?.y).toBe(200);
    expect(node?.z).toBeUndefined();
  });
});

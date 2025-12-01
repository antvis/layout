import type { EdgeData, GraphData, NodeData } from '@/src/types/data';
import {
  extractFieldValues,
  getEdgeId,
  getNodeId,
  validateData,
} from '@/src/util/data';

describe('data', () => {
  describe('validateData', () => {
    test('should pass validation for valid data', () => {
      const data = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
        ],
        edges: [{ id: 'edge1', source: 'node1', target: 'node2', data: {} }],
      };

      expect(() => validateData(data)).not.toThrow();
    });

    test('should throw error when nodes is missing', () => {
      const data = {} as any;

      expect(() => validateData(data)).toThrow(
        'Invalid data: nodes array is required',
      );
    });

    test('should throw error when nodes is not an array', () => {
      const data = { nodes: 'not-array' } as any;

      expect(() => validateData(data)).toThrow(
        'Invalid data: nodes array is required',
      );
    });

    test('should throw error when node id is missing', () => {
      const data = {
        nodes: [{ data: {} }] as any,
      };

      expect(() => validateData(data)).toThrow(
        'Invalid node at index 0: id is required',
      );
    });

    test('should throw error when node id is null', () => {
      const data = {
        nodes: [{ id: null, data: {} }] as any,
      };

      expect(() => validateData(data)).toThrow(
        'Invalid node at index 0: id is required',
      );
    });

    test('should throw error when edge source is missing', () => {
      const data = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [{ target: 'node1', data: {} }] as any,
      };

      expect(() => validateData(data)).toThrow(
        'Invalid edge at index 0: source and target are required',
      );
    });

    test('should throw error when edge target is missing', () => {
      const data = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [{ source: 'node1', data: {} }] as any,
      };

      expect(() => validateData(data)).toThrow(
        'Invalid edge at index 0: source and target are required',
      );
    });

    test('should handle empty edges array', () => {
      const data = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [],
      };

      expect(() => validateData(data)).not.toThrow();
    });

    test('should handle missing edges array', () => {
      const data = {
        nodes: [{ id: 'node1', data: {} }],
      };

      expect(() => validateData(data)).not.toThrow();
    });

    test('should allow node id to be 0', () => {
      const data = {
        nodes: [{ id: 0, data: {} }],
      };

      expect(() => validateData(data)).not.toThrow();
    });

    test('should allow node id to be empty string', () => {
      const data = {
        nodes: [{ id: '', data: {} }],
      };

      expect(() => validateData(data)).not.toThrow();
    });
  });

  describe('extractFieldValues', () => {
    test('should extract default fields from nodes', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: { x: 10, y: 20 } },
          { id: 'node2', data: { x: 30, y: 40, z: 50 } },
        ],
        edges: [],
      };

      const result = extractFieldValues(data);

      expect(result.nodes.size).toBe(2);
      const node1 = result.nodes.get('node1');
      expect(node1?.x).toBe(10);
      expect(node1?.y).toBe(20);
      expect(node1?.z).toBeUndefined();

      const node2 = result.nodes.get('node2');
      expect(node2?.x).toBe(30);
      expect(node2?.y).toBe(40);
      expect(node2?.z).toBe(50);
    });

    test('should extract custom node fields', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', customX: 100, customY: 200 } as any],
        edges: [],
      };

      const result = extractFieldValues(data, {
        x: 'customX',
        y: 'customY',
      });

      const node = result.nodes.get('node1');
      expect(node?.x).toBe(100);
      expect(node?.y).toBe(200);
    });

    test('should extract nested node fields', () => {
      const data: GraphData = {
        nodes: [
          {
            id: 'node1',
            position: { x: 10, y: 20 },
          } as any,
        ],
        edges: [],
      };

      const result = extractFieldValues(data, {
        x: 'position.x',
        y: 'position.y',
      });

      const node = result.nodes.get('node1');
      expect(node?.x).toBe(10);
      expect(node?.y).toBe(20);
    });

    test('should preserve original node data', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: { x: 10, custom: 'value' } }],
        edges: [],
      };

      const result = extractFieldValues(data);
      const node = result.nodes.get('node1');

      expect(node?._original).toBe(data.nodes[0]);
      expect(node?._original.data.custom).toBe('value');
    });

    test('should extract edge fields', () => {
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
            controlPoints: [{ x: 50, y: 50 }],
          },
        ],
      };

      const result = extractFieldValues(data);

      expect(result.edges.size).toBe(1);
      const edge = result.edges.get('edge1');
      expect(edge?.source).toBe('node1');
      expect(edge?.target).toBe('node2');
      expect(edge?.controlPoints).toEqual([{ x: 50, y: 50 }]);
    });

    test('should generate edge id if not provided', () => {
      const data: GraphData = {
        nodes: [
          { id: 'node1', data: {} },
          { id: 'node2', data: {} },
        ],
        edges: [{ source: 'node1', target: 'node2' } as any],
      };

      const result = extractFieldValues(data);

      expect(result.edges.size).toBe(1);
      const edge = Array.from(result.edges.values())[0];
      expect(edge.id).toBe('node1-node2');
    });

    test('should handle empty edges', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: {} }],
      };

      const result = extractFieldValues(data);

      expect(result.edges.size).toBe(0);
    });

    test('should throw error for node missing id', () => {
      const data: GraphData = {
        nodes: [{ data: {} } as any],
        edges: [],
      };

      expect(() => extractFieldValues(data)).toThrow(
        'Node is missing id field "id"',
      );
    });

    test('should throw error for edge missing source or target', () => {
      const data: GraphData = {
        nodes: [{ id: 'node1', data: {} }],
        edges: [{ source: 'node1' } as any],
      };

      expect(() => extractFieldValues(data)).toThrow(
        'Edge is missing source or target field',
      );
    });
  });

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

import { clone, cloneFormatData } from '@/src/util/object';
import { Node, Edge } from '@/src/types';

describe('object', () => {
  describe('clone', () => {
    test('should clone primitive values', () => {
      expect(clone(null)).toBeNull();
      expect(clone(undefined)).toBeUndefined();
      expect(clone(123)).toBe(123);
      expect(clone('string')).toBe('string');
      expect(clone(true)).toBe(true);
    });

    test('should clone Date objects', () => {
      const date = new Date('2024-01-01');
      const cloned = clone(date);
      expect(cloned).toEqual(date);
      expect(cloned).not.toBe(date);
      expect(cloned.getTime()).toBe(date.getTime());
    });

    test('should clone simple arrays', () => {
      const arr = [1, 2, 3];
      const cloned = clone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
    });

    test('should deep clone nested arrays', () => {
      const arr = [1, [2, 3], [4, [5, 6]]];
      const cloned = clone(arr);
      expect(cloned).toEqual(arr);
      expect(cloned).not.toBe(arr);
      expect(cloned[1]).not.toBe(arr[1]);
      expect(cloned[2]).not.toBe(arr[2]);
    });

    test('should clone simple objects', () => {
      const obj = { a: 1, b: 'test', c: true };
      const cloned = clone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
    });

    test('should deep clone nested objects', () => {
      const obj = {
        a: 1,
        b: { c: 2, d: { e: 3 } },
        f: [1, 2, 3],
      };
      const cloned = clone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned).not.toBe(obj);
      expect(cloned.b).not.toBe(obj.b);
      expect(cloned.b.d).not.toBe(obj.b.d);
      expect(cloned.f).not.toBe(obj.f);
    });

    test('should clone objects with Date properties', () => {
      const obj = {
        date: new Date('2024-01-01'),
        nested: { date: new Date('2024-12-31') },
      };
      const cloned = clone(obj);
      expect(cloned).toEqual(obj);
      expect(cloned.date).not.toBe(obj.date);
      expect(cloned.nested.date).not.toBe(obj.nested.date);
    });

    test('should clone complex mixed structures', () => {
      const complex = {
        arr: [1, { a: 2 }, [3, 4]],
        obj: { x: 5, y: { z: 6 } },
        date: new Date('2024-01-01'),
        primitive: 'test',
      };
      const cloned = clone(complex);
      expect(cloned).toEqual(complex);
      expect(cloned).not.toBe(complex);
      expect(cloned.arr).not.toBe(complex.arr);
      expect(cloned.obj).not.toBe(complex.obj);
      expect(cloned.date).not.toBe(complex.date);
    });

    test('should handle empty objects and arrays', () => {
      expect(clone({})).toEqual({});
      expect(clone([])).toEqual([]);
    });
  });

  describe('cloneFormatData', () => {
    test('should clone node without initRange', () => {
      const node: Node = {
        id: 'node1',
        data: { x: 10, y: 20, size: 30 },
      };
      const cloned = cloneFormatData(node);
      expect(cloned).toEqual(node);
      expect(cloned).not.toBe(node);
      expect(cloned.data).not.toBe(node.data);
    });

    test('should clone edge without initRange', () => {
      const edge: Edge = {
        id: 'edge1',
        source: 'a',
        target: 'b',
        data: { weight: 1 },
      };
      const cloned = cloneFormatData(edge);
      expect(cloned).toEqual(edge);
      expect(cloned).not.toBe(edge);
    });

    test('should initialize data property if not exists', () => {
      const node: Node = { id: 'node1' } as any;
      const cloned = cloneFormatData(node);
      expect(cloned.data).toBeDefined();
      expect(cloned.data).toEqual({});
    });

    test('should not modify x and y without initRange', () => {
      const node: Node = {
        id: 'node1',
        data: { x: 10, y: 20 },
      };
      const cloned = cloneFormatData(node);
      expect(cloned.data.x).toBe(10);
      expect(cloned.data.y).toBe(20);
    });

    test('should initialize x with random value when x is undefined and initRange provided', () => {
      const node: Node = {
        id: 'node1',
        data: { y: 20 },
      };
      const cloned = cloneFormatData(node, [100, 200]);
      expect(cloned.data.x).toBeDefined();
      expect(cloned.data.x).toBeGreaterThanOrEqual(0);
      expect(cloned.data.x).toBeLessThanOrEqual(100);
      expect(cloned.data.y).toBe(20);
    });

    test('should initialize y with random value when y is undefined and initRange provided', () => {
      const node: Node = {
        id: 'node1',
        data: { x: 10 },
      };
      const cloned = cloneFormatData(node, [100, 200]);
      expect(cloned.data.x).toBe(10);
      expect(cloned.data.y).toBeDefined();
      expect(cloned.data.y).toBeGreaterThanOrEqual(0);
      expect(cloned.data.y).toBeLessThanOrEqual(200);
    });

    test('should initialize both x and y when both undefined and initRange provided', () => {
      const node: Node = {
        id: 'node1',
        data: { size: 30 },
      };
      const cloned = cloneFormatData(node, [100, 200]);
      expect(cloned.data.x).toBeDefined();
      expect(cloned.data.x).toBeGreaterThanOrEqual(0);
      expect(cloned.data.x).toBeLessThanOrEqual(100);
      expect(cloned.data.y).toBeDefined();
      expect(cloned.data.y).toBeGreaterThanOrEqual(0);
      expect(cloned.data.y).toBeLessThanOrEqual(200);
      expect(cloned.data.size).toBe(30);
    });

    test('should not override existing x and y values even with initRange', () => {
      const node: Node = {
        id: 'node1',
        data: { x: 10, y: 20 },
      };
      const cloned = cloneFormatData(node, [100, 200]);
      expect(cloned.data.x).toBe(10);
      expect(cloned.data.y).toBe(20);
    });

    test('should preserve other data properties', () => {
      const node: Node = {
        id: 'node1',
        data: { size: 30, color: 'red', label: 'Node 1' },
      };
      const cloned = cloneFormatData(node, [100, 200]);
      expect(cloned.data.size).toBe(30);
      expect(cloned.data.color).toBe('red');
      expect(cloned.data.label).toBe('Node 1');
    });

    test('should handle edge with initRange', () => {
      const edge: Edge = {
        id: 'edge1',
        source: 'a',
        target: 'b',
        data: { weight: 1 },
      };
      const cloned = cloneFormatData(edge, [100, 200]);
      expect(cloned.data.x).toBeDefined();
      expect(cloned.data.y).toBeDefined();
      expect(cloned.data.weight).toBe(1);
    });

    test('should treat 0 as valid coordinate', () => {
      const node: Node = {
        id: 'node1',
        data: { x: 0, y: 0 },
      };
      const cloned = cloneFormatData(node, [100, 200]);
      expect(cloned.data.x).toBe(0);
      expect(cloned.data.y).toBe(0);
    });
  });
});

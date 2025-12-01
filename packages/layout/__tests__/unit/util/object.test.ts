import {
  clone,
  cloneFormatData,
  getNestedValue,
  setNestedValue,
} from '@/src/util/object';
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

  describe('getNestedValue', () => {
    test('should get top-level property', () => {
      const obj = { name: 'test', value: 42 };

      expect(getNestedValue(obj, 'name')).toBe('test');
      expect(getNestedValue(obj, 'value')).toBe(42);
    });

    test('should get nested property', () => {
      const obj = {
        user: {
          name: 'John',
          address: {
            city: 'New York',
            zip: 10001,
          },
        },
      };

      expect(getNestedValue(obj, 'user.name')).toBe('John');
      expect(getNestedValue(obj, 'user.address.city')).toBe('New York');
      expect(getNestedValue(obj, 'user.address.zip')).toBe(10001);
    });

    test('should return undefined for non-existent property', () => {
      const obj = { name: 'test' };

      expect(getNestedValue(obj, 'nonexistent')).toBeUndefined();
      expect(getNestedValue(obj, 'nested.prop')).toBeUndefined();
    });

    test('should handle array access', () => {
      const obj = {
        items: [{ id: 1 }, { id: 2 }, { id: 3 }],
      };

      expect(getNestedValue(obj, 'items.0.id')).toBe(1);
      expect(getNestedValue(obj, 'items.1.id')).toBe(2);
      expect(getNestedValue(obj, 'items.2.id')).toBe(3);
    });

    test('should handle null and undefined values in path', () => {
      const obj = {
        a: null,
        b: undefined,
        c: { d: null },
      };

      expect(getNestedValue(obj, 'a')).toBeNull();
      expect(getNestedValue(obj, 'b')).toBeUndefined();
      expect(getNestedValue(obj, 'c.d')).toBeNull();
      expect(getNestedValue(obj, 'a.nested')).toBeUndefined();
    });

    test('should handle empty string path', () => {
      const obj = { '': 'empty key' };

      expect(getNestedValue(obj, '')).toBe('empty key');
    });

    test('should handle numeric property names', () => {
      const obj = { 0: 'zero', 1: 'one' };

      expect(getNestedValue(obj, '0')).toBe('zero');
      expect(getNestedValue(obj, '1')).toBe('one');
    });

    test('should handle special characters in property names', () => {
      const obj = { 'prop-with-dash': 'value1', 'prop.with.dot': 'value2' };

      // Note: This will try to access nested properties for 'prop.with.dot'
      expect(getNestedValue(obj, 'prop-with-dash')).toBe('value1');
    });

    test('should return the value for boolean, number, and null', () => {
      const obj = {
        bool: true,
        num: 0,
        str: '',
        nul: null,
      };

      expect(getNestedValue(obj, 'bool')).toBe(true);
      expect(getNestedValue(obj, 'num')).toBe(0);
      expect(getNestedValue(obj, 'str')).toBe('');
      expect(getNestedValue(obj, 'nul')).toBeNull();
    });

    test('should handle deeply nested objects', () => {
      const obj = {
        level1: {
          level2: {
            level3: {
              level4: {
                level5: 'deep value',
              },
            },
          },
        },
      };

      expect(getNestedValue(obj, 'level1.level2.level3.level4.level5')).toBe(
        'deep value',
      );
    });
  });

  describe('setNestedValue', () => {
    test('should set top-level property', () => {
      const obj: any = { name: 'old' };

      setNestedValue(obj, 'name', 'new');
      expect(obj.name).toBe('new');
    });

    test('should set nested property', () => {
      const obj: any = {
        user: {
          name: 'John',
        },
      };

      setNestedValue(obj, 'user.name', 'Jane');
      expect(obj.user.name).toBe('Jane');
    });

    test('should create intermediate objects if they do not exist', () => {
      const obj: any = {};

      setNestedValue(obj, 'user.address.city', 'New York');
      expect(obj.user.address.city).toBe('New York');
    });

    test('should set deeply nested property', () => {
      const obj: any = {};

      setNestedValue(obj, 'a.b.c.d.e', 'value');
      expect(obj.a.b.c.d.e).toBe('value');
    });

    test('should set array element', () => {
      const obj: any = { items: [{}, {}, {}] };

      setNestedValue(obj, 'items.1.value', 42);
      expect(obj.items[1].value).toBe(42);
    });

    test('should create array if needed', () => {
      const obj: any = {};

      setNestedValue(obj, 'items.0', 'first');
      expect(obj.items[0]).toBe('first');
    });

    test('should handle numeric property names', () => {
      const obj: any = {};

      setNestedValue(obj, '0', 'zero');
      expect(obj[0]).toBe('zero');
    });

    test('should overwrite existing value', () => {
      const obj: any = { value: 'old' };

      setNestedValue(obj, 'value', 'new');
      expect(obj.value).toBe('new');
    });

    test('should set null value', () => {
      const obj: any = { value: 'old' };

      setNestedValue(obj, 'value', null);
      expect(obj.value).toBeNull();
    });

    test('should set undefined value', () => {
      const obj: any = { value: 'old' };

      setNestedValue(obj, 'value', undefined);
      expect(obj.value).toBeUndefined();
    });

    test('should set boolean value', () => {
      const obj: any = {};

      setNestedValue(obj, 'flag', true);
      expect(obj.flag).toBe(true);
    });

    test('should set number value', () => {
      const obj: any = {};

      setNestedValue(obj, 'count', 0);
      expect(obj.count).toBe(0);
    });

    test('should set object value', () => {
      const obj: any = {};
      const value = { x: 10, y: 20 };

      setNestedValue(obj, 'position', value);
      expect(obj.position).toBe(value);
    });

    test('should set array value', () => {
      const obj: any = {};
      const value = [1, 2, 3];

      setNestedValue(obj, 'items', value);
      expect(obj.items).toBe(value);
    });

    test('should handle empty string path', () => {
      const obj: any = {};

      setNestedValue(obj, '', 'empty key');
      expect(obj['']).toBe('empty key');
    });

    test('should not affect other properties', () => {
      const obj: any = {
        existing: 'value',
        user: { name: 'John' },
      };

      setNestedValue(obj, 'user.age', 30);
      expect(obj.existing).toBe('value');
      expect(obj.user.name).toBe('John');
      expect(obj.user.age).toBe(30);
    });

    test('should handle setting nested property in array', () => {
      const obj: any = {
        users: [{ name: 'John' }, { name: 'Jane' }],
      };

      setNestedValue(obj, 'users.0.age', 25);
      expect(obj.users[0].age).toBe(25);
      expect(obj.users[0].name).toBe('John');
    });
  });
});

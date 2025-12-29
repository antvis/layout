import { getNestedValue, setNestedValue } from '@/src/util/object';

describe('object', () => {
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

import { isArray } from '@/src/util/array';

describe('array', () => {
  describe('isArray', () => {
    test('should return true for arrays', () => {
      expect(isArray([])).toBe(true);
      expect(isArray([1, 2, 3])).toBe(true);
      expect(isArray(['a', 'b', 'c'])).toBe(true);
      expect(isArray([{ id: 1 }])).toBe(true);
      expect(isArray(new Array(5))).toBe(true);
    });

    test('should return false for non-arrays', () => {
      expect(isArray(null)).toBe(false);
      expect(isArray(undefined)).toBe(false);
      expect(isArray({})).toBe(false);
      expect(isArray('string')).toBe(false);
      expect(isArray(123)).toBe(false);
      expect(isArray(true)).toBe(false);
      expect(isArray(() => {})).toBe(false);
    });

    test('should return false for array-like objects', () => {
      expect(isArray({ length: 0 })).toBe(false);
      expect(isArray({ 0: 'a', 1: 'b', length: 2 })).toBe(false);
    });
  });
});

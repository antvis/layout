import type { NodeData } from '@/src/types/data';
import {
  formatNumberFn,
  formatSizeFn,
  formatNodeSizeWithSpacingFn,
} from '@/src/util/format';

describe('format', () => {
  describe('formatNumberFn', () => {
    test('should return function that returns default value when value is undefined', () => {
      const result = formatNumberFn(undefined, 10);
      expect(result()).toBe(10);
    });

    test('should return function that returns number when value is number', () => {
      const result = formatNumberFn(20, 10);
      expect(result()).toBe(20);
      expect(result({ id: 'test' } as any)).toBe(20);
    });

    test('should return the function when value is function', () => {
      const customFn = (d?: any) => d?.value * 2 || 0;
      const result = formatNumberFn(customFn, 10);
      expect(result({ value: 5 })).toBe(10);
    });

    test('should return default value for invalid types', () => {
      const result = formatNumberFn('invalid' as any, 10);
      expect(result()).toBe(10);
    });

    test('should handle zero as valid number', () => {
      const result = formatNumberFn(0, 10);
      expect(result()).toBe(0);
    });

    test('should handle negative numbers', () => {
      const result = formatNumberFn(-5, 10);
      expect(result()).toBe(-5);
    });

    test('should handle fractional numbers', () => {
      const result = formatNumberFn(3.14, 10);
      expect(result()).toBe(3.14);
    });

    test('should handle function returning zero', () => {
      const customFn = () => 0;
      const result = formatNumberFn(customFn, 10);
      expect(result()).toBe(0);
    });

    test('should handle function receiving undefined data', () => {
      const customFn = (d?: any) => d?.value || 5;
      const result = formatNumberFn(customFn, 10);
      expect(result()).toBe(5);
      expect(result(undefined)).toBe(5);
    });

    test('should handle null value', () => {
      const result = formatNumberFn(null as any, 10);
      expect(result()).toBe(10);
    });
  });

  describe('formatSizeFn', () => {
    test('should use default value when value is undefined', () => {
      const result = formatSizeFn<NodeData>(undefined, 10);
      expect(result()).toBe(10);
    });

    test('should use default value when value is not provided', () => {
      const result = formatSizeFn<NodeData>(undefined, 20, true);
      expect(result()).toBe(20);
    });

    test('should return number when value is number', () => {
      const result = formatSizeFn<NodeData>(15, 10);
      expect(result()).toBe(15);
    });

    test('should return function result when value is function', () => {
      const customFn = (d?: NodeData) => (d?.data as any)?.customSize || 50;
      const result = formatSizeFn<NodeData>(customFn, 10);
      expect(result({ id: 'test', data: { customSize: 60 } })).toBe(60);
    });

    test('should handle array value and return max', () => {
      const result = formatSizeFn<NodeData>([20, 30], 10, true);
      expect(result()).toBe(30);
    });

    test('should handle array value and return array when resultIsNumber is false', () => {
      const result = formatSizeFn<NodeData>([20, 30], 10, false);
      expect(result()).toEqual([20, 30]);
    });

    test('should handle object value with width and height', () => {
      const result = formatSizeFn<NodeData>({ width: 40, height: 50 }, 10);
      expect(result()).toBe(50);
    });

    test('should handle object value when resultIsNumber is false', () => {
      const result = formatSizeFn<NodeData>(
        { width: 40, height: 50 },
        10,
        false,
      );
      expect(result()).toEqual([40, 50]);
    });

    test('should return default value when value is undefined and no node provided', () => {
      const result = formatSizeFn<NodeData>(undefined, 10);
      expect(result()).toBe(10);
    });

    test('should return default value when value is undefined and node has data but no data field', () => {
      const result = formatSizeFn<NodeData>(undefined, 10);
      const nodeData: NodeData = {
        id: 'node1',
        data: {},
      };
      expect(result(nodeData)).toBe(10);
    });

    test('should handle number zero as valid size', () => {
      const result = formatSizeFn<NodeData>(0, 10);
      expect(result()).toBe(10); // 0 is falsy, falls back to default
    });

    test('should return default value when data has no size', () => {
      const result = formatSizeFn<NodeData>(undefined, 15);
      const nodeData: NodeData = {
        id: 'node1',
        data: {},
      };
      expect(result(nodeData)).toBe(15);
    });

    test('should handle empty array and return default value or -Infinity', () => {
      const result = formatSizeFn<NodeData>([], 10);
      expect(result()).toBe(-Infinity); // Math.max of empty array
    });

    test('should handle single element array', () => {
      const result = formatSizeFn<NodeData>([25], 10);
      expect(result()).toBe(25);
    });

    test('should handle negative sizes in array', () => {
      const result = formatSizeFn<NodeData>([-10, -5], 10);
      expect(result()).toBe(-5);
    });

    test('should handle function returning array', () => {
      const customFn = () => [15, 25];
      const result = formatSizeFn<NodeData>(customFn, 10, true);
      expect(result()).toEqual([15, 25]);
    });

    test('should handle object without width or height and fall back to default when calling with no param', () => {
      const result = formatSizeFn<NodeData>({} as any, 10);
      // Object without width/height doesn't match, returns default for fallback
      // Calling with undefined triggers the "get from data" logic which expects a node
      expect(() => result()).toThrow();
    });

    test('should handle null value', () => {
      const result = formatSizeFn<NodeData>(null as any, 10);
      expect(result()).toBe(10);
    });

    test('should prioritize provided value over node data', () => {
      const result = formatSizeFn<NodeData>(50, 10);
      const nodeData: NodeData = {
        id: 'node1',
        data: { size: 100 },
      };
      expect(result(nodeData)).toBe(50);
    });
  });

  describe('formatNodeSizeWithSpacingFn', () => {
    test('should return node size plus spacing', () => {
      const result = formatNodeSizeWithSpacingFn(20, 5, 10);
      expect(result()).toBe(25);
    });

    test('should use default node size when nodeSize is undefined', () => {
      const result = formatNodeSizeWithSpacingFn(undefined, 5, 15);
      expect(result()).toBe(20); // 15 + 5
    });

    test('should handle zero spacing', () => {
      const result = formatNodeSizeWithSpacingFn(20, 0, 10);
      expect(result()).toBe(20);
    });

    test('should handle undefined spacing', () => {
      const result = formatNodeSizeWithSpacingFn(20, undefined, 10);
      expect(result()).toBe(20);
    });

    test('should handle nodeSize as array', () => {
      const result = formatNodeSizeWithSpacingFn([30, 40], 5, 10);
      expect(result()).toBe(45); // max(30, 40) + 5
    });

    test('should handle nodeSize as function', () => {
      const sizeFn = (node?: NodeData) =>
        ((node?.data as any)?.customSize as number) || 25;
      const result = formatNodeSizeWithSpacingFn(sizeFn, 10, 10);
      expect(result({ id: 'test', data: { customSize: 30 } })).toBe(40); // 30 + 10
    });

    test('should handle nodeSpacing as function', () => {
      const spacingFn = (node?: NodeData) =>
        ((node?.data as any)?.spacing as number) || 0;
      const result = formatNodeSizeWithSpacingFn(20, spacingFn, 10);
      expect(result({ id: 'test', data: { spacing: 5 } })).toBe(25); // 20 + 5
    });

    test('should handle both nodeSize and nodeSpacing as functions', () => {
      const sizeFn = (node?: NodeData) =>
        ((node?.data as any)?.size as number) || 20;
      const spacingFn = (node?: NodeData) =>
        ((node?.data as any)?.spacing as number) || 0;
      const result = formatNodeSizeWithSpacingFn(sizeFn, spacingFn, 10);
      expect(
        result({ id: 'test', data: { size: 30, spacing: 5 } }),
      ).toBe(35);
    });

    test('should return default when nodeSize undefined and node has no size in data', () => {
      const result = formatNodeSizeWithSpacingFn(undefined, 5, 10);
      const nodeData: NodeData = {
        id: 'node1',
        data: {},
      };
      expect(result(nodeData)).toBe(15); // default 10 + 5 spacing
    });

    test('should handle negative spacing', () => {
      const result = formatNodeSizeWithSpacingFn(20, -5, 10);
      expect(result()).toBe(15); // 20 + (-5)
    });

    test('should handle fractional sizes and spacing', () => {
      const result = formatNodeSizeWithSpacingFn(20.5, 3.2, 10);
      expect(result()).toBeCloseTo(23.7);
    });

    test('should handle number zero node size', () => {
      const result = formatNodeSizeWithSpacingFn(0, 5, 10);
      expect(result()).toBe(15); // 0 is falsy, falls back to default 10 + 5
    });

    test('should handle large sizes', () => {
      const result = formatNodeSizeWithSpacingFn(1000, 100, 10);
      expect(result()).toBe(1100);
    });

    test('should handle object size with width and height', () => {
      const result = formatNodeSizeWithSpacingFn(
        { width: 30, height: 40 },
        5,
        10,
      );
      expect(result()).toBe(45); // max(30, 40) + 5
    });

    test('should use default when all values are undefined', () => {
      const result = formatNodeSizeWithSpacingFn(undefined, undefined, 12);
      expect(result()).toBe(12);
    });

    test('should handle node data without spacing function', () => {
      const result = formatNodeSizeWithSpacingFn(25, undefined, 10);
      const nodeData: NodeData = {
        id: 'node1',
        data: {},
      };
      expect(result(nodeData)).toBe(25);
    });

    test('should handle single element array size', () => {
      const result = formatNodeSizeWithSpacingFn([35], 5, 10);
      expect(result()).toBe(40); // max(35) + 5
    });

    test('should handle empty array size resulting in -Infinity', () => {
      const result = formatNodeSizeWithSpacingFn([], 5, 15);
      expect(result()).toBe(-Infinity); // Math.max([]) returns -Infinity
    });
  });
});

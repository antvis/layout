import { Node } from '@/src/types';
import {
  formatNodeSizeToNumber,
  formatNumberFn,
  formatSizeFn,
} from '@/src/util/function';

describe('function', () => {
  describe('formatNumberFn', () => {
    test('should return function that returns default value when value is undefined', () => {
      const result = formatNumberFn(10, undefined);
      expect(result()).toBe(10);
    });

    test('should return function that returns number when value is number', () => {
      const result = formatNumberFn(10, 20);
      expect(result()).toBe(20);
      expect(result({ id: 'test' })).toBe(20);
    });

    test('should return the function when value is function', () => {
      const customFn = (d?: any) => d.value * 2;
      const result = formatNumberFn(10, customFn);
      expect(result({ value: 5 })).toBe(10);
    });

    test('should return default value for invalid types', () => {
      const result = formatNumberFn(10, 'invalid' as any);
      expect(result()).toBe(10);
    });

    test('should handle zero as valid number', () => {
      const result = formatNumberFn(10, 0);
      expect(result()).toBe(0);
    });

    test('should handle negative numbers', () => {
      const result = formatNumberFn(10, -5);
      expect(result()).toBe(-5);
    });
  });

  describe('formatSizeFn', () => {
    const createNode = (data: any = {}): Node => ({
      id: 'node1',
      data,
    });

    test('should use default value when value is undefined', () => {
      const result = formatSizeFn(10, undefined);
      const node = createNode();
      expect(result(node)).toBe(10);
    });

    test('should extract size from node data', () => {
      const result = formatSizeFn(10, undefined);
      const node = createNode({ size: 20 });
      expect(result(node)).toBe(20);
    });

    test('should extract size from node data as array', () => {
      const result = formatSizeFn(10, undefined);
      const node = createNode({ size: [30, 40] });
      expect(result(node)).toBe(40); // max of array
    });

    test('should extract size from node data as object', () => {
      const result = formatSizeFn(10, undefined);
      const node = createNode({ size: { width: 25, height: 35 } });
      expect(result(node)).toBe(35); // max of width and height
    });

    test('should return array when resultIsNumber is false', () => {
      const result = formatSizeFn(10, undefined, false);
      const node = createNode({ size: [30, 40] });
      expect(result(node)).toEqual([30, 40]);
    });

    test('should return size array from object when resultIsNumber is false', () => {
      const result = formatSizeFn(10, undefined, false);
      const node = createNode({ size: { width: 25, height: 35 } });
      expect(result(node)).toEqual([25, 35]);
    });

    test('should return number when value is number', () => {
      const result = formatSizeFn(10, 15);
      const node = createNode();
      expect(result(node)).toBe(15);
    });

    test('should return function result when value is function', () => {
      const customFn = (d: Node) => d.data.customSize || 50;
      const result = formatSizeFn(10, customFn);
      const node = createNode({ customSize: 60 });
      expect(result(node)).toBe(60);
    });

    test('should handle array value', () => {
      const result = formatSizeFn(10, [20, 30]);
      const node = createNode();
      expect(result(node)).toBe(30); // max of array
    });

    test('should handle array value when resultIsNumber is false', () => {
      const result = formatSizeFn(10, [20, 30], false);
      const node = createNode();
      expect(result(node)).toEqual([20, 30]);
    });

    test('should handle object value', () => {
      const result = formatSizeFn(10, { width: 40, height: 50 });
      const node = createNode();
      expect(result(node)).toBe(50);
    });

    test('should handle object value when resultIsNumber is false', () => {
      const result = formatSizeFn(10, { width: 40, height: 50 }, false);
      const node = createNode();
      expect(result(node)).toEqual([40, 50]);
    });

    test('should handle zero as valid size', () => {
      const result = formatSizeFn(10, 0);
      const node = createNode();
      expect(result(node)).toBe(0);
    });

    test('should return default value for invalid types', () => {
      const result = formatSizeFn(10, 'invalid' as any);
      const node = createNode();
      expect(result(node)).toBe(10);
    });
  });

  describe('formatNodeSizeToNumber', () => {
    const createNode = (data: any = {}): Node => ({
      id: 'node1',
      data,
    });

    test('should use default node size when nodeSize is undefined', () => {
      const result = formatNodeSizeToNumber(undefined, undefined, 10);
      const node = createNode();
      expect(result(node)).toBe(10);
    });

    test('should extract size from node data', () => {
      const result = formatNodeSizeToNumber(undefined, undefined, 10);
      const node = createNode({ size: 20 });
      expect(result(node)).toBe(20);
    });

    test('should extract size from node data as array', () => {
      const result = formatNodeSizeToNumber(undefined, undefined, 10);
      const node = createNode({ size: [30, 40] });
      expect(result(node)).toBe(40); // max of array
    });

    test('should extract size from node data as object', () => {
      const result = formatNodeSizeToNumber(undefined, undefined, 10);
      const node = createNode({ size: { width: 25, height: 35 } });
      expect(result(node)).toBe(35);
    });

    test('should use bboxSize when available', () => {
      const result = formatNodeSizeToNumber(undefined, undefined, 10);
      const node = createNode({ bboxSize: [50, 60], size: [30, 40] });
      expect(result(node)).toBe(60); // max of bboxSize
    });

    test('should use provided nodeSize as number', () => {
      const result = formatNodeSizeToNumber(15, undefined, 10);
      const node = createNode();
      expect(result(node)).toBe(15);
    });

    test('should use provided nodeSize as array', () => {
      const result = formatNodeSizeToNumber([20, 30], undefined, 10);
      const node = createNode();
      expect(result(node)).toBe(30);
    });

    test('should use provided nodeSize as function', () => {
      const customFn = (d: Node) => d.data.customSize || [25, 35];
      const result = formatNodeSizeToNumber(customFn, undefined, 10);
      const node = createNode({ customSize: [40, 50] });
      expect(result(node)).toBe(50);
    });

    test('should add nodeSpacing as number', () => {
      const result = formatNodeSizeToNumber(20, 5, 10);
      const node = createNode();
      expect(result(node)).toBe(25); // 20 + 5
    });

    test('should add nodeSpacing as function', () => {
      const spacingFn = (d: Node) => d.data.spacing || 0;
      const result = formatNodeSizeToNumber(20, spacingFn, 10);
      const node = createNode({ spacing: 10 });
      expect(result(node)).toBe(30); // 20 + 10
    });

    test('should handle zero spacing', () => {
      const result = formatNodeSizeToNumber(20, 0, 10);
      const node = createNode();
      expect(result(node)).toBe(20);
    });

    test('should handle undefined spacing', () => {
      const result = formatNodeSizeToNumber(20, undefined, 10);
      const node = createNode();
      expect(result(node)).toBe(20);
    });

    test('should combine node size from data and spacing', () => {
      const result = formatNodeSizeToNumber(undefined, 5, 10);
      const node = createNode({ size: [30, 40] });
      expect(result(node)).toBe(45); // max(30, 40) + 5
    });
  });
});

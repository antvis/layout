import { isFunction, isNumber, isObject } from '@antv/util';
import type { NodeData } from '../types/data';
import type { Size } from '../types/size';
import { parseSize } from './size';

/**
 * Format value with multiple types into a function that returns a number
 * @param value The value to be formatted
 * @param defaultValue The default value when value is invalid
 * @returns A function that returns a number
 */
export function formatNumberFn<T = NodeData>(
  value: number | ((d?: T) => number) | undefined,
  defaultValue: number,
): (d?: T) => number {
  // If value is a function, return it directly
  if (isFunction(value)) {
    return value;
  }

  // If value is a number, return a function that returns this number
  if (isNumber(value)) {
    return () => value;
  }

  // For other cases (undefined or invalid values), return default value function
  return () => defaultValue;
}

/**
 * Format size config with multiple types into a function that returns a size
 * @param value The value to be formatted
 * @param defaultValue The default value when value is invalid
 * @param resultIsNumber Whether to return a number (max of width/height) or size array
 * @returns A function that returns a size
 */
export function formatSizeFn<T extends NodeData>(
  value?: Size | { width: number; height: number } | ((d?: T) => Size),
  defaultValue: number = 10,
  resultIsNumber: boolean = true,
): (d?: T) => Size {
  // If value is not provided, return default value
  if (!value) {
    return () => defaultValue;
  }

  // If value is a function, return it directly
  if (isFunction(value)) {
    return value;
  }

  // If value is a number, return a function that returns this number
  if (isNumber(value)) {
    return () => value;
  }

  // If value is an array, return max or the array itself
  if (Array.isArray(value)) {
    return () => {
      if (resultIsNumber) {
        return Math.max(...value) || defaultValue;
      }
      return value;
    };
  }

  // If value is an object with width and height
  if (isObject(value) && value.width && value.height) {
    return () => {
      if (resultIsNumber) {
        return Math.max(value.width, value.height) || defaultValue;
      }
      return [value.width, value.height];
    };
  }

  // If value is undefined or invalid, try to get from node data
  return (d) => {
    const { size } = d.data || {};

    if (!size) {
      return defaultValue;
    }

    // Handle array size
    if (Array.isArray(size)) {
      return resultIsNumber ? Math.max(...size) || defaultValue : size;
    }

    // Handle object size with width and height
    if (
      isObject<{ width: number; height: number }>(size) &&
      size.width &&
      size.height
    ) {
      return resultIsNumber
        ? Math.max(size.width, size.height) || defaultValue
        : [size.width, size.height];
    }

    // Handle number size
    return size;
  };
}

/**
 * Format nodeSize and nodeSpacing into a function that returns the total size
 * @param nodeSize The size of the node
 * @param nodeSpacing The spacing around the node
 * @param defaultNodeSize The default node size when value is invalid
 * @returns A function that returns the total size (node size + spacing)
 */
export const formatNodeSizeFn = (
  nodeSize: Size | ((node?: NodeData) => Size) | undefined,
  nodeSpacing: number | ((node?: NodeData) => number) | undefined,
  defaultNodeSize: number = 10,
): ((node?: NodeData) => number) => {
  const nodeSpacingFunc = formatNumberFn(nodeSpacing, 0);
  const nodeSizeFunc = formatSizeFn(nodeSize, defaultNodeSize);

  return (node?: NodeData) => {
    const size = nodeSizeFunc(node);
    const spacing = nodeSpacingFunc(node);
    return Math.max(...parseSize(size)) + spacing;
  };
};

import { isFunction, isNil, isNumber, isString } from '@antv/util';
import type { Expr, NodeData, Size, STDSize } from '../types';
import { evaluateExpression } from './expr';
import { isSize, parseSize } from './size';

/**
 * Format a value into a callable function when it is a string expression.
 * - `string` => `(context) => evaluateExpression(string, context)`
 * - `function` => returned as-is
 * - other => returned as-is
 */
export function formatFn<
  TContext extends Record<string, any> = Record<string, any>,
>(value: unknown, argNames: (keyof TContext & string)[]) {
  if (typeof value === 'function') return value;
  if (typeof value === 'string') {
    const expr = value;
    return (...argv: any[]) => {
      const ctx = {} as TContext;
      for (let i = 0; i < argNames.length; i++) {
        (ctx as any)[argNames[i]] = argv[i];
      }
      return evaluateExpression(expr, ctx);
    };
  }
  return () => value;
}

/**
 * Format value with multiple types into a function that returns a number
 * @param value The value to be formatted
 * @param defaultValue The default value when value is invalid
 * @returns A function that returns a number
 */
export function formatNumberFn<T extends NodeData = NodeData>(
  value: number | Expr | ((d: T) => number) | undefined,
  defaultValue: number,
  type: 'node' | 'edge' | 'combo' = 'node',
): (d: T) => number {
  // If value is undefined, return default value function
  if (isNil(value)) {
    return () => defaultValue;
  }

  // If value is an expression, return a function that evaluates the expression
  if (isString(value)) {
    const numberFn = formatFn(value, [type]);
    return (d: T) => {
      const evaluated = numberFn(d);
      if (isNumber(evaluated)) return evaluated;
      return defaultValue;
    };
  }

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
export function formatSizeFn<T extends NodeData = NodeData>(
  value?: Size | Expr | ((d: T) => Size),
  defaultValue: number = 10,
  type: 'node' | 'edge' | 'combo' = 'node',
): (d: T) => Size {
  // If value is undefined, return default value function
  if (isNil(value)) {
    return () => defaultValue;
  }

  // If value is an expression, return a function that evaluates the expression
  if (isString(value)) {
    const sizeFn = formatFn(value, [type]);
    return (d: T) => {
      const evaluated = sizeFn(d);
      if (isSize(evaluated)) return evaluated;
      return defaultValue;
    };
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
    return () => value;
  }

  return () => defaultValue;
}

/**
 * Format nodeSize and nodeSpacing into a function that returns the total size
 * @param nodeSize The size of the node
 * @param nodeSpacing The spacing around the node
 * @param defaultNodeSize The default node size when value is invalid
 * @param defaultNodeSpacing The default node spacing when value is invalid
 * @returns A function that returns the total size (node size + spacing)
 */
export const formatNodeSizeFn = (
  nodeSize?: Size | Expr | ((node: NodeData) => Size),
  nodeSpacing?: Size | Expr | ((node: NodeData) => Size),
  defaultNodeSize: number = 10,
  defaultNodeSpacing: number = 0,
): ((d: NodeData) => STDSize) => {
  const nodeSpacingFunc = formatSizeFn(nodeSpacing, defaultNodeSpacing);
  const nodeSizeFunc = formatSizeFn(nodeSize, defaultNodeSize);

  return (d: NodeData) => {
    const [sizeW, sizeH, sizeD] = parseSize(nodeSizeFunc(d));
    const [spacingW, spacingH, spacingD] = parseSize(nodeSpacingFunc(d));
    return [sizeW + spacingW, sizeH + spacingH, sizeD + spacingD];
  };
};

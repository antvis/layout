import { compile, evaluate } from '@antv/expr';
import type { ExprContext } from '../types';

/**
 * Evaluate an expression if (and only if) it's a valid string expression.
 * - Returns `undefined` when `expression` is not a string, empty, or invalid.
 *
 * @example
 * evaluateExpression('x + y', { x: 10, y: 20 }) // 30
 */
export function evaluateExpression(
  expression: unknown,
  context: ExprContext,
): unknown | undefined {
  if (typeof expression !== 'string') return undefined;

  const source = expression.trim();
  if (!source) return undefined;

  try {
    compile(source);
    return evaluate(source, context);
  } catch {
    return undefined;
  }
}

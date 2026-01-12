export type PlainObject = Record<string, any>;

export type Matrix = number[][];

/**
 * String expression evaluated by `@antv/expr`.
 *
 * Notes:
 * - `Expr` is structured-cloneable and can be passed into WebWorkers.
 * - Function callbacks cannot be structured-cloned; prefer `Expr` when `enableWorker: true`.
 */
export type Expr = string;

/**
 * CallableExpr<(node: NodeData) => number>
 *
 * => 'node.degree' | (node: NodeData) => number
 */
export type CallableExpr<TData = any, TResult = any> =
  | Expr
  | ((data: TData) => TResult);

export type ExprContext = Record<string, any>;

export type Sorter<T = any> = (a: T, b: T) => -1 | 0 | 1;

export type PlainObject = Record<string, any>;

export type Matrix = number[][];

export type Expr = string;

/**
 * CallableExpr<(node: NodeData) => number>
 *
 * => 'node.degree' | (node: NodeData) => number
 */
export type CallableExpr<T = any> = Expr | ((data: T) => any);

export type Sorter<T = any> = (a: T, b: T) => -1 | 0 | 1;

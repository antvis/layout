import type { PlainObject } from './common';
import type { ID } from './id';
import type { Point } from './point';

export interface LayoutData<
  N extends PlainObject = PlainObject,
  E extends PlainObject = PlainObject,
> {
  nodes: Map<ID, LayoutNode<N>>;
  edges: Map<ID, LayoutEdge<E>>;
}

export interface LayoutNode<N extends PlainObject = PlainObject> {
  id: ID;
  x: number;
  y: number;
  z?: number;
  fx?: number;
  fy?: number;
  fz?: number;
  vx?: number;
  vy?: number;
  vz?: number;
  _original?: N;
}

export interface LayoutEdge<E extends PlainObject = PlainObject> {
  id: ID;

  source: ID;
  target: ID;

  controlPoints?: Point[];

  _original?: E;
}

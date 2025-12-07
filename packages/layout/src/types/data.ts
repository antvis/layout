import type { PlainObject } from './common';
import type { ID } from './id';
import type { Point } from './point';

export interface GraphData<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  nodes: N[];
  edges?: E[];
}

export interface NodeData extends PlainObject {}

export interface EdgeData extends PlainObject {}

export interface LayoutData {
  nodes: Map<ID, LayoutNode>;
  edges: Map<ID, LayoutEdge>;
}

export interface LayoutNode<N extends NodeData = NodeData> {
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
  _original: N;
  [key: string]: any;
}

export interface LayoutEdge<E extends EdgeData = EdgeData> {
  id: ID;
  source: ID;
  target: ID;
  sourceNode?: LayoutNode;
  targetNode?: LayoutNode;
  points?: Point[];
  _original: E;
  [key: string]: any;
}

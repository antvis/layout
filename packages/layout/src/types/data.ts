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

export interface LayoutNode {
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
}

export interface LayoutEdge {
  id: ID;
  source: ID;
  target: ID;
  sourceNode?: LayoutNode;
  targetNode?: LayoutNode;
  controlPoints?: Point[];
}

export interface ModelData<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  nodes: Map<ID, ModelNode<N>>;
  edges: Map<ID, ModelEdge<E>>;
}

export interface ModelNode<N extends NodeData = NodeData> extends LayoutNode {
  _original?: N;
}

export interface ModelEdge<E extends EdgeData = EdgeData> extends LayoutEdge {
  _original?: E;
}

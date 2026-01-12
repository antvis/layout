import type { PlainObject } from './common';
import type { EdgeLabelPos } from './edge-label';
import type { ID } from './id';
import type { Point } from './point';
import type { Size } from './size';

export interface GraphData<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  nodes: N[];
  edges?: E[];
}

export interface NodeData extends PlainObject {}

export interface EdgeData extends PlainObject {}

export interface GraphNode<N extends NodeData = NodeData> {
  id: ID;

  x: number;
  y: number;
  z?: number;

  /** Applied for compound layout（dagre、antv-dagre、combo-combined） */
  parentId?: ID | null;
  isCombo?: boolean;

  /** Applied for force-directed layout */
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  vx?: number;
  vy?: number;
  vz?: number;

  /** Output additional info */
  size?: Size;
  _original: N;

  [key: string]: any;
}

export interface GraphEdge<E extends EdgeData = EdgeData> {
  id: ID;

  source: ID;
  target: ID;
  sourceNode?: GraphNode;
  targetNode?: GraphNode;

  _original: E;

  /** Only for dagre layout */
  points?: Point[];
  labelSize?: Size;
  labelPos?: EdgeLabelPos;
  labelOffset?: number;
  weight?: number;
  minLen?: number;

  [key: string]: any;
}

export interface Graph<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  nodes: Map<ID, GraphNode<N>>;
  edges: Map<ID, GraphEdge<E>>;
}

export type LayoutNode<N extends NodeData = NodeData> = GraphNode<N>;
export type LayoutEdge<E extends EdgeData = EdgeData> = GraphEdge<E>;
export type LayoutData<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> = Graph<N, E>;

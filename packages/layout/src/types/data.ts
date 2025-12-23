import type { EdgeLabelPos } from '../dagre/types';
import type { PlainObject } from './common';
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

export interface LayoutData {
  nodes: Map<ID, LayoutNode>;
  edges: Map<ID, LayoutEdge>;
}

export interface LayoutNode<N extends NodeData = NodeData> {
  id: ID;

  x: number;
  y: number;
  z?: number;

  _original: N;

  parentId?: ID | null;

  /** Only for force-directed layout */
  fx?: number | null;
  fy?: number | null;
  fz?: number | null;
  vx?: number;
  vy?: number;
  vz?: number;

  /** Only for dagre layout */
  size?: Size;

  [key: string]: any;
}

export interface LayoutEdge<E extends EdgeData = EdgeData> {
  id: ID;

  source: ID;
  target: ID;
  sourceNode?: LayoutNode;
  targetNode?: LayoutNode;

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

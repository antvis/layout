import type { PlainObject } from './common';

export interface NodeData extends PlainObject {}

export interface EdgeData extends PlainObject {}

export interface GraphData<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  nodes: N[];
  edges?: E[];
}

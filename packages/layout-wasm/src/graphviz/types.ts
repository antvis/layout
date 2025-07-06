import { NodeData, EdgeData, Node as AntvNode, Size } from '@antv/layout';

import { type Edge } from './edge';
import { type Node } from './node';

export interface IGraphvizAttrs {
  ranksep?: number;
  nodesep?: number;
  nclimit?: number;
  mclimit?: number;
  splines?: boolean;
  rankdir?: 'LR' | 'TB';
}

export interface IObj {
  [key: string]: unknown;
}

export type TProcessData = {
  nodes: NodeData[];
  edges: EdgeData[];
};

export interface GraphvizDotLayoutOptions extends IGraphvizAttrs {
  nodeSize?: Size | ((node: AntvNode) => Size);
  preLayout?: boolean;
  iterations?: number;
  getWeight?: (edge: EdgeData) => number;
}

export type TNodesEdgesMap = (Node | Edge)[];

export type TIdsMap = {
  node: Node;
  index: number;
}[];
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

// 这个奇怪的结构来自 antv graph getAllNodes 和 getAllEdges 方法
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

export interface IDotJson {
  bb: string; // x1,y1,x2,y2
  name: string;
  randir: string;
  nodesep: string;
  ranksep: string;
  xdotversion: string;
  objects: {
    _gvid: number;
    width: string; // number
    height: string; // number
    label: string;
    shape: 'box' | 'circle';
    pos: string; // x, y
    fixedsize: string; // boolean;
  }[];
  edges: {
    _gvid: number;
    label: string;
    pos: string; // path
    head: number;
    tail: number;
    lp: string; // x, y labelposition?
    weight: string; // number
    arrowsize: string; // number
    tailclip: string; // boolean
  }[];
}

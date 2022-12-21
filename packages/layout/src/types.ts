import type { Graph, PlainObject } from "@antv/graphlib";

export interface Node extends PlainObject {
  id: string;
}

export interface OutNode extends Node {
  x: number;
  y: number;
  fx?: number;
  fy?: number;
  comboId?: string;
  layer?: number; // dagre布局中指定的层级
  _order?: number; // dagre布局中层内排序结果，用于增量布局
  layout?: boolean;
  size?: number | number[] | undefined;
}

export interface Edge {
  source: string;
  target: string;
}

export interface Combo {
  id: string;
  parentId?: string;
  x?: number;
  y?: number;
  name?: string | number;
  cx?: number;
  cy?: number;
  count?: number;
  depth?: number;
  children?: any[];
  empty?: boolean;
  minX?: number;
  maxX?: number;
  minY?: number;
  maxY?: number;
  size?: number;
  r?: number;
  itemType?: string;
  collapsed?: boolean;
}

export interface Model {
  nodes?: Node[];
  edges?: Edge[];
  combos?: Combo[];
  comboEdges?: Edge[];
  hiddenNodes?: Node[];
  hiddenEdges?: Edge[];
  hiddenCombos?: Combo[];
  vedges?: Edge[]; // temp edges e.g. the edge generated for releated collapsed combo
}

export interface OutModel extends Model {
  nodes?: OutNode[];
}

export interface Size {
  width: number;
  height: number;
}

export type IndexMap = {
  [key: string]: number;
};

export type INode = OutNode & {
  degree: number;
  size: number | PointTuple;
};

export type NodeMap = {
  [key: string]: INode;
};


export type Matrix = number[];

export type Point = {
  x: number;
  y: number;
};

export type Degree = {
  in: number;
  out: number;
  all: number;
};

export interface ComboTree {
  id: string;
  children?: ComboTree[];
  depth?: number;
  parentId?: string;
  itemType?: "node" | "combo";
  [key: string]: unknown;
}
export interface ComboConfig {
  id: string;
  parentId?: string;
  children?: ComboTree[];
  depth?: number;
}

export type PointTuple = [number, number];
export type LayoutMapping = { nodes: OutNode[]; edges: Edge[] };

export interface SyncLayout<LayoutOptions> {
  assign(graph: Graph<any, any>, options?: LayoutOptions): void;
  execute(graph: Graph<any, any>, options?: LayoutOptions): LayoutMapping;
}

export interface LayoutSupervisor {
  start(): void;
  stop(): void;
  kill(): void;
}

export interface CircularLayoutOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
  radius?: number | null;
  startRadius?: number | null;
  endRadius?: number | null;
  clockwise?: boolean;
  divisions?: number;
  ordering?: "topology" | "topology-directed" | "degree" | null;
  angleRatio?: number;
  workerEnabled?: boolean;
  startAngle?: number;
  endAngle?: number;
  nodeSpacing?: ((d?: unknown) => number) | number;
  nodeSize?: number;
  onLayoutEnd?: () => void;
}

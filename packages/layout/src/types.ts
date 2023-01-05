import type { Graph, Node as INode, Edge as IEdge } from "@antv/graphlib";

/**
 * input node
 */
export interface Node extends INode {
  data?: {
    visible?: boolean;
    size?: number | number[];
    bboxSize?: number[];
  }
}

/** output node */
export interface OutNode extends Node {
  data: {
    visible?: boolean;
    size?: number | number[];
    bboxSize?: number[];
    x: number;
    y: number;
  }
}

/**
 * input edge
 */
export interface Edge extends IEdge {
  data?: {
    visible?: boolean;
    // temp edges e.g. the edge generated for releated collapsed combo
    virtual?: boolean;
  }
}

export type Degree = {
  in: number;
  out: number;
  all: number;
};

/**
 * output edge
 */
export interface OutEdge extends Edge {}

export type PointTuple = [number, number];
export type Point = { x: number, y: number };
export type Matrix = number[];
export type LayoutMapping = { nodes: OutNode[]; edges: Edge[] };

export interface SyncLayout<LayoutOptions> {
  assign(graph: Graph<any, any>, options?: LayoutOptions): void;
  execute(graph: Graph<any, any>, options?: LayoutOptions): LayoutMapping;
  options: LayoutOptions;
  id: string;
}

export interface SyncLayoutConstructor<LayoutOptions> {
  new (options?: LayoutOptions): SyncLayout<LayoutOptions>;
}

export interface LayoutSupervisor {
  start(): void;
  stop(): void;
  kill(): void;
}

// most layout options extends CommonOptions
interface CommonOptions {
  // whether take the invisible nodes and edges into calculation, false by default
  layoutInvisibles?: boolean;
}

export interface CircularLayoutOptions extends CommonOptions {
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
  nodeSpacing?: ((node?: Node) => number) | number;
  nodeSize?: number | number[];
  onLayoutEnd?: () => void;
}

export interface GridLayoutOptions extends CommonOptions {
  width?: number;
  height?: number;
  begin?: PointTuple;
  preventOverlap?: boolean;
  nodeSize?: number | number[];
  preventOverlapPadding?: number;
  condense?: boolean;
  rows?: number;
  cols?: number;
  sortBy?: string;
  workerEnabled?: boolean;
  columns?: number | undefined;
  position?: ((node?: Node) => { row?: number; col?: number }) | undefined;
  onLayoutEnd?: () => void;
  nodeSpacing?: ((node?: Node) => number) | number | undefined;
}

export interface RandomLayoutOptions extends CommonOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
  workerEnabled?: boolean;
  onLayoutEnd?: () => void;
}

export interface MDSLayoutOptions extends CommonOptions {
  center?: PointTuple;
  linkDistance?: number;
  workerEnabled?: boolean;
  onLayoutEnd?: () => void;
}

export interface ConcentricLayoutOptions extends CommonOptions {
  center?: PointTuple;
  preventOverlap?: boolean;
  nodeSize?: number | PointTuple;
  minNodeSpacing?: number;
  sweep?: number;
  equidistant?: boolean;
  startAngle?: number;
  clockwise?: boolean;
  maxLevelDiff?: number;
  sortBy?: string;
  workerEnabled?: boolean;
  width?: number;
  height?: number;
  nodeSpacing: number | number[] | ((node?: Node) => number) | undefined;
  onLayoutEnd?: () => void;
}

export interface RadialLayoutOptions extends CommonOptions {
  center?: PointTuple;
  width?: number;
  height?: number;
  linkDistance?: number;
  maxIteration?: number;
  focusNode?: string | Node | null;
  unitRadius?: number | null;
  preventOverlap?: boolean;
  nodeSize?: number | number[] | undefined;
  nodeSpacing?: number | Function | undefined;
  maxPreventOverlapIteration?: number;
  strictRadial?: boolean;
  sortBy?: string | undefined;
  sortStrength?: number;
  workerEnabled?: boolean;
  onLayoutEnd?: () => void;
}

export interface DagreLayoutOptions extends CommonOptions {
  rankdir?: "TB" | "BT" | "LR" | "RL";
  align?: "UL" | "UR" | "DL" | "DR";
  begin?: PointTuple;
  nodeSize?: number | number[] | undefined;
  nodesep?: number;
  ranksep?: number;
  controlPoints?: boolean;
  sortByCombo?: boolean;
  workerEnabled?: boolean;
  edgeLabelSpace?: boolean;
  nodeOrder?: string[];
  radial?: boolean; // 是否基于 dagre 进行辐射布局
  focusNode: string | Node | null; // radial 为 true 时生效，关注的节点
  preset?: {
    nodes: OutNode[],
    edges: Edge[],
  };
  onLayoutEnd?: () => void;
  nodesepFunc?: ((d?: Node) => number) | undefined;
  ranksepFunc?: ((d?: Node) => number) | undefined;
}
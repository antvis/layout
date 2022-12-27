import type { Graph, Node as INode, Edge as IEdge } from "@antv/graphlib";

/**
 * input node
 */
export interface Node extends INode {
  data?: {
    visible?: boolean;
  };
}

/** output node */
export interface OutNode extends Node {
  data?: {
    visible?: boolean;
    x?: number;
    y?: number;
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
  };
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
  nodeSpacing?: ((node?: Node) => number) | number;
  nodeSize?: number | number[];
  onLayoutEnd?: () => void;
}

export interface GridLayoutOptions {
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
  position?: ((node: Node) => { row?: number; col?: number }) | undefined;
  onLayoutEnd?: () => void;
  nodeSpacing?: ((node: Node) => number) | number | undefined;
}
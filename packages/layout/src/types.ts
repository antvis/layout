import type { Graph } from "@antv/graphlib";

export interface Node {
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

export type PointTuple = [number, number];
export type LayoutMapping = { nodes: OutNode[]; edges: Edge[] };

export interface SyncLayout<LayoutOptions> {
  assign(graph: Graph<any, any>, options?: LayoutOptions): void;
  execute(graph: Graph<any, any>, options?: LayoutOptions): LayoutMapping;
}

export interface LayoutSupervisor {

}

export interface AsyncLayout<LayoutOptions> {
  assign(graph: Graph<any, any>, options?: LayoutOptions): void;
  execute(graph: Graph<any, any>, options?: LayoutOptions): LayoutMapping;

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
  onLayoutEnd?: () => void;
}

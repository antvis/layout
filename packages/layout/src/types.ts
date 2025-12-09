import { Edge as IEdge, Graph as IGraph, Node as INode } from '@antv/graphlib';
import type { GraphData } from './types/data';
import type { Size } from './types/size';

/**
 * <zh/> 节点数据
 *
 * <en/> Node data
 */
export interface NodeData {
  /**
   * <zh/> 节点x轴坐标
   *
   * <en/> Node x coordinate
   */
  x?: number;
  /**
   * <zh/> 节点y轴坐标
   *
   * <en/> Node y coordinate
   */
  y?: number;
  /**
   * <zh/> 节点z轴坐标
   *
   * <en/> Node z coordinate
   */
  z?: number;
  /**
   * <zh/> 节点大小（直径)
   *
   * <en/> Node size (diameter)
   */
  size?: number | number[];
  [key: string]: any;
}

/**
 * <zh/> 边数据
 *
 * <en/> Edge data
 */
export interface EdgeData {
  weight?: number;
  [keys: string]: any;
}

export interface OutNodeData extends NodeData {
  x: number;
  y: number;
}

export interface OutEdgeData extends EdgeData {}

export type Node = INode<NodeData>;
export type Edge = IEdge<EdgeData>;
export type OutNode = INode<OutNodeData>;
export type OutEdge = IEdge<OutEdgeData>;

// maps node's id and its index in the nodes array
export type IndexMap = {
  [nodeId: string]: number;
};

export type Graph = IGraph<NodeData, EdgeData>;

export type PointTuple = [number, number] | [number, number, number];
export type Point = { x: number; y: number; z?: number };
export type Matrix = number[];
export type LayoutMapping = { nodes: OutNode[]; edges: OutEdge[] };

export interface Layout<LayoutOptions> {
  /**
   * <zh/> 传入数据并执行布局计算,结果写入原始数据
   *
   * <en/> Passes in the data and performs the layout calculation, modifying the original data
   * @param graph - <zh/> 规范化数据 | <en/> Normalized data
   * @param options - <zh/> 布局配置 | <en/> Layout options
   * @returns Promise<void>
   */
  assign(graph: Graph | GraphData, options?: LayoutOptions): Promise<void>;
  /**
   * <zh/> 传入数据并执行布局计算，且结果不写入原始数据，作为返回值
   *
   * <en/> Passes in the data and performs the layout calculation, and the result is not written to the original data, but returned as a value
   * @param graph - <zh/> 规范化数据 | <en/> Normalized data
   * @param options - <zh/> 布局配置 | <en/> Layout options
   * @returns <zh/> 布局结果 | <en/> Layout result
   */
  execute(
    graph: Graph | GraphData,
    options?: LayoutOptions,
  ): Promise<LayoutMapping>;
  /**
   * <zh/> 布局计算的配置项
   *
   * <en/> Layout calculation configuration item
   */
  options: LayoutOptions;
  /**
   * <zh/> 布局id
   *
   * <en/> Layout id
   */
  id: string;
}

export function isLayoutWithIterations(
  layout: any,
): layout is LayoutWithIterations<any> {
  return !!layout.tick && !!layout.stop;
}

export interface LayoutWithIterations<LayoutOptions>
  extends Layout<LayoutOptions> {
  /**
   * Some layout algorithm has n iterations so that the simulation needs to be stopped at any time.
   * This method is useful for running the simulation manually.
   * @see https://github.com/d3/d3-force#simulation_stop
   */
  stop: () => void;

  /**
   * Manually steps the simulation by the specified number of iterations.
   * @see https://github.com/d3/d3-force#simulation_tick
   */
  tick: (iterations?: number) => LayoutMapping;
}

export interface LayoutSupervisor {
  execute(): Promise<LayoutMapping>;
  stop(): void;
  kill(): void;
  isRunning(): boolean;
}

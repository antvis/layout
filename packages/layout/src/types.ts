import { Edge as IEdge, Graph as IGraph, Node as INode } from '@antv/graphlib';
import type { GraphData } from './types/data';

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

/**
 * <zh/>ComboCombined  复合布局配置项
 *
 * <en/> ComboCombined layout configuration item
 */
export interface ComboCombinedLayoutOptions {
  /**
   * <zh/> 布局的中心、默认为图的中心
   *
   * <en/> The center of the layout, default to the center of the graph
   */
  center?: PointTuple;
  /**
   * <zh/> 节点大小（直径）。用于碰撞检测
   *
   * <en/> The size of the node (diameter). Used for collision detection
   * @remarks
   * <zh/> 若不指定，则根据传入的节点的 size 属性计算。若即不指定，节点中也没有 size，则默认大小为 10
   *
   * <en/> If not specified, it will be calculated based on the size attribute of the incoming node. If neither is specified, the default size is 10
   * @defaultValue 10
   */
  nodeSize?: number | number[] | ((d?: Node) => number);
  /**
   * <zh/> preventNodeOverlap 或 preventOverlap 为 true 时生效, 防止重叠时节点/ combo 边缘间距的最小值。可以是回调函数, 为不同节点设置不同的最小间距
   *
   * <en/> It takes effect when preventNodeOverlap or preventOverlap is true. The minimum spacing between nodes when overlapping is prevented. It can be a callback function, and different minimum spacing can be set for different nodes
   */
  spacing?: number | ((d?: Node) => number);
  /**
   * <zh/> 最外层的布局算法，默认为 force
   *
   * <en/> The outermost layout algorithm, default to force
   * @example
   * ```ts
   * import { ForceLayout } from '@antv/layout';
   *
   * outerLayout: new ForceLayout({
   * gravity: 1,
   * factor: 2,
   * linkDistance: (edge: any, source: any, target: any) => {
   * const nodeSize = ((source.size?.[0] || 30) + (target.size?.[0] || 30)) / 2;
   * return Math.min(nodeSize * 1.5, 700);
   *   }
   *  });
   * ```
   * @defaultValue ForceLayout
   */
  outerLayout?: Layout<any>;
  /**
   * <zh/> combo 内部的布局算法，需要使用同步的布局算法，默认为 concentric
   *
   * <en/> The layout algorithm inside the combo, which needs to use a synchronized layout algorithm, default to concentric
   * @example
   * ```ts
   * import { ConcentricLayout } from '@antv/layout';
   *
   * innerLayout: new ConcentricLayout({
   *  sortBy: 'id'
   *  });
   * ```
   * @defaultValue ConcentricLayout
   */
  innerLayout?: Layout<any>;
  /**
   * <zh/>  Combo 内部的 padding 值，不用于渲染，仅用于计算力。推荐设置为与视图上 combo 内部 padding 值相同的值
   *
   * <en/> The padding value inside the combo, which is not used for rendering, but only for calculating force. It is recommended to set it to the same value as the combo internal padding value on the view
   * @defaultValue 10
   */
  comboPadding?: ((d?: unknown) => number) | number | number[] | undefined;
  /**
   * <zh/> treeKey
   *
   * <en/> treeKey
   */
  treeKey?: string;
}

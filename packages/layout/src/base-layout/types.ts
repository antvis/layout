import type { EdgeData, GraphData, NodeData } from '../types/data';
import type { Point } from '../types/point';

export interface NodeFieldMapping {
  /** 支持嵌套路径，如 'id' 或 'data.id' */
  id?: string;
  x?: string;
  y?: string;
  z?: string;
  fx?: string;
  fy?: string;
  fz?: string;
  vx?: string;
  vy?: string;
  vz?: string;
}

export interface EdgeFieldMapping {
  id?: string;
  source?: string;
  target?: string;
  controlPoints?: string;
}

export interface BaseLayoutOptions<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  /**
   * <zh/> 节点字段映射
   * <en/> Node field mapping
   */
  nodeFields?: NodeFieldMapping;

  /**
   * <zh/> 边字段映射
   * <en/> Edge field mapping
   */
  edgeFields?: EdgeFieldMapping;

  /**
   * <zh/> 布局中心
   * <en/> Layout center
   */
  center?: Point;

  /**
   * <zh/> 布局宽度
   * <en/> Layout width
   */
  width?: number;

  /**
   * <zh/> 布局高度
   * <en/> Layout height
   */
  height?: number;
}

export interface Layout<LayoutOptions> {
  /**
   * <zh/> 传入数据并执行布局计算,结果写入原始数据
   *
   * <en/> Passes in the data and performs the layout calculation, modifying the original data
   * @param graph - <zh/> 规范化数据 | <en/> Normalized data
   * @param options - <zh/> 布局配置 | <en/> Layout options
   * @returns Promise<void>
   */
  assign(graph: GraphData, options?: LayoutOptions): Promise<void>;
  /**
   * <zh/> 传入数据并执行布局计算，且结果不写入原始数据，作为返回值
   *
   * <en/> Passes in the data and performs the layout calculation, and the result is not written to the original data, but returned as a value
   * @param graph - <zh/> 规范化数据 | <en/> Normalized data
   * @param options - <zh/> 布局配置 | <en/> Layout options
   * @returns <zh/> 布局结果 | <en/> Layout result
   */
  execute(graph: GraphData, options?: LayoutOptions): Promise<GraphData>;
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
  tick: (iterations?: number) => GraphData;
}

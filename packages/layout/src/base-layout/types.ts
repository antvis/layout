import type {
  EdgeData,
  GraphData,
  LayoutEdge,
  LayoutNode,
  NodeData,
} from '../types/data';
import type { Point } from '../types/point';

export interface LayoutModelOptions<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  /**
   * <zh/> 自定义节点属性映射
   *
   * <en/> Custom node field mapping
   */
  node?: (datum: N) => LayoutNode;

  /**
   * <zh/> 自定义边属性映射
   *
   * <en/> Custom edge field mapping
   */
  edge?: (datum: E) => LayoutEdge;
}

export interface ViewportOptions {
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

export interface BaseLayoutOptions<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> extends LayoutModelOptions<N, E> {
  [key: string]: any;
}

export interface Layout<
  LayoutOptions extends BaseLayoutOptions = BaseLayoutOptions,
> {
  /**
   * <zh/> 执行布局计算
   *
   * <en/> Execute layout calculation
   */
  execute(graph: GraphData, options?: LayoutOptions): Promise<void>;

  /**
   * <zh/> 遍历节点布局结果
   *
   * <en/> Iterate over node layout results
   */
  forEachNode(callback: (node: LayoutNode) => void): void;

  /**
   * <zh/> 遍历边布局结果
   *
   * <en/> Iterate over edge layout results
   */
  forEachEdge(callback: (edge: LayoutEdge) => void): void;

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

export interface LayoutWithIterations<
  LayoutOptions extends BaseLayoutOptions = BaseLayoutOptions,
> extends Layout<LayoutOptions> {
  /**
   * Some layout algorithm has n iterations so that the simulation needs to be stopped at any time.
   * This method is useful for running the simulation manually.
   * @see https://github.com/d3/d3-force#simulation_stop
   */
  stop(): void;

  /**
   * Manually steps the simulation by the specified number of iterations.
   * @see https://github.com/d3/d3-force#simulation_tick
   */
  tick(iterations?: number): void;
}

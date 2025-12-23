import type {
  EdgeData,
  GraphData,
  ID,
  LayoutEdge,
  LayoutNode,
  LayoutResult,
  NodeData,
  Point,
} from '../types';

export interface LayoutModelOptions<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> {
  /**
   * <zh/> 自定义节点属性映射
   *
   * <en/> Custom node field mapping
   */
  node?: (datum: N) => {
    id?: ID;
    x?: number;
    y?: number;
    z?: number;
    parentId?: ID | null;
  };

  /**
   * <zh/> 自定义边属性映射
   *
   * <en/> Custom edge field mapping
   */
  edge?: (datum: E) => {
    id?: ID;
    source?: ID;
    target?: ID;
  };
}

export interface BaseLayoutOptions<
  N extends NodeData = NodeData,
  E extends EdgeData = EdgeData,
> extends LayoutModelOptions<N, E> {
  /**
   * <zh/> 布局中心
   *
   * <en/> Layout center
   */
  center?: Point;

  /**
   * <zh/> 布局宽度
   *
   * <en/> Layout width
   */
  width?: number;

  /**
   * <zh/> 布局高度
   *
   * <en/> Layout height
   */
  height?: number;

  /**
   * <zh/> 是否启用 WebWorker
   *
   * <en/> Whether to run the layout in a WebWorker
   */
  workerEnabled?: boolean;

  /**
   * <zh/> 自定义 WebWorker 地址，默认使用内置 worker
   *
   * <en/> Custom WebWorker url, uses the built-in worker by default
   */
  workerScriptURL?: string;

  [key: string]: any;
}

export interface Layout<LayoutOptions> {
  /**
   * <zh/> 执行布局计算
   *
   * <en/> Execute layout calculation
   */
  execute(
    graph: GraphData,
    options?: LayoutOptions,
  ): Promise<void | LayoutResult>;

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
   * <zh/> 停止布局计算
   *
   * <en/> Stop the layout calculation
   * @description
   * Some layout algorithm has n iterations so that the simulation needs to be stopped at any time.
   * This method is useful for running the simulation manually.
   */
  stop(): void;

  /**
   * <zh/> 手动推进布局计算若干步
   *
   * <en/> Manually steps the simulation by the specified number of iterations.
   */
  tick(iterations?: number): void;

  /**
   * <zh/> 重置布局计算
   *
   * <en/> Restart the layout calculation
   */
  restart(): void;

  /**
   * <zh/> 设置节点固定位置，在布局过程中该节点不会被移动
   *
   * <en/> Set the fixed position of a node. The node will not be moved during the layout process.
   */
  setFixedPosition(nodeId: string, position: Point | null): void;
}

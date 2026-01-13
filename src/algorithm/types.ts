import type {
  EdgeData,
  Expr,
  GraphData,
  GraphEdge,
  GraphNode,
  ID,
  NodeData,
  Point,
  Size,
} from '../types';

export interface DataOptions<
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
    isCombo?: boolean;
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
> extends DataOptions<N, E> {
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
   * <zh/> 节点大小（直径）。用于防止节点重叠时的碰撞检测
   *
   * <en/> Node size (diameter). Used for collision detection when nodes overlap
   * @defaultValue 10
   */
  nodeSize?: Size | Expr | ((node: NodeData) => Size);

  /**
   * <zh/> 节点之间的最小间距
   *
   * <en/> Minimum spacing between nodes
   * @defaultValue 0
   */
  nodeSpacing?: Size | Expr | ((node: NodeData) => Size);

  /**
   * <zh/> 是否启用 WebWorker
   *
   * <en/> Whether to run the layout in a WebWorker
   */
  enableWorker?: boolean;

  [key: string]: any;
}

export interface Layout<O extends BaseLayoutOptions = BaseLayoutOptions> {
  /**
   * <zh/> 执行布局计算
   *
   * <en/> Execute layout calculation
   */
  execute(graph: GraphData, options?: O): Promise<void>;

  /**
   * <zh/> 遍历节点布局结果
   *
   * <en/> Iterate over node layout results
   */
  forEachNode(callback: (node: GraphNode) => void): void;

  /**
   * <zh/> 遍历边布局结果
   *
   * <en/> Iterate over edge layout results
   */
  forEachEdge(callback: (edge: GraphEdge) => void): void;

  /**
   * <zh/> 布局计算的配置项
   *
   * <en/> Layout calculation configuration item
   */
  options: O;

  /**
   * <zh/> 布局id
   *
   * <en/> Layout id
   */
  id: string;
}

export interface LayoutWithIterations<
  O extends BaseLayoutOptions = BaseLayoutOptions,
> extends Layout<O> {
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

export interface SimulationOptions {
  /**
   * <zh/> 最大迭代次数，若为 0 则将自动调整
   *
   * <en/> Maximum number of iterations, if it is 0, it will be automatically adjusted
   * @defaultValue 0
   */
  maxIteration?: number;

  /**
   * <zh/> 当一次迭代的平均/最大/最小（根据distanceThresholdMode决定）移动长度小于该值时停止迭代。数字越小，布局越收敛，所用时间将越长
   *
   * <en/> When the average/max/min (depending on distanceThresholdMode) movement length of one iteration is less than this value, the iteration will stop. The smaller the number, the more converged the layout, and the longer the time it takes to use
   * @defaultValue 0.4
   */
  minMovement?: number;

  /**
   * <zh/> 是否启用动画模式：动画模式下布局过程会被分解为多次迭代并通过定时器执行，从而可以在布局过程中看到节点的移动过程；非动画模式下布局将在一次函数调用中完成所有迭代
   *
   * <en/> Whether to enable animation mode： in animation mode, the layout process will be decomposed into multiple iterations and executed through a timer, so that you can see the movement process of the nodes during the layout; in non-animation mode, the layout will complete all iterations in one function call
   * @defaultValue true
   */
  animate?: boolean;
}

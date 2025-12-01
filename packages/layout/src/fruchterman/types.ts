import type { BaseLayoutOptions } from '../base-layout';
import type { GraphData, NodeData } from '../types/data';

/**
 * <zh/> Fruchterman 力导布局配置项
 *
 * <en/> Fruchterman force layout configuration
 */
export interface FruchtermanLayoutOptions extends BaseLayoutOptions {
  /**
   * <zh/> 布局的维度，2D 渲染时指定为 2；若为 3D 渲染可指定为 3，则将多计算 z 轴的布局
   *
   * <en/> The dimensions of the layout, specify 2 for 2D rendering; if it is 3D rendering, specify 3 to calculate the layout of the z axis
   * @defaultValue 2
   */
  dimensions?: 2 | 3;
  /**
   * <zh/> 最大迭代次数，若为 0 则将自动调整
   *
   * <en/> Maximum number of iterations, if it is 0, it will be automatically adjusted
   * @defaultValue 0
   */
  maxIteration?: number;
  /**
   * <zh/> 中心力大小，指所有节点被吸引到 center 的力。数字越大，布局越紧凑
   *
   * <en/> The size of the center force, which means the force that all nodes are attracted to the center. The larger the number, the more compact the layout
   * @defaultValue 10
   */
  gravity?: number;
  /**
   * <zh/> 每次迭代节点移动的速度。速度太快可能会导致强烈震荡
   *
   * <en/> The speed at which the node moves in each iteration. A speed that is too fast may cause strong oscillations
   * @defaultValue 5
   */
  speed?: number;
  /**
   * <zh/> 是否按照聚类布局
   *
   * <en/> Whether to layout according to clustering
   * @defaultValue false
   */
  clustering?: boolean;
  /**
   * <zh/> 聚类内部的重力大小，影响聚类的紧凑程度，在 clustering 为 true 时生效
   *
   * <en/> The size of the gravity inside the cluster, which affects the compactness of the cluster, and it takes effect when clustering is true
   * @defaultValue 10
   */
  clusterGravity?: number;
  /**
   * <zh/> 聚类布局依据的字段名，cluster: true 时使用
   *
   * <en/> The field name of the node data in the data, which is used when cluster is true
   * @defaultValue 'cluster'
   */
  nodeClusterBy?: string | ((node: NodeData) => string);
  /**
   * <zh/> 每一次迭代的回调函数
   *
   * <en/> The callback function for each iteration
   * @param data - <zh/> 当前迭代的布局数据 | <en/> Current layout data
   */
  onTick?: (data: GraphData) => void;
  /**
   * <zh/> 是否使用动画自动运行迭代。为 false 时，需要手动调用 tick() 方法来驱动迭代
   *
   * <en/> Whether to use animation to automatically run iterations. When false, you need to manually call the tick() method to drive iterations
   * @defaultValue false
   */
  animate?: boolean;
}

/**
 * <zh/> 规范化后的 Fruchterman 布局配置项
 *
 * <en/> Normalized Fruchterman layout options
 */
export interface NormalizedFruchtermanLayoutOptions
  extends Required<Omit<FruchtermanLayoutOptions, 'nodeClusterBy'>> {
  nodeClusterBy: (node: NodeData) => string;
}

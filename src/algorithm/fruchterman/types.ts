import type { CommonForceLayoutOptions, Expr, NodeData } from '../../types';

/**
 * <zh/> Fruchterman 力导布局配置项
 *
 * <en/> Fruchterman force layout configuration
 */
export interface FruchtermanLayoutOptions extends CommonForceLayoutOptions {
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
  nodeClusterBy?: Expr | ((node: NodeData) => string);
}

export type ParsedFruchtermanLayoutOptions = Required<FruchtermanLayoutOptions>;

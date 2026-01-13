import type { CommonForceLayoutOptions, NodeData, Size } from '../../types';

/**
 * <zh/> ForceAtlas2 力导向布局配置
 *
 * <en/> ForceAtlas2 layout configuration
 */
export interface ForceAtlas2LayoutOptions extends CommonForceLayoutOptions {
  /**
   * <zh/> 斥力系数，可用于调整布局的紧凑程度。kr 越大，布局越松散
   *
   * <en/> The repulsive coefficient, which can be used to adjust the compactness of the layout. The larger kr is, the more relaxed the layout is
   * @defaultValue 5
   */
  kr?: number;
  /**
   * <zh/> 重力系数。kg 越大，布局越聚集在中心
   *
   * <en/> The gravitational coefficient. The larger kg is, the more clustered the layout is in the center
   * @defaultValue 1
   */
  kg?: number;
  /**
   * <zh/> 控制迭代过程中，节点移动的速度
   *
   * <en/> Control the speed of node movement during iteration
   * @defaultValue 0.1
   */
  ks?: number;
  /**
   * <zh/> 迭代过程中，最大的节点移动的速度上限
   *
   * <en/> The upper limit of the maximum node movement speed during iteration
   * @defaultValue 10
   */
  ksmax?: number;
  /**
   * <zh/> 迭代接近收敛时停止震荡的容忍度
   *
   * <en/> The tolerance for stopping oscillation when iteration is close to convergence
   * @defaultValue 0.1
   */
  tao?: number;
  /**
   * <zh/> 聚类模式、'linlog' 模式下，聚类将更加紧凑
   * - 'nornal'：普通模式
   * - 'linlog'：linlog模式
   * <en/> Clustering mode, the clustering will be more compact in the 'linlog' mode
   * - 'normal'：normal mode
   * - 'linlog'：linlog mode
   * @defaultValue 'normal'
   */
  mode?: 'normal' | 'linlog';
  /**
   * <zh/> 是否防止重叠
   *
   * <en/> Whether to prevent overlap
   * @remarks
   * <zh/> 必须配合下面属性 nodeSize 或节点数据中的 data.size 属性，只有在数据中设置了 data.size 或在该布局中配置了与当前图节点大小相同的 nodeSize 值，才能够进行节点重叠的碰撞检测
   *
   * <en/> Must be used with the following properties: nodeSize or data.size in the node data. Only when data.size or nodeSize with the same value as the current graph node size is set in the layout configuration, can the collision detection of node overlap be performed
   * @defaultValue false
   */
  preventOverlap?: boolean;
  /**
   * <zh/> 是否打开 hub 模式。若为 true，相比与出度大的节点，入度大的节点将会有更高的优先级被放置在中心位置
   *
   * <en/> Whether to open the hub mode. If true, nodes with high out-degree will have higher priority than nodes with high in-degree to be placed in the center
   * @defaultValue false
   */
  dissuadeHubs?: boolean;
  /**
   * <zh/> 是否打开 barnes hut 加速，即四叉树加速
   *
   * <en/> Whether to open the barnes hut acceleration, that is, the quad tree acceleration
   * @remarks
   * <zh/> 由于每次迭代需要更新构建四叉树，建议在较大规模图上打开。默认情况下为 undefined，当节点数量大于 250 时它将会被激活。设置为 false 则不会自动被激活
   *
   * <en/> It is recommended to open it on large-scale graphs. By default, it will be activated when the number of nodes is greater than 250. Setting it to false will not be activated automatically
   */
  barnesHut?: boolean;
  /**
   * <zh/> 是否开启自动剪枝模式
   *
   * <en/> Whether to enable the automatic pruning mode
   * @remarks
   * <zh/> 默认情况下为 undefined，当节点数量大于 100 时它将会被激活。注意，剪枝能够提高收敛速度，但可能会降低图的布局质量。设置为 false 则不会自动被激活
   *
   * <en/> By default, it will be activated when the number of nodes is greater than 100. Note that pruning can improve the convergence speed, but it may reduce the layout quality of the graph. Setting it to false will not be activated automatically
   */
  prune?: boolean;
}

export type ParsedForceAtlas2LayoutOptions = Required<ForceAtlas2LayoutOptions>;

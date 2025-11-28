import { LayoutMapping, Node, PointTuple } from '../types';

/**
 * <zh/> 公共力导向布局配置项
 *
 * <en/> Common force layout configuration items
 */
interface CommonForceLayoutOptions {
  /**
   * <zh/> 布局的维度，2D 渲染时指定为 2；若为 3D 渲染可指定为 3，则将多计算 z 轴的布局
   *
   * <en/> The dimensions of the layout, specify 2 for 2D rendering; if it is 3D rendering, specify 3 to calculate the layout of the z axis
   * @defaultValue 2
   */
  dimensions?: number;
  /**
   * <zh/> 布局的中心点，默认为图的中心
   *
   * <en/> The center point of the layout, default to the center of the graph
   */
  center?: PointTuple;
  /**
   * <zh/> 当一次迭代的平均/最大/最小（根据distanceThresholdMode决定）移动长度小于该值时停止迭代。数字越小，布局越收敛，所用时间将越长
   *
   * <en/> When the average/max/min (depending on distanceThresholdMode) movement length of one iteration is less than this value, the iteration will stop. The smaller the number, the more converged the layout, and the longer the time it takes to use
   * @defaultValue 0.4
   */
  minMovement?: number;
  /**
   * <zh/> 最大迭代次数，若为 0 则将自动调整
   *
   * <en/> Maximum number of iterations, if it is 0, it will be automatically adjusted
   * @defaultValue 0
   */
  maxIteration?: number;
  /**
   * <zh/> minMovement 的使用条件
   * - 'mean': 平均移动距离小于 minMovement 时停止迭代
   * - 'max': 最大移动距离小于时 minMovement 时停止迭代
   * - 'min': 最小移动距离小于时 minMovement 时停止迭代
   * <en/> The condition for using minMovement
   * - 'mean': The average movement distance is less than minMovement when stopped iterating
   * - 'max': The maximum movement distance is less than minMovement when stopped iterating
   * - 'min': The minimum movement distance is less than minMovement when stopped iterating
   * @defaultValue 'mean'
   */
  distanceThresholdMode?: 'mean' | 'max' | 'min';
  /**
   * <zh/> 最大距离
   *
   * <en/> Maximum distance
   */
  maxDistance?: number;
}

/**
 * <zh/> Fruchterman 力导布局配置项
 *
 * <en/> Fruchterman force layout configuration
 */
export interface FruchtermanLayoutOptions extends CommonForceLayoutOptions {
  /**
   * <zh/> 布局的宽度，默认使用容器宽度
   *
   * <en/> The width of the layout, defaults to the container width
   */
  width?: number;
  /**
   * <zh/> 布局的高度，默认使用容器高度
   *
   * <en/> The height of the layout, defaults to the container height
   */
  height?: number;
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
   * <zh/> 聚类布局依据的节点数据 data 中的字段名，cluster: true 时使用
   *
   * <en/> The field name of the node data data in the data, which is used when cluster is true
   * @defaultValue 'cluster'
   */
  nodeClusterBy?: string | ((node: Node) => string);
  /**
   * <zh/> 每一次迭代的回调函数
   *
   * <en/> The callback function for each iteration
   * @param data - <zh/> 当前迭代的布局数据 | <en/> Current layout data
   */
  onTick?: (data: LayoutMapping) => void;
}

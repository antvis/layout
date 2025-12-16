import type { Layout } from '../base-layout/types';
import type { ID } from './id';
import type { Point, PointObject } from './point';

export type DisplacementMap = Map<ID, PointObject>;

export type DistanceThresholdMode = 'mean' | 'max' | 'min';

export interface CommonForceLayoutOptions {
  /**
   * <zh/> 布局的维度，2D 渲染时指定为 2；若为 3D 渲染可指定为 3，则将多计算 z 轴的布局
   *
   * <en/> The dimensions of the layout, specify 2 for 2D rendering; if it is 3D rendering, specify 3 to calculate the layout of the z axis
   * @defaultValue 2
   */
  dimensions?: 2 | 3;
  /**
   * <zh/> 布局的中心点，默认为图的中心
   *
   * <en/> The center point of the layout, default to the center of the graph
   */
  center?: Point;
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
  /**
   * <zh/> 每次迭代后的回调函数
   *
   * <en/> Callback function after each iteration
   */
  onTick?: (layout: Layout) => void;
}

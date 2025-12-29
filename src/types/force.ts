import type { SimulationOptions } from '../algorithm/base-simulation';
import type { BaseLayoutOptions, Layout } from '../algorithm/types';
import type { ID } from './id';
import type { PointObject } from './point';

export type DisplacementMap = Map<ID, PointObject>;

export type DistanceThresholdMode = 'mean' | 'max' | 'min';

/**
 * <zh/> 公共力导向布局配置项
 *
 * <en/> Common force layout configuration items
 */
export interface CommonForceLayoutOptions
  extends BaseLayoutOptions,
    SimulationOptions {
  /**
   * <zh/> 布局的维度，2D 渲染时指定为 2；若为 3D 渲染可指定为 3，则将多计算 z 轴的布局
   *
   * <en/> The dimensions of the layout, specify 2 for 2D rendering; if it is 3D rendering, specify 3 to calculate the layout of the z axis
   * @defaultValue 2
   */
  dimensions?: 2 | 3;
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
  onTick?: (layout: Layout<any>) => void;
}

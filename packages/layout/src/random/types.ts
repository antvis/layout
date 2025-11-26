import type { PointTuple } from '../types';

/**
 * <zh/> 随机布局配置
 *
 * <en/> Random layout configuration
 */
export interface RandomLayoutOptions {
  /**
   * <zh/> 布局的中心
   *
   * <en/> Layout center
   * @defaultValue [0, 0]
   */
  center?: PointTuple;
  /**
   * <zh/> 布局的宽度范围
   *
   * <en/> Layout width range
   * @defaultValue 300
   */
  width?: number;
  /**
   * <zh/> 布局的高度范围
   *
   * <en/> Layout height range
   * @defaultValue 300
   */
  height?: number;
}

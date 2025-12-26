import type { BaseLayoutOptions } from '../types';
import type { Point } from '../../types';

/**
 * <zh/> MDS 高维数据降维布局配置
 *
 * <en/> MDS layout configuration for high-dimensional data dimensionality reduction
 */
export interface MDSLayoutOptions extends BaseLayoutOptions {
  /**
   * <zh/> 圆形布局的中心位置
   *
   * <en/> Center position of circular layout
   */
  center?: Point;
  /**
   * <zh/> 边的理想长度，可以理解为边作为弹簧在不受力下的长度
   *
   * <en/> Ideal length of the edge, which can be understood as the length of the edge as a spring under no force
   * @defaultValue 200
   */
  linkDistance?: number;
}

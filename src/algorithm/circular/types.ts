import type { BaseLayoutOptions } from '../types';

/**
 * <zh/> 环形 Circular 布局配置
 *
 * <en/> Circular layout configuration
 */
export interface CircularLayoutOptions extends BaseLayoutOptions {
  /**
   * <zh/> 圆的半径
   *
   * <en/> Circle radius
   * @remarks
   * <zh/> 若设置了 radius，则 startRadius 与 endRadius 不生效
   *
   * <en/> If radius is set, startRadius and endRadius will not take effect
   * @defaultValue null
   */
  radius?: number | null;
  /**
   * <zh/> 螺旋状布局的起始半径
   *
   * <en/> Spiral layout start radius
   * @defaultValue null
   */
  startRadius?: number | null;
  /**
   * <zh/> 螺旋状布局的结束半径
   *
   * <en/> Spiral layout end radius
   * @defaultValue null
   */
  endRadius?: number | null;
  /**
   * <zh/> 是否顺时针排列
   *
   * <en/> Whether to arrange clockwise
   * @defaultValue true
   */
  clockwise?: boolean;
  /**
   * <zh/> 节点在环上的分段数（几个段将均匀分布）
   *
   * <en/> Number of segments (how many segments will be evenly distributed)
   * @remarks
   * <zh/> 在 endRadius - startRadius != 0 时生效
   *
   * <en/> It takes effect when endRadius - startRadius != 0
   * @defaultValue 1
   */
  divisions?: number;
  /**
   * <zh/> 节点在环上排序的依据
   * - null: 直接使用数据中的顺序
   * - 'topology': 按照拓扑排序
   * - 'topology-directed': 按照拓扑排序（有向图）
   * - 'degree': 按度数降序排序
   * <en/> Sorting basis of nodes on the ring
   * - null: Use the order in the data directly
   * - 'topology': Sort according to topological order
   * - 'topology-directed': Sort according to topological order (directed graph)
   * - 'degree': Sort descending by degree
   * @defaultValue null
   */
  ordering?: 'topology' | 'topology-directed' | 'degree' | null;
  /**
   * <zh/> 从第一个节点到最后节点之间相隔多少个 2*PI
   *
   * <en/> The distance between the first node and the last node is separated by how many 2*PI
   * @defaultValue 1
   */
  angleRatio?: number;
  /**
   * <zh/> 起始角度
   *
   * <en/> Start angle
   * @defaultValue 0
   */
  startAngle?: number;
  /**
   * <zh/> 结束角度
   *
   * <en/> End angle
   * @defaultValue 2 * Math.PI
   */
  endAngle?: number;
}

export interface ParsedCircularLayoutOptions
  extends Required<CircularLayoutOptions> {}

import type { Expr, ID, NodeData } from '../../types';
import type { BaseLayoutOptions } from '../types';

export type ComboCombinedLayoutConfig = { type: string; [key: string]: any };

export interface ComboCombinedLayoutOptions extends BaseLayoutOptions {
  /**
   * 布局配置：支持固定配置或回调选择器（可基于层级信息选择不同布局）
   */
  layout?:
    | ComboCombinedLayoutConfig
    | ((comboId: ID | null) => ComboCombinedLayoutConfig)
    | Expr;

  /**
   * Combo 之间的间距
   */
  comboSpacing?: number | ((combo: NodeData) => number) | Expr;

  /**
   * Combo 内部的边距
   */
  comboPadding?: number | ((combo: NodeData) => number) | Expr;
}

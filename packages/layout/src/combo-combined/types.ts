import type { BaseLayoutOptions } from '../core/types';
import type { ID, NodeData, Size } from '../types';

export type ComboCombinedLayoutConfig =
  | string
  | { type: string; [key: string]: any };

export interface ComboCombinedLayoutOptions extends BaseLayoutOptions {
  /**
   * 布局配置：支持固定配置或回调选择器（可基于层级信息选择不同布局）
   */
  layout?:
    | ComboCombinedLayoutConfig
    | ((comboId: ID | null) => ComboCombinedLayoutConfig);

  /**
   * <zh/> 节点尺寸
   *
   * <en/> Node size
   */
  nodeSize?: Size | ((node?: NodeData) => Size);

  /**
   * <zh/> 节点间距
   *
   * <en/> Node spacing
   */
  nodeSpacing?: number | ((node?: NodeData) => number);

  /**
   * Combo 之间的间距
   */
  comboSpacing?: number | ((combo?: NodeData) => number);

  /**
   * Combo 内部的边距
   */
  comboPadding?: number | ((combo?: NodeData) => number);
}

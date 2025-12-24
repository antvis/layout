import { BaseLayoutOptions } from '../core/types';
import type { PlainObject, Size } from '../types';

export type ComboCombinedLayoutConfig =
  | string
  | { type: string; [key: string]: any };

export interface ComboCombinedLevelElementInfo {
  id: string;
  type: 'node' | 'combo';
}

export interface ComboCombinedLevelGroupInfo {
  id: string;
  elements: ComboCombinedLevelElementInfo[];
}

export interface ComboCombinedLevelInfo {
  depth: number;
  groups: ComboCombinedLevelGroupInfo[];
}

export interface ComboCombinedLayoutContext {
  maxDepth: number;
  depth: number;
  combo: string;
  level?: ComboCombinedLevelInfo;
}

export interface ComboData extends PlainObject {
  id: string;
  parentId?: string;
  size?: Size;
  padding?: number | number[];
}

export interface ComboNodeData extends PlainObject {
  x?: number;
  y?: number;
  fx?: number;
  fy?: number;
  size?: Size;
  mass?: number;
  parentId?: string;
}

export interface ComboCombinedLayoutOptions extends BaseLayoutOptions {
  /**
   * 布局配置：支持固定配置或回调选择器（可基于层级信息选择不同布局）
   */
  layout?:
    | ComboCombinedLayoutConfig
    | ((ctx: ComboCombinedLayoutContext) => ComboCombinedLayoutConfig);

  /**
   * <zh/> 节点尺寸
   *
   * <en/> Node size
   */
  nodeSize?: Size | ((node: any) => Size);

  /**
   * <zh/> 节点间距
   *
   * <en/> Node spacing
   */
  nodeSpacing?: number | ((node: any) => number);

  /**
   * Combo 之间的间距
   */
  comboSpacing?: number;

  /**
   * Combo 内部的边距
   */
  comboPadding?: number;

  /**
   * 是否计算 Combo 边界
   */
  computeComboBounds?: boolean;
}

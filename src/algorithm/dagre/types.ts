import type { GraphLabel } from 'dagre';
import type { EdgeData, Expr, Size } from '../../types';
import type { EdgeLabelPos } from '../../types/edge-label';
import type { BaseLayoutOptions } from '../types';

/**
 * <zh/> 边标签位置：'l' 左侧，'c' 中心，'r' 右侧
 *
 * <en/> Edge label position: 'l' for left, 'c' for center, 'r' for right
 */
/**
 * <zh/> Dagre 层次布局配置项，用于有向图的分层排列
 *
 * <en/> Dagre hierarchical layout options for layered arrangement of directed graphs
 */
export interface DagreLayoutOptions extends BaseLayoutOptions, GraphLabel {
  /**
   * <zh/> 控制边的方向性，true 表示边有方向（箭头），影响布局的层次关系
   *
   * <en/> Controls edge directionality; true means edges have direction (arrows), affecting hierarchical relationships in layout
   * @defaultValue true
   */
  directed?: boolean;

  /**
   * <zh/> 支持嵌套结构，允许节点包含子图，用于复杂的层级关系
   *
   * <en/> Supports nested structures where nodes can contain subgraphs for complex hierarchical relationships
   * @defaultValue true
   */
  compound?: boolean;

  /**
   * <zh/> 允许两节点间存在多条边，用于表示多重关系
   *
   * <en/> Allows multiple edges between two nodes to represent multiple relationships
   * @defaultValue true
   */
  multigraph?: boolean;

  /**
   * <zh/> 设置边跨越的最小层数，值越大节点间距越远，用于控制布局紧凑度
   *
   * <en/> Sets minimum number of layers an edge spans; larger values create more distance between nodes, controlling layout compactness
   * @defaultValue 1
   */
  edgeMinLen?: number | Expr | ((edge: EdgeData) => number);

  /**
   * <zh/> 边的权重，影响边的长度优化优先级，权重大的边倾向于更短
   *
   * <en/> Edge weight affecting length optimization priority; higher weight edges tend to be shorter
   */
  edgeWeight?: number | Expr | ((edge: EdgeData) => number);

  /**
   * <zh/> 边标签的尺寸，用于为标签预留空间，避免与节点重叠
   *
   * <en/> Size of edge labels for reserving space to prevent overlap with nodes
   */
  edgeLabelSize?: Size | Expr | ((edge: EdgeData) => Size);

  /**
   * <zh/> 标签在边上的位置，控制标签相对于边的对齐方式
   *
   * <en/> Label position on edge, controlling label alignment relative to the edge
   */
  edgeLabelPos?: EdgeLabelPos | Expr | ((edge: EdgeData) => EdgeLabelPos);

  /**
   * <zh/> 标签与边的偏移距离，用于微调标签位置避免视觉重叠
   *
   * <en/> Offset distance between label and edge for fine-tuning label position to avoid visual overlap
   */
  edgeLabelOffset?: number | Expr | ((edge: EdgeData) => number);
}

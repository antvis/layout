import type { Expr, NodeData } from '../../types';
import type { BaseLayoutOptions } from '../base-layout';

/**
 * <zh/> Radial 辐射布局的配置项
 *
 * <en/> Configuration items for Radial layout
 */
export interface RadialLayoutOptions extends BaseLayoutOptions {
  /**
   * <zh/> 边长度
   *
   * <en/> Edge length
   * @defaultValue 50
   */
  linkDistance?: number;
  /**
   * <zh/> 辐射的中心点
   * - string: 节点 id
   * - null: 数据中第一个节点
   * <en/> The center point of the radiation
   * - string: node id
   * - null: the first node in the data
   */
  focusNode?: string | null;
  /**
   * <zh/> 每一圈距离上一圈的距离。默认填充整个画布，即根据图的大小决定
   *
   * <en/> The distance between each ring. Defaults to filling the entire canvas, i.e., determined by the size of the graph
   * @defaultValue 100
   */
  unitRadius?: number | null;
  /**
   * <zh/> 是否防止重叠
   *
   * <en/> Whether to prevent overlap
   * @remarks
   * <zh/> 必须配合下面属性 nodeSize 或节点数据中的 data.size 属性，只有在数据中设置了 data.size 或在该布局中配置了与当前图节点大小相同的 nodeSize 值，才能够进行节点重叠的碰撞检测
   *
   * <en/> Must be used with the following properties: nodeSize or data.size in the node data. Only when data.size or nodeSize with the same value as the current graph node size is set in the layout configuration, can the collision detection of node overlap be performed
   * @defaultValue false
   */
  preventOverlap?: boolean;
  /**
   * <zh/> 防止重叠步骤的最大迭代次数
   *
   * <en/> Maximum iteration number of the prevent overlap step
   * @defaultValue 200
   */
  maxPreventOverlapIteration?: number;
  /**
   * <zh/> 是否必须是严格的 radial 布局，及每一层的节点严格布局在一个环上。preventOverlap 为 true 时生效。
   *
   * <en/> Whether it must be a strict radial layout, that is, each layer of nodes strictly layout on a ring. Effective when preventOverlap is true.
   * @remarks
   * <zh/> 当 preventOverlap 为 true，且 strictRadial 为 false 时，有重叠的节点严格沿着所在的环展开，但在一个环上若节点过多，可能无法完全避免节点重叠 当 preventOverlap 为 true，且 strictRadial 为 true 时，允许同环上重叠的节点不严格沿着该环布局，可以在该环的前后偏移以避免重叠
   *
   * <en/> When preventOverlap is true and strictRadial is false, overlapping nodes are strictly laid out along the ring they are in. However, if there are too many nodes on a ring, it may not be possible to completely avoid node overlap. When preventOverlap is true and strictRadial is true, overlapping nodes on the same ring are allowed to be laid out not strictly along the ring, and can be offset before and after the ring to avoid overlap
   * @defaultValue true
   */
  strictRadial?: boolean;
  /**
   * <zh/> 同层节点布局后相距远近的依据
   *
   * <en/> The basis for the distance between nodes in the same layer after layout
   * @remarks
   * <zh/> 默认 undefined ，表示根据数据的拓扑结构（节点间最短路径）排布，即关系越近/点对间最短路径越小的节点将会被尽可能排列在一起；'data' 表示按照节点在数据中的顺序排列，即在数据顺序上靠近的节点将会尽可能排列在一起；也可以指定为节点数据中的某个字段名，例如 'cluster'、'name' 等（必须在数据的 data 中存在）
   *
   * <en/> The default is undefined, which means arranging based on the topological structure of the data (the shortest path between nodes). Nodes that are closer in proximity or have a smaller shortest path between them will be arranged as close together as possible. 'data' indicates arranging based on the order of nodes in the data, so nodes that are closer in the data order will be arranged as close together as possible. You can also specify a field name in the node data, such as 'cluster' or 'name' (it must exist in the data of the graph)
   * @defaultValue undefined
   */
  sortBy?: 'data' | ((node: NodeData) => number | string) | Expr;
  /**
   * <zh/> 同层节点根据 sortBy 排列的强度，数值越大，sortBy 指定的方式计算出距离越小的越靠近。sortBy 不为 undefined 时生效
   *
   * <en/> The strength of arranging nodes according to sortBy. The larger the value, the closer the nodes that sortBy specifies are arranged. It takes effect when sortBy is not undefined
   * @defaultValue 10
   */
  sortStrength?: number;
  /**
   * <zh/> 停止迭代到最大迭代数
   *
   * <en/> Stop iterating until the maximum iteration number is reached
   * @defaultValue 1000
   */
  maxIteration?: number;
}

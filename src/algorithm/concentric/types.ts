import type { Expr, NodeData } from '../../types';
import type { BaseLayoutOptions } from '../types';

/**
 * <zh/> Concentric 同心圆布局配置
 *
 * <en/> Concentric layout configuration
 */
export interface ConcentricLayoutOptions extends BaseLayoutOptions {
  /**
   * <zh/> 是否防止重叠
   *
   * <en/> Whether to prevent overlap
   * @remarks
   * <zh/> 必须配合下面属性 nodeSize 或节点数据中的 data.size 属性，只有在数据中设置了 data.size 或在该布局中配置了与当前图节点大小相同的 nodeSize 值，才能够进行节点重叠的碰撞检测
   *
   * <en/> Must be used with the following properties, and only when the data.size property is set in the data or the nodeSize value configured with the same size as the current graph node is configured in the layout, can the node overlap collision detection be performed
   * @defaultValue false
   */
  preventOverlap?: boolean;
  /**
   * <zh/> 第一个节点与最后一个节点之间的弧度差
   *
   * <en/> The difference in radians between the first and last nodes
   * @remarks
   * <zh/> 若为 undefined ，则将会被设置为 2 * Math.PI * (1 - 1 / |level.nodes|) ，其中 level.nodes 为该算法计算出的每一层的节点，|level.nodes| 代表该层节点数量
   *
   * <en/> If undefined, it will be set to 2 * Math.PI * (1 - 1 / |level.nodes|), where level.nodes is the number of nodes in each layer calculated by this algorithm, and |level.nodes| represents the number of nodes in this layer
   * @defaultValue undefined
   */
  sweep?: number;
  /**
   * <zh/> 环与环之间的距离是否相等
   *
   * <en/> Whether the distance between rings is equal
   * @defaultValue false
   */
  equidistant?: boolean;
  /**
   * <zh/> 开始布局节点的弧度
   *
   * <en/> The starting angle of the layout node
   * @defaultValue 3 / 2 * Math.PI
   */
  startAngle?: number;
  /**
   * <zh/> 是否按照顺时针排列
   *
   * <en/> Whether to arrange in clockwise order
   * @defaultValue true
   */
  clockwise?: boolean;
  /**
   * <zh/> 每一层同心值的求和
   *
   * <en/> The sum of the concentric values of each layer
   * @remarks
   * <zh/> 若为 undefined，则将会被设置为 maxValue / 4 ，其中 maxValue 为最大的排序依据的属性值。例如，若 sortBy 为 'degree'，则 maxValue 为所有节点中度数最大的节点的度数
   *
   * <en/> If undefined, it will be set to maxValue / 4, where maxValue is the largest value of the sortBy attribute. For example, if sortBy is 'degree', maxValue is the degree of the node with the largest degree in all nodes
   * @defaultValue undefined
   */
  maxLevelDiff?: number;
  /**
   * <zh/> 指定排序的依据（节点属性名）
   * - 'degree': 按度数大小排序，数值越高则该节点被放置得越中心
   * - ((node) => ...): 自定义排序函数, 返回数值，数值越高则该节点被放置得越中心
   *
   * <en/> Specify the basis for sorting (node attribute name)
   * - 'degree': Sort by degree size, the higher the value, the more the node will be placed in the center
   * - ((node) => ...): Custom sorting function, returns a number, the higher the value, the more the node will be placed in the center
   * @defaultValue degree
   */
  sortBy?: 'degree' | Expr | ((node: NodeData) => number);
}

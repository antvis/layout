import type { BaseLayoutOptions } from '../base-layout';
import { NodeData } from '../types/data';
import { Point } from '../types/point';
import type { Size } from '../types/size';

export interface GridLayoutOptions extends BaseLayoutOptions {
  /**
   * <zh/> 网格开始位置（左上角）
   *
   * <en/> Grid layout starting position (upper left corner)
   * @defaultValue [0, 0]
   *
   */
  begin?: Point;
  /**
   * <zh/> 是否防止重叠
   *
   * <en/> Whether to prevent overlap
   * @remarks
   * <zh/> 必须配合下面属性 nodeSize 或节点数据中的 data.size 属性，只有在数据中设置了 data.size 或在该布局中配置了与当前图节点大小相同的 nodeSize 值，才能够进行节点重叠的碰撞检测
   *
   * <en/> Must be used with the following properties: nodeSize or data.size in the data. When data.size is set or nodeSize is configured with the same value as the current graph node size in the layout, the collision detection of node overlap can be performed
   * @defaultValue false
   */
  preventOverlap?: boolean;
  /**
   * <zh/> 节点大小（直径）。用于防止节点重叠时的碰撞检测
   *
   * <en/> Node size (diameter). Used for collision detection when nodes overlap
   */
  nodeSize?: Size | ((node?: NodeData) => Size);
  /**
   * <zh/> 环与环之间最小间距，用于调整半径
   *
   * <en/> Minimum spacing between rings, used to adjust the radius
   */
  nodeSpacing?: number | ((node?: NodeData) => number);
  /**
   * <zh/> 避免重叠时节点的间距 padding。preventOverlap 为 true 时生效
   *
   * <en/> Padding between nodes to prevent overlap. It takes effect when preventOverlap is true
   * @defaultValue 10
   */
  preventOverlapPadding?: number;
  /**
   * <zh/> 为 false 时表示利用所有可用画布空间，为 true 时表示利用最小的画布空间
   *
   * <en/> When false, it means to use all available canvas space. When true, it means to use the smallest canvas space
   * @defaultValue false
   */
  condense?: boolean;
  /**
   * <zh/> 网格的行数，为 undefined 时算法根据节点数量、布局空间、cols（若指定）自动计算
   *
   * <en/> Number of rows in the grid. It is calculated automatically when it is undefined and the number of nodes, layout space, and cols (if specified) are specified
   * @defaultValue 10
   */
  rows?: number;
  /**
   * <zh/> 网格的列数，为 undefined 时算法根据节点数量、布局空间、rows（若指定）自动计算
   *
   * <en/> Number of columns in the grid. It is calculated automatically when it is undefined and the number of nodes, layout space, and rows (if specified) are specified
   * @defaultValue undefined
   */
  cols?: number;
  /**
   * <zh/> 指定排序的依据（节点属性名），数值越高则该节点被放置得越中心。若为 undefined，则会计算节点的度数，度数越高，节点将被放置得越中心
   *
   * <en/> Specify the basis for sorting (node attribute name). The higher the value, the more the node will be placed in the center. If it is undefined, the degree of the node will be calculated, and the higher the degree, the more the node will be placed in the center
   * @defaultValue undefined
   */
  sortBy?: 'id' | 'degree' | ((nodeA: NodeData, nodeB: NodeData) => -1 | 0 | 1);
  /**
   * <zh/> 指定每个节点所在的行和列
   *
   * <en/> Specify the row and column where each node is located
   * @defaultValue undefined
   */
  position?: (node: NodeData) => { row?: number; col?: number };
}

export interface NormalizedGridLayoutOptions
  extends Omit<
    GridLayoutOptions,
    | 'begin'
    | 'nodeSize'
    | 'nodeSpacing'
    | 'preventOverlap'
    | 'preventOverlapPadding'
    | 'sortBy'
    | 'rows'
    | 'cols'
  > {
  width: number;
  height: number;
  center: Point;
  begin: Point;
  rcs: { rows: number; cols: number };
  nodeSize: (node?: NodeData) => Size;
  nodeSpacing: (node?: NodeData) => number;
  preventOverlap: boolean;
  preventOverlapPadding: number;
  sortBy: 'id' | 'degree' | ((nodeA: NodeData, nodeB: NodeData) => -1 | 0 | 1);
}

export type RowsAndCols = {
  rows: number;
  cols: number;
};

export type RowAndCol = {
  row: number;
  col: number;
};

export type IdMapRowAndCol = {
  [id: string]: RowAndCol;
};

export type VisitMap = {
  [id: string]: boolean;
};

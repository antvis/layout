import type {
  CommonForceLayoutOptions,
  EdgeData,
  Expr,
  NodeData,
  Point,
} from '../../types';

export type AccMap = { [id: string]: { x: number; y: number; z: number } };

/**
 * <zh/> 向心力配置，包括叶子节点、离散点、其他节点的向心中心及向心力大小
 *
 * <en/> Centripetal configuration, including the center of the leaf node, the center of the scattered point, and the center of the other nodes
 */
export interface CentripetalOptions {
  /**
   * <zh/> 叶子节点（即度数为 1 的节点）受到的向心力大小
   * - number: 固定向心力大小
   * - ((node: NodeData, nodes: NodeData[], edges: EdgeData[]) => number): 可根据节点、边的情况返回不同的值
   * <en/> The centripetal force of the leaf node (i.e., the node with degree 1)
   * - number: fixed centripetal force size
   * - ((node: NodeData, nodes: NodeData[], edges: EdgeData[]) => number): return different values according to the node, edge, and situation
   * @defaultValue 2
   */
  leaf?:
    | number
    | Expr
    | ((node: NodeData, nodes: NodeData[], edges: EdgeData[]) => number);
  /**
   * <zh/> 离散节点（即度数为 0 的节点）受到的向心力大小
   * - number: 固定向心力大小
   * - ((node: NodeData, nodes: NodeData[], edges: EdgeData[]) => number): 可根据节点情况返回不同的值
   * <en/> The centripetal force of the scattered node (i.e., the node with degree 0)
   * - number: fixed centripetal force size
   * - ((node: NodeData) => number): return different values according to the node situation
   * @defaultValue 2
   */
  single?: number | Expr | ((node: NodeData) => number);
  /**
   * <zh/> 除离散节点、叶子节点以外的其他节点（即度数 > 1 的节点）受到的向心力大小
   * - number: 固定向心力大小
   * - ((node: NodeData) => number): 可根据节点的情况返回不同的值
   * <en/> The centripetal force of the other nodes (i.e., the node with degree > 1)
   * - number: fixed centripetal force size
   * - ((node: NodeData) => number): return different values according to the node situation
   * @defaultValue 1
   */
  others?: number | Expr | ((node: NodeData) => number);
  /**
   * <zh/> 向心力发出的位置，可根据节点、边的情况返回不同的值、默认为图的中心
   *
   * <en/> The position where the centripetal force is emitted, which can return different values according to the node, edge, and situation. The default is the center of the graph
   */
  center?:
    | Expr
    | ((
        node: NodeData,
        nodes: NodeData[],
        edges: EdgeData[],
        width: number,
        height: number,
      ) => {
        x: number;
        y: number;
        z?: number;
        centerStrength?: number;
      });
}

interface FormatCentripetalOptions extends CentripetalOptions {
  leaf: (node: NodeData, nodes: NodeData[], edges: EdgeData[]) => number;
  /** Force strength for single nodes. */
  single: (node: NodeData) => number;
  /** Force strength for other nodes. */
  others: (node: NodeData) => number;
  center: (
    node: NodeData,
    nodes: NodeData[],
    edges: EdgeData[],
    width: number,
    height: number,
  ) => {
    x: number;
    y: number;
    z?: number;
    centerStrength?: number;
  };
}

export interface ForceLayoutOptions extends CommonForceLayoutOptions {
  /**
   * <zh/> 边的长度
   * - number: 固定长度
   * - ((edge: EdgeData, source: NodeData, target: NodeData) => number): 根据边的信息返回长度
   * <en/> The length of the edge
   * - number: fixed length
   * - ((edge: EdgeData, source: NodeData, target: NodeData) => number): return length according to the edge information
   * @defaultValue 200
   */
  linkDistance?:
    | number
    | Expr
    | ((edge: EdgeData, source: NodeData, target: NodeData) => number);
  /**
   * <zh/> 节点作用力，正数代表节点之间的引力作用，负数代表节点之间的斥力作用
   *
   * <en/> The force of the node, positive numbers represent the attraction force between nodes, and negative numbers represent the repulsion force between nodes
   * @defaultValue 1000
   */
  nodeStrength?: number | Expr | ((node: NodeData) => number);
  /**
   * <zh/> 边的作用力（引力）大小
   *
   * <en/> The size of the force of the edge (attraction)
   * @defaultValue 50
   */
  edgeStrength?: number | Expr | ((edge: EdgeData) => number);
  /**
   * <zh/> 是否防止重叠，必须配合下面属性 nodeSize 或节点数据中的 data.size 属性，只有在数据中设置了 data.size 或在该布局中配置了与当前图节点大小相同的 nodeSize 值，才能够进行节点重叠的碰撞检测
   *
   * <en/> Whether to prevent overlap, must be used with the following properties nodeSize or data.size in the node data, and only when the data.size is set in the data or the nodeSize value is configured with the same value as the current graph node size in the layout configuration, can the node overlap collision detection be performed
   * @defaultValue true
   */
  preventOverlap?: boolean;
  /**
   * <zh/> 阻尼系数，取值范围 [0, 1]。数字越大，速度降低得越慢
   *
   * <en/> Damping coefficient, the range of the value is [0, 1]. The larger the number, the slower the speed will decrease
   * @defaultValue 0.9
   */
  damping?: number;
  /**
   * <zh/> 一次迭代的最大移动长度
   *
   * <en/> The maximum movement length of one iteration
   * @defaultValue 200
   */
  maxSpeed?: number;
  /**
   * <zh/> 库伦系数，斥力的一个系数，数字越大，节点之间的斥力越大
   *
   * <en/> Coulomb's coefficient, a coefficient of repulsion, the larger the number, the larger the repulsion between nodes
   * @defaultValue 0.005
   */
  coulombDisScale?: number;
  /**
   * <zh/> 中心力大小，指所有节点被吸引到 center 的力。数字越大，布局越紧凑
   *
   * <en/> The size of the center force, which attracts all nodes to the center. The larger the number, the more compact the layout
   * @defaultValue 10
   */
  gravity?: number;
  /**
   * <zh/> 斥力系数，数值越大，斥力越大
   *
   * <en/> The repulsion coefficient, the larger the number, the larger the repulsion
   * @defaultValue 1
   */
  factor?: number;
  /**
   * <zh/> 控制每个迭代节点的移动速度
   *
   * <en/> Control the movement speed of each iteration node
   * @defaultValue 0.02
   */
  interval?: number;
  /**
   * <zh/> 向心力配置，包括叶子节点、离散点、其他节点的向心中心及向心力大小
   *
   * <en/> Centripetal configuration, including the centripetal center of leaf nodes, discrete points, and the centripetal center of other nodes
   */
  centripetalOptions?: CentripetalOptions;
  /**
   * <zh/> 是否需要叶子结点聚类
   *
   * <en/> Whether to cluster leaf nodes
   * @remarks
   * <zh/> 若为 true，则 centripetalOptions.single 将为 100；centripetalOptions.leaf 将使用 getClusterNodeStrength 返回值；getClusterNodeStrength.center 将为叶子节点返回当前所有叶子节点的平均中心
   *
   * <en/> If it is true, centripetalOptions.single will be 100; centripetalOptions.leaf will use the return value of getClusterNodeStrength; getClusterNodeStrength.center will be the average center of all leaf nodes
   * @defaultValue false
   */
  leafCluster?: boolean;
  /**
   * <zh/> 是否需要全部节点聚类
   *
   * <en/> Whether to cluster all nodes
   * @remarks
   * <zh/> 若为 true，将使用 nodeClusterBy 配置的节点数据中的字段作为聚类依据。 centripetalOptions.single、centripetalOptions.leaf、centripetalOptions.others 将使用 getClusterNodeStrength 返回值；leaf、centripetalOptions.center 将使用当前节点所属聚类中所有节点的平均中心
   *
   * <en/> If it is true, the node data configured by nodeClusterBy will be used as the clustering basis. centripetalOptions.single, centripetalOptions.leaf, centripetalOptions.others will use the return value of getClusterNodeStrength; leaf、centripetalOptions.center will use the average center of all nodes in the current cluster
   * @defaultValue false
   */
  clustering?: boolean;
  /**
   * <zh/> 指定节点数据中的字段名称作为节点聚类的依据，clustering 为 true 时生效，自动生成 centripetalOptions，可配合 clusterNodeStrength 使用
   *
   * <en/> Specify the field name of the node data as the clustering basis for the node, and it takes effect when clustering is true. You can combine it with clusterNodeStrength to use it
   */
  nodeClusterBy?: Expr | ((node: NodeData) => string);
  /**
   * <zh/> 配合 clustering 和 nodeClusterBy 使用，指定聚类向心力的大小
   *
   * <en/> Use it with clustering and nodeClusterBy to specify the size of the centripetal force of the cluster
   * @defaultValue 20
   */
  clusterNodeStrength?: number | Expr | ((node: NodeData) => number);
  /**
   * <zh/> 防止重叠的力强度，范围 [0, 1]
   *
   * <en/> The strength of the force that prevents overlap, range [0, 1]
   * @defaultValue 1
   */
  collideStrength?: number;
  /**
   * <zh/> 每个节点质量的回调函数，如参为节点内部流转数据，返回值为质量大小
   *
   * <en/> The callback function for the mass of each node, if the parameter is the internal circulation data of the node, the return value is the size of the mass
   * @param node - <zh/> 节点数据 | <en/> NodeData data
   * @returns <zh/> 节点质量大小 | <en/> Mass size of the node
   */
  getMass?: Expr | ((node: NodeData) => number);
  /**
   * <zh/> 每个节点中心力的 x、y、强度的回调函数，若不指定，则没有额外中心力
   *
   * <en/> The callback function for the center force of each node, if not specified, there will be no additional center force
   * @param node - <zh/> 节点数据 | <en/> NodeData data
   * @param degree - <zh/> 节点度数 | <en/> NodeData degree
   * @returns <zh/> 中心力 x、y、强度 | <en/> Center force x、y、strength
   */
  getCenter?: Expr | ((node: NodeData, degree: number) => number[]);
  /**
   * <zh/> 每个迭代的监控信息回调，energy 表示布局的收敛能量。若配置可能带来额外的计算能量性能消耗，不配置则不计算
   *
   * <en/> The callback function for monitoring information of each iteration, energy indicates the convergence energy of the layout. If not configured, it will not calculate
   * @param params - <zh/> 监控信息 | <en/> Monitoring information
   */
  monitor?: (params: {
    energy: number;
    nodes: NodeData[];
    edges: EdgeData[];
    iterations: number;
  }) => void;
}

export interface ParsedForceLayoutOptions
  extends Omit<
    ForceLayoutOptions,
    | 'centripetalOptions'
    | 'nodeClusterBy'
    | 'clusterNodeStrength'
    | 'getMass'
    | 'getCenter'
    | 'nodeStrength'
    | 'edgeStrength'
    | 'linkDistance'
  > {
  width: number;
  height: number;
  center: Point;
  minMovement: number;
  maxIteration: number;
  factor: number;
  interval: number;
  damping: number;
  maxSpeed: number;
  coulombDisScale: number;
  centripetalOptions?: FormatCentripetalOptions;
  nodeClusterBy?: NodeClusterByFn;
  getCenter?: GetCenterFn;
  nodeSize: NodeSizeFn;
  getMass: GetMassFn;
  nodeStrength: NodeStrengthFn;
  edgeStrength: EdgeStrengthFn;
  linkDistance: LinkDistanceFn;
  clusterNodeStrength: NodeStrengthFn;
}

export type NodeClusterByFn = (node: NodeData) => string;

export type GetCenterFn = (node: NodeData, degree: number) => number[];

export type NodeSizeFn = (node: NodeData) => number;

export type GetMassFn = (node: NodeData) => number;

export type NodeStrengthFn = (node: NodeData) => number;

export type EdgeStrengthFn = (edge: EdgeData) => number;

export type LinkDistanceFn = (
  edge: EdgeData,
  source: NodeData,
  target: NodeData,
) => number;

import type {
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from 'd3-force';
import type { Expr, LayoutEdge, LayoutNode } from '../../types';
import type { BaseLayoutOptions, Layout } from '../types';

export interface D3ForceCommonOptions
  extends Omit<BaseLayoutOptions, 'center'> {
  /**
   * <zh/> 每次迭代执行回调
   *
   * <en/> Callback executed on each tick
   * @param data - <zh/> 布局结果 | <en/> layout result
   */
  onTick?: (layout: Layout<D3ForceCommonOptions>) => void;
  /**
   * <zh/> 布局中心点的 X 坐标
   *
   * <en/> X coordinate of the layout center
   * @defaultValue width / 2
   */
  centerX?: number;
  /**
   * <zh/> 布局中心点的 Y 坐标
   *
   * <en/> Y coordinate of the layout center
   * @defaultValue height / 2
   */
  centerY?: number;
  /**
   * <zh/> 中心力的强度，值范围为 [0, 1]
   *
   * <en/> Strength of the centering force. Value range is [0, 1]
   * @defaultValue undefined
   */
  centerStrength?: number;
  /**
   * <zh/> 边的唯一标识字段或函数
   *
   * <en/> Unique identifier field or function for edges
   * @defaultValue (edge) => String(edge.id)
   */
  edgeId?: Expr | ((edge: EdgeDatum) => string);
  /**
   * <zh/> 边的理想长度，可以是数值或根据边数据返回长度的函数
   *
   * <en/> Ideal length of edges, can be a number or a function that returns length based on edge data
   * @defaultValue 50
   */
  linkDistance?: number | Expr | ((edge: EdgeDatum) => number);
  /**
   * <zh/> 边的强度，可以是数值或根据边数据返回强度的函数。值范围为 [0, 1]
   *
   * <en/> Strength of edges, can be a number or a function that returns strength based on edge data. Value range is [0, 1]
   * @defaultValue null
   */
  edgeStrength?: number | Expr | ((edge: EdgeDatum) => number) | null;
  /**
   * <zh/> 链接力的迭代次数
   *
   * <en/> Number of iterations for link force
   * @defaultValue 1
   */
  edgeIterations?: number;
  /**
   * <zh/> 节点之间的作用力强度，负数为斥力，正数为引力
   *
   * <en/> Strength of node force, negative for repulsion, positive for attraction
   * @defaultValue -30
   */
  nodeStrength?: number | Expr | ((node: NodeDatum) => number);
  /**
   * <zh/> 多体力的近似参数，值范围为 (0, 1]
   *
   * <en/> Approximation parameter for many-body force, value range is (0, 1]
   * @defaultValue undefined
   */
  theta?: number;
  /**
   * <zh/> 多体力的最大作用距离
   *
   * <en/> Maximum distance for many-body force
   * @defaultValue undefined
   */
  distanceMax?: number;
  /**
   * <zh/> 多体力的最小作用距离
   *
   * <en/> Minimum distance for many-body force
   * @defaultValue undefined
   */
  distanceMin?: number;
  /**
   * <zh/> 是否防止节点重叠
   *
   * <en/> Whether to prevent node overlap
   * @defaultValue false
   */
  preventOverlap?: boolean;
  /**
   * <zh/> 防止重叠的力强度，值范围为 [0, 1]
   *
   * <en/> Strength of collision force, value range is [0, 1]
   * @defaultValue 1
   */
  collideStrength?: number;
  /**
   * <zh/> 防止重叠的迭代次数
   *
   * <en/> Number of iterations for collision detection
   * @defaultValue 1
   */
  collideIterations?: number;
  /**
   * <zh/> 径向力的理想半径，可以是数值或根据节点数据返回半径的函数
   *
   * <en/> Ideal radius of radial force, can be a number or a function that returns radius based on node data
   * @defaultValue 100
   */
  radialRadius?: number;
  /**
   * <zh/> 径向力的强度，值范围为 [0, 1]
   *
   * <en/> Strength of radial force, value range is [0, 1]
   * @defaultValue undefined
   */
  radialStrength?: number;
  /**
   * <zh/> 径向力的中心点 X 坐标
   *
   * <en/> X coordinate of the center point of radial force
   * @defaultValue undefined
   */
  radialX?: number;
  /**
   * <zh/> 径向力的中心点 Y 坐标
   *
   *  <en/> Y coordinate of the center point of radial force
   * @defaultValue undefined
   */
  radialY?: number;
  /**
   * <zh/> 是否启用聚类布局
   *
   * <en/> Whether to enable clustering layout
   * @defaultValue false
   */
  clustering?: boolean;
  /**
   * <zh/> 用于聚类的字段或函数
   *
   * <en/> Field or function used for clustering
   * @defaultValue (d) => d.cluster
   */
  clusterBy?: Expr | ((node: NodeDatum) => string | number);
  /**
   * <zh/> 聚类内节点之间的作用力强度
   *
   * <en/> Strength of force between nodes within a cluster
   * @defaultValue -1
   */
  clusterNodeStrength?: number;
  /**
   * <zh/> 聚类之间边的强度
   *
   * <en/> Strength of edges between clusters
   * @defaultValue 0.1
   */
  clusterEdgeStrength?: number;
  /**
   * <zh/> 聚类之间边的距离
   *
   * <en/> Distance of edges between clusters
   * @defaultValue 100
   */
  clusterEdgeDistance?: number;
  /**
   * <zh/> 聚类节点的大小
   *
   * <en/> Size of cluster nodes
   * @defaultValue 10
   */
  clusterNodeSize?: number;
  /**
   * <zh/> 聚类焦点的引力强度，值范围为 [0, 1]
   *
   * <en/> Strength of cluster foci attraction, value range is [0, 1]
   * @defaultValue 0.8
   */
  clusterFociStrength?: number;
  /**
   * <zh/> 迭代次数
   *
   * <en/> Number of iterations
   * @description
   * <zh/> 设置的是力的迭代次数，而不是布局的迭代次数
   *
   * <en/> The number of iterations of the force, not the layout
   */
  iterations?: number;
  /**
   * <zh/> 自定义 force 方法，若不指定，则使用 d3.js 的方法
   *
   * <en/> Custom force method, if not specified, use d3.js method
   */
  forceSimulation?: Simulation<any, any>;
  /**
   * <zh/> 当前的迭代收敛阈值
   *
   * <en/> Convergence threshold of the current iteration
   */
  alpha?: number;
  /**
   * <zh/> 停止迭代的阈值
   *
   * <en/> Convergence threshold of the current iteration
   */
  alphaMin?: number;
  /**
   * <zh/> 迭代阈值的衰减率。范围 [0, 1]。0.028 对应迭代数为 300
   *
   * <en/> Convergence threshold of the current iteration
   */
  alphaDecay?: number;
  /**
   * <zh/> 设置目标迭代收敛阈值
   *
   * <en/> Set the target convergence threshold of the current iteration
   */
  alphaTarget?: number;
  /**
   * <zh/> 指定衰减因子
   *
   * <en/> Specify the decay factor
   */
  velocityDecay?: number;
  /**
   * <zh/> 设置用于生成随机数的函数
   *
   * <en/> Set the function for generating random numbers
   * @returns <zh/> 随机数 | <en/> Random number
   */
  randomSource?: Expr | (() => number);
  /**
   * <zh/> 碰撞力
   *
   * <en/> Collision force
   */
  collide?:
    | false
    | {
        radius?:
          | number
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
        strength?: number;
        iterations?: number;
      };
  /**
   * <zh/> 多体力
   *
   * <en/> Many body force
   */
  manyBody?:
    | false
    | {
        strength?:
          | number
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
        theta?: number;
        distanceMin?: number;
        distanceMax?: number;
      };
  /**
   * <zh/> 链接力
   *
   * <en/> Link force
   */
  link?:
    | false
    | {
        id?: (edge: EdgeDatum, index: number, edges: EdgeDatum[]) => string;
        distance?:
          | number
          | ((edge: EdgeDatum, index: number, edges: EdgeDatum[]) => number);
        strength?:
          | number
          | ((edge: EdgeDatum, index: number, edges: EdgeDatum[]) => number);
        iterations?: number;
      };
  /**
   * <zh/> X 轴力
   *
   * <en/> X axis force
   */
  x?:
    | false
    | {
        strength?:
          | number
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
        x?:
          | number
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
      };
  /**
   * <zh/> Y 轴力
   *
   * <en/> Y axis force
   */
  y?:
    | false
    | {
        strength?:
          | number
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
        y?:
          | number
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
      };
}

export interface D3ForceLayoutOptions extends D3ForceCommonOptions {
  numDimensions?: 2;
  /**
   * <zh/> 中心力
   *
   * <en/> Center force
   */
  center?:
    | false
    | {
        x?: number;
        y?: number;
        strength?: number;
      };
  /**
   * <zh/> 径向力
   *
   * <en/> Radial force
   */
  radial?:
    | false
    | {
        strength?:
          | number
          | Expr
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
        radius?:
          | number
          | Expr
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
        x?: number;
        y?: number;
      };
}

export interface NodeDatum
  extends Omit<LayoutNode, 'x' | 'y'>,
    SimulationNodeDatum {}

export interface EdgeDatum<N extends NodeDatum = NodeDatum>
  extends Omit<LayoutEdge, 'source' | 'target'>,
    SimulationLinkDatum<N> {}

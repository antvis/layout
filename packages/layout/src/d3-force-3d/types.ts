import type { ID } from '@antv/graphlib';
import type { EdgeData, LayoutMapping, NodeData } from '../types';

/**
 * @see https://github.com/vasturiano/d3-force-3d
 */
export interface D3Force3DLayoutOptions {
  /**
   * <zh/> 节点尺寸，默认为 10
   *
   * <en/> Node size, default is 10
   */
  nodeSize?: number | ((node: NodeData) => number);
  /**
   * <zh/> 每次迭代执行回调
   *
   * <en/> Callback executed on each tick
   * @param data - <zh/> 布局结果 | <en/> layout result
   */
  onTick?: (data: LayoutMapping) => void;
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

  alpha?: number;
  alphaMin?: number;
  alphaDecay?: number;
  alphaTarget?: number;
  velocityDecay?: number;
  randomSource?: () => number;
  numDimensions?: number;
  /**
   * <zh/> 中心力
   * <en/> Center force
   */
  center?: {
    x?: number;
    y?: number;
    z?: number;
    strength?: number;
  };
  /**
   * <zh/> 多体力
   *
   * <en/> Many body force
   */
  manyBody?: {
    strength?: number;
    distanceMin?: number;
    distanceMax?: number;
    theta?: number;
  };
  /**
   * <zh/> 碰撞力
   *
   * <en/> Collision force
   */
  collide?: {
    radius?: number | ((node: NodeData) => number);
    strength?: number;
    iterations?: number;
  };
  /**
   * <zh/> 链接力
   *
   * <en/> Link force
   */
  link?: {
    distance?: number | ((edge: EdgeData) => number);
    strength?: number | ((edge: EdgeData) => number);
    iterations?: number;
    id?: (edge: EdgeData) => string;
  };
  /**
   * <zh/> 辐射力
   *
   * <en/> Radial force
   */
  radial?: {
    strength?: number | ((node: NodeData) => number);
    radius?: number | ((node: NodeData) => number);
    x?: number;
    y?: number;
    z?: number;
  };
  /**
   * <zh/> X 轴力
   *
   * <en/> X axis force
   */
  x?: {
    strength?: number | ((node: NodeData) => number);
    x?: number | ((node: NodeData) => number);
  };
  /**
   * <zh/> Y 轴力
   *
   * <en/> Y axis force
   */
  y?: {
    strength?: number | ((node: NodeData) => number);
    y?: number | ((node: NodeData) => number);
  };
  /**
   * <zh/> Z 轴力
   *
   * <en/> Z axis force
   */
  z?: {
    strength?: number | ((node: NodeData) => number);
    z?: number | ((node: NodeData) => number);
  };
}

// TODO wait for d3-force-3d to be published
export interface SimulationNodeDatum {
  id: ID;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  [key: string]: any;
}

export interface SimulationEdgeDatum {
  id: ID;
  source: SimulationNodeDatum;
  target: SimulationNodeDatum;
  [key: string]: any;
}

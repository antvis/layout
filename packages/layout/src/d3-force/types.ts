import type {
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from 'd3-force';
import type { EdgeData, LayoutMapping, NodeData } from '../types';

export interface D3ForceLayoutOptions {
  /**
   * <zh/> 节点尺寸，默认为 10
   *
   * <en/> Node size, default is 10
   */
  nodeSize?: number | ((node: NodeDatum) => number);
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
  forceSimulation?: Simulation<NodeDatum, EdgeDatum>;

  alpha?: number;
  alphaMin?: number;
  alphaDecay?: number;
  alphaTarget?: number;
  velocityDecay?: number;
  randomSource?: () => number;
  /**
   * <zh/> 中心力
   * <en/> Center force
   */
  center?: {
    x?: number;
    y?: number;
    strength?: number;
  };
  /**
   * <zh/> 碰撞力
   *
   * <en/> Collision force
   */
  collide?: {
    radius?: number | ((node: NodeDatum) => number);
    strength?: number;
    iterations?: number;
  };
  /**
   * <zh/> 多体力
   *
   * <en/> Many body force
   */
  manyBody?: {
    strength?: number;
    theta?: number;
    distanceMin?: number;
    distanceMax?: number;
  };
  /**
   * <zh/> 链接力
   *
   * <en/> Link force
   */
  link?: {
    id?: (edge: EdgeDatum) => string;
    distance?: number | ((edge: EdgeDatum) => number);
    strength?: number | ((edge: EdgeDatum) => number);
    iterations?: number;
  };
  /**
   * <zh/> 径向力
   *
   * <en/> Radial force
   */
  radial?: {
    strength?: number | ((node: NodeDatum) => number);
    radius?: number | ((node: NodeDatum) => number);
    x?: number;
    y?: number;
  };
  /**
   * <zh/> X 轴力
   *
   * <en/> X axis force
   */
  x?: {
    strength?: number | ((node: NodeDatum) => number);
    x?: number | ((node: NodeDatum) => number);
  };
  /**
   * <zh/> Y 轴力
   *
   * <en/> Y axis force
   */
  y?: {
    strength?: number | ((node: NodeDatum) => number);
    y?: number | ((node: NodeDatum) => number);
  };
}

export interface NodeDatum extends NodeData, SimulationNodeDatum {}

export interface EdgeDatum extends EdgeData, SimulationLinkDatum<NodeDatum> {}

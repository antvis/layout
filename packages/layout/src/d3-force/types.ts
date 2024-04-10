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
  nodeSize?:
    | number
    | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
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
  center?:
    | false
    | {
        x?: number;
        y?: number;
        strength?: number;
      };
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
   * <zh/> 径向力
   *
   * <en/> Radial force
   */
  radial?:
    | false
    | {
        strength?:
          | number
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
        radius?:
          | number
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
        x?: number;
        y?: number;
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

export interface NodeDatum extends NodeData, SimulationNodeDatum {}

export interface EdgeDatum extends EdgeData, SimulationLinkDatum<NodeDatum> {}

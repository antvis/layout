import type {
  D3ForceLayoutOptions,
  EdgeDatum,
  NodeDatum as _NodeDatum,
} from '../d3-force/types';
import type { NodeData } from '../types';

/**
 * @see https://github.com/vasturiano/d3-force-3d
 */
export interface D3Force3DLayoutOptions extends D3ForceLayoutOptions {
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
   * <zh/> 径向力
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
   * <zh/> Z 轴力
   *
   * <en/> Z axis force
   */
  z?: {
    strength?: number | ((node: NodeData) => number);
    z?: number | ((node: NodeData) => number);
  };
}

export interface NodeDatum extends _NodeDatum {
  z: number;
  vz: number;
}

export type { EdgeDatum };

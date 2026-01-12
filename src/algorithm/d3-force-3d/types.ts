import type { Expr } from '../../types';
import type {
  D3ForceCommonOptions,
  EdgeDatum as _EdgeDatum,
  NodeDatum as _NodeDatum,
} from '../d3-force/types';

/**
 * @see https://github.com/vasturiano/d3-force-3d
 */
export interface D3Force3DLayoutOptions extends D3ForceCommonOptions {
  numDimensions?: 3;
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
        z?: number;
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
        z?: number;
      };
  /**
   * <zh/> Z 轴力
   *
   * <en/> Z axis force
   */
  z?:
    | false
    | {
        strength?:
          | number
          | Expr
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
        z?:
          | number
          | Expr
          | ((node: NodeDatum, index: number, nodes: NodeDatum[]) => number);
      };
}

export interface NodeDatum extends _NodeDatum {
  z: number;
  vz: number;
}

export interface EdgeDatum extends Omit<_EdgeDatum, 'source' | 'target'> {
  source: NodeDatum | string | number;
  target: NodeDatum | string | number;
}

import { isNil } from '@antv/util';
import type { GraphLib } from '../../model/data';
import type {
  DisplacementMap,
  ID,
  LayoutNode,
  NodeData,
  NullablePosition,
} from '../../types';
import { normalizeViewport } from '../../util';
import { BaseSimulation } from '../base-simulation';
import type {
  FruchtermanLayoutOptions,
  ParsedFruchtermanLayoutOptions,
} from './types';

interface ClusterInfo {
  name: string;
  cx: number;
  cy: number;
  cz: number;
  count: number;
}

type ClusterMap = Map<ID, ClusterInfo>;

const SPEED_DIVISOR = 800;

/**
 * Fruchterman Simulation
 */
export class Simulation extends BaseSimulation<ParsedFruchtermanLayoutOptions> {
  private k!: number;
  private k2!: number;
  private maxDisplace!: number;

  private displacements: DisplacementMap | null = null;
  private clusterMap: ClusterMap | null = null;

  protected model!: GraphLib;

  data(model: GraphLib): this {
    this.model = model;

    return this;
  }

  initialize(options: ParsedFruchtermanLayoutOptions): void {
    super.initialize(options);

    this.recomputeConstants();

    this.displacements = null;
    this.clusterMap = null;

    this.initDisplacements();
  }

  private recomputeConstants(): void {
    const { model, options } = this;
    const { width, height } = normalizeViewport(options);
    const area = width * height;

    this.k2 = area / (model.nodeCount() + 1);
    this.k = Math.sqrt(this.k2);
    this.maxDisplace = Math.sqrt(area) / 10;
  }

  protected runOneStep(): number {
    this.syncFixedPositions();
    this.initDisplacements();
    this.calculateRepulsive();
    this.calculateAttractive();
    this.applyClusterGravity();
    this.applyGlobalGravity();
    return this.updatePositions();
  }

  /**
   * Fixes the position of the node with the given id to the specified position.
   */
  public setFixedPosition(id: ID, position: NullablePosition | null) {
    const node = this.model.node(id);
    if (!node) return;

    const keys = ['fx', 'fy', 'fz'] as const;

    if (position === null) {
      // Unset fixed position
      keys.forEach((key) => {
        delete node[key];
      });
      return;
    }

    position.forEach((value, index) => {
      if (
        index < keys.length &&
        (typeof value === 'number' || value === null)
      ) {
        node[keys[index]] = value;
      }
    });
  }

  /**
   * Determines whether a node is fixed (has fx and fy defined).
   */
  private isNodeFixed(node: LayoutNode): boolean {
    return !isNil(node.fx) && !isNil(node.fy);
  }

  /**
   * Synchronizes fixed node positions (fx/fy -> x/y)
   */
  private syncFixedPositions(): void {
    const { model, options } = this;
    const is3D = options.dimensions === 3;

    model.forEachNode((node) => {
      if (this.isNodeFixed(node)) {
        node.x = node.fx!;
        node.y = node.fy!;
        if (is3D && node.fz !== undefined) {
          node.z = node.fz!;
        }
      }
    });
  }

  private initDisplacements(): void {
    if (!this.displacements) {
      this.displacements = new Map();
      this.model.forEachNode((node) => {
        this.displacements!.set(node.id, { x: 0, y: 0, z: 0 });
      });
    }

    this.displacements.forEach((displacement) => {
      displacement.x = 0;
      displacement.y = 0;
      displacement.z = 0;
    });
  }

  /**
   * Calculates repulsive forces
   */
  private calculateRepulsive(): void {
    const { model, options } = this;
    const is3D = options.dimensions === 3;

    const nodes = model.nodes();

    for (let i = 0; i < nodes.length; i++) {
      const nodeV = nodes[i];
      const dispV = this.displacements!.get(nodeV.id)!;
      const vFixed = this.isNodeFixed(nodeV);

      for (let j = i + 1; j < nodes.length; j++) {
        const nodeU = nodes[j];
        const dispU = this.displacements!.get(nodeU.id)!;
        const uFixed = this.isNodeFixed(nodeU);

        let vecX = nodeV.x - nodeU.x;
        let vecY = nodeV.y - nodeU.y;
        let vecZ = is3D ? nodeV.z! - nodeU.z! : 0;

        let lengthSqr = vecX * vecX + vecY * vecY + vecZ * vecZ;

        if (lengthSqr === 0) {
          lengthSqr = 1;
          vecX = 0.01;
          vecY = 0.01;
          vecZ = 0.01;
        }

        const common = this.k2 / lengthSqr;
        const dispX = vecX * common;
        const dispY = vecY * common;
        const dispZ = vecZ * common;

        if (!vFixed && !uFixed) {
          // 两个都不固定：正常分配
          dispV.x += dispX;
          dispV.y += dispY;
          dispU.x -= dispX;
          dispU.y -= dispY;
          if (is3D) {
            dispV.z! += dispZ;
            dispU.z! -= dispZ;
          }
        } else if (vFixed && !uFixed) {
          // V 固定，U 不固定：U 承受双倍位移
          dispU.x -= dispX * 2;
          dispU.y -= dispY * 2;
          if (is3D) {
            dispU.z! -= dispZ * 2;
          }
        } else if (!vFixed && uFixed) {
          // U 固定，V 不固定：V 承受双倍位移
          dispV.x += dispX * 2;
          dispV.y += dispY * 2;
          if (is3D) {
            dispV.z! += dispZ * 2;
          }
        }
        // 如果两个都固定，则都不移动（不添加位移）
      }
    }
  }

  private calculateAttractive(): void {
    const { model, options } = this;
    const is3D = options.dimensions === 3;

    model.forEachEdge((edge) => {
      const { source, target } = edge;

      if (!source || !target || source === target) {
        return;
      }

      const u = model.node(source)!;
      const v = model.node(target)!;

      const dispSource = this.displacements!.get(source)!;
      const dispTarget = this.displacements!.get(target)!;
      const fixedU = this.isNodeFixed(u);
      const fixedV = this.isNodeFixed(v);

      const vecX = v.x - u.x;
      const vecY = v.y - u.y;
      const vecZ = is3D ? v.z! - u.z! : 0;

      const length = Math.sqrt(vecX * vecX + vecY * vecY + vecZ * vecZ);

      if (length === 0) return;

      const common = length / this.k;
      const dispX = vecX * common;
      const dispY = vecY * common;
      const dispZ = vecZ * common;

      if (!fixedU && !fixedV) {
        // 两个都不固定：正常分配
        dispSource.x += dispX;
        dispSource.y += dispY;
        dispTarget.x -= dispX;
        dispTarget.y -= dispY;
        if (is3D) {
          dispSource.z! += dispZ;
          dispTarget.z! -= dispZ;
        }
      } else if (fixedU && !fixedV) {
        // V 固定，U 不固定：U 承受双倍位移
        dispTarget.x -= dispX * 2;
        dispTarget.y -= dispY * 2;
        if (is3D) {
          dispTarget.z! -= dispZ * 2;
        }
      } else if (!fixedU && fixedV) {
        // U 固定，V 不固定：V 承受双倍位移
        dispSource.x += dispX * 2;
        dispSource.y += dispY * 2;
        if (is3D) {
          dispSource.z! += dispZ * 2;
        }
      }
      // 如果两个都固定，则都不移动（不添加位移）
    });
  }

  private applyClusterGravity(): void {
    const { model, options } = this;
    const { nodeClusterBy, clusterGravity, dimensions, clustering } =
      options as FruchtermanLayoutOptions & {
        nodeClusterBy: (node: NodeData) => string;
      };

    if (!clustering) return;

    if (!this.clusterMap) {
      this.clusterMap = new Map();

      model.forEachNode((node) => {
        const clusterKey = nodeClusterBy(model.originalNode(node.id)!);
        if (!this.clusterMap!.has(clusterKey)) {
          this.clusterMap!.set(clusterKey, {
            name: clusterKey,
            cx: 0,
            cy: 0,
            cz: 0,
            count: 0,
          });
        }
      });
    }
    if (this.clusterMap.size === 0) return;

    const is3D = dimensions === 3;

    this.clusterMap.forEach((cluster) => {
      cluster.cx = 0;
      cluster.cy = 0;
      cluster.cz = 0;
      cluster.count = 0;
    });

    model.forEachNode((node) => {
      const clusterKey = nodeClusterBy(model.originalNode(node.id)!);
      const cluster = this.clusterMap!.get(clusterKey);

      if (!cluster) return;

      cluster.cx += node.x;
      cluster.cy += node.y;
      if (is3D) cluster.cz += node.z!;
      cluster.count++;
    });

    this.clusterMap.forEach((cluster) => {
      if (cluster.count > 0) {
        cluster.cx /= cluster.count;
        cluster.cy /= cluster.count;
        cluster.cz /= cluster.count;
      }
    });

    model.forEachNode((node) => {
      const { id } = node;
      // 固定节点不应用聚类重力
      if (this.isNodeFixed(node)) return;

      const clusterKey = nodeClusterBy(model.originalNode(id)!);
      const cluster = this.clusterMap!.get(clusterKey);
      if (!cluster) return;

      const disp = this.displacements!.get(id)!;

      const vecX = node.x - cluster.cx;
      const vecY = node.y - cluster.cy;
      const vecZ = is3D ? node.z! - cluster.cz : 0;

      const distLength = Math.sqrt(vecX * vecX + vecY * vecY + vecZ * vecZ);

      if (distLength === 0) return;

      const gravityForce = this.k * clusterGravity!;
      disp.x -= (gravityForce * vecX) / distLength;
      disp.y -= (gravityForce * vecY) / distLength;

      if (is3D) {
        disp.z! -= (gravityForce * vecZ) / distLength;
      }
    });
  }

  private applyGlobalGravity(): void {
    const { model, options } = this;
    const { gravity, center, dimensions } = options;

    const is3D = dimensions === 3;
    const gravityForce = 0.01 * this.k * gravity;

    model.forEachNode((node) => {
      const { id } = node;

      // 固定节点不应用全局重力
      if (this.isNodeFixed(node)) return;

      const disp = this.displacements!.get(id)!;

      disp.x -= gravityForce * (node.x - center[0]);
      disp.y -= gravityForce * (node.y - center[1]);

      if (is3D) {
        disp.z! -= gravityForce * (node.z! - (center[2] || 0));
      }
    });
  }

  /**
   * Updates node positions based on calculated displacements
   */
  private updatePositions(): number {
    const { model, options } = this;
    const { speed, dimensions, distanceThresholdMode = 'max' } = options;
    const is3D = dimensions === 3;

    let max = 0;
    let min = Infinity;
    let sum = 0;
    let count = 0;

    model.forEachNode((node) => {
      const { id } = node;

      if (this.isNodeFixed(node)) return;

      const disp = this.displacements!.get(id)!;

      const distLength = Math.sqrt(
        disp.x * disp.x + disp.y * disp.y + (is3D ? disp.z! * disp.z! : 0),
      );

      if (distLength === 0) return;

      const limitedDist = Math.min(
        this.maxDisplace * (speed / SPEED_DIVISOR),
        distLength,
      );

      const ratio = limitedDist / distLength;

      node.x += disp.x * ratio;
      node.y += disp.y * ratio;
      if (is3D) {
        node.z = node.z! + disp.z! * ratio;
      }

      // ---- distance statistics ----
      max = Math.max(max, limitedDist);
      min = Math.min(min, limitedDist);
      sum += limitedDist;
      count++;
    });

    if (count === 0) return 0;
    switch (distanceThresholdMode) {
      case 'min':
        return min === Infinity ? 0 : min;
      case 'mean':
        return sum / count;
      case 'max':
      default:
        return max;
    }
  }

  public destroy(): void {
    this.stop();

    this.displacements?.clear();
    this.clusterMap?.clear();
  }
}

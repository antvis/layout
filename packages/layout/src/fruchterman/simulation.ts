import EventEmitter from '@antv/event-emitter';
import type { Graph as IGraph, ID } from '@antv/graphlib';
import { isNumber } from '@antv/util';
import type {
  EdgeData,
  OutEdge,
  OutNode,
  OutNodeData,
  Point,
  PointTuple,
} from '../types';

interface SimulationOptions {
  width: number;
  height: number;
  center: PointTuple;
  gravity: number;
  speed: number;
  clustering: boolean;
  clusterGravity: number;
  nodeClusterBy: (node: OutNode) => string;
  dimensions: 2 | 3;
  maxIteration: number;
}

interface ClusterInfo {
  name: string;
  cx: number;
  cy: number;
  cz: number;
  count: number;
}

type ClusterMap = Map<ID, ClusterInfo>;
type DisplacementMap = Map<ID, Point>;

const SPEED_DIVISOR = 800;

/**
 * Fruchterman Simulation
 */
export class Simulation extends EventEmitter {
  private k: number;
  private k2: number;
  private maxDisplace: number;

  private displacements: DisplacementMap;
  private clusterMap: ClusterMap;
  private currentIteration: number = 0;

  private isRunning: boolean = false;
  private animationFrameId: number | null = null;
  private iterationsPerFrame: number = 10;

  private isDestroyed: boolean = false;

  private context: {
    nodes: OutNode[];
    edges: OutEdge[];
    graph?: IGraph<OutNodeData, EdgeData>;
    options: Partial<SimulationOptions>;
  } = {
    nodes: [],
    edges: [],
    graph: undefined,
    options: {},
  };

  constructor(
    graph: IGraph<OutNodeData, EdgeData>,
    options: SimulationOptions,
  ) {
    super();

    const { width, height } = options;
    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();
    this.context = { nodes, edges, graph, options };

    const area = height * width;
    this.k2 = area / (nodes.length + 1);
    this.k = Math.sqrt(this.k2);
    this.maxDisplace = Math.sqrt(area) / 10;

    this.initDisplacements();
  }

  /**
   * Manually steps the simulation by the specified number of *iterations*, and returns the simulation.
   * If *iterations* is not specified, it defaults to 1 (single step).
   */
  public tick(iterations: number = 1): this {
    if (this.isDestroyed) {
      console.warn('Simulation has already been destroyed.');
      return;
    }

    this.isRunning = true;

    for (let i = 0; i < iterations; i++) {
      this.syncFixedPositions();
      this.initDisplacements();
      this.calculateRepulsive();
      this.calculateAttractive();
      this.applyClusterGravity();
      this.applyGlobalGravity();
      this.updatePositions();

      this.currentIteration++;
      this.emit('tick');
    }

    return this;
  }

  /**
   * Stops the simulation's animation timer and returns the simulation.
   */
  public stop(): this {
    if (!this.isRunning) return this;

    this.isRunning = false;
    if (this.animationFrameId !== null) {
      if (typeof cancelAnimationFrame !== 'undefined') {
        cancelAnimationFrame(this.animationFrameId);
      }
      this.animationFrameId = null;
    }

    return this;
  }

  /**
   * Restart the simulation's animation timer and returns the simulation.
   */
  public restart(): this {
    if (this.isDestroyed) {
      console.warn('Simulation has already been destroyed.');
      return;
    }

    this.isRunning = true;

    const loop = () => {
      if (!this.isRunning) return;

      const delta = this.context.options.maxIteration - this.currentIteration;
      if (delta <= 0) {
        this.isRunning = false;
        this.emit('end');
        return;
      }
      this.tick(Math.min(this.iterationsPerFrame, delta));

      if (this.isRunning) {
        this.animationFrameId = requestAnimationFrame(loop);
      }
    };

    this.animationFrameId = requestAnimationFrame(loop);
    return this;
  }

  /**
   * Fixes the position of the node with the given id to the specified position.
   */
  public setFixedPosition(id: ID, position: (number | null)[]): this {
    const node = this.context.graph?.getNode(id);
    if (!node) return this;

    const keys = ['fx', 'fy', 'fz'] as const;

    position.forEach((value, index) => {
      if (
        index < keys.length &&
        (typeof value === 'number' || value === null)
      ) {
        (node.data as any)[keys[index]] = value;
      }
    });

    return this;
  }

  /**
   * Determines whether a node is fixed (has fx and fy defined).
   */
  private isNodeFixed(data: OutNodeData): boolean {
    return isNumber(data.fx) && isNumber(data.fy);
  }

  /**
   * Synchronizes fixed node positions (fx/fy -> x/y)
   */
  private syncFixedPositions(): void {
    const { nodes, graph, options } = this.context;
    const is3D = options.dimensions === 3;

    nodes.forEach((node) => {
      const { id, data } = node;

      if (this.isNodeFixed(data)) {
        const updateData: any = {
          x: data.fx,
          y: data.fy,
          ...(is3D ? { z: data.fz } : {}),
        };

        graph.mergeNodeData(id, updateData);
      }
    });
  }

  private initDisplacements(): void {
    if (!this.displacements) {
      this.displacements = new Map();
      this.context.nodes.forEach((node) => {
        this.displacements.set(node.id, { x: 0, y: 0, z: 0 });
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
    const { nodes, options } = this.context;
    const is3D = options.dimensions === 3;

    for (let i = 0; i < nodes.length; i++) {
      const nodeV = nodes[i];
      const v = nodeV.data;
      const dispV = this.displacements.get(nodeV.id)!;
      const vFixed = this.isNodeFixed(v);

      for (let j = i + 1; j < nodes.length; j++) {
        const nodeU = nodes[j];
        const u = nodeU.data;
        const dispU = this.displacements.get(nodeU.id)!;
        const uFixed = this.isNodeFixed(u);

        if (
          !isNumber(v.x) ||
          !isNumber(v.y) ||
          !isNumber(u.x) ||
          !isNumber(u.y)
        ) {
          continue;
        }

        let vecX = v.x - u.x;
        let vecY = v.y - u.y;
        let vecZ = is3D && isNumber(v.z) && isNumber(u.z) ? v.z - u.z : 0;

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
            dispV.z += dispZ;
            dispU.z -= dispZ;
          }
        } else if (vFixed && !uFixed) {
          // V 固定，U 不固定：U 承受双倍位移
          dispU.x -= dispX * 2;
          dispU.y -= dispY * 2;
          if (is3D) {
            dispU.z -= dispZ * 2;
          }
        } else if (!vFixed && uFixed) {
          // U 固定，V 不固定：V 承受双倍位移
          dispV.x += dispX * 2;
          dispV.y += dispY * 2;
          if (is3D) {
            dispV.z += dispZ * 2;
          }
        }
        // 如果两个都固定，则都不移动（不添加位移）
      }
    }
  }

  private calculateAttractive(): void {
    const { edges, graph, options } = this.context;
    const is3D = options.dimensions === 3;

    edges.forEach((edge) => {
      const { source, target } = edge;

      if (!source || !target || source === target) {
        return;
      }

      const u = graph.getNode(source).data;
      const v = graph.getNode(target).data;

      if (
        !isNumber(v.x) ||
        !isNumber(v.y) ||
        !isNumber(u.x) ||
        !isNumber(u.y)
      ) {
        return;
      }

      const dispSource = this.displacements.get(source)!;
      const dispTarget = this.displacements.get(target)!;
      const fixedU = this.isNodeFixed(u);
      const fixedV = this.isNodeFixed(v);

      const vecX = v.x - u.x;
      const vecY = v.y - u.y;
      const vecZ = is3D && isNumber(v.z) && isNumber(u.z) ? v.z - u.z : 0;

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
          dispSource.z += dispZ;
          dispTarget.z -= dispZ;
        }
      } else if (fixedU && !fixedV) {
        // V 固定，U 不固定：U 承受双倍位移
        dispTarget.x -= dispX * 2;
        dispTarget.y -= dispY * 2;
        if (is3D) {
          dispTarget.z -= dispZ * 2;
        }
      } else if (!fixedU && fixedV) {
        // U 固定，V 不固定：V 承受双倍位移
        dispSource.x += dispX * 2;
        dispSource.y += dispY * 2;
        if (is3D) {
          dispSource.z += dispZ * 2;
        }
      }
      // 如果两个都固定，则都不移动（不添加位移）
    });
  }

  private applyClusterGravity(): void {
    const { nodes, options } = this.context;
    const { nodeClusterBy, clusterGravity, dimensions, clustering } = options;

    if (!clustering) return;

    if (!this.clusterMap) {
      this.clusterMap = new Map();
      nodes.forEach((node) => {
        const clusterKey = nodeClusterBy(node);
        if (!this.clusterMap.has(clusterKey)) {
          this.clusterMap.set(clusterKey, {
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

    nodes.forEach((node) => {
      const { data } = node;
      const clusterKey = nodeClusterBy(node);
      const cluster = this.clusterMap.get(clusterKey);

      if (!cluster) return;

      if (isNumber(data.x)) cluster.cx += data.x;
      if (isNumber(data.y)) cluster.cy += data.y;
      if (is3D && isNumber(data.z)) cluster.cz += data.z;
      cluster.count++;
    });

    this.clusterMap.forEach((cluster) => {
      if (cluster.count > 0) {
        cluster.cx /= cluster.count;
        cluster.cy /= cluster.count;
        cluster.cz /= cluster.count;
      }
    });

    nodes.forEach((node) => {
      const { id, data } = node;

      // 固定节点不应用聚类重力
      if (this.isNodeFixed(data)) return;

      if (!isNumber(data.x) || !isNumber(data.y)) return;

      const clusterKey = nodeClusterBy(node);
      const cluster = this.clusterMap.get(clusterKey);
      if (!cluster) return;

      const disp = this.displacements.get(id)!;

      const vecX = data.x - cluster.cx;
      const vecY = data.y - cluster.cy;
      const vecZ = is3D && isNumber(data.z) ? data.z - cluster.cz : 0;

      const distLength = Math.sqrt(vecX * vecX + vecY * vecY + vecZ * vecZ);

      if (distLength === 0) return;

      const gravityForce = this.k * clusterGravity;
      disp.x -= (gravityForce * vecX) / distLength;
      disp.y -= (gravityForce * vecY) / distLength;

      if (is3D) {
        disp.z -= (gravityForce * vecZ) / distLength;
      }
    });
  }

  private applyGlobalGravity(): void {
    const { nodes, options } = this.context;
    const { gravity, center, dimensions } = options;

    const is3D = dimensions === 3;
    const gravityForce = 0.01 * this.k * gravity;

    nodes.forEach((node) => {
      const { id, data } = node;

      // 固定节点不应用全局重力
      if (this.isNodeFixed(data)) return;

      if (!isNumber(data.x) || !isNumber(data.y)) return;

      const disp = this.displacements.get(id)!;

      disp.x -= gravityForce * (data.x - center[0]);
      disp.y -= gravityForce * (data.y - center[1]);

      if (is3D && isNumber(data.z)) {
        disp.z -= gravityForce * (data.z - (center[2] || 0));
      }
    });
  }

  /**
   * Updates node positions based on calculated displacements
   */
  private updatePositions(): void {
    const { nodes, graph, options } = this.context;
    const { speed, dimensions } = options;
    const is3D = dimensions === 3;

    nodes.forEach((node) => {
      const { id, data } = node;

      if (this.isNodeFixed(data)) {
        return;
      }

      if (!isNumber(data.x) || !isNumber(data.y)) return;

      const disp = this.displacements.get(id)!;

      const distLength = Math.sqrt(
        disp.x * disp.x + disp.y * disp.y + (is3D ? disp.z * disp.z : 0),
      );

      if (distLength === 0) return;

      const limitedDist = Math.min(
        this.maxDisplace * (speed / SPEED_DIVISOR),
        distLength,
      );

      const ratio = limitedDist / distLength;
      const updateData: any = {
        x: data.x + disp.x * ratio,
        y: data.y + disp.y * ratio,
        ...(is3D && isNumber(data.z) ? { z: data.z + disp.z * ratio } : {}),
      };

      graph.mergeNodeData(id, updateData);
    });
  }

  public destroy(): void {
    if (this.isDestroyed) {
      console.warn('Simulation has already been destroyed.');
      return;
    }

    this.stop();

    if (this.displacements) {
      this.displacements.clear();
      this.displacements = null;
    }

    if (this.clusterMap) {
      this.clusterMap.clear();
      this.clusterMap = null;
    }
    this.context.nodes = [];
    this.context.edges = [];
    this.context.graph = undefined;
    this.context.options = {};

    this.off('tick');
    this.off('end');

    this.currentIteration = 0;
    this.isRunning = false;
    this.animationFrameId = null;

    this.isDestroyed = true;
  }
}

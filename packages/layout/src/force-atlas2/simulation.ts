import EventEmitter from '@antv/event-emitter';
import { isNumber } from '@antv/util';
import type { ID } from '../types/id';
import type { NullablePosition } from '../types/position';
import type { LayoutModel } from '../util/model';
import Body from './body';
import Quad from './quad';
import QuadTree from './quad-tree';
import type { ParsedForceAtlas2LayoutOptions } from './types';

type PointTuple = [number, number];
type ForceMap = Record<string, PointTuple>;
type BodyMap = Record<string, Body>;
type SizeMap = Record<string, number>;

/**
 * ForceAtlas2 Simulation
 */
export class Simulation extends EventEmitter {
  private sg = 0;
  private forces: ForceMap = {};
  private preForces: ForceMap = {};
  private bodies: BodyMap = {};
  private sizes: SizeMap = {};
  private currentIteration = 0;
  private maxIteration = 0;

  private isRunning = false;
  private animationFrameId: number | null = null;
  private iterationsPerFrame = 1;
  private isDestroyed = false;

  private context: {
    model: LayoutModel;
    options: ParsedForceAtlas2LayoutOptions;
  };

  constructor(
    model: LayoutModel,
    options: ParsedForceAtlas2LayoutOptions,
    sizes: SizeMap,
  ) {
    super();
    this.context = { model, options };
    this.sizes = sizes;
    this.maxIteration = options.maxIteration;
    this.initForces();
  }

  public update(
    model: LayoutModel,
    options: ParsedForceAtlas2LayoutOptions,
    sizes: SizeMap,
  ): this {
    if (this.isDestroyed) return this;

    this.context.model = model;
    this.context.options = options;
    this.sizes = sizes;
    this.maxIteration = options.maxIteration;

    this.forces = {};
    this.preForces = {};
    this.bodies = {};
    this.sg = 0;
    this.currentIteration = 0;

    this.initForces();

    return this;
  }

  private initForces(): void {
    const { model, options } = this.context;
    const { kr, barnesHut } = options;
    const nodes = model.nodes();

    this.forces = {};
    this.preForces = {};
    this.bodies = {};

    for (let i = 0; i < nodes.length; i += 1) {
      const node = nodes[i];
      this.forces[node.id] = [0, 0];
      this.preForces[node.id] = [0, 0];

      if (barnesHut) {
        const params = {
          id: i,
          rx: node.x,
          ry: node.y,
          mass: 1,
          g: kr,
          degree: model.degree(node.id),
        };
        this.bodies[node.id] = new Body(params);
      }
    }
  }

  /**
   * Execute specified number of iterations
   */
  public tick(iterations: number = 1): this {
    if (this.isDestroyed) {
      console.warn('Simulation has already been destroyed.');
      return this;
    }

    this.isRunning = true;

    for (let i = 0; i < iterations; i++) {
      this.syncFixedPositions();
      this.step();
      this.currentIteration++;
      this.emit('tick');
    }

    return this;
  }

  /**
   * Stop the simulation
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
   * Restart the simulation
   */
  public restart(): this {
    if (this.isDestroyed) return this;

    this.isRunning = true;

    const loop = () => {
      if (!this.isRunning) return;

      const delta = this.maxIteration - this.currentIteration;
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
   * Set a node's fixed position
   */
  public setFixedPosition(id: ID, position: NullablePosition | null): void {
    const node = this.context.model.node(id);
    if (!node) return;

    if (position === null) {
      delete node.fx;
      delete node.fy;
      return;
    }

    if (position[0] !== undefined) node.fx = position[0];
    if (position[1] !== undefined) node.fy = position[1];
  }

  private isNodeFixed(node: any): boolean {
    return isNumber(node.fx) && isNumber(node.fy);
  }

  private syncFixedPositions(): void {
    this.context.model.forEachNode((node) => {
      if (this.isNodeFixed(node)) {
        node.x = node.fx!;
        node.y = node.fy!;
      }
    });
  }

  /**
   * Execute one step of the simulation
   */
  private step(): void {
    const { model, options } = this.context;
    const { preventOverlap, barnesHut } = options;
    const iter = this.maxIteration - this.currentIteration;
    const krPrime = 100;

    // Save previous & reset current force vectors
    const nodes = model.nodes();
    for (let i = 0; i < nodes.length; i += 1) {
      const { id } = nodes[i];
      this.preForces[id] = [...(this.forces[id] || [0, 0])];
      this.forces[id] = [0, 0];
    }

    // 1. Attractive forces (edges)
    this.calculateAttractive(iter);

    // 2. Repulsive forces + gravity
    // 当启用 Barnes-Hut 且不需要防重叠时使用优化算法
    if (barnesHut && !preventOverlap) {
      this.calculateOptRepulsiveGravity();
    } else {
      this.calculateRepulsiveGravity(iter, krPrime);
    }

    // 3. Update positions
    this.updatePositions();
  }

  private calculateAttractive(iter: number): void {
    const { model, options } = this.context;
    const { preventOverlap, dissuadeHubs, mode, prune } = options;
    const edges = model.edges();

    for (let i = 0; i < edges.length; i += 1) {
      const { source, target } = edges[i];
      const sourceNode = model.node(source);
      const targetNode = model.node(target);

      const sourceDegree = model.degree(source);
      const targetDegree = model.degree(target);
      if (prune && (sourceDegree <= 1 || targetDegree <= 1)) continue;

      const dirX = targetNode.x - sourceNode.x;
      const dirY = targetNode.y - sourceNode.y;
      let eucliDis = Math.hypot(dirX, dirY);
      eucliDis = eucliDis < 1e-4 ? 1e-4 : eucliDis;

      const nx = dirX / eucliDis;
      const ny = dirY / eucliDis;

      let effectiveDist = eucliDis;
      // 当启用 preventOverlap 时,考虑节点大小,确保有效距离不为负
      if (preventOverlap) {
        effectiveDist = Math.max(0, eucliDis - this.sizes[source] - this.sizes[target]);
      }

      let faSource = effectiveDist;
      let faTarget = effectiveDist;

      if (mode === 'linlog') {
        faSource = Math.log(1 + effectiveDist);
        faTarget = faSource;
      }

      if (dissuadeHubs) {
        faSource = effectiveDist / sourceDegree;
        faTarget = effectiveDist / targetDegree;
      }

      this.forces[source][0] += faSource * nx;
      this.forces[source][1] += faSource * ny;
      this.forces[target][0] -= faTarget * nx;
      this.forces[target][1] -= faTarget * ny;
    }
  }

  private calculateOptRepulsiveGravity(): void {
    const { model, options } = this.context;
    const { kg, center, prune, kr } = options;

    const nodes = model.nodes();
    const n = nodes.length;

    // Compute bounding box and set body positions
    let minx = Number.POSITIVE_INFINITY;
    let maxx = Number.NEGATIVE_INFINITY;
    let miny = Number.POSITIVE_INFINITY;
    let maxy = Number.NEGATIVE_INFINITY;

    for (let i = 0; i < n; i += 1) {
      const node = nodes[i];
      const { id, x, y } = node;
      if (prune && model.degree(id) <= 1) continue;
      const body = this.bodies[id];
      if (!body) continue;
      body.setPos(x, y);
      if (x < minx) minx = x;
      if (x > maxx) maxx = x;
      if (y < miny) miny = y;
      if (y > maxy) maxy = y;
    }

    let width = Math.max(maxx - minx, maxy - miny);
    if (!isFinite(width) || width <= 0) width = 1;

    const quadParams = {
      xmid: (maxx + minx) / 2,
      ymid: (maxy + miny) / 2,
      length: width,
      massCenter: center,
      mass: n,
    };
    const quad = new Quad(quadParams);
    const quadTree = new QuadTree(quad);

    // Insert bodies into tree
    for (let i = 0; i < n; i += 1) {
      const { id } = nodes[i];
      if (prune && model.degree(id) <= 1) continue;
      const body = this.bodies[id];
      if (body && body.in(quad)) quadTree.insert(body);
    }

    // Compute forces
    for (let i = 0; i < n; i += 1) {
      const node = nodes[i];
      const { id, x, y } = node;
      const degree = model.degree(id);
      if (prune && degree <= 1) continue;

      const body = this.bodies[id];
      if (!body) continue;
      body.resetForce();
      quadTree.updateForce(body);
      this.forces[id][0] -= body.fx;
      this.forces[id][1] -= body.fy;

      // Gravity toward center
      const dx = x - center[0];
      const dy = y - center[1];
      let dist = Math.hypot(dx, dy);
      dist = dist < 1e-4 ? 1e-4 : dist;
      const nx = dx / dist;
      const ny = dy / dist;
      const fg = kg * (degree + 1);
      this.forces[id][0] -= fg * nx;
      this.forces[id][1] -= fg * ny;
    }
  }

  private calculateRepulsiveGravity(iter: number, krPrime: number): void {
    const { model, options } = this.context;
    const { preventOverlap, kr, kg, center, prune } = options;
    const nodes = model.nodes();
    const n = nodes.length;

    for (let i = 0; i < n; i += 1) {
      const nodei = nodes[i];
      const degreei = model.degree(nodei.id);

      for (let j = i + 1; j < n; j += 1) {
        const nodej = nodes[j];
        const degreej = model.degree(nodej.id);
        if (prune && (degreei <= 1 || degreej <= 1)) continue;

        const dx = nodej.x - nodei.x;
        const dy = nodej.y - nodei.y;
        let dist = Math.hypot(dx, dy);
        dist = dist < 1e-4 ? 1e-4 : dist;
        const nx = dx / dist;
        const ny = dy / dist;

        let effDist = dist;
        let fr: number;

        // 当启用 preventOverlap 时,考虑节点大小
        if (preventOverlap) {
          const overlap = dist - this.sizes[nodei.id] - this.sizes[nodej.id];
          if (overlap < 0) {
            // 节点重叠,使用强推力
            fr = krPrime * (degreei + 1) * (degreej + 1);
          } else if (overlap === 0) {
            // 节点刚好接触,无斥力
            fr = 0;
          } else {
            // 节点未重叠,使用正常斥力
            effDist = overlap;
            fr = (kr * (degreei + 1) * (degreej + 1)) / effDist;
          }
        } else {
          fr = (kr * (degreei + 1) * (degreej + 1)) / effDist;
        }

        this.forces[nodei.id][0] -= fr * nx;
        this.forces[nodei.id][1] -= fr * ny;
        this.forces[nodej.id][0] += fr * nx;
        this.forces[nodej.id][1] += fr * ny;
      }

      // Gravity toward center
      const gx = nodei.x - center[0];
      const gy = nodei.y - center[1];
      let gdist = Math.hypot(gx, gy);
      gdist = gdist < 1e-4 ? 1e-4 : gdist;
      const gnx = gx / gdist;
      const gny = gy / gdist;
      const fg = kg * (degreei + 1);
      this.forces[nodei.id][0] -= fg * gnx;
      this.forces[nodei.id][1] -= fg * gny;
    }
  }

  private updatePositions(): void {
    const { model, options } = this.context;
    const { ks, tao, prune, ksmax } = options;
    const nodes = model.nodes();
    const n = nodes.length;

    const swgns: Record<string, number> = {};
    const trans: Record<string, number> = {};

    let swgG = 0;
    let traG = 0;

    // Accumulate swg and tra across nodes
    for (let i = 0; i < n; i += 1) {
      const { id } = nodes[i];
      const degree = model.degree(id);
      if (prune && degree <= 1) continue;

      const prev = this.preForces[id] || [0, 0];
      const cur = this.forces[id] || [0, 0];

      const minusX = cur[0] - prev[0];
      const minusY = cur[1] - prev[1];
      const minusNorm = Math.hypot(minusX, minusY);

      const addX = cur[0] + prev[0];
      const addY = cur[1] + prev[1];
      const addNorm = Math.hypot(addX, addY);

      swgns[id] = minusNorm;
      trans[id] = addNorm / 2;

      swgG += (degree + 1) * swgns[id];
      traG += (degree + 1) * trans[id];
    }

    let usingSg = this.sg;
    const preSG = this.sg;
    if (swgG <= 0) {
      usingSg = preSG > 0 ? preSG : 1;
    } else {
      usingSg = (tao * traG) / swgG;
      if (preSG !== 0) {
        usingSg = usingSg > 1.5 * preSG ? 1.5 * preSG : usingSg;
      }
    }

    this.sg = usingSg;

    // Update positions with adaptive step factor
    for (let i = 0; i < n; i += 1) {
      const node = nodes[i];
      const id = node.id;
      const degree = model.degree(id);
      if (prune && degree <= 1) continue;
      if (this.isNodeFixed(node)) continue;

      const swgVal = swgns[id] || 0;
      let sn = (ks * usingSg) / (1 + usingSg * Math.sqrt(swgVal));

      let absForce = Math.hypot(this.forces[id][0], this.forces[id][1]);
      absForce = absForce < 1e-4 ? 1e-4 : absForce;
      const maxStep = ksmax / absForce;
      if (sn > maxStep) sn = maxStep;

      const dx = sn * this.forces[id][0];
      const dy = sn * this.forces[id][1];
      node.x += dx;
      node.y += dy;
    }
  }

  public destroy(): void {
    this.stop();
    this.isDestroyed = true;
    this.forces = {};
    this.preForces = {};
    this.bodies = {};
    this.sizes = {};
    this.off();
  }
}

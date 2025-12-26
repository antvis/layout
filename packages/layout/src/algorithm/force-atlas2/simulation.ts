import { isNumber } from '@antv/util';
import { BaseSimulation } from '../base-simulation';
import type { ID, NullablePosition } from '../../types';
import type { GraphLib } from '../../model/data';
import Body from './body';
import Quad from './quad';
import QuadTree from './quad-tree';
import type {
  ForceAtlas2LayoutOptions,
  ParsedForceAtlas2LayoutOptions,
} from './types';

type PointTuple = [number, number];
type ForceMap = Record<string, PointTuple>;
type BodyMap = Record<string, Body>;
type SizeMap = Record<string, number>;

/**
 * ForceAtlas2 Simulation
 */
export class Simulation extends BaseSimulation<ParsedForceAtlas2LayoutOptions> {
  private sg = 0;
  private forces: ForceMap = {};
  private preForces: ForceMap = {};
  private bodies: BodyMap = {};
  private sizes: SizeMap = {};
  private maxIteration = 0;

  protected model!: GraphLib;

  data(model: GraphLib, sizes: SizeMap): this {
    this.model = model;
    this.sizes = sizes;
    return this;
  }

  initialize(options: Required<ForceAtlas2LayoutOptions>): void {
    super.initialize(options);

    this.maxIteration = options.maxIteration;

    this.sg = 0;

    this.initForces();
  }

  private initForces(): void {
    const { model, options } = this;
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
   * Set a node's fixed position
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

  private isNodeFixed(node: any): boolean {
    return isNumber(node.fx) && isNumber(node.fy);
  }

  private syncFixedPositions(): void {
    this.model.forEachNode((node) => {
      if (this.isNodeFixed(node)) {
        node.x = node.fx!;
        node.y = node.fy!;
      }
    });
  }

  /**
   * Execute one step of the simulation
   */
  protected runOneStep(): number {
    const { model, options } = this;
    const { preventOverlap, barnesHut } = options;
    const iter = this.maxIteration - this.iteration;
    const krPrime = 100;

    // Save previous & reset current force vectors
    const nodes = model.nodes();
    for (let i = 0; i < nodes.length; i += 1) {
      const { id } = nodes[i];
      this.preForces[id] = [...(this.forces[id] || [0, 0])];
      this.forces[id] = [0, 0];
    }

    this.syncFixedPositions();

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
    return this.updatePositions();
  }

  private calculateAttractive(iter: number): void {
    const { model, options } = this;
    const { preventOverlap, dissuadeHubs, mode, prune } = options;
    const edges = model.edges();

    for (let i = 0; i < edges.length; i += 1) {
      const { source, target } = edges[i];
      const sourceNode = model.node(source)!;
      const targetNode = model.node(target)!;

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
        effectiveDist = Math.max(
          0,
          eucliDis - this.sizes[source] - this.sizes[target],
        );
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
    const { model, options } = this;
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
    const { model, options } = this;
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

  private updatePositions(): number {
    const { model, options } = this;
    const { ks, tao, prune, ksmax, distanceThresholdMode = 'max' } = options;
    const nodes = model.nodes();
    const n = nodes.length;

    const swgns: Record<string, number> = {};
    const trans: Record<string, number> = {};

    let swgG = 0;
    let traG = 0;

    // -------- ① 计算 swg / tra --------
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

    // -------- ② 更新 sg --------
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

    // -------- ③ 新增：distance 累计 --------
    let maxDistance = 0;
    let minDistance = Infinity;
    let sumDistance = 0;
    let movedCount = 0;

    // -------- ④ 更新位置 --------
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

      // -------- ⑤ 记录位移 --------
      const dist = Math.hypot(dx, dy);
      if (dist > 0) {
        movedCount++;
        sumDistance += dist;
        if (dist > maxDistance) maxDistance = dist;
        if (dist < minDistance) minDistance = dist;
      }
    }

    // -------- ⑥ 根据 mode 返回 distance --------
    switch (distanceThresholdMode) {
      case 'min':
        return minDistance;
      case 'mean':
        return movedCount > 0 ? sumDistance / movedCount : 0;
      case 'max':
      default:
        return maxDistance;
    }
  }

  public destroy(): void {
    this.stop();
    this.forces = {};
    this.preForces = {};
    this.bodies = {};
    this.sizes = {};
    this.off();
  }
}

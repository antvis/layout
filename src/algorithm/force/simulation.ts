import { isNumber } from '@antv/util';
import { BaseSimulation } from '../base-simulation';
import type { LayoutNode, NullablePosition } from '../../types';
import type { GraphLib } from '../../model/data';
import type { AccMap, ParsedForceLayoutOptions } from './types';

interface Force {
  (model: GraphLib, accMap: AccMap): void;
  [key: string]: any;
}

export class ForceSimulation extends BaseSimulation<ParsedForceLayoutOptions> {
  private forces = new Map<string, Force>();
  private velMap: AccMap = {};

  protected model!: GraphLib;

  data(model: GraphLib): this {
    this.model = model;

    model.forEachNode((node) => {
      this.velMap[node.id] = { x: 0, y: 0, z: 0 };
    });

    return this;
  }

  force(name: string, force?: Force | null) {
    if (arguments.length === 1) return this.forces.get(name) || null;
    if (force === null) this.forces.delete(name);
    else if (force) this.forces.set(name, force);
    return force || null;
  }

  protected runOneStep(): number {
    const accMap: AccMap = {};
    const nodes = this.model.nodes();
    if (!nodes.length) return 0;

    nodes.forEach((n) => {
      accMap[n.id] = { x: 0, y: 0, z: 0 };
    });

    this.forces.forEach((force) => {
      force(this.model, accMap);
    });

    this.updateVelocity(accMap);
    const distance = this.updatePosition();

    this.monitor(accMap, nodes);

    return distance;
  }

  setFixedPosition(nodeId: string, position: NullablePosition | null) {
    const node = this.model.node(nodeId);
    if (!node) return;

    const keys = ['fx', 'fy', 'fz'] as const;

    if (position === null) {
      keys.forEach((k) => delete node[k]);
      return;
    }

    position.forEach((v, i) => {
      if (i < keys.length && (typeof v === 'number' || v === null)) {
        node[keys[i]] = v;
      }
    });

    const vel = this.velMap[nodeId];
    if (vel) {
      vel.x = 0;
      vel.y = 0;
      vel.z = 0;
    }
  }

  private updateVelocity(accMap: AccMap) {
    const {
      damping = 0.9,
      maxSpeed = 100,
      interval = 0.02,
      dimensions = 2,
    } = this.options;

    this.model.nodes().forEach((node) => {
      const id = node.id;
      let vx = (this.velMap[id].x + accMap[id].x * interval) * damping;
      let vy = (this.velMap[id].y + accMap[id].y * interval) * damping;
      let vz =
        dimensions === 3
          ? (this.velMap[id].z + accMap[id].z * interval) * damping
          : 0;

      const vLen = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (vLen > maxSpeed) {
        const k = maxSpeed / vLen;
        vx *= k;
        vy *= k;
        vz *= k;
      }

      this.velMap[id] = { x: vx, y: vy, z: vz };
    });
  }

  private updatePosition(): number {
    const {
      distanceThresholdMode = 'mean',
      interval = 0.02,
      dimensions = 2,
    } = this.options;

    const nodes = this.model.nodes();
    let sum = 0;
    let judge =
      distanceThresholdMode === 'max'
        ? -Infinity
        : distanceThresholdMode === 'min'
        ? Infinity
        : 0;

    nodes.forEach((node) => {
      const id = node.id;

      if (isNumber(node.fx) && isNumber(node.fy)) {
        node.x = node.fx;
        node.y = node.fy;
        if (dimensions === 3 && isNumber(node.fz)) node.z = node.fz;
        return;
      }

      const dx = this.velMap[id].x * interval;
      const dy = this.velMap[id].y * interval;
      const dz = dimensions === 3 ? this.velMap[id].z * interval : 0;

      node.x += dx;
      node.y += dy;
      if (dimensions === 3) node.z = (node.z || 0) + dz;

      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (distanceThresholdMode === 'max') judge = Math.max(judge, dist);
      else if (distanceThresholdMode === 'min') judge = Math.min(judge, dist);
      else sum += dist;
    });

    return distanceThresholdMode === 'mean' ? sum / nodes.length : judge;
  }

  private monitor(accMap: AccMap, nodes: LayoutNode[]) {
    const { monitor, dimensions = 2 } = this.options;
    if (!monitor) return;

    let energy = 0;
    nodes.forEach((node) => {
      const a = accMap[node.id];
      const v2 = a.x * a.x + a.y * a.y + (dimensions === 3 ? a.z * a.z : 0);
      energy += (node.mass || 1) * v2 * 0.5;
    });

    monitor({
      energy,
      nodes,
      edges: this.model.edges(),
      iterations: this.iteration,
    });
  }
}

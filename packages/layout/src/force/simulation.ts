import { isNumber } from '@antv/util';
import type { LayoutNode } from '../types/data';
import type { PointObject } from '../types/point';
import { LayoutModel } from '../util';
import type { ParsedForceLayoutOptions } from './types';

interface Force {
  (model: LayoutModel, accMap: { [id: string]: PointObject }): void;
  [key: string]: any;
}

/**
 * Custom simulation for Force layout
 * Manages the physics calculation loop
 */
export class ForceSimulation {
  private model: LayoutModel | null = null;
  private forces: Map<string, Force> = new Map();
  private velMap: { [id: string]: PointObject } = {};
  private judgingDistance: number = 0;
  private options: Partial<ParsedForceLayoutOptions> = {};
  private tickCallback: (() => void) | null = null;
  private endCallback: (() => void) | null = null;
  private timeInterval: number = 0;
  private running: boolean = false;
  private iteration: number = 0;

  constructor() {}

  /**
   * Get or set a force by name
   */
  force(name: string, force?: Force | null): Force | null {
    if (arguments.length === 1) {
      return this.forces.get(name) || null;
    }
    if (force === null) {
      this.forces.delete(name);
    } else if (force) {
      this.forces.set(name, force);
    }
    return force;
  }

  /**
   * Initialize simulation with graph data
   */
  initialize(model: LayoutModel, options: ParsedForceLayoutOptions) {
    this.model = model;
    this.options = options;

    // Initialize velocity map
    this.velMap = {};

    model.forEachNode((node) => {
      this.velMap[node.id] = { x: 0, y: 0, z: 0 };
    });

    this.iteration = 0;
    this.judgingDistance = Infinity;

    // Start the simulation
    this.restart();
  }

  /**
   * Register tick callback
   */
  on(event: string, callback: () => void): this {
    if (event === 'tick') {
      this.tickCallback = callback;
    } else if (event === 'end') {
      this.endCallback = callback;
    }
    return this;
  }

  /**
   * Run one iteration step
   */
  tick(iterations: number = 1): this {
    for (let i = 0; i < iterations; i++) {
      this.runOneStep();
    }

    return this;
  }

  /**
   * Start the simulation
   */
  restart(): this {
    if (this.running) return this;

    const { maxIteration = 500, minMovement = 0.4 } = this.options;

    if (typeof window === 'undefined') {
      // Server-side: run synchronously
      while (
        this.iteration < maxIteration &&
        (this.judgingDistance > minMovement || this.iteration < 1)
      ) {
        this.tick(1);
      }
      this.endCallback?.();
      return this;
    }

    // Client-side: run with animation frame
    this.running = true;
    this.timeInterval = window.setInterval(() => {
      this.tick(1);
      this.tickCallback?.();

      if (
        this.iteration >= maxIteration ||
        this.judgingDistance < minMovement
      ) {
        this.stop();
        this.endCallback?.();
      }
    }, 0);

    return this;
  }

  /**
   * Stop the simulation
   */
  stop(): this {
    this.running = false;
    if (this.timeInterval && typeof window !== 'undefined') {
      window.clearInterval(this.timeInterval);
      this.timeInterval = 0;
    }
    return this;
  }

  /**
   * Run one simulation step
   */
  private runOneStep() {
    const accMap: { [id: string]: PointObject } = {};
    const nodes = this.model.nodes();

    if (!nodes?.length) return;

    // Initialize acceleration map
    nodes.forEach((node) => {
      accMap[node.id] = { x: 0, y: 0, z: 0 };
    });

    // Apply all forces
    this.forces.forEach((force, key) => {
      force(this.model, accMap);
    });

    // Update velocities
    this.updateVelocity(accMap);

    // Update positions
    this.updatePosition();

    // Monitor energy if callback provided
    const { monitor } = this.options;
    if (monitor) {
      const energy = this.calTotalEnergy(accMap, nodes);
      monitor({
        energy,
        nodes: this.model.nodes(),
        edges: this.model.edges(),
        iterations: this.iteration,
      });
    }

    this.iteration++;
  }

  /**
   * Calculate total energy for monitoring
   */
  private calTotalEnergy(
    accMap: { [id: string]: PointObject },
    nodes: LayoutNode[],
  ) {
    if (!nodes?.length) return 0;
    let energy = 0.0;

    nodes.forEach((node) => {
      const vx = accMap[node.id].x;
      const vy = accMap[node.id].y;
      const vz = this.options.dimensions === 3 ? accMap[node.id].z : 0;
      const speed2 = vx * vx + vy * vy + vz * vz;
      const mass = node.mass || 1;
      energy += mass * speed2 * 0.5;
    });

    return energy;
  }

  /**
   * Update velocities based on acceleration
   */
  private updateVelocity(accMap: { [id: string]: PointObject }) {
    const {
      damping = 0.9,
      maxSpeed = 100,
      interval = 0.02,
      dimensions = 2,
    } = this.options;
    const nodes = this.model!.nodes();

    nodes.forEach((node) => {
      const { id } = node;
      let vx = (this.velMap[id].x + accMap[id].x * interval) * damping;
      let vy = (this.velMap[id].y + accMap[id].y * interval) * damping;
      let vz =
        dimensions === 3
          ? (this.velMap[id].z + accMap[id].z * interval) * damping
          : 0.0;

      const vLength = Math.sqrt(vx * vx + vy * vy + vz * vz);
      if (vLength > maxSpeed) {
        const param2 = maxSpeed / vLength;
        vx = param2 * vx;
        vy = param2 * vy;
        vz = param2 * vz;
      }

      this.velMap[id] = { x: vx, y: vy, z: vz };
    });
  }

  /**
   * Update node positions based on velocity
   */
  private updatePosition() {
    const {
      distanceThresholdMode = 'mean',
      interval = 0.02,
      dimensions = 2,
    } = this.options;
    const nodes = this.model.nodes();

    if (!nodes?.length) {
      this.judgingDistance = 0;
      return;
    }

    let sum = 0;
    if (distanceThresholdMode === 'max') this.judgingDistance = -Infinity;
    else if (distanceThresholdMode === 'min') this.judgingDistance = Infinity;

    nodes.forEach((node) => {
      const id = node.id;

      // Handle fixed positions
      if (isNumber(node.fx) && isNumber(node.fy)) {
        node.x = node.fx;
        node.y = node.fy;
        if (dimensions === 3 && isNumber(node.fz)) {
          node.z = node.fz;
        }
        return;
      }

      const distX = this.velMap[id].x * interval;
      const distY = this.velMap[id].y * interval;
      const distZ = dimensions === 3 ? this.velMap[id].z * interval : 0.0;

      node.x = node.x + distX;
      node.y = node.y + distY;
      if (dimensions === 3) {
        node.z = (node.z || 0) + distZ;
      }

      const distanceMagnitude = Math.sqrt(
        distX * distX + distY * distY + distZ * distZ,
      );

      switch (distanceThresholdMode) {
        case 'max':
          if (this.judgingDistance < distanceMagnitude) {
            this.judgingDistance = distanceMagnitude;
          }
          break;
        case 'min':
          if (this.judgingDistance > distanceMagnitude) {
            this.judgingDistance = distanceMagnitude;
          }
          break;
        default:
          sum = sum + distanceMagnitude;
          break;
      }
    });

    if (!distanceThresholdMode || distanceThresholdMode === 'mean') {
      this.judgingDistance = sum / nodes.length;
    }
  }
}

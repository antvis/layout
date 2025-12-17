import { deepMix } from '@antv/util';
import type { ForceLink, Simulation } from 'd3-force';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  forceX,
  forceY,
} from 'd3-force';
import { BaseLayoutWithIterations } from '../base-layout';
import type { LayoutWithIterations } from '../base-layout/types';
import type { ID } from '../types/id';
import type { Position } from '../types/position';
import { assignDefined, normalizeViewport } from '../util';
import { formatNodeSizeFn } from '../util/format';
import forceInABox from './force-in-a-box';
import type { D3ForceLayoutOptions, EdgeDatum, NodeDatum } from './types';

export type { D3ForceLayoutOptions };

const DEFAULTS_LAYOUT_OPTIONS: Partial<D3ForceLayoutOptions> = {
  centerStrength: 1,

  edgeId: (d) => String(d.id),
  linkDistance: 30,
  edgeStrength: undefined,
  edgeIterations: 1,

  preventOverlap: false,
  nodeSize: 10,
  nodeSpacing: 0,
  collideStrength: 1,
  collideIterations: 1,

  nodeStrength: -30,
  distanceMin: undefined,
  distanceMax: undefined,
  theta: undefined,

  alpha: 1,
  alphaMin: 0.001,
  alphaDecay: 1 - Math.pow(0.001, 1 / 300),
  alphaTarget: 0,
  velocityDecay: 0.4,

  clustering: false,
  clusterNodeStrength: -1,
  clusterEdgeStrength: 0.1,
  clusterEdgeDistance: 100,
  clusterFociStrength: 0.8,
  clusterNodeSize: 10,
};

export class D3ForceLayout<
    T extends D3ForceLayoutOptions = D3ForceLayoutOptions,
  >
  extends BaseLayoutWithIterations<T>
  implements LayoutWithIterations<T>
{
  public id = 'd3-force';

  public simulation: Simulation<NodeDatum, EdgeDatum>;

  private d3Nodes: NodeDatum[] = [];
  private d3Edges: EdgeDatum[] = [];

  protected config = {
    simulationAttrs: [
      'alpha',
      'alphaMin',
      'alphaDecay',
      'alphaTarget',
      'velocityDecay',
      'randomSource',
    ],
  };

  protected getDefaultOptions(): T {
    return DEFAULTS_LAYOUT_OPTIONS as T;
  }

  protected mergeOptions(base: T, patch?: Partial<T>): T {
    return deepMix({}, base, patch) as T;
  }

  constructor(options?: Partial<T>) {
    super(options);

    if (this.options.forceSimulation) {
      this.simulation = this.options.forceSimulation;
    }
  }

  public stop(): this {
    if (this.simulation) {
      this.simulation.stop();
    }
    return this;
  }

  public tick(iterations: number = 1): this {
    if (this.simulation) {
      for (let i = 0; i < iterations; i++) {
        this.simulation.tick();
      }
      this.syncPositionsFromD3();
      this.options.onTick?.(this);
    }
    return this;
  }

  public restart(alpha?: number): this {
    if (this.simulation) {
      if (alpha !== undefined) {
        this.simulation.alpha(alpha);
      }
      this.simulation.restart();
    }
    return this;
  }

  public reheat(): this {
    return this.restart(1);
  }

  public getAlpha(): number {
    return this.simulation?.alpha() ?? 0;
  }

  public setAlpha(alpha: number): this {
    if (this.simulation) {
      this.simulation.alpha(alpha);
    }
    return this;
  }

  public getForce(name: string): any {
    return this.simulation?.force(name);
  }

  public force(name: string, force: any): this {
    if (this.simulation) {
      this.simulation.force(name, force);
    }
    return this;
  }

  public nodes(): NodeDatum[] {
    return this.simulation?.nodes() ?? [];
  }

  public find(x: number, y: number, radius?: number): NodeDatum | undefined {
    if (!this.simulation) return undefined;
    return this.simulation.find(x, y, radius);
  }

  public setFixedPosition(id: ID, position: Position | null[] | null): void {
    const d3Node = this.d3Nodes.find((n) => n.id === id);
    const node = this.model.node(id);
    if (!node || !d3Node) return;

    const keys = ['fx', 'fy', 'fz'] as const;

    if (position === null) {
      // Unset fixed position
      keys.forEach((key) => {
        delete node[key];
        delete d3Node[key];
      });
      return;
    }

    position.forEach((value, index) => {
      if (
        index < keys.length &&
        (typeof value === 'number' || value === null)
      ) {
        node[keys[index]] = value;
        d3Node[keys[index]] = value;
      }
    });
  }

  protected parseOptions(options: Partial<T>): T {
    const _ = options;
    // process nodeSize
    if (_.collide && _.collide?.radius === undefined) {
      _.collide = _.collide || {};
      // @ts-ignore
      _.collide.radius = _.nodeSize ?? 10;
    }
    // process iterations
    if (_.iterations === undefined) {
      if (_.link && _.link.iterations === undefined) {
        _.iterations = _.link.iterations;
      }
      if (_.collide && _.collide.iterations === undefined) {
        _.iterations = _.collide.iterations;
      }
    }

    return _ as T;
  }

  protected async layout(): Promise<void> {
    const options = this.parseOptions(this.options || {});

    this.createD3Copies();

    const simulation = this.setSimulation(options);

    simulation.nodes(this.d3Nodes);
    simulation
      .force<ForceLink<NodeDatum, EdgeDatum>>('link')
      ?.links(this.d3Edges);

    return new Promise<void>((resolve) => {
      simulation.on('end', () => {
        this.syncPositionsFromD3();
        resolve();
      });
    });
  }

  private createD3Copies() {
    this.d3Nodes = [];
    this.d3Edges = [];

    this.model.forEachNode((node) => {
      this.d3Nodes.push({ ...node });
    });
    this.model.forEachEdge((edge) => {
      this.d3Edges.push({ ...edge });
    });
  }

  protected syncPositionsFromD3() {
    this.d3Nodes.forEach((d3Node) => {
      const node = this.model.node(d3Node.id);
      if (node) {
        node.x = d3Node.x;
        node.y = d3Node.y;
        if (d3Node.z !== undefined) node.z = d3Node.z;
        // 同步固定位置属性
        if (d3Node.fx !== undefined) node.fx = d3Node.fx;
        if (d3Node.fy !== undefined) node.fy = d3Node.fy;
        if (d3Node.fz !== undefined) node.fz = d3Node.fz;
        // 同步速度属性
        if (d3Node.vx !== undefined) node.vx = d3Node.vx;
        if (d3Node.vy !== undefined) node.vy = d3Node.vy;
        if (d3Node.vz !== undefined) node.vz = d3Node.vz;
      }
    });
  }

  protected initSimulation() {
    return forceSimulation<NodeDatum, EdgeDatum>();
  }

  protected setSimulation(options: T) {
    const simulation =
      this.simulation || this.options.forceSimulation || this.initSimulation();

    if (!this.simulation) {
      this.simulation = simulation.on('tick', () => {
        this.syncPositionsFromD3();
        options.onTick?.(this);
      });
    }

    apply(
      simulation,
      this.config.simulationAttrs.map((name) => [
        name,
        options[name as keyof T],
      ]),
    );

    this.setupForces(simulation, options);

    return simulation;
  }

  protected setupForces(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    this.setupLinkForce(simulation, options);
    this.setupManyBodyForce(simulation, options);
    this.setupCenterForce(simulation, options);
    this.setupCollisionForce(simulation, options);
    this.setupXForce(simulation, options);
    this.setupYForce(simulation, options);
    this.setupRadialForce(simulation, options);
    this.setupClusterForce(simulation, options);
  }

  private getCenterOptions(options: T): D3ForceLayoutOptions['center'] {
    if (
      !options.width ||
      !options.height ||
      options.centerStrength !== undefined
    ) {
      const viewport = normalizeViewport({
        width: options.width,
        height: options.height,
      });
      return assignDefined({}, options.center, {
        x: viewport.width / 2,
        y: viewport.height / 2,
        strength: options.centerStrength,
      });
    }
    return undefined;
  }

  protected setupCenterForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const center = this.getCenterOptions(options);

    if (center) {
      let force = simulation.force('center');
      if (!force) {
        force = forceCenter(center.x, center.y);
        simulation.force('center', force as any);
      }

      const params: [string, any][] = [];
      if (center.x !== undefined) params.push(['x', center.x]);
      if (center.y !== undefined) params.push(['y', center.y]);
      if (center.strength !== undefined)
        params.push(['strength', center.strength]);

      apply(force, params);
    } else {
      simulation.force('center', null);
    }
  }

  private getManyBodyOptions(options: T): D3ForceLayoutOptions['manyBody'] {
    if (
      options.manyBody !== undefined ||
      options.nodeStrength !== undefined ||
      options.distanceMin !== undefined ||
      options.distanceMax !== undefined ||
      options.theta !== undefined
    ) {
      return assignDefined({}, options.manyBody, {
        strength: options.nodeStrength,
        distanceMin: options.distanceMin,
        distanceMax: options.distanceMax,
        theta: options.theta,
      });
    }
    return undefined;
  }

  protected setupManyBodyForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const manyBody = this.getManyBodyOptions(options);

    if (manyBody) {
      let force = simulation.force('charge');
      if (!force) {
        force = forceManyBody();
        simulation.force('charge', force as any);
      }

      const params: [string, any][] = [];

      if (manyBody.strength !== undefined)
        params.push(['strength', manyBody.strength]);
      if (manyBody.distanceMin !== undefined)
        params.push(['distanceMin', manyBody.distanceMin]);
      if (manyBody.distanceMax !== undefined)
        params.push(['distanceMax', manyBody.distanceMax]);
      if (manyBody.theta !== undefined) params.push(['theta', manyBody.theta]);

      apply(force, params);
    } else {
      simulation.force('charge', null);
    }
  }

  private getLinkOptions(options: T): D3ForceLayoutOptions['link'] {
    if (
      options.link ||
      options.edgeId !== undefined ||
      options.linkDistance !== undefined ||
      options.edgeStrength !== undefined ||
      options.edgeIterations !== undefined
    ) {
      return assignDefined({}, options.link, {
        id: options.edgeId,
        distance: options.linkDistance,
        strength: options.edgeStrength,
        iterations: options.edgeIterations,
      });
    }
    return undefined;
  }

  protected setupLinkForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const edges = this.model.edges();

    const link = this.getLinkOptions(options);

    if (edges.length > 0 && link) {
      let force = simulation.force<ForceLink<NodeDatum, EdgeDatum>>('link');
      if (!force) {
        force = forceLink<NodeDatum, EdgeDatum>();
        simulation.force('link', force);
      }

      const params: [string, any][] = [];
      if (link.id !== undefined) params.push(['id', link.id]);
      if (link.distance !== undefined) params.push(['distance', link.distance]);
      if (link.strength !== undefined) params.push(['strength', link.strength]);
      if (link.iterations !== undefined)
        params.push(['iterations', link.iterations]);

      apply(force, params);
    } else {
      simulation.force('link', null);
    }
  }

  private getCollisionOptions(options: T): D3ForceLayoutOptions['collide'] {
    if (!options.preventOverlap) return undefined;
    if (
      options.collide !== undefined ||
      options.nodeSize !== undefined ||
      options.nodeSpacing !== undefined ||
      options.collideStrength !== undefined ||
      options.collideIterations !== undefined
    ) {
      const radius =
        options.nodeSize || options.nodeSpacing
          ? (d: NodeDatum) =>
              formatNodeSizeFn(options.nodeSize, options.nodeSpacing)(d) / 2
          : undefined;

      return assignDefined({}, options.collide, {
        radius,
        strength: options.collideStrength,
        iterations: options.collideIterations,
      });
    }
    return undefined;
  }

  protected setupCollisionForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const collide = this.getCollisionOptions(options);

    if (collide) {
      let force = simulation.force('collide');
      if (!force) {
        force = forceCollide();
        simulation.force('collide', force as any);
      }

      const params: [string, any][] = [];

      if (collide.radius !== undefined) params.push(['radius', collide.radius]);
      if (collide.strength !== undefined)
        params.push(['strength', collide.strength]);
      if (collide.iterations !== undefined)
        params.push(['iterations', collide.iterations]);

      apply(force, params);
    } else {
      simulation.force('collide', null);
    }
  }

  private getXForceOptions(options: T): D3ForceLayoutOptions['x'] {
    if (
      options.x !== undefined ||
      options.forceXPosition !== undefined ||
      options.forceXStrength !== undefined ||
      options.width !== undefined ||
      options.height !== undefined
    ) {
      const center = this.getCenterOptions(options);
      return assignDefined({}, options.x, {
        x: options.forceXPosition ?? (center && center.x),
        strength: options.forceXStrength,
      });
    }
    return undefined;
  }

  protected setupXForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const x = this.getXForceOptions(options);

    if (x) {
      let force = simulation.force('x');
      if (!force) {
        force = forceX();
        simulation.force('x', force as any);
      }

      const params: [string, any][] = [];
      if (x.x !== undefined) params.push(['x', x.x]);
      if (x.strength !== undefined) params.push(['strength', x.strength]);

      apply(force, params);
    } else {
      simulation.force('x', null);
    }
  }

  private getYForceOptions(options: T): D3ForceLayoutOptions['y'] {
    if (
      options.y !== undefined ||
      options.forceYPosition !== undefined ||
      options.forceYStrength !== undefined ||
      options.width !== undefined ||
      options.height !== undefined
    ) {
      const center = this.getCenterOptions(options);
      return assignDefined({}, options.y, {
        y: options.forceYPosition ?? (center && center.y),
        strength: options.forceYStrength,
      });
    }

    return undefined;
  }

  protected setupYForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const y = this.getYForceOptions(options);
    if (y) {
      let force = simulation.force('y');
      if (!force) {
        force = forceY();
        simulation.force('y', force as any);
      }

      const params: [string, any][] = [];
      if (y.y !== undefined) params.push(['y', y.y]);
      if (y.strength !== undefined) params.push(['strength', y.strength]);

      apply(force, params);
    } else {
      simulation.force('y', null);
    }
  }

  private getRadialOptions(options: T): D3ForceLayoutOptions['radial'] {
    if (
      options.radial !== undefined ||
      options.radialStrength !== undefined ||
      options.radialRadius !== undefined ||
      options.radialX !== undefined ||
      options.radialY !== undefined
    ) {
      const center = this.getCenterOptions(options);
      return assignDefined({}, options.radial, {
        strength: options.radialStrength,
        radius: options.radialRadius ?? 100,
        x: options.radialX ?? (center && center.x),
        y: options.radialY ?? (center && center.y),
      });
    }
    return undefined;
  }

  protected setupRadialForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const radial = this.getRadialOptions(options);

    if (radial) {
      let force = simulation.force('radial');
      if (!force) {
        force = forceRadial(radial.radius, radial.x, radial.y);
        simulation.force('radial', force as any);
      }

      const params: [string, any][] = [];
      if (radial.radius !== undefined) params.push(['radius', radial.radius]);
      if (radial.strength !== undefined)
        params.push(['strength', radial.strength]);
      if (radial.x !== undefined) params.push(['x', radial.x]);
      if (radial.y !== undefined) params.push(['y', radial.y]);

      apply(force, params);
    } else {
      simulation.force('radial', null);
    }
  }

  protected setupClusterForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const { clustering } = options;

    if (clustering) {
      const {
        clusterFociStrength,
        clusterEdgeDistance,
        clusterEdgeStrength,
        clusterNodeStrength,
        clusterNodeSize,
        clusterBy,
      } = options;

      const center = this.getCenterOptions(options);

      let force = simulation.force('group');
      if (!force) {
        force = forceInABox();
        simulation.force('group', force as any);
      }

      apply(force, [
        ['centerX', center && center.x],
        ['centerY', center && center.y],
        ['template', 'force'],
        ['strength', clusterFociStrength],
        ['groupBy', clusterBy],
        ['nodes', this.model.nodes()],
        ['links', this.model.edges()],
        ['forceLinkDistance', clusterEdgeDistance],
        ['forceLinkStrength', clusterEdgeStrength],
        ['forceCharge', clusterNodeStrength],
        ['forceNodeSize', clusterNodeSize],
      ]);
    } else {
      simulation.force('group', null);
    }
  }
}

export const apply = (target: any, params: [string, any][]) => {
  return params.reduce((acc, [method, param]) => {
    if (!acc[method] || param === undefined) return acc;
    return acc[method].call(target, param);
  }, target);
};

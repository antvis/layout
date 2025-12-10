import { deepMix, isNil } from '@antv/util';
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
import type { Point } from '../types/point';
import type { Position } from '../types/position';
import { normalizeViewport } from '../util';
import { formatNodeSizeFn } from '../util/format';
import forceInABox from './force-in-a-box';
import type { D3ForceLayoutOptions, EdgeDatum, NodeDatum } from './types';

export type { D3ForceLayoutOptions };

const DEFAULTS_LAYOUT_OPTIONS: Partial<D3ForceLayoutOptions> = {
  centerStrength: 1,
  linkDistance: 30,
  nodeStrength: -30,
  edgeStrength: null,
  preventOverlap: true,
  nodeSize: 10,
  nodeSpacing: 0,
  collideStrength: 1,
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

  protected forceMap: Record<string, Function> = {
    link: forceLink,
    manyBody: forceManyBody,
    center: forceCenter,
    collide: forceCollide,
    radial: forceRadial,
    x: forceX,
    y: forceY,
    group: forceInABox,
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

    this.setupCenterForce(simulation, options);
    this.setupManyBodyForce(simulation, options);
    this.setupLinkForce(simulation, options);
    this.setupCollisionForce(simulation, options);
    this.setupXForce(simulation, options);
    this.setupYForce(simulation, options);
    this.setupRadialForce(simulation, options);
    this.setupClusterForce(simulation, options);

    return simulation;
  }

  protected setupCenterForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const opts = options as any;

    const centerStrength = opts.centerStrength ?? opts.center?.strength;
    const center = this.getCenterPoint(options);

    if (center) {
      let force = simulation.force('center');
      if (!force) {
        force = forceCenter(center[0], center[1]);
        simulation.force('center', force as any);
      }

      const params: [string, any][] = [
        ['x', center[0]],
        ['y', center[1]],
      ];
      if (centerStrength !== undefined)
        params.push(['strength', centerStrength]);

      apply(force, params);
    } else {
      simulation.force('center', null);
    }
  }

  protected setupManyBodyForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const opts = options as any;

    const nodeStrength = opts.nodeStrength ?? opts.manyBody?.strength;
    const distanceMin = opts.distanceMin ?? opts.manyBody?.distanceMin;
    const distanceMax = opts.distanceMax ?? opts.manyBody?.distanceMax;
    const theta = opts.theta ?? opts.manyBody?.theta;

    if (nodeStrength !== undefined || opts.manyBody) {
      let force = simulation.force('charge');
      if (!force) {
        force = forceManyBody();
        simulation.force('charge', force as any);
      }

      const params: [string, any][] = [];

      if (nodeStrength !== undefined) params.push(['strength', nodeStrength]);
      if (distanceMin !== undefined) params.push(['distanceMin', distanceMin]);
      if (distanceMax !== undefined) params.push(['distanceMax', distanceMax]);
      if (theta !== undefined) params.push(['theta', theta]);

      apply(force, params);
    } else {
      simulation.force('charge', null);
    }
  }

  protected setupLinkForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const opts = options as any;
    const edges = this.model.edges();

    const linkDistance = opts.linkDistance ?? opts.link?.distance;
    const edgeStrength = opts.edgeStrength ?? opts.link?.strength;
    const linkIterations = opts.linkIterations ?? opts.link?.iterations;
    const linkId = opts.link?.id;

    if (
      edges.length > 0 &&
      (linkDistance !== undefined || edgeStrength !== undefined || opts.link)
    ) {
      let force = simulation.force<ForceLink<NodeDatum, EdgeDatum>>('link');
      if (!force) {
        force = forceLink<NodeDatum, EdgeDatum>().id(
          linkId || ((d: any) => d.id),
        );
        simulation.force('link', force);
      }

      const params: [string, any][] = [];
      if (linkDistance !== undefined) params.push(['distance', linkDistance]);
      if (edgeStrength !== undefined) params.push(['strength', edgeStrength]);
      if (linkIterations !== undefined)
        params.push(['iterations', linkIterations]);

      apply(force, params);
    } else {
      simulation.force('link', null);
    }
  }

  protected setupCollisionForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const opts = options as any;

    const preventOverlap =
      opts.preventOverlap ??
      (opts.collide !== undefined && opts.collide !== false);
    const collideStrength = opts.collideStrength ?? opts.collide?.strength;
    const nodeSize = opts.nodeSize ?? opts.collide?.radius ?? 10;
    const nodeSpacing = opts.nodeSpacing ?? opts.collide?.nodeSpacing ?? 0;
    const collideIterations =
      opts.collideIterations ?? opts.collide?.iterations;

    if (preventOverlap) {
      const getRadius = (d: NodeDatum) => {
        const sizeFn = formatNodeSizeFn(nodeSize, nodeSpacing, 10);
        return sizeFn(d._original || d) / 2;
      };

      let force = simulation.force('collide');
      if (!force) {
        force = forceCollide(getRadius);
        simulation.force('collide', force as any);
      }

      const params: [string, any][] = [
        ['radius', getRadius],
        ['strength', collideStrength ?? 1],
      ];

      if (collideIterations !== undefined)
        params.push(['iterations', collideIterations]);

      apply(force, params);
    } else {
      simulation.force('collide', null);
    }
  }

  protected setupXForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const opts = options as any;

    const forceXStrength = opts.forceXStrength ?? opts.x?.strength;
    const forceXPosition = opts.forceXPosition ?? opts.x?.x;

    if (forceXStrength !== undefined || opts.x) {
      let force = simulation.force('x');
      if (!force) {
        force = forceX();
        simulation.force('x', force as any);
      }

      const params: [string, any][] = [];
      if (forceXPosition !== undefined) params.push(['x', forceXPosition]);
      if (forceXStrength !== undefined)
        params.push(['strength', forceXStrength]);

      apply(force, params);
    } else {
      simulation.force('x', null);
    }
  }

  protected setupYForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const opts = options as any;

    const forceYStrength = opts.forceYStrength ?? opts.y?.strength;
    const forceYPosition = opts.forceYPosition ?? opts.y?.y;

    if (forceYStrength !== undefined || opts.y) {
      let force = simulation.force('y');
      if (!force) {
        force = forceY();
        simulation.force('y', force as any);
      }

      const params: [string, any][] = [];
      if (forceYPosition !== undefined) params.push(['y', forceYPosition]);
      if (forceYStrength !== undefined)
        params.push(['strength', forceYStrength]);

      apply(force, params);
    } else {
      simulation.force('y', null);
    }
  }

  protected setupRadialForce(
    simulation: Simulation<NodeDatum, EdgeDatum>,
    options: T,
  ) {
    const opts = options as any;

    const radialStrength = opts.radialStrength ?? opts.radial?.strength;
    const radialRadius = opts.radialRadius ?? opts.radial?.radius;
    const radialX = opts.radialX ?? opts.radial?.x;
    const radialY = opts.radialY ?? opts.radial?.y;

    if (
      (radialRadius !== undefined && radialStrength !== undefined) ||
      opts.radial
    ) {
      const center = this.getCenterPoint(options);
      const x = !isNil(radialX) ? radialX : center[0];
      const y = !isNil(radialY) ? radialY : center[1];

      let force = simulation.force('radial');
      if (!force) {
        force = forceRadial(radialRadius ?? 100, x, y);
        simulation.force('radial', force as any);
      }

      const params: [string, any][] = [];
      if (radialRadius !== undefined) params.push(['radius', radialRadius]);
      if (radialStrength !== undefined)
        params.push(['strength', radialStrength]);
      if (radialX !== undefined) params.push(['x', radialX]);
      if (radialY !== undefined) params.push(['y', radialY]);

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

      const center = this.getCenterPoint(options);

      let force = simulation.force('group');
      if (!force) {
        force = forceInABox();
        simulation.force('group', force as any);
      }

      apply(force, [
        ['centerX', center[0]],
        ['centerY', center[1]],
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

  private getCenterPoint(options: T): Point {
    const viewport = normalizeViewport({
      width: options.width,
      height: options.height,
    });
    const vwCenter: Point = [viewport.width / 2, viewport.height / 2];
    const center: Point = options.center
      ? [
          options.center?.x ?? viewport.width / 2,
          options.center?.y ?? viewport.height / 2,
        ]
      : vwCenter;
    return center;
  }
}

const apply = (target: any, params: [string, any][]) => {
  return params.reduce((acc, [method, param]) => {
    if (!acc[method] || param === undefined) return acc;
    return acc[method].call(target, param);
  }, target);
};

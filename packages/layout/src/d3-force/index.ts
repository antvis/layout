import type { ID } from '@antv/graphlib';
import type { Force, ForceLink, Simulation } from 'd3-force';
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
import type { Position } from '../types/position';
import type { D3ForceLayoutOptions, EdgeDatum, NodeDatum } from './types';

export type { D3ForceLayoutOptions };

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
  };

  protected getDefaultOptions(): Partial<T> {
    return {
      link: {
        id: (d) => String(d.id),
      },
      manyBody: {},
      center: {
        x: 0,
        y: 0,
      },
    } as unknown as Partial<T>;
  }

  constructor(options?: Partial<T>) {
    super(options);

    if (this.options.forceSimulation) {
      this.simulation = this.options.forceSimulation;
    }
  }

  public stop() {
    if (this.simulation) {
      this.simulation.stop();
    }
  }

  public tick(iterations?: number): void {
    if (this.simulation) {
      this.simulation.tick(iterations);
      this.syncPositionsFromD3();
      this.options.onTick?.(this);
    }
  }

  public restart() {
    if (this.simulation) {
      this.simulation.restart();
    }
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

  protected getOptions(options: Partial<T>): T {
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
    const options = this.getOptions(this.options || {});
    this.options = options;

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

  private syncPositionsFromD3() {
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

    Object.entries(this.forceMap).forEach(([name, Ctor]) => {
      const forceName = name;
      if (options[name as keyof T]) {
        let force = simulation.force(forceName);
        if (!force) {
          force = Ctor();
          simulation.force(forceName, force as Force<NodeDatum, EdgeDatum>);
        }
        apply(force, Object.entries(options[forceName as keyof T] as object));
      } else simulation.force(forceName, null);
    });

    return simulation;
  }
}

const apply = (target: any, params: [string, any][]) => {
  return params.reduce((acc, [method, param]) => {
    if (!acc[method] || param === undefined) return acc;
    return acc[method].call(target, param);
  }, target);
};

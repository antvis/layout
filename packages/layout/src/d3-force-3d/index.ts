import { deepMix, pick } from '@antv/util';
import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceRadial,
  forceSimulation,
  forceX,
  forceY,
  forceZ,
} from 'd3-force-3d';
import type { Graph, LayoutMapping, LayoutWithIterations } from '../types';
import type {
  D3Force3DLayoutOptions,
  SimulationEdgeDatum,
  SimulationNodeDatum,
} from './types';

export class D3Force3DLayout
  implements LayoutWithIterations<D3Force3DLayoutOptions>
{
  public id = 'd3-force-3d';

  private simulation: ReturnType<typeof forceSimulation>;

  public options: Partial<D3Force3DLayoutOptions> = {
    numDimensions: 3,
    link: {
      id: (edge) => edge.id,
    },
    manyBody: {},
    center: {
      x: 0,
      y: 0,
      z: 0,
    },
  };

  private context: {
    assign: boolean;
    options: Partial<D3Force3DLayoutOptions>;
    nodes: SimulationNodeDatum[];
    edges: SimulationEdgeDatum[];
    graph?: Graph;
  } = {
    options: {},
    assign: false,
    nodes: [],
    edges: [],
  };

  constructor(options?: Partial<D3Force3DLayoutOptions>) {
    this.options = deepMix({}, this.options, options);
  }

  public async execute(
    graph: Graph,
    options?: D3Force3DLayoutOptions,
  ): Promise<LayoutMapping> {
    return this.genericLayout(false, graph, options);
  }

  public async assign(
    graph: Graph,
    options?: D3Force3DLayoutOptions,
  ): Promise<void> {
    await this.genericLayout(true, graph, options);
  }

  public stop() {
    this.simulation.stop();
  }

  public tick(iterations?: number): LayoutMapping {
    this.simulation.tick(iterations);
    return this.getResult();
  }

  public restart() {
    this.simulation.restart();
  }

  private getOptions(options: Partial<D3Force3DLayoutOptions>) {
    const _ = { ...this.options, ...options };
    // process nodeSize
    if (_.collide?.radius === undefined) {
      _.collide = _.collide || {};
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

    // assign to context
    this.context.options = _;
    return _;
  }

  private resolver: (value: LayoutMapping) => void;

  private async genericLayout(
    assign: boolean,
    graph: Graph,
    options?: D3Force3DLayoutOptions,
  ): Promise<LayoutMapping> {
    const _options = this.getOptions(options);

    const nodes = graph.getAllNodes().map(({ id, data }) => ({
      id,
      data,
      ...pick(data, ['x', 'y', 'z', 'vx', 'vy', 'vz', 'fx', 'fy', 'fz']),
    }));

    const edges = graph.getAllEdges().map((edge) => ({ ...edge }));

    Object.assign(this.context, { assign, nodes, edges, graph });

    const promise = new Promise<LayoutMapping>((resolver) => {
      this.resolver = resolver;
    });

    const simulation = this.initSimulation(_options);

    simulation.nodes(nodes);
    simulation.force<any>('link')?.links(edges);

    return promise;
  }

  private getResult(): LayoutMapping {
    const { assign, nodes, edges, graph } = this.context;

    const nodesResult = nodes.map((node) => ({
      id: node.id,
      data: {
        ...node.data,
        ...(pick<any>(node, ['x', 'y', 'z', 'vx', 'vy', 'vz']) as any),
      },
    }));

    const edgeResult = edges.map(({ id, source, target, data }) => ({
      id,
      source: source.id,
      target: target.id,
      data,
    }));

    if (assign) {
      nodesResult.forEach((node) => graph.mergeNodeData(node.id, node.data));
    }

    return { nodes: nodesResult, edges: edgeResult };
  }

  private initSimulation(options: D3Force3DLayoutOptions) {
    if (!this.simulation) {
      this.simulation = forceSimulation();
      this.simulation
        .on('tick', () => options.onTick?.(this.getResult()))
        .on('end', () => this.resolver?.(this.getResult()));
    }

    apply(this.simulation, [
      ['alpha', options.alpha],
      ['alphaMin', options.alphaMin],
      ['alphaDecay', options.alphaDecay],
      ['alphaTarget', options.alphaTarget],
      ['velocityDecay', options.velocityDecay],
      ['randomSource', options.randomSource],
      ['numDimensions', options.numDimensions],
    ]);

    const forceMap = {
      link: forceLink,
      manyBody: forceManyBody,
      center: forceCenter,
      collide: forceCollide,
      radial: forceRadial,
      x: forceX,
      y: forceY,
      z: forceZ,
    };

    Object.entries(forceMap).forEach(([name, Ctor]) => {
      const forceName = name as keyof typeof forceMap;
      if (name in options) {
        let force = this.simulation.force(forceName);
        if (!force) {
          force = Ctor();
          this.simulation.force(forceName, force);
        }
        apply(force, Object.entries(options[forceName]));
      } else this.simulation.force(forceName, null);
    });

    return this.simulation;
  }
}

const apply = (target: any, params: [string, any][]) => {
  return params.reduce((acc, [method, param]) => {
    if (!acc[method] || param === undefined) return acc;
    return acc[method].call(target, param);
  }, target);
};

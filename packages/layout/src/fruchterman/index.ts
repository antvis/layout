import { Graph as IGraph, ID } from '@antv/graphlib';
import type {
  EdgeData,
  Graph,
  LayoutMapping,
  LayoutWithIterations,
  OutEdge,
  OutNode,
  OutNodeData,
} from '../types';
import type { GraphData } from '../types/data';
import {
  applySingleNodeLayout,
  cloneFormatData,
  normalizeViewport,
  toGraph,
} from '../util';
import { Simulation } from './simulation';
import { FruchtermanLayoutOptions } from './types';

const DEFAULTS_LAYOUT_OPTIONS: Partial<FruchtermanLayoutOptions> = {
  maxIteration: 1000,
  gravity: 10,
  speed: 5,
  clustering: false,
  clusterGravity: 10,
  width: 300,
  height: 300,
  nodeClusterBy: 'cluster',
  dimensions: 2,
};

export type { FruchtermanLayoutOptions };

export class FruchtermanLayout
  implements LayoutWithIterations<FruchtermanLayoutOptions>
{
  public id = 'fruchterman';
  public options: Partial<FruchtermanLayoutOptions> = {};
  private simulation: Simulation | null = null;

  private resolver?: (value: LayoutMapping) => void;

  private calcGraph: IGraph<OutNodeData, EdgeData> | null = null;

  protected context: {
    assign: boolean;
    graph: Graph | null;
    nodes: OutNode[];
    edges: OutEdge[];
    options: any;
  } = {
    nodes: [],
    edges: [],
    assign: false,
    graph: null,
    options: {},
  };

  constructor(options?: Partial<FruchtermanLayoutOptions>) {
    this.options = { ...DEFAULTS_LAYOUT_OPTIONS, ...options };
  }

  public async execute(
    graph: GraphData | Graph,
    options?: FruchtermanLayoutOptions,
  ): Promise<LayoutMapping> {
    return this.genericLayout(false, toGraph(graph), options);
  }

  public async assign(
    graph: GraphData | Graph,
    options?: FruchtermanLayoutOptions,
  ): Promise<void> {
    await this.genericLayout(true, toGraph(graph), options);
  }

  public restart(): void {
    if (this.simulation) this.simulation.restart();
  }

  public stop(): void {
    if (this.simulation) this.simulation.stop();
  }

  public tick(iterations: number = 1): LayoutMapping {
    if (this.simulation) this.simulation.tick(iterations);

    return this.getResult();
  }

  public setFixedPosition(id: ID, position: (number | null)[]): void {
    if (this.simulation) this.simulation.setFixedPosition(id, position);
  }

  private getOptions(options?: Partial<FruchtermanLayoutOptions>): any {
    const mergedOptions = { ...this.options, ...options };
    const normalized = normalizeViewport(mergedOptions);

    const { clustering, nodeClusterBy } = mergedOptions;
    const clusteringEnabled = clustering && !!nodeClusterBy;
    const clusterByFunc =
      typeof nodeClusterBy === 'string'
        ? (node) => node.data?.[nodeClusterBy]
        : nodeClusterBy;

    return {
      ...DEFAULTS_LAYOUT_OPTIONS,
      ...mergedOptions,
      ...normalized,
      clustering: clusteringEnabled,
      nodeClusterBy: clusterByFunc,
    };
  }

  private async genericLayout(
    assign: true,
    graph: Graph,
    options?: FruchtermanLayoutOptions,
  ): Promise<void>;
  private async genericLayout(
    assign: false,
    graph: Graph,
    options?: FruchtermanLayoutOptions,
  ): Promise<LayoutMapping>;
  private async genericLayout(
    assign: boolean,
    graph: Graph,
    options?: FruchtermanLayoutOptions,
  ): Promise<LayoutMapping | void> {
    const opts = this.getOptions(options);
    const { dimensions, width, height, center } = opts;

    const nodes = graph.getAllNodes();
    const edges = graph.getAllEdges();

    if (!nodes?.length || nodes.length === 1) {
      applySingleNodeLayout(assign, graph, center, dimensions);
    }

    this.context = {
      assign,
      graph,
      nodes: nodes.map((node) =>
        cloneFormatData(node, [width, height]),
      ) as OutNode[],
      edges: edges,
      options: opts,
    };

    this.calcGraph = new IGraph<OutNodeData, EdgeData>({
      nodes: this.context.nodes,
      edges: this.context.edges,
    });

    const simulation = this.setSimulation();
    simulation.restart();

    return new Promise<LayoutMapping>((resolver) => {
      this.resolver = resolver;
    });
  }

  private setSimulation(): Simulation {
    const simulation =
      this.simulation || new Simulation(this.calcGraph, this.context.options);

    if (!this.simulation) {
      this.simulation = simulation
        .on('tick', () => this.context.options.onTick?.(this.getResult()))
        .on('end', () => this.resolver?.(this.getResult()));
    }

    return simulation;
  }

  private getResult(): LayoutMapping {
    const { nodes, graph, assign, edges, options } = this.context;
    const is3D = options.dimensions === 3;

    const nodesResult = nodes.map((node) => {
      const data: any = {
        ...node.data,
        x: node.data.x,
        y: node.data.y,
        ...(is3D ? { z: node.data.z } : {}),
      };

      return { ...node, data };
    });

    if (assign) {
      nodesResult.forEach(({ id, data }) => {
        graph.mergeNodeData(id, {
          x: data.x,
          y: data.y,
          ...(is3D ? { z: data.z } : {}),
        });
      });
    }

    return { nodes: nodesResult, edges };
  }
}

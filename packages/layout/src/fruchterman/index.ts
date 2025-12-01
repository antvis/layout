import { BaseLayoutWithIterations } from '../base-layout';
import type { GraphData, NodeData } from '../types/data';
import type { ID } from '../types/id';
import type { Position } from '../types/position';
import {
  applySingleNodeLayout,
  getNestedValue,
  normalizeViewport,
} from '../util';
import { LayoutModel } from '../util/model';
import { Simulation } from './simulation';
import type {
  FruchtermanLayoutOptions,
  NormalizedFruchtermanLayoutOptions,
} from './types';

export type { FruchtermanLayoutOptions };

export class FruchtermanLayout extends BaseLayoutWithIterations<FruchtermanLayoutOptions> {
  public id = 'fruchterman';

  private simulation: Simulation | null = null;

  protected getDefaultOptions(): Partial<FruchtermanLayoutOptions> {
    return {
      maxIteration: 1000,
      gravity: 10,
      speed: 5,
      clustering: false,
      clusterGravity: 10,
      width: 300,
      height: 300,
      nodeClusterBy: 'data.cluster',
      dimensions: 2,
      animate: true,
    };
  }

  protected normalizeOptions(
    options: FruchtermanLayoutOptions,
  ): NormalizedFruchtermanLayoutOptions {
    const { clustering, nodeClusterBy } = options;
    const clusteringEnabled = clustering && !!nodeClusterBy;
    const nodeClusterByFunc =
      typeof nodeClusterBy === 'string'
        ? (node: NodeData) => getNestedValue(node, nodeClusterBy)
        : nodeClusterBy!;

    return {
      ...options,
      ...normalizeViewport(options),
      clustering: clusteringEnabled,
      nodeClusterBy: nodeClusterByFunc,
    } as NormalizedFruchtermanLayoutOptions;
  }

  protected async layout(): Promise<void> {
    this.model.init();

    const opts = this.normalizeOptions(this.options);
    this.options = opts;

    const { dimensions, center, animate, maxIteration } = opts;

    const n = this.model.nodeCount();
    if (!n || n === 1) {
      applySingleNodeLayout(this.model, center, dimensions);
      return;
    }

    const simulation = this.setSimulation(this.model, opts);

    if (animate) {
      return new Promise<void>((resolve) => {
        simulation.restart();
        simulation.once('end', () => resolve());
      });
    } else {
      simulation.tick(maxIteration);
    }
  }

  private setSimulation(
    model: LayoutModel,
    options: NormalizedFruchtermanLayoutOptions,
  ): Simulation {
    const simulation = this.simulation || new Simulation(model, options);

    this.simulation = simulation.on('tick', () =>
      this.options.onTick?.(this.getResult()),
    );

    return simulation;
  }

  private getResult(): GraphData {
    return this.model.getGraphData();
  }

  public restart(): void {
    if (!this.simulation) {
      console.warn('Simulation instance does not exist.');
      return;
    }

    this.simulation.restart();
  }

  public stop(): void {
    if (this.simulation) this.simulation.stop();
  }

  public tick(iterations: number = 1): GraphData {
    if (this.simulation) {
      this.simulation.tick(iterations);
    }

    return this.getResult();
  }

  public setFixedPosition(id: ID, position: Position | null): void {
    if (this.simulation) {
      this.simulation.setFixedPosition(id, position);
    }
  }

  public destroy(): void {
    super.destroy();

    this.stop();

    if (this.simulation) {
      this.simulation.destroy();
      this.simulation = null;
    }
  }
}

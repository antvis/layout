import { initNodePosition } from '../../model/data';
import type { ID, NullablePosition } from '../../types';
import { applySingleNodeLayout, formatFn, normalizeViewport } from '../../util';
import { BaseLayoutWithIterations } from '../base-layout';
import { Simulation } from './simulation';
import type {
  FruchtermanLayoutOptions,
  ParsedFruchtermanLayoutOptions,
} from './types';

export type { FruchtermanLayoutOptions };

const DEFAULTS_LAYOUT_OPTIONS: Partial<FruchtermanLayoutOptions> = {
  maxIteration: 1000,
  gravity: 10,
  speed: 5,
  clustering: false,
  clusterGravity: 10,
  width: 300,
  height: 300,
  nodeClusterBy: 'node.cluster',
  dimensions: 2,
};

export class FruchtermanLayout extends BaseLayoutWithIterations<FruchtermanLayoutOptions> {
  public id = 'fruchterman';

  private simulation: Simulation | null = null;

  protected getDefaultOptions(): Partial<FruchtermanLayoutOptions> {
    return DEFAULTS_LAYOUT_OPTIONS;
  }

  protected parseOptions(
    options: Partial<FruchtermanLayoutOptions> = {},
  ): ParsedFruchtermanLayoutOptions {
    const { clustering, nodeClusterBy } = this.options;
    const clusteringEnabled = clustering && !!nodeClusterBy;

    Object.assign(options, normalizeViewport(options), {
      clustering: clusteringEnabled,
      nodeClusterBy: formatFn(nodeClusterBy, ['node']),
    });

    return options as ParsedFruchtermanLayoutOptions;
  }

  protected async layout(): Promise<void> {
    const options = this.parseOptions(this.options);

    const { dimensions, center, width, height } = options;

    const n = this.model.nodeCount();
    if (!n || n === 1) {
      applySingleNodeLayout(this.model, center, dimensions);
      return;
    }

    initNodePosition(this.model, width, height, dimensions);

    const simulation = this.setSimulation();

    simulation.data(this.model);
    simulation.initialize(options);
    simulation.restart();

    return new Promise<void>((resolve) => {
      simulation.on('end', () => resolve());
    });
  }

  private setSimulation() {
    const simulation = this.simulation || new Simulation();

    if (!this.simulation) {
      this.simulation = simulation.on('tick', () =>
        this.options.onTick?.(this),
      );
    }

    return this.simulation;
  }

  public restart(): void {
    this.simulation?.restart();
  }

  public stop(): void {
    this.simulation?.stop();
  }

  public tick(iterations: number = 1): void {
    this.simulation?.tick(iterations);
  }

  public setFixedPosition(id: ID, position: NullablePosition | null): void {
    this.simulation?.setFixedPosition(id, position);
  }

  public destroy(): void {
    super.destroy();

    this.stop();

    this.simulation?.destroy();
    this.simulation = null;
  }
}

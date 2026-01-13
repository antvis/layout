import { initNodePosition } from '../../model/data';
import type { ID, NullablePosition } from '../../types';
import { normalizeViewport } from '../../util';
import { applySingleNodeLayout } from '../../util/common';
import { formatNodeSizeFn } from '../../util/format';
import { BaseLayoutWithIterations } from '../base-layout';
import { Simulation } from './simulation';
import type {
  ForceAtlas2LayoutOptions,
  ParsedForceAtlas2LayoutOptions,
} from './types';

export type { ForceAtlas2LayoutOptions };

const DEFAULTS_LAYOUT_OPTIONS: Partial<ForceAtlas2LayoutOptions> = {
  nodeSize: 10,
  nodeSpacing: 0,
  width: 300,
  height: 300,
  kr: 5,
  kg: 1,
  mode: 'normal',
  preventOverlap: false,
  dissuadeHubs: false,
  maxIteration: 0,
  ks: 0.1,
  ksmax: 10,
  tao: 0.1,
};

type SizeMap = Record<string, number>;

export class ForceAtlas2Layout extends BaseLayoutWithIterations<ForceAtlas2LayoutOptions> {
  public id = 'force-atlas2';

  public simulation: Simulation | null = null;

  protected getDefaultOptions(): Partial<ForceAtlas2LayoutOptions> {
    return DEFAULTS_LAYOUT_OPTIONS;
  }

  protected async layout(options: ForceAtlas2LayoutOptions): Promise<void> {
    const merged = this.parseOptions(options);
    const { width, height, prune, center } = merged;

    const n = this.model.nodeCount();
    if (!n || n === 1) {
      return applySingleNodeLayout(this.model, center);
    }

    initNodePosition(this.model, width, height);

    const sizes = this.getSizes(merged.nodeSize, merged.nodeSpacing);

    const simulation = this.setSimulation();
    simulation.data(this.model, sizes);
    simulation.initialize(merged);
    simulation.restart();

    const run = () =>
      new Promise<void>((resolve) => {
        simulation.on('end', resolve);
      });

    if (!prune) return run();

    await run();

    // prune: 把叶子节点贴到父节点并再运行若干次以收敛
    if (prune) {
      const edges = this.model.edges();
      for (let j = 0; j < edges.length; j += 1) {
        const { source, target } = edges[j];
        const sourceDegree = this.model.degree(source);
        const targetDegree = this.model.degree(target);
        const sourceNode = this.model.node(source)!;
        const targetNode = this.model.node(target)!;
        if (sourceDegree <= 1) {
          sourceNode.x = targetNode.x;
          sourceNode.y = targetNode.y;
        } else if (targetDegree <= 1) {
          targetNode.x = sourceNode.x;
          targetNode.y = sourceNode.y;
        }
      }
      simulation.initialize({
        ...merged,
        prune: false,
        barnesHut: false,
      });
      simulation.tick(100);
    }
  }

  private getSizes(
    nodeSize?: ForceAtlas2LayoutOptions['nodeSize'],
    nodeSpacing?: ForceAtlas2LayoutOptions['nodeSpacing'],
  ): SizeMap {
    const result: SizeMap = {};

    const nodeSizeFn = formatNodeSizeFn(
      nodeSize,
      nodeSpacing,
      DEFAULTS_LAYOUT_OPTIONS.nodeSize as number,
      DEFAULTS_LAYOUT_OPTIONS.nodeSpacing as number,
    );

    this.model.forEachNode((node) => {
      result[node.id] = Math.max(...nodeSizeFn(node._original!));
    });
    return result;
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

  private parseOptions(
    options: ForceAtlas2LayoutOptions = {},
  ): ParsedForceAtlas2LayoutOptions {
    const { barnesHut, prune, maxIteration, kr, kg } = options;
    const auto: Partial<ForceAtlas2LayoutOptions> = {};

    const n = this.model.nodeCount();

    if (barnesHut === undefined && n > 250) auto.barnesHut = true;
    if (prune === undefined && n > 100) auto.prune = true;

    if (maxIteration === 0 && !prune) {
      auto.maxIteration = 250;
      if (n <= 200 && n > 100) auto.maxIteration = 1000;
      else if (n > 200) auto.maxIteration = 1200;
    } else if (maxIteration === 0 && prune) {
      auto.maxIteration = 100;
      if (n <= 200 && n > 100) auto.maxIteration = 500;
      else if (n > 200) auto.maxIteration = 950;
    }

    if (!kr) {
      auto.kr = 50;
      if (n > 100 && n <= 500) auto.kr = 20;
      else if (n > 500) auto.kr = 1;
    }
    if (!kg) {
      auto.kg = 20;
      if (n > 100 && n <= 500) auto.kg = 10;
      else if (n > 500) auto.kg = 1;
    }

    return {
      ...options,
      ...auto,
      ...normalizeViewport(options),
    } as ParsedForceAtlas2LayoutOptions;
  }

  public stop(): void {
    this.simulation?.stop();
  }

  public tick(iterations: number = 1): void {
    this.simulation?.tick(iterations);
  }

  public restart(): void {
    this.simulation?.restart();
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

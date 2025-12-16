import { BaseLayoutWithIterations } from '../base-layout';
import type { Node } from '../types';
import type { ID } from '../types/id';
import type { NullablePosition } from '../types/position';
import type { Size } from '../types/size';
import { initModelNodePosition, normalizeViewport } from '../util';
import { applySingleNodeLayout } from '../util/common';
import { formatNodeSizeFn, formatNumberFn, formatSizeFn } from '../util/format';
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
  public id = 'forceAtlas2';

  public simulation: Simulation | null = null;

  protected getDefaultOptions(): Partial<ForceAtlas2LayoutOptions> {
    return DEFAULTS_LAYOUT_OPTIONS;
  }

  protected async layout(options: ForceAtlas2LayoutOptions): Promise<void> {
    const merged = this.parseOptions(options);
    const { width, height, prune, maxIteration, center, animate } = merged;

    const n = this.model.nodeCount();
    if (!n || n === 1) {
      return applySingleNodeLayout(this.model, center);
    }

    initModelNodePosition(this.model, width, height);

    const sizes = this.getSizes(merged.nodeSize, merged.nodeSpacing);

    // Create or update simulation
    this.simulation = this.setSimulation(this.model, merged, sizes);

    if (animate) {
      return new Promise<void>((resolve) => {
        this.simulation!.restart();
        this.simulation!.once('end', () => resolve());
      });
    } else {
      this.simulation.tick(maxIteration);
    }

    // prune: 把叶子节点贴到父节点并再运行若干次以收敛
    if (prune) {
      const edges = this.model.edges();
      for (let j = 0; j < edges.length; j += 1) {
        const { source, target } = edges[j];
        const sourceDegree = this.model.degree(source);
        const targetDegree = this.model.degree(target);
        const sourceNode = this.model.node(source);
        const targetNode = this.model.node(target);
        if (sourceDegree <= 1) {
          sourceNode.x = targetNode.x;
          sourceNode.y = targetNode.y;
        } else if (targetDegree <= 1) {
          targetNode.x = sourceNode.x;
          targetNode.y = sourceNode.y;
        }
      }
      this.simulation = this.setSimulation(
        this.model,
        {
          ...merged,
          prune: false,
          barnesHut: false,
        },
        sizes,
      );
      this.simulation.tick(100);
    }
  }

  private getSizes(
    nodeSize?: Size | ((d?: Node) => Size),
    nodeSpacing?: number | ((d?: Node) => number),
  ): SizeMap {
    const result: SizeMap = {};
    this.model.forEachNode((node) => {
      const nodeSizeFn = formatNodeSizeFn(nodeSize, nodeSpacing);
      result[node.id] = nodeSizeFn(node._original);
    });
    return result;
  }

  private setSimulation(
    model: any,
    options: ParsedForceAtlas2LayoutOptions,
    sizes: SizeMap,
  ) {
    if (!this.simulation) {
      this.simulation = new Simulation(model, options, sizes);
    } else {
      this.simulation.update(model, options, sizes);
      this.simulation.off('tick');
    }

    this.simulation.on('tick', () => options.onTick?.(this));

    return this.simulation;
  }

  private parseOptions(
    options: ForceAtlas2LayoutOptions = {},
  ): ParsedForceAtlas2LayoutOptions {
    const { barnesHut, prune, maxIteration, kr, kg, nodeSize, nodeSpacing } =
      options;
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
      nodeSize: formatSizeFn(
        nodeSize,
        DEFAULTS_LAYOUT_OPTIONS.nodeSize as number,
      ),
      nodeSpacing: formatNumberFn(
        nodeSpacing,
        DEFAULTS_LAYOUT_OPTIONS.nodeSpacing as number,
      ),
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

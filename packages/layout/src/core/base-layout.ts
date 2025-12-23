import { Supervisor } from '../supervisor';
import type { GraphData, LayoutEdge, LayoutNode, Point } from '../types';
import { mergeOptions } from '../util';
import { LayoutModel } from '../util/model';
import type { BaseLayoutOptions, Layout, LayoutWithIterations } from './types';

export type { BaseLayoutOptions };

/**
 * <zh/> 布局基类
 *
 * <en/> Base class for layouts
 */
export abstract class BaseLayout<
  O extends BaseLayoutOptions = BaseLayoutOptions,
> implements Layout<O>
{
  public abstract readonly id: string;

  protected abstract getDefaultOptions(): O;

  protected initialOptions!: O;

  protected runtimeOptions!: O;

  protected model!: LayoutModel;

  protected supervisor: Supervisor | null = null;

  constructor(options?: Partial<O>) {
    this.initialOptions = mergeOptions<O>(this.getDefaultOptions(), options);
  }

  get options(): O {
    return this.runtimeOptions || this.initialOptions;
  }

  public async execute(
    data: GraphData,
    userOptions?: Partial<O>,
  ): Promise<void> {
    this.runtimeOptions = mergeOptions<O>(this.initialOptions, userOptions);
    const { node, edge, enableWorker } = this.runtimeOptions;

    this.model = new LayoutModel(data, { node, edge });

    const shouldUseWorker = enableWorker && typeof Worker !== 'undefined';
    if (shouldUseWorker) {
      await this.layoutInWorker(data, this.runtimeOptions);
    } else {
      await this.layout(this.runtimeOptions);
    }
  }

  protected abstract layout(options: O): Promise<void>;

  protected async layoutInWorker(data: GraphData, options: O): Promise<void> {
    try {
      if (!this.supervisor) {
        this.supervisor = new Supervisor();
      }

      const result = await this.supervisor.execute(this.id, data, options);
      this.model?.apply(result);
    } catch (error) {
      console.error(
        'Layout in worker failed, fallback to main thread layout.',
        error,
      );

      // Fallback to main thread layout
      await this.layout(options);
    }
  }

  public forEachNode(callback: (node: LayoutNode, index: number) => void) {
    this.model.forEachNode(callback);
  }

  public forEachEdge(callback: (edge: LayoutEdge, index: number) => void) {
    this.model.forEachEdge((edge, i) => {
      edge.sourceNode = this.model.nodeMap.get(edge.source);
      edge.targetNode = this.model.nodeMap.get(edge.target);
      callback(edge, i);
    });
  }

  public destroy(): void {
    this.model?.destroy();
    // @ts-ignore
    this.model = null;

    if (this.supervisor) {
      this.supervisor.destroy();
      this.supervisor = null;
    }
  }
}

/**
 * 迭代布局基类
 */
export abstract class BaseLayoutWithIterations<
  O extends BaseLayoutOptions = BaseLayoutOptions,
> extends BaseLayout<O> {
  abstract stop(): void;

  abstract tick(iterations: number): void;

  abstract restart(): void;

  abstract setFixedPosition(nodeId: string, position: Point | null): void;

  /**
   * 在 worker 中停止布局
   */
  protected async stopInWorker(): Promise<void> {
    if (this.supervisor) {
      await this.supervisor.stop();
    }
  }

  /**
   * 在 worker 中执行迭代
   */
  protected async tickInWorker(iterations?: number): Promise<void> {
    if (this.supervisor) {
      const result = await this.supervisor.tick(iterations);
      if (result) {
        this.model?.apply(result);
      }
    }
  }
}

/**
 * 判断布局是否为迭代布局
 */
export function isLayoutWithIterations(
  layout: any,
): layout is LayoutWithIterations {
  return !!layout.tick && !!layout.stop;
}

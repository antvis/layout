import type { GraphLib } from '../model/data';
import { RuntimeContext } from '../runtime/context';
import { Supervisor } from '../runtime/supervisor';
import type { GraphData, GraphEdge, GraphNode, Point } from '../types';
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

  protected context!: RuntimeContext;

  protected model!: GraphLib;

  protected supervisor: Supervisor | null = null;

  constructor(options?: Partial<O>) {
    this.initialOptions = this.mergeOptions<O>(
      this.getDefaultOptions(),
      options,
    );
  }

  get options(): O {
    return this.runtimeOptions || this.initialOptions;
  }

  protected mergeOptions<O>(base: O, patch?: Partial<O>): O {
    return Object.assign({}, base, patch || {});
  }

  public async execute(
    data: GraphData,
    userOptions?: Partial<O>,
  ): Promise<void> {
    this.runtimeOptions = this.mergeOptions<O>(
      this.initialOptions,
      userOptions,
    );
    const { node, edge, enableWorker } = this.runtimeOptions;

    this.context = new RuntimeContext(data, { node, edge });
    this.model = this.context.graph;

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
      this.context?.replace(result);
    } catch (error) {
      console.error(
        'Layout in worker failed, fallback to main thread layout.',
        error,
      );

      // Fallback to main thread layout
      await this.layout(options);
    }
  }

  public forEachNode(callback: (node: GraphNode, index: number) => void) {
    this.context.forEachNode(callback);
  }

  public forEachEdge(callback: (edge: GraphEdge, index: number) => void) {
    this.context.forEachEdge(callback);
  }

  public destroy(): void {
    this.context?.destroy();
    // @ts-ignore
    this.model = null;
    // @ts-ignore
    this.context = null;

    if (this.supervisor) {
      this.supervisor.destroy();
      this.supervisor = null;
    }
  }
}

/**
 * <zh/> 迭代布局基类
 *
 * <en/> Base class for iterative layouts
 */
export abstract class BaseLayoutWithIterations<
  O extends BaseLayoutOptions = BaseLayoutOptions,
> extends BaseLayout<O> {
  abstract stop(): void;

  abstract tick(iterations: number): void;

  abstract restart(): void;

  abstract setFixedPosition(nodeId: string, position: Point | null): void;
}

/**
 * <zh/> 判断布局是否为迭代布局
 *
 * <en/> Determine whether the layout is an iterative layout
 */
export function isLayoutWithIterations(
  layout: any,
): layout is LayoutWithIterations {
  return !!layout.tick && !!layout.stop;
}

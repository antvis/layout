import { Remote, wrap } from 'comlink';
import type {
  GraphData,
  LayoutData,
  LayoutEdge,
  LayoutNode,
  PlainObject,
  Point,
} from '../types';
import { mergeOptions } from '../util';
import { LayoutModel } from '../util/model';
import type { BaseLayoutOptions, Layout, LayoutWithIterations } from './types';

export type { BaseLayoutOptions };

interface LayoutWorker {
  execute(
    id: string,
    data: GraphData,
    config: PlainObject,
  ): Promise<LayoutData>;
  stop(): Promise<void>;
  tick(iterations?: number): Promise<LayoutData | void>;
  destroy(): Promise<void>;
}

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

  protected worker: Worker | null = null;
  protected workerApi: Remote<LayoutWorker> | null = null;

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
    const { node, edge, workerEnabled } = this.runtimeOptions;

    this.model = new LayoutModel(data, { node, edge });

    const shouldUseWorker = workerEnabled && typeof Worker !== 'undefined';
    if (shouldUseWorker) {
      await this.layoutInWorker(data, this.runtimeOptions);
    } else {
      await this.layout(this.runtimeOptions);
    }
  }

  protected abstract layout(options: O): Promise<void>;

  protected async layoutInWorker(data: any, options: O): Promise<void> {
    try {
      if (!this.worker) {
        const workerPath =
          this.runtimeOptions.workerScriptURL ||
          new URL('../worker.js', import.meta.url);
        this.worker = new Worker(workerPath, { type: 'module' });
        this.workerApi = wrap<LayoutWorker>(this.worker);

        const result = await this.workerApi.execute(this.id, data, options);
        this.model?.apply(result);
      }
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

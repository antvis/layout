import type { GraphData, LayoutEdge, LayoutNode } from '../types/data';
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

  constructor(options?: Partial<O>) {
    this.initialOptions = this.mergeOptions(this.getDefaultOptions(), options);
  }

  get options(): O {
    return this.runtimeOptions || this.initialOptions;
  }

  public async execute(
    data: GraphData,
    userOptions?: Partial<O>,
  ): Promise<void> {
    this.runtimeOptions = this.mergeOptions(this.initialOptions, userOptions);

    this.model = new LayoutModel(data, {
      node: this.runtimeOptions.node,
      edge: this.runtimeOptions.edge,
    });

    await this.layout(this.runtimeOptions);
  }

  protected mergeOptions(base: O, patch?: Partial<O>): O {
    return Object.assign({}, base, patch || {});
  }

  protected abstract layout(options: O): Promise<void>;

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
  >
  extends BaseLayout<O>
  implements LayoutWithIterations<O>
{
  abstract stop(): void;

  abstract tick(iterations: number): void;
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

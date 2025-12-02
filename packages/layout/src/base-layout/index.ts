import type { GraphData, LayoutEdge, LayoutNode } from '../types/data';
import { LayoutModel } from '../util/model';
import type { BaseLayoutOptions, Layout, LayoutWithIterations } from './types';

export type { BaseLayoutOptions };

/**
 * Base class for layout algorithms
 */
export abstract class BaseLayout<
  O extends BaseLayoutOptions = BaseLayoutOptions,
> implements Layout<O>
{
  public abstract readonly id: string;

  public options: O;

  protected model: LayoutModel;

  protected abstract getDefaultOptions(): Partial<O>;

  constructor(options?: Partial<O>) {
    this.options = Object.assign({}, this.getDefaultOptions(), options) as O;
  }

  public async execute(data: GraphData, options?: Partial<O>): Promise<void> {
    Object.assign(this.options, options);

    this.model = new LayoutModel(data, {
      node: this.options.node,
      edge: this.options.edge,
    });

    try {
      await this.layout();
    } catch (error) {
      throw new Error(`Layout ${this.id} failed`, { cause: error });
    }
  }

  protected abstract layout(): Promise<void>;

  public forEachNode(callback: (node: LayoutNode) => void) {
    this.model.nodeMap.forEach(callback);
  }

  public forEachEdge(callback: (edge: LayoutEdge) => void) {
    this.model.edgeMap.forEach((edge) => {
      edge.sourceNode = this.model.nodeMap.get(edge.source);
      edge.targetNode = this.model.nodeMap.get(edge.target);
      callback(edge);
    });
  }

  public destroy(): void {
    this.model?.destroy();
    // @ts-ignore
    this.model = null;
  }
}

export abstract class BaseLayoutWithIterations<
    O extends BaseLayoutOptions = BaseLayoutOptions,
  >
  extends BaseLayout<O>
  implements LayoutWithIterations<O>
{
  abstract stop(): void;

  abstract tick(iterations: number): void;
}

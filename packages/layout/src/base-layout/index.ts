import type { GraphData } from '../types/data';
import { LayoutModel } from '../util/model';
import type { BaseLayoutOptions, Layout, LayoutWithIterations } from './types';

export type { BaseLayoutOptions };

/**
 * Base class for layout algorithms
 */
export abstract class BaseLayout<
  O extends BaseLayoutOptions = BaseLayoutOptions,
> implements Layout<BaseLayoutOptions>
{
  /** Unique identifier for the layout algorithm */
  public abstract readonly id: string;

  /** Current effective options */
  public options!: O;

  /** Layout data model that manages the layout state of nodes and edges */
  protected model!: LayoutModel;

  /**
   * Subclasses must implement this method to return default options
   * @returns Default options object
   */
  protected abstract getDefaultOptions(): Partial<O>;

  constructor(options?: Partial<O>) {
    this.options = Object.assign({}, this.getDefaultOptions(), options) as O;
  }

  /**
   * Execute layout and directly modify the original graph data
   * @param data - Graph data
   * @param runtimeOptions - Runtime options that will override initial options
   */
  public async assign(data: GraphData, options?: Partial<O>): Promise<void> {
    await this.executeLayout(data, options);
    this.model.syncToGraphData();
  }

  /**
   * Execute layout and return new graph data (without modifying original data)
   * @param data - Graph data
   * @param runtimeOptions - Runtime options that will override initial options
   * @returns New graph data with layout results
   */
  public async execute(
    data: GraphData,
    options?: Partial<O>,
  ): Promise<GraphData> {
    await this.executeLayout(data, options);
    return this.model.getGraphData();
  }

  /**
   * Core layout execution flow
   * @param data - Graph data
   */
  protected async executeLayout(
    data: GraphData,
    options?: Partial<O>,
  ): Promise<void> {
    Object.assign(this.options, options);

    this.model = new LayoutModel(data, {
      nodeFields: this.options.nodeFields,
      edgeFields: this.options.edgeFields,
      width: this.options.width,
      height: this.options.height,
    });

    try {
      await this.layout();
    } catch (error) {
      throw new Error(`Layout ${this.id} failed`, { cause: error });
    }
  }

  /**
   * Subclasses must implement this method to execute the specific layout algorithm
   */
  protected abstract layout(): Promise<void>;

  /**
   * Destroy the layout instance and release resources
   */
  public destroy(): void {
    this.model?.destroy();
    this.model = null as unknown as LayoutModel;
  }
}

/**
 * Base class for iterative layouts, used for force-directed and other algorithms requiring multiple iterations
 * @template O - Layout options type
 */
export abstract class BaseLayoutWithIterations<
    O extends BaseLayoutOptions = BaseLayoutOptions,
  >
  extends BaseLayout<O>
  implements LayoutWithIterations<O>
{
  /**
   * Restart the layout computation
   */
  public abstract restart(): void;

  /**
   * Stop the layout computation
   */
  public abstract stop(): void;

  /**
   * Execute a specified number of iterations
   * @param iterations - Number of iterations
   * @returns Current layout result
   */
  public abstract tick(iterations?: number): GraphData;
}

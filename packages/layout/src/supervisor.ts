import EventEmitter from '@antv/event-emitter';
import { Edge, Graph, Node } from '@antv/graphlib';
import { isFunction } from '@antv/util';
import * as Comlink from 'comlink';
import type { Layout, LayoutSupervisor } from './types';

/**
 * The payload transferred from main thread to the worker.
 */
export interface Payload {
  layout: {
    id: string;
    options: any;
    iterations: number;
  };
  nodes: Node<any>[];
  edges: Edge<any>[];
}

export interface SupervisorOptions {
  /**
   * Iterations run in algorithm such as d3force, will be passed in `tick()` later.
   */
  iterations: number;
}

/**
 * @example
 * const graph = new Graph();
 * const layout = new CircularLayout();
 *
 * const supervisor = new Supervisor(graph, layout, { iterations: 1000 });
 * const positions = await supervisor.execute();
 * supervisor.stop();
 * supervisor.kill();
 */
export class Supervisor extends EventEmitter implements LayoutSupervisor {
  /**
   * Internal worker.
   */
  private proxy: Comlink.Remote<any>;

  /**
   * Flag of running state.
   */
  private running: boolean;

  constructor(
    private graph: Graph<any, any>,
    private layout: Layout<any>,
    private options?: Partial<SupervisorOptions>,
  ) {
    super();

    this.spawnWorker();
  }

  spawnWorker() {
    this.proxy = Comlink.wrap(
      // @ts-ignore
      new Worker(new URL('./worker.js', import.meta.url), { type: 'module' }),
    );

    if (this.running) {
      this.running = false;
      this.execute();
    }
  }

  async execute() {
    if (this.running) return this;

    this.running = true;

    // Payload should include nodes & edges(if needed).
    const { onTick, ...rest } = this.layout.options;
    const noFunctionOptions: any = {};
    Object.keys(rest).forEach((name) => {
      if (!isFunction(rest[name])) noFunctionOptions[name] = rest[name];
    });
    const payload = {
      layout: {
        id: this.layout.id,
        options: noFunctionOptions,
        iterations: this.options?.iterations,
      },
      nodes: this.graph.getAllNodes(),
      edges: this.graph.getAllEdges(),
    };

    /**
     * TODO: Convert graph object to linear memory(e.g. csr, adjacency matrix), then transfer the ownership to worker.
     * @example
     * const arraybufferWithNodesEdges = graphToByteArrays(this.graph); // Float32Array
     */
    const arraybufferWithNodesEdges = new Float32Array([0]);

    // TODO: Support transferables.
    // @see https://www.npmjs.com/package/@naoak/workerize-transferable
    // setupTransferableMethodsOnMain(this.worker, {
    //   calculateLayout: {
    //     // pick a transferable object from the method parameters
    //     pickTransferablesFromParams: (params) => [params[1].buffer],
    //   },
    // });

    const [positions] = await this.proxy.calculateLayout(payload, [
      arraybufferWithNodesEdges,
    ]);

    return positions;
  }

  stop() {
    this.running = false;

    // trigger `layout.stop()` if needed
    this.proxy.stopLayout();

    return this;
  }

  kill() {
    // allow the GC to collect wrapper port
    // @see https://github.com/GoogleChromeLabs/comlink#comlinkreleaseproxy
    this.proxy[Comlink.releaseProxy]();

    // TODO: unbind listeners on graph.

    // TODO: release attached memory
  }

  isRunning() {
    return this.running;
  }
}

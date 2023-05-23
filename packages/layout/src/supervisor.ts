import EventEmitter from "eventemitter3";
import { Graph, Node, Edge } from "@antv/graphlib";
import * as Comlink from "comlink";
import type { Layout, LayoutSupervisor } from "./types";

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

interface SupervisorOptions {
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
  private worker: any;

  /**
   * Flag of running state.
   */
  private running: boolean;

  constructor(
    private graph: Graph<any, any>,
    private layout: Layout<any>,
    private options?: Partial<SupervisorOptions>
  ) {
    super();

    this.spawnWorker();
  }

  spawnWorker() {
    if (this.worker) {
      this.worker.terminate();
    }

    /**
     * Worker function
     */
    // this.worker = this.createWorker(workerFunctionString);
    // this.worker.addEventListener('message', this.handleWorkerMessage);

    // Use workerize-loader to create WebWorker.
    // @see https://github.com/developit/workerize-loader
    this.worker = Comlink.wrap(
      // @ts-ignore
      new Worker(new URL("./worker.js", import.meta.url), {
        type: "module",
      })
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
    const payload = {
      layout: {
        id: this.layout.id,
        options: rest,
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

    const [positions] = await this.worker.calculateLayout(payload, [
      arraybufferWithNodesEdges,
    ]);

    return positions;
  }

  stop() {
    this.running = false;

    // trigger `layout.stop()` if needed
    this.worker.stopLayout();

    return this;
  }

  kill() {
    // if (this.worker) {
    //   this.worker.terminate();
    // }

    // TODO: unbind listeners on graph.

    // TODO: release attached memory
  }

  isRunning() {
    return this.running;
  }
}

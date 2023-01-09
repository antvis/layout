import EventEmitter from 'eventemitter3';
import { Graph, Node, Edge } from "@antv/graphlib";
import type { LayoutMapping, SyncLayout, LayoutSupervisor } from "./types";
// @ts-ignore
// Inline the worker as a Blob. @see https://github.com/developit/workerize-loader#inline
import worker from "workerize-loader?inline!./worker";
// import { setupTransferableMethodsOnMain } from "@naoak/workerize-transferable";

/**
 * The payload transferred from main thread to the worker.
 */
export interface Payload {
  layout: {
    id: string;
    options: any;
  };
  nodes: Node<any>[];
  edges: Edge<any>[];
}

// tslint:disable-next-line: variable-name
export const SupervisorEvent = {
  /**
   * Get triggerred when each iteration finished.
   */
  LAYOUT_ITERATION: 'tick',

  /**
   * Get triggerred when layout calculation is done.
   */
  LAYOUT_END: 'layoutend',
};

/**
 * @example
 * const graph = new Graph();
 * const layout = new CircularLayout();
 * 
 * const supervisor = new Supervisor(graph, layout, { auto: true });
 * supervisor.start();
 * supervisor.stop();
 * supervisor.kill();
 * 
 * // lifecycle
 * supervisor.on('tick', () => {
 * });
 * supervisor.on('layoutend', () => {
 * });
 * 
 * // Re-layout when graph changed.
 * graph.addNodes([{ id: 'node1' }, { id: 'node2' }]);
 * 
 * // TODO: Custom layout.
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
    private layout: SyncLayout<any>, 
    options: {
      auto: boolean; // 默认手动模式
    }
  ) {
    super();

    // TODO: listen to the graph-changed events.
    // optional.
    // forcelayout
    // graph.onChanged = (e) => {
    //   // node/edge added/dropped
    // };

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
    this.worker = worker();

    if (this.running) {
      this.running = false;
      this.start();
    }
  }

  start() {
    if (this.running) return this;

    this.running = true;

    // Payload should include nodes & edges(if needed).
    const payload = {
      layout: {
        id: this.layout.id,
        options: this.layout.options,
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

    this.worker.calculateLayout(payload, [arraybufferWithNodesEdges]).then(([positions, transferables]: [LayoutMapping, Float32Array[]]) => {
      this.emit(SupervisorEvent.LAYOUT_END, positions);
    });

    return this;
  }

  stop() {
    this.running = false;
    return this;
  }

  kill() {
    if (this.worker) {
      this.worker.terminate();
    }

    // TODO: unbind listeners on graph.

    // TODO: release attached memory
  }

  isRunning() {
    return this.running;
  }
}

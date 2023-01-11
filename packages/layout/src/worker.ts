import { Graph } from "@antv/graphlib";
// import { setupTransferableMethodsOnWorker } from "@naoak/workerize-transferable";
import { registry } from "./registry";
import type { Payload } from "./supervisor";
import type { LayoutMapping, SyncLayout } from "./types";

// @see https://www.npmjs.com/package/@naoak/workerize-transferable
// setupTransferableMethodsOnWorker({
//   // The name of function which use some transferables.
//   calculateLayout: {
//     // Specify an instance of the function
//     fn: calculateLayout,
//     // Pick a transferable object from the result which is an instance of Float32Array
//     pickTransferablesFromResult: (result) => [result[1].buffer],
//   },
// });

export async function calculateLayout(payload: Payload, transferables: Float32Array[]) {
  const { layout: { id, options }, nodes, edges } = payload;

  // Sync graph on the worker side.
  // TODO: Use transferable objects like ArrayBuffer for nodes & edges, 
  // in which case we don't need the whole graph.
  // @see https://github.com/graphology/graphology/blob/master/src/layout-noverlap/webworker.tpl.js#L32
  const graph = new Graph({
    nodes,
    edges,
  });

  /**
   * Create layout instance on the worker side.
   */
  let layout: SyncLayout<any>;
  let positions: LayoutMapping;
  const layoutCtor = registry[id];
  if (layoutCtor) {
    layout = new layoutCtor(options);
  } else {
    throw new Error(`Unknown layout id: ${id}`);
  }

  return new Promise((resolve) => {
    // Do calculation.
    positions = layout.execute(graph, {
      onLayoutEnd: () => {
        resolve([positions, transferables]);
      }
    });
  });
}

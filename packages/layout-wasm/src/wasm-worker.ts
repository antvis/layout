import * as Comlink from "comlink";
import type { ForceAtlas2Options } from "./interface";

// Wrap wasm-bindgen exports (the `generate` function) to add time measurement.
function wrapExports({ forceAtlas2 }: any) {
  return {
    forceAtlas2: (options: ForceAtlas2Options) => {
      const positions = forceAtlas2(options);
      return {
        // Little perf boost to transfer data to the main thread w/o copying.
        positions: Comlink.transfer(positions, [positions]),
      };
    },
  };
}

async function initHandlers(useMultiThread: boolean) {
  if (useMultiThread) {
    // @ts-ignore
    const multiThread = await import("../pkg-parallel/antv_layout_wasm.js");
    await multiThread.default();
    await multiThread.initThreadPool(navigator.hardwareConcurrency);
    return Comlink.proxy(wrapExports(multiThread));
  } else {
    // @ts-ignore
    const singleThread = await import("../pkg/antv_layout_wasm.js");
    await singleThread.default();
    return Comlink.proxy(wrapExports(singleThread));
  }
}

Comlink.expose(initHandlers);

import * as Comlink from "comlink";
import type {
  ForceLayoutOptions,
  Forceatlas2LayoutOptions,
  Force2LayoutOptions,
  FruchtermanLayoutOptions,
} from "./interface";

const DEFAULT_LAYOUT_OPTIONS = {
  ka: 0,
  kg: 0,
  kr: 0,
  speed: 0,
  prevent_overlapping: false,
  kr_prime: 0,
  node_radius: 0,
  strong_gravity: false,
  lin_log: false,
  dissuade_hubs: false,
  edge_strength: 0,
  link_distance: 0,
  node_strength: 0,
  coulomb_dis_scale: 0,
  factor: 0,
  interval: 0,
  damping: 0,
  center: [0, 0],
};

const wrapTransfer = <T extends ForceLayoutOptions>(
  name: number,
  force: any
) => {
  return (options: T) => {
    const positions = force({
      name,
      ...DEFAULT_LAYOUT_OPTIONS,
      ...options,
    });
    return {
      // Little perf boost to transfer data to the main thread w/o copying.
      nodes: Comlink.transfer(positions, [positions]),
    };
  };
};

// Wrap wasm-bindgen exports (the `generate` function) to add time measurement.
function wrapExports({ force }: any) {
  return {
    forceatlas2: wrapTransfer<Forceatlas2LayoutOptions>(0, force),
    force2: wrapTransfer<Force2LayoutOptions>(1, force),
    fruchterman: wrapTransfer<FruchtermanLayoutOptions>(2, force),
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

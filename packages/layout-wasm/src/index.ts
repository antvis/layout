import { threads } from "wasm-feature-detect";
import * as Comlink from "comlink";

/**
 * [Not all browsers](https://webassembly.org/roadmap/) support WebAssembly threads yet,
 * so you'll likely want to make two builds:
 * - one with threads support
 * - one without
 *
 * and use feature detection to choose the right one on the JavaScript side.
 */
export async function supportsThreads() {
  return threads();
}

export async function initThreads(useMultiThread = true) {
  const initHandlers = Comlink.wrap(
    // @ts-ignore
    new Worker(new URL("./wasm-worker.ts", import.meta.url), {
      type: "module",
    })
  );

  // @ts-ignore
  const handlers = await initHandlers(useMultiThread);
  return handlers;
}

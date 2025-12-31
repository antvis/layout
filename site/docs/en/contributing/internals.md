# Internal Implementation Overview

This section walks through the implementation of `@antv/layout` from entry to result.

## 1. Unified entry point: `BaseLayout.execute`

All layout classes are built on `BaseLayout` (`src/algorithm/base-layout.ts`):

- Merge default options with user options (`mergeOptions`)
- Build the runtime context: `RuntimeContext(data, { node, edge })`
- Decide whether to enable Worker: `enableWorker && typeof Worker !== 'undefined'`
  - Enabled: use `layoutInWorker`
  - Disabled: call `layout()` on the main thread

## 2. Graph data model: `RuntimeContext` + `GraphLib`

`RuntimeContext` wraps the input `GraphData` into a readable/writable graph object:

- Uses `GraphLib` internally to store `nodes`/`edges` in Maps
- Exposes helpers like `forEachNode`/`forEachEdge`
- `forEachEdge` fills in `sourceNode/targetNode` to reduce repeated lookups

`GraphLib` handles two kinds of work:

- Data structures: organize `nodes/edges` into Maps and keep `_original` references
- Performance caches: build and cache degree, adjacency lists, index maps, and more on demand

## 3. Worker execution: `Supervisor` ↔ `worker.ts`

Workers move computation off the main thread to avoid blocking.

- `Supervisor` (main thread):
  - Resolve the worker script path (compatible with ESM/UMD)
  - `new Worker(workerPath, { type })` and use Comlink `wrap` to create `workerApi`
  - Call `workerApi.execute(layoutId, data, options)` to get the result graph
- `worker.ts` (worker thread):
  - Fetch the layout constructor from `registry[layoutId]` and run it
  - Force `enableWorker = false` to avoid spawning workers inside workers
  - Return `layoutInstance.model.data()` (final Maps of nodes/edges)

If a worker fails, it automatically falls back to the main thread (see the try/catch in `BaseLayout.layoutInWorker`).

## 4. Iterative layouts: `BaseSimulation` pattern

Some layouts converge iteratively (e.g., force-directed). `BaseSimulation` provides shared control:

- `tick(n)`: run n iterations and trigger the `tick` callback
- `restart()`: support animated and non-animated runs
- `stop()`: stop the iteration loop

Each algorithm only needs to implement `runOneStep()`, returning the step's movement or convergence metric.

# Project Structure

## Directory overview

- `src`: core library source (algorithms, types, Worker entry, etc.)
- `lib`: ESM build output (published)
- `dist`: UMD build output (published)
- `site`: docs site (Rspress)
- `__tests__`: unit tests
- `perf`: performance benchmarks and comparisons (optional)

## Directory notes

`src` contains the core implementation. Start with `src/index.ts` and `src/algorithm/base-layout.ts`.

- `src/index.ts`: public exports
- `src/registry.ts`: layout registry (`layoutId -> LayoutCtor`)
- `src/algorithm/`: layout implementations
  - `base-layout.ts`: base layout (unified entry, Worker support)
  - `base-simulation.ts`: shared logic for iterative/simulation layouts (tick/restart/stop)
- `src/model/`: graph data model
- `src/runtime/`: runtime capabilities
  - `context.ts`: `RuntimeContext` (wraps input data into an iterable graph context)
  - `supervisor.ts`: Worker management (init, invoke, teardown, path resolution)
- `src/worker.ts`: Worker entry (Comlink expose)
- `src/types/`: shared type definitions
- `src/util/`: utilities

## What to change when adding a layout

Typically:

1. Add an implementation in `src/algorithm/` (extend `BaseLayout`, implement `id` + `layout()`)
2. Export it in `src/algorithm/index.ts` and `src/index.ts`
3. Register the `id` in `src/registry.ts`
4. Add tests in `__tests__`
5. Add docs in `site/docs/zh/guide/api/`

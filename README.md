<h1 align="center">
<b>@antv/layout</b>
</h1>

[![Build Status](https://github.com/antvis/layout/actions/workflows/build.yml/badge.svg)](https://github.com/antvis/layout/actions)
[![Coverage Status](https://img.shields.io/coveralls/github/antvis/layout/v5.svg)](https://coveralls.io/github/antvis/layout?branch=v5)
[![npm Version](https://img.shields.io/npm/v/@antv/layout.svg)](https://www.npmjs.com/package/@antv/layout)
[![npm Download](https://img.shields.io/npm/dm/@antv/layout.svg)](https://www.npmjs.com/package/@antv/layout)
[![npm License](https://img.shields.io/npm/l/@antv/layout.svg)](https://www.npmjs.com/package/@antv/layout)

This is a collection of basic layout algorithms. We provide the following packages to support different runtime environments:

- [@antv/layout](./packages/layout/README.md) [![npm Version](https://img.shields.io/npm/v/@antv/layout/alpha)](https://www.npmjs.com/package/@antv/layout) Implemented with TypeScript. [Online Demo](https://observablehq.com/d/2db6b0cc5e97d8d6)
- [@antv/layout-rust](./packages/layout-rust/README.md) Implemented with Rust.
- [@antv/layout-wasm](./packages/layout-wasm/README.md) [![npm Version](https://img.shields.io/npm/v/@antv/layout-wasm)](https://www.npmjs.com/package/@antv/layout-wasm) Provide a WASM binding of `@antv/layout-rust`. [Online Demo](https://observablehq.com/d/288c16a54543a141)
- [@antv/layout-gpu](./packages/layout-gpu/README.md) [![npm Version](https://img.shields.io/npm/v/@antv/layout-gpu)](https://www.npmjs.com/package/@antv/layout-gpu) Accelerate some parallelizable algorithms such as Fruchterman with WebGPU which has a better performance under large amount of data.

Online benchmarks: https://antv.vision/layout/index.html

## Development

We use [Vite](https://vitejs.dev/) to start a dev server:

```bash
$ pnpm dev
```

## Test

```bash
$ pnpm test
```

## Publish

Using Changesets with pnpm: https://pnpm.io/next/using-changesets

The generated markdown files in the .changeset directory should be committed to the repository.

```bash
pnpm changeset
```

This will bump the versions of the packages previously specified with pnpm changeset (and any dependents of those) and update the changelog files.

```bash
pnpm changeset version
```

Commit the changes. This command will publish all packages that have bumped versions not yet present in the registry.

```bash
pnpm publish -r
```

If you want to publish versions for test:

```bash
pnpm changeset pre enter alpha   # 发布 alpha 版本
pnpm changeset pre enter beta    # 发布 beta 版本
pnpm changeset pre enter rc      # 发布 rc 版本
```

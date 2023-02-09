<h1 align="center">
<b>AntV Layout</b>
</h1>

[![Build Status](https://github.com/antvis/layout/workflows/build/badge.svg?branch=v5)](https://github.com/antvis//actions)
[![Coverage Status](https://img.shields.io/coveralls/github/antvis/layout/v5.svg)](https://coveralls.io/github/antvis/layout?branch=v5)
[![npm Download](https://img.shields.io/npm/dm/@antv/layout.svg)](https://www.npmjs.com/package/@antv/layout)
[![npm License](https://img.shields.io/npm/l/@antv/layout.svg)](https://www.npmjs.com/package/@antv/layout)

This is a collection of basic layout algorithms. We provide the following packages to support different runtime environments:

- [@antv/layout](./packages/layout/README.md) [![npm Version](https://img.shields.io/npm/v/@antv/layout/alpha)](https://www.npmjs.com/package/@antv/layout) Implemented with TypeScript. [Online Demo](https://observablehq.com/d/2db6b0cc5e97d8d6)
- [@antv/layout-rust](./packages/layout-rust/README.md) Implemented with Rust.
- [@antv/layout-wasm](./packages/layout-wasm/README.md) [![npm Version](https://img.shields.io/npm/v/@antv/layout-wasm)](https://www.npmjs.com/package/@antv/layout-wasm) Provide a WASM binding of `@antv/layout-rust`. [Online Demo](https://observablehq.com/d/288c16a54543a141)
- [@antv/layout-gpu](./packages/layout-gpu/README.md) [![npm Version](https://img.shields.io/npm/v/@antv/layout-gpu)](https://www.npmjs.com/package/@antv/layout-gpu) Accelerate some parallelizable algorithms such as Fruchterman with WebGPU which has a better performance under large amount of data.

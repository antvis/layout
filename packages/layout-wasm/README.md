# @antv/layout-wasm

A WASM binding of `@antv/layout-rust`.

## Build

Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) first.

Then run the command `make`, the compiled package will be outputted under the `/pkg` directory.

```bash
$ make
```

## Publish

```bash
$ cd pkg
$ npm publish
```

## Usage

Load WASM asynchronously.

```js
import init from "@antv/layout-wasm";

await init();
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

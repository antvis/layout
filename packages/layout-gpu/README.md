# @antv/layout-gpu

Accelerate some parallelizable algorithms such as Fruchterman with WebGPU which has a better performance under large amount of data.

## Usage

### NPM

```shell
# npm
$ npm install @antv/layout-gpu --save

# yarn
$ yarn add @antv/layout-gpu
```

Choose a layout algorithm from `@antv/layout-gpu` then. Since the GPGPU is asynchronous, `onLayoutEnd` callback should be passed in.

```ts
import { Graph } from "@antv/graphlib";
import { FruchtermanLayout } from "@antv/layout-gpu";

const graph = new Graph({ nodes: [], edges: [] });

const fruchtermanLayout = new FruchtermanLayout({
  onLayoutEnd: (positions) => {
    // render nodes & edges
  },
});

// Return positions of nodes & edges.
const positions = fruchtermanLayout.execute(graph);
// Or to directly assign the positions to the nodes:
circularLayout.assign(graph);
```

### UMD

Import scripts in UMD version of `@antv/graphlib`, `@antv/layout` and `@antv/layout-gpu`.

```html
<script
  src="https://unpkg.com/@antv/graphlib"
  type="application/javascript"
></script>
<script
  src="https://unpkg.com/@antv/layout"
  type="application/javascript"
></script>
<script
  src="https://unpkg.com/@antv/layout-gpu"
  type="application/javascript"
></script>
```

Use layouts under `LayoutGPU` namespace.

```js
const { Graph } = window.GraphLib;
const { FruchtermanLayout } = window.LayoutGPU;
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

# @antv/layout-webgpu

Accelerate some parallelizable algorithms such as Fruchterman with WebGPU which has a better performance under large amount of data.

## Usage

### NPM

```shell
# npm
$ npm install @antv/layout-webgpu --save

# yarn
$ yarn add @antv/layout-webgpu
```

Choose a layout algorithm from `@antv/layout-webgpu` then.

```ts
import { Graph } from "@antv/graphlib";
import { FruchtermanLayout } from "@antv/layout-webgpu";

const graph = new Graph({ nodes: [], edges: [] });

const fruchtermanLayout = new FruchtermanLayout();

(async () => {
  // Return positions of nodes & edges.
  const positions = await fruchtermanLayout.execute(graph);
  // Or to directly assign the positions to the nodes:
  await circularLayout.assign(graph);
})();
```

### UMD

Import scripts in UMD version of `@antv/graphlib`, `@antv/layout` and `@antv/layout-webgpu`.

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
  src="https://unpkg.com/@antv/layout-webgpu"
  type="application/javascript"
></script>
```

Use layouts under `LayoutWebGPU` namespace.

```js
const { Graph } = window.GraphLib;
const { FruchtermanLayout } = window.LayoutWebGPU;
```

## Documentation

We provide the following parallelizable layouts:

- [Fruchterman]()
- [GForce]()

```js
import { Graph } from "@antv/graphlib";
import { FruchtermanLayout } from "@antv/layout-webgpu";

const graph = new Graph({ nodes: [], edges: [] });

const fruchtermanLayout = new FruchtermanLayout({
  center: [200, 200],
});
const positions = await fruchtermanLayout.execute(graph);
```

### Fruchterman

Fruchterman is a kind of force-directed layout. The implementation is according to the paper [Graph Drawing by Force-directed Placement](http://www.mathe2.uni-bayreuth.de/axel/papers/reingold:graph_drawing_by_force_directed_placement.pdf).

<img src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*jK3ITYqVJnQAAAAAAAAAAABkARQnAQ" alt="fruchterman layout" width="300">

[Online Demo](https://observablehq.com/d/2db6b0cc5e97d8d6#cell-1058)

LayoutOptions:

- `center` **[number, number]** The center of the graph. e.g. `[0, 0]`
- `width` **number** The width of the graph. The default value is `300`.
- `height` **number** The height of the graph. The default value is `300`.
- `maxIteration` **number** The default value is `1000`.
- `gravity` **number** The gravity, which will affect the compactness of the layout. The default value is `10`.
- `speed` **number** The moving speed of each iteraction. Large value of the speed might lead to violent swing. The default value is `5`.

### GForce

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

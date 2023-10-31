# @antv/layout-wasm

A WASM binding of `@antv/layout-rust`. We used [wasm-bindgen-rayon](https://github.com/GoogleChromeLabs/wasm-bindgen-rayon) to implement data parallelism with WebWorkers.

- [Online benchmarks](https://antv.vision/layout/index.html)
- [Use with Webpack](#webpack)
- [Use with Vite](#vite)

Besides 2D, we also support force-directed layouts in 3D.
![3D snapshot](https://user-images.githubusercontent.com/3608471/237603139-4104b2de-edb0-4e24-93cc-a69fb0200336.png)

Now we support the following layouts:

- [ForceAtlas2](#ForceAtlas2)
- [Fruchterman](#Fruchterman)
- [Force](#Force)
- [Dagre](#Dagre)

## Usage

Since [cross origin workers are blocked](https://stackoverflow.com/questions/58098143/why-are-cross-origin-workers-blocked-and-why-is-the-workaround-ok/60015898#60015898), we do not recommand the UMD way of using it for now. You can opt to ESM usage with bundler such as [Webpack](#webpack) or [Vite](#vite).

### ESM

```js
import { initThreads, supportsThreads } from "@antv/layout-wasm";
```

Since [Not all browsers](https://webassembly.org/roadmap/) support WebAssembly threads yet, we need to use feature detection to choose the right one on the JavaScript side.

```js
const supported = await supportsThreads(); // `true` means we can use multithreads now!
const threads = await initThreads(supported);
```

Then we can execute layout algorithm as usual, don't forget to pass in threads created in the previous step:

```js
import { Graph } from "@antv/graphlib";
import { ForceAtlas2 } from "@antv/layout-wasm";

const forceatlas2 = new ForceAtlas2({
  threads,
  maxIteration: 1000,
  // ...other params
});

const { nodes } = await forceatlas2.execute(graph);
```

### Use WASM with multithreads

First of all, in order to use SharedArrayBuffer on the Web, you need to enable [cross-origin isolation policies](https://web.dev/coop-coep/). Check out the linked article for details.

To opt in to a cross-origin isolated state, you need to send the following HTTP headers on the main document:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

If you can't control the server, try this hacky workaround which implemented with ServiceWorker: https://github.com/orgs/community/discussions/13309#discussioncomment-3844940. Here's an example on [Stackblitz](https://stackblitz.com/edit/github-wpncwj-fxmffg?file=src/index.js).

### Webpack

Webpack has good support for Webworker, here's an example on [Stackblitz](https://stackblitz.com/edit/github-wpncwj?file=src/index.js). We use [statikk](https://www.npmjs.com/package/statikk) as static server in this example since it has a good support of cross-origin isolation headers. For more information, please refer to [Use WASM with multithreads](#use-wasm-with-multithreads).

### Vite

Vite also provides [worker options](https://vitejs.dev/config/worker-options.html) in its config. To let Vite [process URL correctly](https://vitejs.dev/guide/dep-pre-bundling.html#customizing-the-behavior) when creating WebWorker in third-party packages, we need to add the package to `optimizeDeps.exclude`:

```js
// vite.config.js
optimizeDeps: {
  exclude: ['@antv/layout-wasm'],
},
```

To enable COOP & COEP headers, we can set them with `plugins`:

```js
// vite.config.js
plugins: [
  {
    name: 'isolation',
    configureServer(server) {
      // @see https://gist.github.com/mizchi/afcc5cf233c9e6943720fde4b4579a2b
      server.middlewares.use((_req, res, next) => {
        res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
        next();
      });
    },
  },
],
```

Here's a complete example on [Stackblitz](https://stackblitz.com/edit/vite-6b9ga6?file=README.md).

If you can't control the server, try this hacky workaround which implemented with ServiceWorker: https://github.com/orgs/community/discussions/13309#discussioncomment-3844940

## API Reference

### Common force-directed layout options

- `center` **[number, number] | [number, number, number]** The center of the graph. e.g. `[0, 0]` or `[0, 0, 0]` in 3-dimensional scene.
- `maxIteration` **number**
- `minMovement` **number** When the average/minimum/maximum (according to `distanceThresholdMode`) movement of nodes in one iteration is smaller than minMovement, terminate the layout.
- `distanceThresholdMode` **'mean' | 'max' ｜ 'min'** The condition to judge with minMovement, `'mean'` means the layout stops while the nodes' average movement is smaller than minMovement, `'max' / 'min'` means the layout stops while the nodes' maximum/minimum movement is smaller than minMovement. `'mean'` by default
- `maxDistance` **number** If distance is specified, sets the maximum distance between nodes over which this force is considered. If distance is not specified, returns the current maximum distance, which defaults to `Infinity`. Specifying a finite maximum distance improves performance and produces a more localized layout.
- `dimensions` **number** Dimensions of coordinates, default to `2`.

### <a id='ForceAtlas2' />ForceAtlas2

FA2 is a kind of force directed layout, which performs better on the convergence and compactness.

<img src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*MqwAQZLIVPwAAAAAAAAAAAAAARQnAQ" alt="forceAtlas2 layout" width="300">

LayoutOptions:

- `kr` **number** Repulsive parameter, smaller the kr, more compact the graph. The default value is `5`.
- `kg` **number** The parameter for the gravity. Larger kg, the graph will be more compact to the center. The default value is `5`.
- `ks` **number** The moving speed of the nodes during iterations. The default value is `0.1`.
- `tao` **number** The threshold of the swinging. The default value is `0.1`.
- `preventOverlap` **boolean**
- `dissuadeHubs` **boolean** Wheather to enable hub mode. If it is `true`, the nodes with larger in-degree will be placed on the center in higher priority.
- `barnesHut` **boolean** Whether to enable the barnes hut speedup, which is the quad-tree optimization. Due to the computation for quad-tree re-build in each iteration, we sugguest to enable it in large graph. It is `undefined` by deafult, when the number of nodes is larger than 250, it will be activated automatically. If it is set to be `false`, it will not be activated anyway.

### <a id='Fruchterman' />Fruchterman

Fruchterman is a kind of force-directed layout. The implementation is according to the paper [Graph Drawing by Force-directed Placement](http://www.mathe2.uni-bayreuth.de/axel/papers/reingold:graph_drawing_by_force_directed_placement.pdf).

<img src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*jK3ITYqVJnQAAAAAAAAAAABkARQnAQ" alt="fruchterman layout" width="300">

LayoutOptions:

- `width` **number** The width of the graph.
- `height` **number** The height of the graph.
- `gravity` **number** The gravity, which will affect the compactness of the layout. The default value is `10`.
- `speed` **number** The moving speed of each iteraction. Large value of the speed might lead to violent swing.
- `clustering` **boolean** We can also layout according to `nodeClusterBy` field in data when enable clustering.
- `clusterGravity` The gravity of each cluster, which will affect the compactness of each cluster. The default value is `10`.

### <a id='Force' />Force

Force2 implements the force-directed layout algorithm. It comes from graphin-force, supports assign different masses and center gravities for different nodes freedomly. Comparing to graphin-force, the performance is improved greatly.

<img src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*lX-qSqDECrIAAAAAAAAAAAAAARQnAQ" alt="force layout" width="300">

LayoutOptions:

- `linkDistance` **number** The edge length. The default length is `200`.
- `nodeStrength` **number** The strength of node force. Positive value means repulsive force, negative value means attractive force (it is different from 'force'). The default value is `1000`.
- `edgeStrength` **number** The strength of edge force. Calculated according to the degree of nodes by default. The default value is `200`.
- `preventOverlap` **boolean**
- `nodeSize` **number** The diameter of the node. It is used for preventing node overlappings. If nodeSize is not assigned, the size property in node data will take effect. If the size in node data does not exist either, nodeSize is assigned to `10` by default.
- `nodeSpacing` **number** The minimum space between two nodes when preventOverlap is true. The default value is `0`.
- `damping` **number** Range [0, 1], affect the speed of decreasing node moving speed. Large the number, slower the decreasing. The default value is `0.9`.
- `interval` **number** Controls the speed of the nodes' movement in each iteration. The default value is `0.02`.
- `maxSpeed` **number** The max speed in each iteration. The default value is `1000`.
- `force` **number** Coefficient for the repulsive force. Larger the number, larger the repulsive force.
- `coulombDisScale` **number** A parameter for repulsive force between nodes. Large the number, larger the repulsion. The default value is `0.005`.
- `gravity` **number** The gravity strength to the center for all the nodes. Larger the number, more compact the nodes. The default value is `10`.

### <a id='Dagre' />Dagre

Dagre is an hierarchical layout.

LayoutOptions:

- `begin` **[number, number]** The position for the left-top of the layout.
- `rankdir` **'TB' | 'BT' | 'LR' | 'RL'** The layout direction, defaults to `'TB'`.
- `align` **'UL' | 'UR' | 'DL' | 'DR'** The alignment of the nodes, defaults to `'UL'`
- `nodesep` **number** The separation between nodes with unit px. When rankdir is 'TB' or 'BT', nodesep represents the horizontal separations between nodes; When rankdir is 'LR' or 'RL', nodesep represents the vertical separations between nodes. Defaults to `50`.
- `ranksep` **number** The separations between adjacent levels with unit px. When rankdir is 'TB' or 'BT', ranksep represents the vertical separations between adjacent levels; when rankdir is 'LR' or 'RL', rankdir represents the horizontal separations between adjacent levels. Defaults to `50`.


## Benchmarks

Since WASM can be executed on both Node.js and browser sides, we use [benchmark.js](https://github.com/bestiejs/benchmark.js/) and Chrome.

Here's my local enviroment:

- MacBook Pro (13-inch, M1, 2020)
- Node.js v14.18.0
- Chrome 109.0.5414.119

We compare the WASM version with [graphology](https://github.com/graphology/graphology/tree/master/src/layout-forceatlas2) & `@antv/layout@0.3.x`.

### Node.js

Build WASM and execute scripts under `/benchmarks`, you will see the following output in terminal.

```bash
$ npm run build
$ npm run benchmarks
```

500 nodes / 1000 edges / 100 iterations / ～ 5x speedup

```
Graphology x 3.75 ops/sec ±4.86% (14 runs sampled)
@antv/layout x 0.99 ops/sec ±10.48% (7 runs sampled)
@antv/layout-wasm x 17.23 ops/sec ±3.59% (33 runs sampled)

Fastest is @antv/layout-wasm
```

2000 nodes / 2000 edges / 100 iterations / ～ 2x speedup

```
Graphology x 0.47 ops/sec ±13.38% (6 runs sampled)
@antv/layout x 0.06 ops/sec ±15.28% (5 runs sampled)
@antv/layout-wasm x 1.09 ops/sec ±3.00% (7 runs sampled)

Fastest is @antv/layout-wasm
```

### Browser

Build WASM and start a local devserver.

```bash
$ npm run build
$ npm run demo
```

Go to `http://localhost:9093/demo/index.html` and you will see the following output in console.

```
Layout Graphology: 32.93115234375 ms
Layout WASM singlethread: 67.17724609375 ms
Layout WASM multithread: 112.954833984375 ms
```

| Nodes / Edges / Iterations | WASM single thread | WASM multi-thread | graphology |
| -------------------------- | ------------------ | ----------------- | ---------- |
| 5000 / 8000 / 100          | **4412**           | 7022              | 11699      |
| 5000 / 5000 / 100          | **2817**           | 6963              | 9991       |
| 2000 / 2000 / 100          | **652**            | 1248              | 1745       |
| 100 / 800 / 100            | 112                | 67                | **32**     |

It can be seen that:

- WASM has no advantage at small data sizes
- WASM especially the multi-threaded version, has a roughly **3x** improvement over the JS serial version for larger data volumes
- But the multi-threaded version of WASM requires additional server-side configuration

## Build

Install [wasm-pack](https://rustwasm.github.io/wasm-pack/installer/) first.

Then run the command `npm run build`, the compiled package will be outputted under the `/dist` directory.

```bash
$ npm run build
```

## Publish

```bash
$ npm publish
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

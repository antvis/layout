# @antv/layout-wasm

A WASM binding of `@antv/layout-rust`. We used [wasm-bindgen-rayon](https://github.com/GoogleChromeLabs/wasm-bindgen-rayon) to implement data parallelism with WebWorkers.

- [Online benchmarks](https://antv.vision/layout/index.html)
- [Use with Webpack](#webpack)
- [Use with Vite](#vite)

## Usage

Since [cross origin workers are blocked](https://stackoverflow.com/questions/58098143/why-are-cross-origin-workers-blocked-and-why-is-the-workaround-ok/60015898#60015898), we do not recommand the UMD way of using it for now. You can opt to ESM usage with bundler such as [Webpack](#webpack) or [Vite](#vite).

### ESM

```js
import { initThreads, supportsThreads } from "@antv/layout-wasm";
```

Since [Not all browsers](https://webassembly.org/roadmap/) support WebAssembly threads yet, we need to use feature detection to choose the right one on the JavaScript side.

```js
const supported = await supportsThreads(); // `true` means we can use multithreads now!
const { forceatlas2, force2, fruchterman } = await initThreads(supported);
```

Then we can execute layout algorithm as usual.

```js
const { nodes } = await forceatlas2({
  nodes,
  edges,
  masses,
  weights,
  iterations,
  // other options
  kg: 1,
}); // [x1, y1, x2, y2...]
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

### Shared params

<a name="nodes" href="#nodes">#</a> <b>nodes</b>

A list of nodes' coordinates, e.g. `[x1, y1, x2, y2, ...]`.

<a name="edges" href="#edges">#</a> <b>edges</b>

The specified array of **edges**. Assumes edges `(n1, n2)` respect `n1 < n2`, e.g. `[[n1, n2], [n3, n4], ...]`.

<a name="masses" href="#masses">#</a> <b>masses</b>

A list of masses, e.g. `[m1, m2, ...]`.

<a name="weights" href="#weights">#</a> <b>weights</b>

A list of weights, e.g. `[e1, e2, ...]`.

<a name="iterations" href="#iterations">#</a> <b>iterations</b>

The max number of iterations. If the average movement do not reach minMovement but the iteration number is over maxIteration, terminate the layout.

<a name="distance_threshold_mode" href="#distance_threshold_mode">#</a> <b>distance_threshold_mode</b>

The condition to judge with minMovement:

- 0 -> 'mean' means the layout stops while the nodes' average movement is smaller than minMovement
- 1 -> 'min' means the layout stops while the nodes' minimum movement is smaller than minMovement
- 2 -> 'max' means the layout stops while the nodes' maximum movement is smaller than minMovement

<a name="min_movement" href="#min_movement">#</a> <b>min_movement</b>

When the average/minimum/maximum (according to distanceThresholdMode) movement of nodes in one iteration is smaller than minMovement, terminate the layout.

<a name="center" href="#center">#</a> <b>center</b>

The center of the layout, default to `[0, 0]`.

### forceatlas2

<a name="ka" href="#ka">#</a> <b>ka</b>

Attraction coefficient.

<a name="kg" href="#kg">#</a> <b>kg</b>

Gravity coefficient, larger the kg, the graph will be more compact to the center.

<a name="kr" href="#kr">#</a> <b>kr</b>

Repulsion coefficient, smaller the kr, more compact the graph will be.

<a name="speed" href="#speed">#</a> <b>speed</b>

Speed factor, e.g. `0.5`

<a name="strong_gravity" href="#strong_gravity">#</a> <b>strong_gravity</b>

Gravity does not decrease with distance, resulting in a more compact graph, default to `false`.

<a name="lin_log" href="#lin_log">#</a> <b>lin_log</b>

Logarithmic attraction, default to `false`.

<a name="dissuade_hubs" href="#dissuade_hubs">#</a> <b>dissuade_hubs</b>

Move hubs (high degree nodes) to the center, default to `false`.

### fruchterman

<a name="kg" href="#kg">#</a> <b>kg</b>

Gravity coefficient, larger the kg, the graph will be more compact to the center.

<a name="width" href="#width">#</a> <b>width</b>

The width of canvas.

<a name="height" href="#height">#</a> <b>height</b>

The height of canvas.

<a name="speed" href="#speed">#</a> <b>speed</b>

The moving speed of each iteraction. Large value of the speed might lead to violent swing.

### force2

<a name="kg" href="#kg">#</a> <b>kg</b>

Gravity coefficient, larger the kg, the graph will be more compact to the center.

<a name="edge_strength" href="#edge_strength">#</a> <b>edge_strength</b>

The strength of edge force. Calculated according to the degree of nodes by default.

<a name="link_distance" href="#link_distance">#</a> <b>link_distance</b>

The edge length, default to `1`.

<a name="node_strength" href="#node_strength">#</a> <b>node_strength</b>

The strength of node force. Positive value means repulsive force, negative value means attractive force, default to `1000`.

<a name="coulomb_dis_scale" href="#coulomb_dis_scale">#</a> <b>coulomb_dis_scale</b>

A parameter for repulsive force between nodes. Large the number, larger the repulsion, default to `0.005`.

<a name="factor" href="#factor">#</a> <b>factor</b>

Coefficient for the repulsive force. Larger the number, larger the repulsive force, default to `1`.

<a name="damping" href="#damping">#</a> <b>damping</b>

Range `[0, 1]`, affect the speed of decreasing node moving speed. Large the number, slower the decreasing, default to `0.9`.

<a name="interval" href="#interval">#</a> <b>interval</b>

Controls the speed of the nodes' movement in each iteration, default to `0.002`.

<a name="max_speed" href="#max_speed">#</a> <b>max_speed</b>

The max speed in each iteration, default to `1000`.

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

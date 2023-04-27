# @antv/layout-wasm

A WASM binding of `@antv/layout-rust`. We use [wasm-bindgen-rayon](https://github.com/GoogleChromeLabs/wasm-bindgen-rayon) implementing multi-thread.

## Usage

### UMD

```html
<script
  src="https://unpkg.com/@antv/layout-wasm"
  crossorigin="anonymous"
  type="text/javascript"
></script>
```

Get `initThread` method from `layout` namespace.

```js
const { initThreads, supportsThreads } = window.layoutWASM;
```

Since [Not all browsers](https://webassembly.org/roadmap/) support WebAssembly threads yet, we need to use feature detection to choose the right one on the JavaScript side.

```js
const supported = await supportsThreads();
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

When the average/minimum/maximum (according to distanceThresholdMode) movement of nodes in one iteration is smaller than minMovement, terminate the layout

### forceatlas2

<a name="ka" href="#ka">#</a> <b>ka</b>

Attraction coefficient.

<a name="kg" href="#kg">#</a> <b>kg</b>

Gravity coefficient, larger the kg, the graph will be more compact to the center.

<a name="kr" href="#kr">#</a> <b>kr</b>

Repulsion coefficient, smaller the kr, more compact the graph will be.

<a name="speed" href="#speed">#</a> <b>speed</b>

Speed factor.

<a name="strong_gravity" href="#strong_gravity">#</a> <b>strong_gravity</b>

<a name="lin_log" href="#lin_log">#</a> <b>lin_log</b>

<a name="dissuade_hubs" href="#dissuade_hubs">#</a> <b>dissuade_hubs</b>

### fruchterman

<a name="kg" href="#kg">#</a> <b>kg</b>

Gravity coefficient, larger the kg, the graph will be more compact to the center.

<a name="width" href="#width">#</a> <b>width</b>

<a name="height" href="#height">#</a> <b>height</b>

<a name="speed" href="#speed">#</a> <b>speed</b>

Speed factor.

### force2

<a name="kg" href="#kg">#</a> <b>kg</b>

Gravity coefficient, larger the kg, the graph will be more compact to the center.

<a name="edge_strength" href="#edge_strength">#</a> <b>edge_strength</b>

<a name="link_distance" href="#link_distance">#</a> <b>link_distance</b>

<a name="node_strength" href="#node_strength">#</a> <b>node_strength</b>

<a name="coulomb_dis_scale" href="#coulomb_dis_scale">#</a> <b>coulomb_dis_scale</b>

<a name="factor" href="#factor">#</a> <b>factor</b>

<a name="damping" href="#damping">#</a> <b>damping</b>

<a name="interval" href="#interval">#</a> <b>interval</b>

<a name="max_speed" href="#max_speed">#</a> <b>max_speed</b>

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

## About

Collection of basic layout algorithms to be used with [@antv/graphlib]().

[Living Demo](https://observablehq.com/d/2db6b0cc5e97d8d6)

## Installation

```shell
# npm
$ npm install @antv/layout --save

# yarn
$ yarn add @antv/layout
```

## Usage

```ts
import { Graph } from "@antv/graphlib";
import { CircularLayout } from "@antv/layout";

const graph = new Graph({ nodes: [], edges: [] });

const circularLayout = new CircularLayout({ radius: 10 });

// 1. Return positions of nodes & edges.
const positions = circularLayout.execute(graph);

// 2. To directly assign the positions to the nodes:
circularLayout.assign(graph);
```

## Documentation

- [G6 Layout](https://g6.antv.vision/zh/docs/api/graphLayout/guide)

Layout algorithms can be divided into two categories, the first is synchronous, e.g. circular layout

### Circular

Circular layout arranges the node on a circle. By tuning the configurations, user can adjust the node ordering method, division number, radial layout, and so on. G6 implements it according to the paper: [A framework and algorithms for circular drawings of graphs](https://www.sciencedirect.com/science/article/pii/S1570866705000031).

<img src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*-3idTK1xa6wAAAAAAAAAAABkARQnAQ" alt="circular layout" width="300">
<img src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*_nLORItzM5QAAAAAAAAAAABkARQnAQ" alt="circular layout" width="300">
<img src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*6J6BRIjmXKAAAAAAAAAAAABkARQnAQ" alt="circular layout" width="300">

Arguments

- `graph` **Graph**: target graph.
- `options?` **LayoutOptions**.
  - `center` **[number, number]** The center of the graph. e.g. `[0, 0]`
  - `radius` **number** The radius of the circle. If the raidus exists, startRadius and endRadius do not take effect.
  - `startRadius` **number** The start radius of spiral layout. The default value is `null`.
  - `endRadius` **number** The end radius of spiral layout. The default value is `null`.
  - `clockwise` **boolean** Whether to layout clockwisely. The default value is `true`.
  - `divisions` **number** The division number of the nodes on the circle. Takes effect when `endRadius - startRadius !== 0`. The default value is `1`.
  - `ordering` **null | 'topology' | 'degree'** The ordering method for nodes. `null` by default, which means the nodes are arranged in data order. `'topology'` means in topology order; `'degree'` means in degree order.
  - `angleRatio` **number** How many `2*PI`s Between the first node and the last node. The default value is `1`.

### Supervisor

```js
const graph = new Graph();
const layout = new CircularLayout();

const supervisor = new Supervisor(graph, layout, { auto: true });
supervisor.start();
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

## About

Layout algorithms for AntV

## Installation

```shell
# npm
$ npm install @antv/layout --save

# yarn
$ yarn add @antv/layout
```

## Usage

```ts
import { GridLayout } from '@antv/layout'
import { DagreLayout } from '@antv/layout'

const model = {
  nodes: [
    {
      id: 'node1',
      x: 0,
      y: 0,
    }, {
      id: 'node2',
      x: 20,
      y: 20,
    },
  ],
  edges: [
    {
      source: 'node1',
      target: 'node2',
    },
  ],
}

// simple grid layout
const gridLayout = new GridLayout({
  type: 'grid',
  width: 600,
  height: 400,
  rows: 4,
  cols: 4,
})

const gridModel = gridLayout.layout(model)

// dagre layout
const dagreLayout = new DagreLayout({
  type: 'dagre',
  rankdir: 'TB',
  align: 'UL',
  width: 1200,
  height: 1000,
  nodesep: 50,
  ranksep: 50
})

const dagreModel = dagreLayout.layout(model)

// more layout at documentation ...

```


## Documentation

- [G6 Layout](https://g6.antv.vision/zh/docs/api/graphLayout/guide)

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).

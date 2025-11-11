# Circular

Circular layout arranges nodes on a circle. By tuning the configurations, user can adjust the node ordering method, division number, radial layout, and so on. We implement it according to the paper: [A framework and algorithms for circular drawings of graphs](https://www.sciencedirect.com/science/article/pii/S1570866705000031).

<p align="center">
  <img width="300" src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*D85cS7-yqNEAAAAAAAAAAABkARQnAQ" />
</p>

## Usage

First we need to create a graph model with `@antv/graphlib`.

```ts
import { Graph } from '@antv/graphlib';

const graph = new Graph({
  nodes: [
    { id: 'node1', data: {} },
    { id: 'node2', data: {} },
    { id: 'node3', data: {} },
    // ...
  ],
  edges: [
    { id: 'edge1', source: 'node1', target: 'node2', data: {} },
    // ...
  ],
});
```

Then select a circular layout from `@antv/layout`.

```ts
import { CircularLayout } from '@antv/layout';

const circular = new CircularLayout({
  center: [250, 250],
  radius: 200,
});
```

Returns the positions of nodes after calculating the layout.

```ts
const positions = await circular.execute(graph);
// positions = { nodes: [...], edges: [...] }
```

Or we can directly assign the positions to the nodes by calling `assign`:

```ts
await circular.assign(graph);
```

## Options

| Key         | Description                                                                                                                                                                                                   | Type                                                                                                | Default                   |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------- |
| width       | The width of the layout.                                                                                                                                                                                      | `number`                                                                                            | `undefined`               |
| height      | The height of the layout.                                                                                                                                                                                     | `number`                                                                                            | `undefined`               |
| center      | The center of the layout.                                                                                                                                                                                     | `[number, number]`                                                                                  | `[width / 2, height / 2]` |
| radius      | The radius of the circle. If specified, `startRadius` and `endRadius` will be ignored.                                                                                                                        | `number`                                                                                            | `null`                    |
| startRadius | The start radius for spiral layout.                                                                                                                                                                           | `number`                                                                                            | `null`                    |
| endRadius   | The end radius for spiral layout.                                                                                                                                                                             | `number`                                                                                            | `null`                    |
| startAngle  | The start angle in radians for placing nodes.                                                                                                                                                                 | `number`                                                                                            | `0`                       |
| endAngle    | The end angle in radians for placing nodes.                                                                                                                                                                   | `number`                                                                                            | `2 * Math.PI`             |
| clockwise   | Whether to place nodes in clockwise order.                                                                                                                                                                    | `boolean`                                                                                           | `true`                    |
| divisions   | The division number of nodes on the circle. Takes effect when `endRadius - startRadius !== 0`.                                                                                                                | `number`                                                                                            | `1`                       |
| ordering    | The ordering method for nodes. `null` means nodes are arranged in data order; `'topology'` means in topology order; `'topology-directed'` means in directed topology order; `'degree'` means in degree order. | <code>null &#124; 'topology' &#124; 'topology-directed' &#124; 'degree'</code>                      | `null`                    |
| angleRatio  | The ratio of the angle between nodes. For example, `angleRatio: 1` means the angle between nodes is `(endAngle - startAngle) / nodeCount`.                                                                    | `number`                                                                                            | `1`                       |
| nodeSize    | The size of nodes. Used with `nodeSpacing` to calculate radius automatically.                                                                                                                                 | <code>number &#124; [number, number] &#124; ((node: Node) => number &#124; [number, number])</code> | `undefined`               |
| nodeSpacing | The spacing between nodes. Used with `nodeSize` to calculate radius automatically.                                                                                                                            | <code>number &#124; ((node: Node) => number)</code>                                                 | `undefined`               |

## Layout Types

### Circle Layout

When `radius` is specified, nodes are arranged on a single circle.

```ts
const circular = new CircularLayout({
  center: [250, 250],
  radius: 200,
});
```

```plain
         node2
           ●
      ●         ●
   node1         node3

      ●    ●    ●
   node8   C   node4

      ●         ●
   node7         node5
           ●
         node6

C = center (250, 250)
radius = 200
```

### Spiral Layout

When `startRadius` and `endRadius` are specified (without `radius`), nodes are arranged in a spiral pattern.

```ts
const circular = new CircularLayout({
  center: [250, 250],
  startRadius: 50,
  endRadius: 200,
});
```

```plain
           node_n
              ●
         ●         ●
                      ●
    ●        C           ●
  node1
         ●         ●
              ●

Nodes spiral outward from startRadius to endRadius
```

### Multi-Division Layout

When `divisions > 1`, nodes are divided into multiple arcs.

```ts
const circular = new CircularLayout({
  center: [250, 250],
  radius: 200,
  divisions: 4,
});
```

```plain
Division 1    Division 2
    ●    ●    ●    ●

    ●            ●
         C
    ●            ●

    ●    ●    ●    ●
Division 4    Division 3

Each division occupies 2π/4 radians
```

## Node Ordering

### Default Ordering (null)

Nodes are arranged in their original data order.

### Topology Ordering

Nodes are arranged based on graph topology, placing neighbors close to each other.

```ts
const circular = new CircularLayout({
  ordering: 'topology',
});
```

### Topology-Directed Ordering

Similar to topology ordering but considers edge direction.

```ts
const circular = new CircularLayout({
  ordering: 'topology-directed',
});
```

### Degree Ordering

Nodes are sorted by their degree (number of connections) in ascending order.

```ts
const circular = new CircularLayout({
  ordering: 'degree',
});
```

## Methods

### execute

<a name="circular_execute" href="#circular_execute">#</a> **execute**<i>(graph: Graph, options?: CircularLayoutOptions): Promise&lt;LayoutMapping&gt;</i>

Returns the positions of nodes and edges after calculating the layout.

**Parameters:**

- `graph`: The graph instance.
- `options`: Optional layout options to override the constructor options.

**Returns:**

```ts
{
  nodes: Node[],  // nodes with x, y positions in data
  edges: Edge[]   // edges
}
```

### assign

<a name="circular_assign" href="#circular_assign">#</a> **assign**<i>(graph: Graph, options?: CircularLayoutOptions): Promise&lt;void&gt;</i>

Directly assigns the calculated positions to the nodes in the graph.

**Parameters:**

- `graph`: The graph instance.
- `options`: Optional layout options to override the constructor options.

## Use Cases

Circular layout is particularly useful for:

- **Social networks**: Visualizing connections in a circular pattern
- **Cycle detection**: Highlighting circular dependencies
- **Timeline visualization**: Arranging events in a circular timeline
- **Periodic data**: Displaying seasonal or cyclical patterns
- **Network topology**: Showing network structure in a symmetric way

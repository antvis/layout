# Concentric

Concentric layout arranges nodes in concentric circles based on their importance or properties. Nodes with higher values (such as degree) are placed in the inner circles, while nodes with lower values are placed in the outer circles.

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

Then select a concentric layout from `@antv/layout`.

```ts
import { ConcentricLayout } from '@antv/layout';

const concentric = new ConcentricLayout({
  width: 500,
  height: 500,
  center: [250, 250],
  nodeSize: 30,
  nodeSpacing: 10,
  preventOverlap: true,
  sortBy: 'degree',
});
```

Returns the positions of nodes after calculating the layout.

```ts
const positions = await concentric.execute(graph);
// positions = { nodes: [...], edges: [...] }
```

Or we can directly assign the positions to the nodes by calling `assign`:

```ts
await concentric.assign(graph);
```

## Options

| Key | Description | Type | Default|  
| ----| ----------- | -----| -------|
| width | The width of the layout. | `number` | `undefined` |
| height | The height of the layout. | `number` | `undefined` |
| center | The center of the layout. | `[number, number]` | `[width / 2, height / 2]` |
| nodeSize | The size of the nodes. Can be a number, array `[width, height]`, or a function that returns the size for each node. | <code>number &#124; [number, number] &#124; ((node: Node) => number &#124; [number, number])</code> | `30` |
| nodeSpacing | The spacing between nodes. Can be a number, array `[dx, dy]`, or a function that returns the spacing for each node. | <code>number &#124; [number, number] &#124; ((node: Node) => number)</code> | `10` |
| preventOverlap | Whether to prevent node overlapping. If true, nodes will not overlap. | `boolean` | `false` |
| sweep | The angle range for nodes in radians. If undefined, it equals to `2 * PI - 2 * PI / level.nodes.length`. | `number` | `undefined` |
| equidistant | Whether to place nodes at equal distances from the center, regardless of their level. | `boolean` | `false` |
| startAngle | The starting angle in radians for placing nodes. | `number` | `(3 / 2) * Math.PI` |
| clockwise | Whether to place nodes in clockwise order. | `boolean` | `true` |
| maxLevelDiff | The maximum difference in values between levels. Nodes with value differences greater than this will be placed in different levels. If undefined, it defaults to `maxValue / 4`. | `number` | `undefined` |
| sortBy | The property name to sort nodes by. Can be `'degree'` or any property in node data. Nodes with higher values will be placed in inner circles. | `string` | `'degree'` |

## Example

```plain
Concentric layout with 3 levels (sorted by degree):

Level 0 (highest degree):     ●
                            /  |  \
Level 1:                  ●   ●   ●
                        / | X | X | \
Level 2 (lowest):      ● ●  ●  ●  ●  ●

- Nodes are sorted by sortBy value (default: degree)
- Higher value nodes are placed in inner circles
- maxLevelDiff controls when to create new levels
- preventOverlap ensures nodes don't overlap
- sweep controls the angular range for each level
```

## Methods

### execute

<a name="concentric_execute" href="#concentric_execute">#</a> **execute**<i>(graph: Graph, options?: ConcentricLayoutOptions): Promise&lt;LayoutMapping&gt;</i>

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

<a name="concentric_assign" href="#concentric_assign">#</a> **assign**<i>(graph: Graph, options?: ConcentricLayoutOptions): Promise&lt;void&gt;</i>

Directly assigns the calculated positions to the nodes in the graph.

**Parameters:**

- `graph`: The graph instance.
- `options`: Optional layout options to override the constructor options.


## Algorithm Details

The concentric layout algorithm works as follows:

1. **Sort nodes**: Nodes are sorted by the specified property (default: degree). Nodes with higher values are considered more important.

2. **Create levels**: Nodes are grouped into levels based on their values. The `maxLevelDiff` parameter controls the maximum value difference within a level. If the difference between the current node and the first node in the current level exceeds `maxLevelDiff`, a new level is created.

3. **Calculate radii**: For each level, a radius is calculated:
   - If `preventOverlap` is true, the radius ensures no nodes overlap
   - Each level's radius is at least `minDist` (nodeSize + nodeSpacing) larger than the previous level
   - If `equidistant` is true, all levels have equal spacing

4. **Position nodes**: Nodes in each level are placed evenly around a circle at the calculated radius:
   - The angular spacing is determined by the `sweep` parameter
   - Nodes are placed starting from `startAngle`
   - Direction is controlled by the `clockwise` parameter

## Use Cases

Concentric layout is particularly useful for:

- **Social networks**: Visualizing influence or centrality, with more connected nodes in the center
- **Organizational hierarchies**: Showing importance levels
- **Dependency graphs**: Highlighting critical dependencies
- **Any scenario where node importance varies**: Using custom properties via `sortBy`

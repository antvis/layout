# GridLayout 网格布局

网格布局（GridLayout）将节点按照特定的排序规则（如度数、ID 等）排列在网格中。适用于需要将节点整齐排列以便于观察的场景。

## 快速使用

首先，构建图数据模型。

```ts
const data = {
  nodes: [
    { id: 'node1', data: {} },
    { id: 'node2', data: {} },
    { id: 'node3', data: {} },
    // ...
  ],
  edges: [
    { source: 'node1', target: 'node2', data: {} },
    // ...
  ],
};
```

然后，初始化网格布局算法。

```ts
import { GridLayout } from '@antv/layout';

const grid = new GridLayout({
  width: 600,
  height: 400,
  sortBy: 'degree', // 按节点度数排序
  rows: 4, // 固定为 4 行
});
```

执行布局，返回计算后的节点位置信息（不修改原数据）。

```ts
const positions = await grid.execute(data);
// positions = { nodes: [{ id: 'node1', data: { x: 100, y: 100 } }, ...], edges: [...] }
```

或者，直接将计算后的位置赋值给节点（修改原数据）。

```ts
await grid.assign(data);
// data.nodes[0].data.x 已被更新
```

## 配置项

| 属性                      | 类型                                 | 默认值     | 必选 | 描述                                                                                                                            |
| :------------------------ | :----------------------------------- | :--------- | :--- | :------------------------------------------------------------------------------------------------------------------------------ |
| **width**                 | `number`                             | `300`      | ❌   | 布局区域的宽度。                                                                                                                |
| **height**                | `number`                             | `300`      | ❌   | 布局区域的高度。                                                                                                                |
| **begin**                 | `[number, number]`                   | `[0, 0]`   | ❌   | 网格左上角的起始位置 `[x, y]`。                                                                                                 |
| **rows**                  | `number`                             | -          | ❌   | 网格的行数。若不填，将根据宽高比自动计算。                                                                                      |
| **cols**                  | `number`                             | -          | ❌   | 网格的列数。若不填，将根据宽高比自动计算。                                                                                      |
| **sortBy**                | `string`                             | `'degree'` | ❌   | 节点的排序依据。可选：<br/>- `'degree'`: 按度数排序。<br/>- `'id'`: 按 ID 排序。<br/>- 数据属性名: 按节点数据中的指定字段排序。 |
| **preventOverlap**        | `boolean`                            | `true`     | ❌   | 是否防止节点重叠。开启后会根据节点大小调整网格单元格大小。                                                                      |
| **preventOverlapPadding** | `number`                             | `10`       | ❌   | 防止重叠时的间隙大小（当 `preventOverlap` 为 `true` 时生效）。                                                                  |
| **nodeSize**              | `number` \| `number[]` \| `Function` | `30`       | ❌   | 节点大小，用于防重叠计算。支持固定值、数组 `[w, h]` 或回调函数。                                                                |
| **nodeSpacing**           | `number` \| `Function`               | -          | ❌   | 节点间的最小间距。若设置，优先级高于 `preventOverlapPadding`。                                                                  |
| **condense**              | `boolean`                            | `false`    | ❌   | 是否压缩网格。为 `true` 时利用空间更紧凑，否则均匀分布。                                                                        |
| **position**              | `(node) => { row, col }`             | -          | ❌   | 指定特定节点在网格中的行和列索引的回调函数。                                                                                    |

> **说明**：若同时未指定 `rows` 和 `cols`，算法会自动根据 `width` 和 `height` 计算最接近画布宽高比的网格布局。

## API

### `new GridLayout(options?)`

实例化布局算法。

### `layout.execute(graph, options?)`

执行布局计算。返回包含节点位置信息的 `LayoutMapping` 对象，**不会**修改原始图数据。

- **graph**: `Graph` 实例或 `GraphData` 数据对象。
- **options**: 可选，本次执行覆盖的配置项。

### `layout.assign(graph, options?)`

执行布局计算，并**直接更新**传入的图数据中的节点位置（`x`, `y`）。

- **graph**: `Graph` 实例或 `GraphData` 数据对象。
- **options**: 可选，本次执行覆盖的配置项。

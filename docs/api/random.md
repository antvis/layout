# RandomLayout 随机布局

随机布局（RandomLayout）将图中的节点随机分布在指定的画布范围内。通常用于图数据的快速初始化展示。

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
    { id: 'edge1', source: 'node1', target: 'node2', data: {} },
    // ...
  ],
};
```

然后，初始化随机布局算法。

```ts
import { RandomLayout } from '@antv/layout';

const random = new RandomLayout({
  width: 500,
  height: 500,
  center: [250, 250],
});
```

执行布局，返回计算后的节点位置信息（不修改原数据）。

```ts
const positions = await random.execute(data);
// positions = { nodes: [{ id: 'node1', data: { x: 100, y: 200 } }, ...], edges: [...] }
```

或者，直接将计算后的位置赋值给节点（修改原数据）。

```ts
await random.assign(data);
// data.nodes[0].data.x 已被更新
```

## 配置项

| 属性       | 类型               | 默认值   | 必选 | 描述                      |
| :--------- | :----------------- | :------- | :--- | :------------------------ |
| **center** | `[number, number]` | `[0, 0]` | ❌   | 布局的中心位置 `[x, y]`。 |
| **width**  | `number`           | `300`    | ❌   | 布局区域的宽度。          |
| **height** | `number`           | `300`    | ❌   | 布局区域的高度。          |

> **注意**：布局计算时会应用 `0.9` 的缩放比例，防止节点紧贴布局区域边缘。

## API

### `new RandomLayout(options?)`

实例化布局算法。

### `layout.execute(graph, options?)`

执行布局计算。返回包含节点位置信息的 `LayoutMapping` 对象，**不会**修改原始图数据。

- **graph**: `Graph` 实例或 `GraphData` 数据对象。
- **options**: 可选，本次执行覆盖的配置项。

### `layout.assign(graph, options?)`

执行布局计算，并**直接更新**传入的图数据中的节点位置（`x`, `y`）。

- **graph**: `Graph` 实例或 `GraphData` 数据对象。
- **options**: 可选，本次执行覆盖的配置项。

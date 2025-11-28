# FruchtermanLayout 力导向布局

Fruchterman 布局是一种基于力导向算法的图布局方式，通过模拟节点之间的斥力和连边的引力，使图达到视觉上的平衡状态。该算法基于 [Reingold: Graph Drawing by Force-directed Placement](http://www.mathe2.uni-bayreuth.de/axel/papers/reingold:graph_drawing_by_force_directed_placement.pdf) 算法实现。

<center>
<img src="https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*jK3ITYqVJnQAAAAAAAAAAABkARQnAQ" width="300"/>
</center>

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
    { id: 'edge2', source: 'node2', target: 'node3', data: {} },
    // ...
  ],
};
```

然后，初始化 Fruchterman 布局算法。

```ts
import { FruchtermanLayout } from '@antv/layout';

const layout = new FruchtermanLayout({
  width: 500,
  height: 500,
  center: [250, 250],
  maxIteration: 1000,
});
```

执行布局，返回计算后的节点位置信息（不修改原数据）。

```ts
const positions = await layout.execute(data);
// positions = { nodes: [{ id: 'node1', data: { x: 100, y: 200 } }, ...], edges: [...] }
```

或者，直接将计算后的位置赋值给节点（修改原数据）。

```ts
await layout.assign(data);
// data.nodes[0].data.x 已被更新
```

## 配置项

| 属性               | 类型                                 | 默认值      | 必选 | 描述                                               |
| :----------------- | :----------------------------------- | :---------- | :--- | :------------------------------------------------- |
| **center**         | `[number, number]`                   | `[0, 0]`    | ❌   | 布局的中心位置 `[x, y]`。                          |
| **width**          | `number`                             | `300`       | ❌   | 布局区域的宽度。                                   |
| **height**         | `number`                             | `300`       | ❌   | 布局区域的高度。                                   |
| **maxIteration**   | `number`                             | `1000`      | ❌   | 最大迭代次数。                                     |
| **gravity**        | `number`                             | `10`        | ❌   | 中心引力强度，值越大节点越靠近中心。               |
| **speed**          | `number`                             | `5`         | ❌   | 每次迭代的移动速度因子。                           |
| **clustering**     | `boolean`                            | `false`     | ❌   | 是否启用聚类布局。                                 |
| **nodeClusterBy**  | `string \| ((node) => string)`       | `'cluster'` | ❌   | 聚类字段名或聚类函数，返回节点所属的聚类标识。     |
| **clusterGravity** | `number`                             | `10`        | ❌   | 聚类中心引力强度，仅在 `clustering: true` 时生效。 |
| **dimensions**     | `2 \| 3`                             | `2`         | ❌   | 布局维度，`2` 为平面布局，`3` 为空间布局。         |
| **onTick**         | `(positions: LayoutMapping) => void` | `undefined` | ❌   | 每次迭代后的回调函数，用于实时渲染布局过程。       |

## API

### `new FruchtermanLayout(options?)`

实例化布局算法。

**参数**

- **options**: 可选，布局配置项。

---

### `layout.execute(graph, options?)`

执行布局计算。返回包含节点位置信息的 `LayoutMapping` 对象，**不会**修改原始图数据。

**参数**

- **graph**: `Graph` 实例或 `GraphData` 数据对象。
- **options**: 可选，本次执行覆盖的配置项。

**返回值**

- `Promise<LayoutMapping>`

---

### `layout.assign(graph, options?)`

执行布局计算，并**直接更新**传入的图数据中的节点位置（`x`, `y`, `z`）。

**参数**

- **graph**: `Graph` 实例或 `GraphData` 数据对象。
- **options**: 可选，本次执行覆盖的配置项。

**返回值**

- `Promise<void>`

---

### `layout.tick(iterations?)`

手动执行指定次数的迭代计算。返回当前的布局结果。

**参数**

- **iterations**: 可选，迭代次数，默认为 `1`。

**返回值**

- `LayoutMapping`

**示例**

```ts
// 执行 100 次迭代
const positions = layout.tick(100);
```

---

### `layout.stop()`

停止布局动画。适用于在布局完成前提前终止。

**示例**

```ts
layout.execute(data); // 开始布局
setTimeout(() => {
  layout.stop(); // 5秒后停止
}, 5000);
```

---

### `layout.restart()`

重新启动布局动画。会重置迭代计数并从当前状态继续计算。

**示例**

```ts
layout.restart();
```

---

### `layout.setFixedPosition(id, position)`

设置节点的固定位置。固定的节点不会受力移动，但会参与力的计算并影响其他节点。

**参数**

- **id**: `string | number`，节点 ID。
- **position**: `(number | null)[]`，固定位置 `[x, y]` 或 `[x, y, z]`。传入 `null` 表示释放对应轴的固定。

**示例**

```ts
// 固定节点位置
layout.setFixedPosition('node1', [100, 200]);

// 释放固定
layout.setFixedPosition('node1', [null, null]);

// 3D 布局
layout.setFixedPosition('node1', [100, 200, 50]);
```

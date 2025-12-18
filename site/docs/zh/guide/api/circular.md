# Circular 圆形布局

圆形布局将节点排列在一个圆上。通过调整配置项，用户可以调整节点排序方式、分组数量、径向布局等。该布局基于论文实现：[A framework and algorithms for circular drawings of graphs](https://www.sciencedirect.com/science/article/pii/S1570866705000031)。

![circular](https://gw.alipayobjects.com/mdn/rms_f8c6a0/afts/img/A*D85cS7-yqNEAAAAAAAAAAABkARQnAQ)

## 配置项

| 配置项      | 说明                                                                                                                                                | 类型                                                                             | 默认值                    |
| ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------- |
| width       | 布局的宽度                                                                                                                                          | `number`                                                                         | `undefined`               |
| height      | 布局的高度                                                                                                                                          | `number`                                                                         | `undefined`               |
| center      | 布局的中心点坐标                                                                                                                                    | `[number, number]`                                                               | `[width / 2, height / 2]` |
| radius      | 圆的半径。如果指定了该值，`startRadius` 和 `endRadius` 将被忽略                                                                                     | `number`                                                                         | `null`                    |
| startRadius | 螺旋布局的起始半径                                                                                                                                  | `number`                                                                         | `null`                    |
| endRadius   | 螺旋布局的结束半径                                                                                                                                  | `number`                                                                         | `null`                    |
| startAngle  | 节点放置的起始角度(弧度制)                                                                                                                          | `number`                                                                         | `0`                       |
| endAngle    | 节点放置的结束角度(弧度制)                                                                                                                          | `number`                                                                         | `2 * Math.PI`             |
| clockwise   | 是否按顺时针方向放置节点                                                                                                                            | `boolean`                                                                        | `true`                    |
| divisions   | 圆上节点的分组数量。当 `endRadius - startRadius !== 0` 时生效                                                                                       | `number`                                                                         | `1`                       |
| ordering    | 节点的排序方式。`null` 表示按数据顺序排列；`'topology'` 表示按拓扑顺序排列；`'topology-directed'` 表示按有向拓扑顺序排列；`'degree'` 表示按度数排列 | `null \| 'topology' \| 'topology-directed' \| 'degree'`                          | `null`                    |
| angleRatio  | 节点之间的角度比例。例如，`angleRatio: 1` 表示节点之间的角度为 `(endAngle - startAngle) / nodeCount`                                                | `number`                                                                         | `1`                       |
| nodeSize    | 节点的大小。与 `nodeSpacing` 配合使用可自动计算半径                                                                                                 | `number \| [number, number] \| ((node: NodeData) => number \| [number, number])` | `undefined`               |
| nodeSpacing | 节点之间的间距。与 `nodeSize` 配合使用可自动计算半径。如果指定了该值，`startRadius` 和 `endRadius` 将被忽略                                         | `number \| ((node: NodeData) => number`)                                         | `undefined`               |

:::tip
`NodeData` 代表传入的原始节点数据
:::

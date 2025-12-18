# 准备数据

在前面的 [示例](./getting-started.mdx) 中，直接使用了 `id / source / target` 这样的字段来描述图数据。
但在真实业务中，节点和边的数据结构往往更加复杂，也不一定符合布局算法的默认字段约定。

这里提供了 **数据映射通道**，用于将业务数据转换为布局可识别的内部模型。

## 1. 原始业务数据

假设你的业务数据结构如下：

```js
const data = {
  nodes: [
    { nodeId: 'n1', position: { x: 100, y: 200 }, radius: 16 },
    { nodeId: 'n2', position: { x: 300, y: 200 }, radius: 16 },
  ],
  edges: [{ edgeId: 'e1', from: 'n1', to: 'n2', weight: 2 }],
};
```

此时字段命名与布局默认约定并不一致，无法直接用于布局计算。

## 2. 配置数据映射

通过在布局初始化或执行时传入 `node` 和 `edge` 映射函数，可以完成字段转换。

### 节点映射

```js
const layout = new CircularLayout({
  node: (datum) => ({
    id: datum.nodeId,
    x: datum.position?.x,
    y: datum.position?.y,
  }),
});
```

映射函数接收 **单个原始节点数据**，并返回布局所需字段：

- `id`：节点唯一标识，默认会读取 `datum.id`
- `x / y / z`：初始位置（可选），默认读取 `datum.x / datum.y / datum.z`。如果有初始位置，布局时会基于当前位置进行计算。

### 边映射

```js
const layout = new CircularLayout({
  edge: (datum) => ({
    id: datum.edgeId,
    source: datum.from,
    target: datum.to,
  }),
});
```

映射结果中需要至少提供：

- `source`：起点节点 ID，默认读取 `datum.source`
- `target`：终点节点 ID，默认读取 `datum.target`

## 3. 执行布局

数据映射配置完成后，布局的使用方式与基础示例完全一致：

```js
await layout.execute(data);
```

布局过程中：

- **不会修改原始数据**
- 会自动生成内部的节点与边模型
- 所有映射逻辑只在布局内部生效

## 4. 读取映射后的结果

布局完成后，仍然通过统一接口读取结果：

```js
layout.forEachNode((node) => {
  console.log(node.id, node.x, node.y);
});
```

通过数据映射，`@antv/layout` 可以适配各种业务数据结构，而不增加额外的维护成本。

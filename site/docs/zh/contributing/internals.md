# 内部实现思路

本节用“从入口到结果”的方式概览 `@antv/layout` 的实现结构。

## 1. 布局的统一入口：`BaseLayout.execute`

所有布局类都以 `BaseLayout` 为基础（`src/algorithm/base-layout.ts`）：

- 合并默认配置与用户配置（`mergeOptions`）
- 构建运行时上下文：`RuntimeContext(data, { node, edge })`
- 判断是否启用 Worker：`enableWorker && typeof Worker !== 'undefined'`
  - 启用：走 `layoutInWorker`
  - 不启用：直接在主线程调用 `layout()`

## 2. 图数据模型：`RuntimeContext` + `GraphLib`

`RuntimeContext` 的职责是把输入 `GraphData` 包装成可读写的图对象：

- 内部使用 `GraphLib` 存储 `nodes`/`edges` 的 `Map`
- 提供 `forEachNode/forEachEdge` 等便利方法
- `forEachEdge` 会把 `sourceNode/targetNode` 填好，减少算法层重复查找

`GraphLib` 做两类事情：

- 数据结构：把 `nodes/edges` 提前组织成 Map，并保留 `_original` 引用
- 性能缓存：度、邻接表、索引映射等按需构建并缓存

## 3. Worker 执行：`Supervisor` ↔ `worker.ts`

Worker 的目标是把计算放到后台线程，避免阻塞主线程。

- `Supervisor`（主线程）：
  - 解析 worker 脚本路径（兼容 ESM/UMD 场景）
  - `new Worker(workerPath, { type })` 并用 Comlink `wrap` 出 `workerApi`
  - 调 `workerApi.execute(layoutId, data, options)` 获取结果图
- `worker.ts`（worker 线程）：
  - 通过 `registry[layoutId]` 拿到布局构造器并执行
  - 强制把 `enableWorker` 置为 `false`，避免“Worker 中再开 Worker”
  - 返回 `layoutInstance.model.data()`（节点/边 Map 的最终结果）

Worker 失败时会自动回退到主线程执行（见 `BaseLayout.layoutInWorker` 的 try/catch）。

## 4. 迭代类布局：`BaseSimulation` 的思路

一些布局需要迭代收敛（如力导向类）。`BaseSimulation` 提供通用控制：

- `tick(n)`：执行 n 次迭代，并触发 `tick` 回调
- `restart()`：支持动画/非动画两种运行模式
- `stop()`：停止迭代

具体算法只需要实现 `runOneStep()`，返回本次的“移动距离/收敛指标”。

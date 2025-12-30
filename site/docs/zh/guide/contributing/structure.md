# 项目架构

## 目录速览

- `src`：库核心源码（算法、类型、Worker 入口等）
- `lib`：ESM 构建产物（发布物）
- `dist`：UMD 构建产物（发布物）
- `site`：文档站（Rspress）
- `__tests__`：单元测试
- `perf`：性能基准与对比（可选）

## 目录说明

`src` 是库的核心实现，推荐从 `src/index.ts` 与 `src/algorithm/base-layout.ts` 读起。

- `src/index.ts`：对外导出
- `src/registry.ts`：布局注册表（`layoutId -> LayoutCtor`）
- `src/algorithm/`：布局算法实现
  - `base-layout.ts`：布局基类（统一执行入口，支持 Worker）
  - `base-simulation.ts`：迭代/仿真类公共逻辑（tick/restart/stop）
- `src/model/`：图数据模型
- `src/runtime/`：运行时能力
  - `context.ts`：`RuntimeContext`（把输入数据包装成可迭代的图上下文）
  - `supervisor.ts`：Worker 管理（初始化、调用、销毁、路径解析）
- `src/worker.ts`：Worker 入口（Comlink expose）
- `src/types/`：公共类型定义
- `src/util/`：工具函数

## 新增一个布局算法时改哪些地方

通常包括：

1. 在 `src/algorithm/` 新增实现（继承 `BaseLayout`，实现 `id` + `layout()`）
2. 在 `src/algorithm/index.ts` 与 `src/index.ts` 导出该布局
3. 在 `src/registry.ts` 注册 `id`
4. 补测试：`__tests__`
5. 补文档：`site/docs/zh/guide/api/`

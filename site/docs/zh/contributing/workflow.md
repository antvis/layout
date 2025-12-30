# 贡献流程

## 前置条件

- Node.js `>= 18.12`
- npm `>= 9`（或与项目锁文件匹配的版本）

## 安装依赖

```bash
git clone https://github.com/antvis/layout.git
npm i
```

## 本地开发

常用开发方式按目标分三类：

- **改布局库本体（根目录）**
  - 启动开发服务：`npm run dev`
  - 构建：`npm run build`
  - 测试：`npm test`
- **改文档站（`site`）**
  - 启动：`npm --prefix site run dev`
  - 构建：`npm --prefix site run build`
- **全量检查（建议在提 PR 前跑一遍）**
  - 构建：`npm run build`
  - 测试：`npm test`

## 提交前自检

- 保持改动最小且聚焦（一个 PR 做一件事）
- 有行为变更时补齐测试（`__tests__`）
- 文档/示例与代码一致（新增布局/参数时同时更新）

## 版本与变更记录（可选）

仓库使用 Changesets 管理发布变更（`.changeset/`）。如需要新增变更记录：

```bash
npx changeset
```

新增/修改的 changeset 会在发布时汇总到 changelog。

## 提交 PR

```bash
git checkout -b feat/your-branch
git add .
git commit -m "feat(layout): ..."
git push origin feat/your-branch
```

提交信息建议遵循 Angular 风格（详见仓库根目录 `CONTRIBUTING.md`）。

# protocol/main: 用扁平文件表达任意深度的 Issue Graph

- ID：`0.1.0-PROTO-B-000`。
- 类型：`API`。
- 状态：待处理（原文未完成项保持未勾选）。
- 版本管理标识：`versioncontrolid`（含义待定义，不推断为 commit、branch 或 change）。
- 来源：`REQUIREMENTS.md` @ `7649f547f4ea8214825f55d0746338becf1aea33`；标题路径：任务清单 / Phase - v0.1.0 - Markdown Issue Protocol 与最小可用流程 / protocol/main: 用扁平文件表达任意深度的 Issue Graph。
- 原稳定 ID：`0.1.0-PROTO-B-000`, `0.1.0-PROTO-B-001`, `0.1.0-PROTO-B-002`, `issue-001`, `0.1.0-PROTO-B-003`, `0.1.0-PROTO-B-004`, `0.1.0-PROTO-B-005`, `0.1.0-PROTO-B-006`, `0.1.0-PROTO-B-007`；不改写或重编号这些既有 ID。

## 当前需求与范围

- [ ] [0.1.0-PROTO-B-000] 所有工作对象统一为 Issue，并通过关系而不是目录深度表达结构 #epic #P0
  - [ ] [0.1.0-PROTO-B-001] Issue 文件平级存放在仓库的 `issues/` 目录，文件名采用稳定、可预测的 `issue-001.md` 形式。
  - [ ] [0.1.0-PROTO-B-002] `parent` 保存至多一个 Obsidian wikilink，例如 `"[[issue-001]]"`，并允许由同一规则形成任意深度的父子层级。
  - [ ] [0.1.0-PROTO-B-003] Issue 与 Sub-issue 不建模为两种实体；是否为 Sub-issue 只由 `parent` 是否存在推导。
  - [ ] [0.1.0-PROTO-B-004] 文件中不保存 `children`；children 永远通过反向查询其他 Issue 的 `parent` 动态计算。
  - [ ] [0.1.0-PROTO-B-005] `depends_on` 使用多个 Obsidian wikilink表达执行依赖，并与 `parent` 的工作分解语义分离。
  - [ ] [0.1.0-PROTO-B-006] 协议可用多个 Obsidian wikilink表达 `related` 等非层级语义关联，但不得与依赖或父子关系混用。 #P1
  - [ ] [0.1.0-PROTO-B-007] 普通 Obsidian 能直接跳转父级、查看 Backlinks，并在 Graph View 中观察 Issue 关系，不需要专用插件才能理解协议。

## 检查与验收边界

以上勾选与结果沿用迁移前的当前需求文档；历史记录中的实现、测试、编译、视觉与用户验收彼此独立。本次只迁移文档并检查结构 / 引用，没有重新执行产品构建或用户验收，也没有凭历史日志新增完成勾选。

## Comments

### 2026-10-23 17:44:33 UTC — Agent（文档迁移）

按原有功能 / 工作目标标题拆分需求，保留原 ID、勾选、依赖、最新补充及来源。没有稳定根 ID或旧 ID 在不同上下文重用时，采用由来源路径和标题确定的迁移 Issue ID，原 ID 仍在正文保留。完整旧内容可从来源版本读取；独有未提交内容的版本化副本见迁移映射。

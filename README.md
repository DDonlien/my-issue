# myIssue

myIssue 是一个 repo-native、agent-neutral 的 Issue/Task 上下文层。它让人类和任意 Coding Agent 通过仓库内的 Markdown 文件共享工作定义、当前状态、关系与评论，而不把 Agent、模型或 Harness 的运行交给 myIssue 托管。

## 当前状态

- 阶段：需求定义
- 实现：尚未开始
- 仓库：`my-issue`
- 产品名：`myIssue`

当前提交只建立项目边界与需求基线，不包含 CLI、GUI、服务端或其他实现代码。

## 核心方向

- Markdown 文件是唯一事实来源；Git 保存精确变更历史。
- 所有 Issue 平级存放在 `issues/`，层级与依赖由 Obsidian wikilink 属性表达。
- 一个 Issue 由 Properties、Description 与 Comments 组成。
- 人类和 Agent 使用同一套 Issue 与 Comment 模型。
- CLI、Kanban、TUI、Obsidian Plugin 和 IDE Plugin 都只是可替换的操作或展示层。
- 即使移除 CLI、GUI、AI、模型与 Harness，Issue 文件仍可直接阅读和维护。

## 明确边界

myIssue 不负责启动、暂停或调度 Agent，不管理模型供应商、Prompt、Session、Worktree 或 Agent Runtime，也不要求账号、云服务或中心数据库。

`REQUIREMENTS.md` 与 Issue 是否最终统一为同一种实体仍需在协议冻结前决定；当前不会用未确认的数据模型替代需求文档。

## 文档入口

- [`REQUIREMENTS.md`](REQUIREMENTS.md)：产品需求、待决策项与验收条件
- [`AGENTS.md`](AGENTS.md)：协作边界与维护规则
- [`DESIGN.md`](DESIGN.md)：当前视觉范围与未来展示层约束
- `agent-log/`：每次任务的执行记录

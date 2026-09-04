# myIssue 协作规则

## 项目范围

- 产品名使用 `myIssue`，仓库名使用 `my-issue`。
- 本仓库开发 repo-native、agent-neutral 的 Issue/Task 上下文层。
- 当前阶段只定义需求与协议；在用户明确要求开始实现前，不编写产品代码。

## 每次任务开始前

1. 阅读本文件、`README.md`、`REQUIREMENTS.md`、`DESIGN.md` 与最近相关的 `agent-log/`。
2. 检查当前分支、上游状态与未提交改动，保留用户已有工作。
3. 在 `REQUIREMENTS.md` 中找到对应稳定 ID；新增产品行为时先记录需求，再实施。
4. 不把参考项目或历史讨论中的建议自动当作已确认需求；以用户最新确认和当前需求文档为准。

## 产品不变量

1. Markdown Issue 文件是系统事实来源，任何数据库或索引都只能是可重建的派生数据。
2. 核心数据不能依赖特定 AI、模型、Agent、Harness、云服务或 GUI 才能读取和修改。
3. 文件只保存事实，层级、children、ready 列表、Kanban 列和关系图等视图由查询推导。
4. `Description` 是用户自由编辑的 Markdown；系统不得强制解析其中的业务子标题。
5. `Comments` 是人类与 Agent 共用的历史线程；已存在的 Comment 不得被结构化操作静默改写。
6. `parent`、`depends_on` 与其他关系不得形成重复事实来源。
7. myIssue 不托管 Agent 执行，不负责 Agent Runtime、模型适配、Prompt、Session、Branch 或 Worktree 生命周期。

## 需求与文档

- `REQUIREMENTS.md` 使用稳定 ID 与 Markdown checkbox；不静默删除或重编号已有需求。
- 功能、范围、验收条件或协议发生变化时，同步更新 `REQUIREMENTS.md`。
- `README.md` 只说明产品、当前能力和边界，不放具体待办。
- `DESIGN.md` 只记录视觉和交互约束；系统架构与协议要求留在需求或后续架构文档中。
- 每次产生仓库修改时，在 `agent-log/` 新增一条执行日志，记录原始请求、决策、改动、验证以及提交和推送状态。

## 实施与验证

- 只实施已确认需求所需的最小范围，不预先增加 GUI、服务端、数据库或 Agent 适配层。
- Schema 变更必须先写清兼容性、迁移与失败行为。
- 实现后分别报告静态检查、自动测试、实际 CLI/交互、提交和推送状态；这些状态互不替代。
- 提交时只包含本任务文件；未经用户明确要求，不进行破坏性 Git 操作或改写远端历史。

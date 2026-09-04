# 任务清单

本文件是 myIssue 在协议能够自托管需求之前的需求事实来源。当前阶段只记录需求与待决策项，所有产品实现条目均保持未完成。

## Phase - v0.1.0 - Markdown Issue Protocol 与最小可用流程

### protocol/main: 建立可脱离 Agent 与 Harness 的 Issue 协议

- [ ] [0.1.0-PROTO-A-000] 交付 repo-native、agent-neutral 的 Issue Protocol #epic #P0
  - [ ] [0.1.0-PROTO-A-001] 每个项目把可读、可手工编辑的 Markdown Issue 文件作为唯一事实来源，Git 负责保存精确的文件变更历史。
  - [ ] [0.1.0-PROTO-A-002] 核心读写流程不依赖账号、云服务、常驻服务端、专有数据库、GUI、AI 模型或 Agent Harness。
  - [ ] [0.1.0-PROTO-A-003] 人类与任意 Coding Agent 使用同一套文件协议，不要求 myIssue 识别或适配具体 Agent 产品。
  - [ ] [0.1.0-PROTO-A-004] 移除 myIssue CLI、GUI、插件、AI 与 Harness 后，用户仍能直接读取和维护全部 Issue 信息。
  - [ ] [0.1.0-PROTO-A-005] CLI、索引与展示层生成的缓存必须可由 Markdown 文件完整重建，不得成为第二事实来源。

### protocol/main: 用扁平文件表达任意深度的 Issue Graph

- [ ] [0.1.0-PROTO-B-000] 所有工作对象统一为 Issue，并通过关系而不是目录深度表达结构 #epic #P0
  - [ ] [0.1.0-PROTO-B-001] Issue 文件平级存放在仓库的 `issues/` 目录，文件名采用稳定、可预测的 `issue-001.md` 形式。
  - [ ] [0.1.0-PROTO-B-002] `parent` 保存至多一个 Obsidian wikilink，例如 `"[[issue-001]]"`，并允许由同一规则形成任意深度的父子层级。
  - [ ] [0.1.0-PROTO-B-003] Issue 与 Sub-issue 不建模为两种实体；是否为 Sub-issue 只由 `parent` 是否存在推导。
  - [ ] [0.1.0-PROTO-B-004] 文件中不保存 `children`；children 永远通过反向查询其他 Issue 的 `parent` 动态计算。
  - [ ] [0.1.0-PROTO-B-005] `depends_on` 使用多个 Obsidian wikilink表达执行依赖，并与 `parent` 的工作分解语义分离。
  - [ ] [0.1.0-PROTO-B-006] 协议可用多个 Obsidian wikilink表达 `related` 等非层级语义关联，但不得与依赖或父子关系混用。 #P1
  - [ ] [0.1.0-PROTO-B-007] 普通 Obsidian 能直接跳转父级、查看 Backlinks，并在 Graph View 中观察 Issue 关系，不需要专用插件才能理解协议。

### protocol/main: 定义最小且可读的 Issue 文件

- [ ] [0.1.0-SCHEMA-A-000] 一个 Issue 由 Properties、Title、Description 与 Comments 构成 #epic #P0
  - [ ] [0.1.0-SCHEMA-A-001] YAML frontmatter 只保存当前结构化状态与关系；必须字段、可选字段、默认值和状态词表在实现前冻结。
  - [ ] [0.1.0-SCHEMA-A-002] 一级标题 `# Title` 是人类可读的 Issue 标题，协议不得要求用户在正文中重复维护第二份标题。
  - [ ] [0.1.0-SCHEMA-A-003] `## Description` 保存用户自由编写的 Markdown，myIssue 将其视为完整内容块，不解释或强制 `Acceptance Criteria`、`Context`、`Notes` 等子标题。
  - [ ] [0.1.0-SCHEMA-A-004] `## Comments` 是人类和 Agent 共用的 Comment thread，可记录补充要求、进展、提问、回答、Blocker、Review 意见、方向变更与最终总结。
  - [ ] [0.1.0-SCHEMA-A-005] 每条 Comment 使用三级标题携带时间、用户名与执行者类型或 Agent 模型名；格式必须同时便于阅读和无歧义解析。
  - [ ] [0.1.0-SCHEMA-A-006] 人类 Comment 使用 `human` 标识执行者类型，Agent Comment 记录可获得的具体模型标识。
  - [ ] [0.1.0-SCHEMA-A-007] 结构化操作只能新增 Comment，不得重写、删除或重排已有 Comment；需要纠正时新增一条说明。
  - [ ] [0.1.0-SCHEMA-A-008] Comment 保存有语义的工作上下文，Git history 保存精确 mutation history；二者不能互相替代。

Issue 文件的目标形态如下；在待决策项关闭前，此示例只表示已经确认的最小结构，不代表全部 frontmatter 已冻结：

```markdown
---
id: issue-002
status: todo
parent: "[[issue-001]]"
depends_on:
  - "[[issue-003]]"
---

# Implement Save System

## Description

实现多存档系统。

## Comments

### 2026-09-02 10:32 · taobe · gpt-5.6

确认序列化层没有问题，当前问题位于旧存档迁移逻辑。

### 2026-09-02 11:04 · taobe · human

停止当前方案，改为评估 SQLite migration。
```

### cli/main: 提供薄而确定的结构化操作入口

- [ ] [0.1.0-CLI-A-000] 提供可供人类、脚本与 Agent 共用的最小 CLI #epic #P0
  - [ ] [0.1.0-CLI-A-001] 提供 `init`、`create`、`list`、`show`、`ready`、`status`、`parent`、`comment`、`close` 与 `validate` 的最小工作流；最终命令面在实现前复核并冻结。
  - [ ] [0.1.0-CLI-A-002] 所有读取命令提供稳定、低冗余的机器可读输出，至少支持 JSON。
  - [ ] [0.1.0-CLI-A-003] CLI 只负责需要确定性的结构化 mutation；用户仍可直接用任意 Markdown 编辑器修改 Title 与 Description。
  - [ ] [0.1.0-CLI-A-004] `comment` 自动写入时间与执行者元数据，并保证已有 Comment 内容不被意外修改。
  - [ ] [0.1.0-CLI-A-005] `ready` 只返回状态允许开始且依赖已经满足的 Issue，其结果由当前文件实时推导。
  - [ ] [0.1.0-CLI-A-006] 无效输入、损坏文件或关系冲突必须明确失败，不得用静默默认值覆盖用户文件。
  - [ ] [0.1.0-CLI-A-007] CLI 修改后保持用户原有 Markdown 内容与不相关格式，不对整个文件做无关重排。

### integration/main: 让现有项目逐步采用 myIssue

- [ ] [0.1.0-INTEGRATION-A-000] 项目能够在不迁移代码和 Git 历史的前提下采用 myIssue #epic #P0
  - [ ] [0.1.0-INTEGRATION-A-001] 初始化只添加协议所需文件和配置，不改变目标项目已有目录结构、分支策略或 Harness。
  - [ ] [0.1.0-INTEGRATION-A-002] 提供一份简短的 `AGENTS.md` 使用约定，使未知 Agent 只靠仓库说明即可读取、领取、评论和关闭 Issue。
  - [ ] [0.1.0-INTEGRATION-A-003] Issue 能关联现有长期需求，使 Agent 获得一次具体工作的目标、上下文、依赖与最新讨论。
  - [ ] [0.1.0-INTEGRATION-A-004] 项目不安装 myIssue CLI 时，仍可通过复制最小模板或手工创建兼容 Issue。

### protocol/main: 关闭协议冻结前的关键待决策项

- [ ] [0.1.0-PM-A-000] 在开始产品代码前冻结 v0.1.0 Schema 与边界 #epic #P0
  - [ ] [0.1.0-PM-A-001] 决定 `REQUIREMENTS.md` 与 Issue 的长期关系：继续保留独立需求文档，或把 requirement 建模为带类型的 Issue；决定时必须处理长期规格与可关闭 Issue 生命周期的差异。
  - [ ] [0.1.0-PM-A-002] 决定最小 frontmatter 字段、可选字段、字段顺序、默认值与状态词表。
  - [ ] [0.1.0-PM-A-003] 决定 Comment 标题的最终时间格式、时区规则、分隔符与排序规则，同时保证人类可读和机器无歧义解析。
  - [ ] [0.1.0-PM-A-004] 决定 Issue ID 的分配方式以及删除、重命名和移动后的引用稳定性规则。
  - [ ] [0.1.0-PM-A-005] 决定并发写入、领取与释放 Issue 的最小语义；在该规则冻结前，不宣称支持多个 Agent 安全竞争同一 Issue。
  - [ ] [0.1.0-PM-A-006] 决定实现语言、安装方式和跨平台支持范围；该工程选择不得改变文件协议的独立性。

### validation/main: 验证协议可恢复、可互操作且不损坏内容

- [ ] [0.1.0-QA-A-000] 为每项核心协议行为提供自动验证与真实文件验收 #epic #P0
  - [ ] [0.1.0-QA-A-001] 验证合法 Issue 能解析、修改并重新读取，且 Title、Description 与既有 Comments 原文保持不变。
  - [ ] [0.1.0-QA-A-002] 检测重复 ID、缺失目标、损坏 wikilink、非法 parent 循环与非法 dependency 循环。
  - [ ] [0.1.0-QA-A-003] 验证任意深度的 parent 层级能够正确推导 children 与祖先关系。
  - [ ] [0.1.0-QA-A-004] 验证 `ready`、状态变更与依赖解除均由同一文件事实计算，不依赖过期缓存。
  - [ ] [0.1.0-QA-A-005] 在普通 Markdown 编辑器与 Obsidian 中人工验证文件可读、链接可跳转、Backlinks 与 Graph View 可用。
  - [ ] [0.1.0-QA-A-006] 验证 CLI 的 JSON 输出能由不同 Agent 或脚本消费，不需要解析面向人的终端样式。

## Phase - v0.2.0 - 多 Agent 协作与可替换展示层

### collaboration/main: 支持多个执行者协作同一 Issue 集合

- [ ] [0.2.0-COLLAB-A-000] 提供不绑定 Harness 的协作语义 #epic #P1
  - [ ] [0.2.0-COLLAB-A-001] 在 v0.1.0 冻结的并发规则上提供原子领取与释放能力。
  - [ ] [0.2.0-COLLAB-A-002] 领取信息可由人类和不同 Agent 读取，并能区分当前状态与历史 Comment。
  - [ ] [0.2.0-COLLAB-A-003] 异常中断后的恢复流程不会静默覆盖他人的领取或 Comment。

### presentation/main: 在协议之上提供可替换视图

- [ ] [0.2.0-VIEW-A-000] 提供至少一种便于人类浏览与操作 Issue Graph 的展示层 #epic #P1
  - [ ] [0.2.0-VIEW-A-001] 展示层从 `issues/*.md` 推导列表、层级、依赖、ready 状态与 Kanban，不保存重复业务状态。
  - [ ] [0.2.0-VIEW-A-002] 人类在展示层完成的修改可确定性地写回同一 Markdown 文件。
  - [ ] [0.2.0-VIEW-A-003] Obsidian Plugin、Web Kanban、TUI 与 IDE Plugin 作为候选载体分别评估，但 v0.1.0 不要求交付 GUI。

# 明确不在当前范围

- myIssue 不启动、暂停、恢复或调度 Coding Agent。
- myIssue 不管理模型供应商、Prompt、Agent Session、Branch、Worktree、代码 Review 或部署流水线。
- v0.1.0 不建立必须在线的服务端、账号体系、中心数据库或 SaaS。
- v0.1.0 不建立独立 Activity 数据库；有语义的进展进入 Comments，精确变更进入 Git。
- myIssue 不规定 Description 内的业务写法，也不增加系统级 `Acceptance Criteria`、`Context` 或 `Notes` section。
- myIssue 不在父 Issue 中保存 `children`，不通过嵌套目录或 `subtask` 类型重复表达层级。
- v0.1.0 不把一次 Agent Run 建模为 myIssue 托管的运行对象；外部 Harness 可通过 Comment 或未来协议扩展写回结果。

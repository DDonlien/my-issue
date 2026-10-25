---
title: 定义包含Properties标题正文与Comments的最小Issue文件
id: 0.1.0-SCHEMA-A-000
type: API
status: 待处理（原文未完成项保持未勾选）。
版本管理: Git。
来源: '`REQUIREMENTS.md` @ `7649f547f4ea8214825f55d0746338becf1aea33`；标题路径：任务清单 / Phase - v0.1.0 - Markdown Issue Protocol 与最小可用流程 / protocol/main: 定义最小且可读的 Issue 文件。'
原稳定 ID: '`0.1.0-SCHEMA-A-000`, `0.1.0-SCHEMA-A-001`, `0.1.0-SCHEMA-A-002`, `0.1.0-SCHEMA-A-003`, `0.1.0-SCHEMA-A-004`, `0.1.0-SCHEMA-A-005`, `0.1.0-SCHEMA-A-006`, `0.1.0-SCHEMA-A-007`, `0.1.0-SCHEMA-A-008`；不改写或重编号这些既有 ID。'
原需求标题: 'protocol/main: 定义最小且可读的 Issue 文件。'
原迁移文件: '`issue/issue-0.1.0-SCHEMA-A-000-API-issue-files-versioncontrolid.md`（重命名前路径，仅用于历史追溯）。'
updated-time: '2026-10-24T16:22:34+00:00'
---

# Description

## 当前需求与范围

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

## 检查与验收边界

以上勾选与结果沿用迁移前的当前需求文档；历史记录中的实现、测试、编译、视觉与用户验收彼此独立。本次只迁移文档并检查结构 / 引用，没有重新执行产品构建或用户验收，也没有凭历史日志新增完成勾选。

# Comments

## 20261023-174433_Agent

原记录标题：2026-10-23 17:44:33 UTC — Agent（文档迁移）

按原有功能 / 工作目标标题拆分需求，保留原 ID、勾选、依赖、最新补充及来源。没有稳定根 ID或旧 ID 在不同上下文重用时，采用由来源路径和标题确定的迁移 Issue ID，原 ID 仍在正文保留。完整旧内容可从来源版本读取；独有未提交内容的版本化副本见迁移映射。

原记录未提供完整 Agent / 模型详情及原执行会话链接，未补造。

## 20261024-070634_Agent

原记录标题：2026-10-24 07:06:34 UTC — Agent（纠正迁移命名）

根据用户确认的原语言与下划线命名规则整理本记录；类型与原 ID 保留在 properties，原始勾选、取消／延后标记及验收边界照录。 未核实本任务实际实施提交，省略文件名版本后缀；未执行代码、构建或用户验收，未提交或推送。

原记录未提供完整 Agent / 模型详情及原执行会话链接，未补造。

## 20261024-162234_Codex

按用户最新手写模板迁移属性和正文结构，保留任务语义、来源、原始状态及历史内容；本次未重新执行业务验收。

原版本关联记录（照录来源，不将本次文档迁移提交当作业务实施提交）：
- 实施提交：未核实（现有记录未提供可直接对应本任务的实际实施提交；来源快照、当前 HEAD 与文档迁移提交不代替任务实施版本）。

本次执行环境未提供具体模型标识，未补造 Model-Detail。

[本次文档迁移对话](codex://threads/01a157b3-610c-73b4-ae06-163c0f8490d3)

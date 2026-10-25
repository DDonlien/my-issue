---
title: 交付可脱离Agent与Harness的Markdown-Issue协议
id: 0.1.0-PROTO-A-000
type: API
status: 待处理（原文未完成项保持未勾选）。
版本管理: Git。
来源: '`REQUIREMENTS.md` @ `f4834f13242293ffb522ee78c2de0669d6c08ead`；标题路径：任务清单 / Phase - v0.1.0 - Markdown Issue Protocol 与最小可用流程 / protocol/main: 建立可脱离 Agent 与 Harness 的 Issue 协议。'
原稳定 ID: '`0.1.0-PROTO-A-000`, `0.1.0-PROTO-A-001`, `0.1.0-PROTO-A-002`, `0.1.0-PROTO-A-003`, `0.1.0-PROTO-A-004`, `0.1.0-PROTO-A-005`；不改写或重编号这些既有 ID。'
原需求标题: 'protocol/main: 建立可脱离 Agent 与 Harness 的 Issue 协议。'
原迁移文件: '`issue/issue-0.1.0-PROTO-A-000-API-agent-harness-issue-protocol-versioncontrolid.md`（重命名前路径，仅用于历史追溯）。'
updated-time: '2026-10-24T16:22:34+00:00'
---

# Description

## 当前需求与范围

- [ ] [0.1.0-PROTO-A-000] 交付 repo-native、agent-neutral 的 Issue Protocol #epic #P0
  - [ ] [0.1.0-PROTO-A-001] 每个项目把可读、可手工编辑的 Markdown Issue 文件作为唯一事实来源，Git 负责保存精确的文件变更历史。
  - [ ] [0.1.0-PROTO-A-002] 核心读写流程不依赖账号、云服务、常驻服务端、专有数据库、GUI、AI 模型或 Agent Harness。
  - [ ] [0.1.0-PROTO-A-003] 人类与任意 Coding Agent 使用同一套文件协议，不要求 myIssue 识别或适配具体 Agent 产品。
  - [ ] [0.1.0-PROTO-A-004] 移除 myIssue CLI、GUI、插件、AI 与 Harness 后，用户仍能直接读取和维护全部 Issue 信息。
  - [ ] [0.1.0-PROTO-A-005] CLI、索引与展示层生成的缓存必须可由 Markdown 文件完整重建，不得成为第二事实来源。

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

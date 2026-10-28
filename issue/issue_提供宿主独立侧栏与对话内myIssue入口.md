---
title: 提供宿主独立侧栏与对话内myIssue入口
id: CODEX-PLUGIN-002
type: DB
status: 待处理（本任务原文未完成项保持未勾选；取消、阻塞和延后标记照录）。
版本管理: Git。
来源: '`REQUIREMENTS.md` @ `f4834f13242293ffb522ee78c2de0669d6c08ead`；标题路径：任务清单 / Phase - Codex 插件首版（2026-10-01 确认）。'
原稳定 ID: '`CODEX-PLUGIN-001`, `CODEX-PLUGIN-002`, `CODEX-PLUGIN-003`, `CODEX-PLUGIN-004`, `CODEX-PLUGIN-005`, `CODEX-PLUGIN-006`, `CODEX-PLUGIN-007`, `CODEX-PLUGIN-008`, `CODEX-PLUGIN-009`；不改写或重编号这些既有 ID。'
来源汇总状态: 进行中（原文同时包含已完成与未完成项）。
原迁移记录 ID: '`CODEX-PLUGIN-001`。'
本文件原任务 ID: '`CODEX-PLUGIN-002`。'
原需求标题: Phase - Codex 插件首版（2026-10-01 确认）。
原迁移文件: '`issue/issue-CODEX-PLUGIN-001-DB-project-goal-versioncontrolid.md`（重命名前路径，仅用于历史追溯）。'
同源任务: '[提供可安装的myIssue插件清单与分发包](issue_%E6%8F%90%E4%BE%9B%E5%8F%AF%E5%AE%89%E8%A3%85%E7%9A%84myIssue%E6%8F%92%E4%BB%B6%E6%B8%85%E5%8D%95%E4%B8%8E%E5%88%86%E5%8F%91%E5%8C%85.md)、[从真实Markdown文件驱动myIssue看板与安全读写](issue_%E4%BB%8E%E7%9C%9F%E5%AE%9EMarkdown%E6%96%87%E4%BB%B6%E9%A9%B1%E5%8A%A8myIssue%E7%9C%8B%E6%9D%BF%E4%B8%8E%E5%AE%89%E5%85%A8%E8%AF%BB%E5%86%99.md)、[在myIssue与当前或新对话间传递Issue上下文](issue_%E5%9C%A8myIssue%E4%B8%8E%E5%BD%93%E5%89%8D%E6%88%96%E6%96%B0%E5%AF%B9%E8%AF%9D%E9%97%B4%E4%BC%A0%E9%80%92Issue%E4%B8%8A%E4%B8%8B%E6%96%87.md)。'
共同约束与完整历史: '[提供可安装的myIssue插件清单与分发包](issue_%E6%8F%90%E4%BE%9B%E5%8F%AF%E5%AE%89%E8%A3%85%E7%9A%84myIssue%E6%8F%92%E4%BB%B6%E6%B8%85%E5%8D%95%E4%B8%8E%E5%88%86%E5%8F%91%E5%8C%85.md)（共享说明与源 Comments 保留在该主记录）。'
updated-time: '2026-10-24T16:22:34+00:00'
---

# Description

## 当前需求与范围
- [ ] [CODEX-PLUGIN-002] 提供 MCP Apps 全局独立侧栏入口及对话内入口，使用官方 OpenAI UI entrypoints；打开项目时接受根目录下的 `Issue/` 或 `issues/` 文件夹，且不要求迁移原有目录。平台是否展示必须单独人工验收。已实现并由 Codex app-server 读取元数据；2026-10-02 用户截图已确认全局页面显示，对话侧栏入口仍未人工验收。

## 检查与验收边界

以上勾选与结果沿用迁移前的当前需求文档；历史记录中的实现、测试、编译、视觉与用户验收彼此独立。本次只迁移文档并检查结构 / 引用，没有重新执行产品构建或用户验收，也没有凭历史日志新增完成勾选。

# Comments

## 20261024-070634_Agent

原记录标题：2026-10-24 07:06:34 UTC — Agent（纠正迁移命名）

根据用户确认的原语言与下划线命名规则整理本记录；类型与原 ID 保留在 properties，原始勾选、取消／延后标记及验收边界照录。 本源文档按独立目标拆为 4 份，原始 Comments 与共同说明见上方主记录链接。 未核实本任务实际实施提交，省略文件名版本后缀；未执行代码、构建或用户验收，未提交或推送。

原记录未提供完整 Agent / 模型详情及原执行会话链接，未补造。

## 20261024-162234_Codex

按用户最新手写模板迁移属性和正文结构，保留任务语义、来源、原始状态及历史内容；本次未重新执行业务验收。

原版本关联记录（照录来源，不将本次文档迁移提交当作业务实施提交）：
- 实施提交：未核实（现有记录未提供可直接对应本任务的实际实施提交；来源快照、当前 HEAD 与文档迁移提交不代替任务实施版本）。

本次执行环境未提供具体模型标识，未补造 Model-Detail。

[本次文档迁移对话](codex://threads/01a157b3-610c-73b4-ae06-163c0f8490d3)

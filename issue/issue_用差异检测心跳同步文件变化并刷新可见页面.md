---
title: 用差异检测心跳同步文件变化并刷新可见页面
id: CODEX-PLUGIN-LIVE-001
type: API
status: 已完成（仅沿用本任务原始勾选；本轮未重新执行产品验收）。
版本管理: Git。
来源: '`REQUIREMENTS.md` @ `f4834f13242293ffb522ee78c2de0669d6c08ead`；标题路径：任务清单 / Phase - ChatGPT 外观与主题（2026-10-02 确认）。'
原稳定 ID: '`CODEX-PLUGIN-010`, `CODEX-PLUGIN-011`, `CODEX-PLUGIN-012`, `CODEX-PLUGIN-SCROLL-001`, `CODEX-PLUGIN-FOOTER-001`, `CODEX-PLUGIN-LIVE-001`；不改写或重编号这些既有 ID。'
来源汇总状态: 已完成（沿用原需求记录；本轮未重新执行产品验收）。
原迁移记录 ID: '`CODEX-PLUGIN-010`。'
本文件原任务 ID: '`CODEX-PLUGIN-LIVE-001`。'
原需求标题: Phase - ChatGPT 外观与主题（2026-10-02 确认）。
原迁移文件: '`issue/issue-CODEX-PLUGIN-010-API-project-goal-versioncontrolid.md`（重命名前路径，仅用于历史追溯）。'
同源任务: '[采用ChatGPT中性外观并精简看板页面](issue_%E9%87%87%E7%94%A8ChatGPT%E4%B8%AD%E6%80%A7%E5%A4%96%E8%A7%82%E5%B9%B6%E7%B2%BE%E7%AE%80%E7%9C%8B%E6%9D%BF%E9%A1%B5%E9%9D%A2.md)、[保持旧页面资源地址兼容并修复侧栏升级启动](issue_%E4%BF%9D%E6%8C%81%E6%97%A7%E9%A1%B5%E9%9D%A2%E8%B5%84%E6%BA%90%E5%9C%B0%E5%9D%80%E5%85%BC%E5%AE%B9%E5%B9%B6%E4%BF%AE%E5%A4%8D%E4%BE%A7%E6%A0%8F%E5%8D%87%E7%BA%A7%E5%90%AF%E5%8A%A8.md)、[通过系统文件夹选择器与桌面项目列表切换项目](issue_%E9%80%9A%E8%BF%87%E7%B3%BB%E7%BB%9F%E6%96%87%E4%BB%B6%E5%A4%B9%E9%80%89%E6%8B%A9%E5%99%A8%E4%B8%8E%E6%A1%8C%E9%9D%A2%E9%A1%B9%E7%9B%AE%E5%88%97%E8%A1%A8%E5%88%87%E6%8D%A2%E9%A1%B9%E7%9B%AE.md)。'
共同约束与完整历史: '[采用ChatGPT中性外观并精简看板页面](issue_%E9%87%87%E7%94%A8ChatGPT%E4%B8%AD%E6%80%A7%E5%A4%96%E8%A7%82%E5%B9%B6%E7%B2%BE%E7%AE%80%E7%9C%8B%E6%9D%BF%E9%A1%B5%E9%9D%A2.md)（共享说明与源 Comments 保留在该主记录）。'
updated-time: '2026-10-24T16:22:34+00:00'
---

# Description

## 当前需求与范围
- [x] [CODEX-PLUGIN-LIVE-001] 移除主区手动刷新按钮，使用 2 秒心跳读取文件并比较数据差异，只有变化才更新界面；页面重新可见或获得焦点时立即检查。心跳请求不重叠，错误后后续心跳可重试；未保存草稿、打开的对话框和本页操作期间暂停，迟到的响应不得覆盖草稿、切换后的项目或刚保存的结果。2026-10-07 实现；新增四项自动测试通过，实际 Web 页面外修改名称/状态、删除和新增文件均自动同步。

首版工程决定：Node.js 22+ / TypeScript，共用文件核心；默认 YAML frontmatter、H1 名称、可选 `## Description`、追加式 `## Comments`。新评论使用带时区 ISO 8601 时间与 `· author · human/model`；旧评论原文保留。默认状态 backlog/todo/in_progress/in_review/done/blocked/cancelled 可配置；不识别的状态仍独立展示。ID 使用文件名 `issue-<UUID>.md`，不改已有文件名或 ID。`REQUIREMENTS.md` 暂继续独立保存。仅由宿主对话能力执行分发，不托管 Agent Runtime；原“不启动 Agent”边界不限制用户本次确认的对话启动动作。许可证仍待用户选择。

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

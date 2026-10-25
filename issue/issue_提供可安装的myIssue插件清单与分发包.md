---
title: 提供可安装的myIssue插件清单与分发包
id: CODEX-PLUGIN-001
type: DB
status: 已完成（仅沿用本任务原始勾选；本轮未重新执行产品验收）。
版本管理: Git。
来源: '`REQUIREMENTS.md` @ `268e46933a376860f446dd7e98eab189612eeb21`；标题路径：任务清单 / Phase - Codex 插件首版（2026-10-01 确认）。'
原稳定 ID: '`CODEX-PLUGIN-001`, `CODEX-PLUGIN-002`, `CODEX-PLUGIN-003`, `CODEX-PLUGIN-004`, `CODEX-PLUGIN-005`, `CODEX-PLUGIN-006`, `CODEX-PLUGIN-007`, `CODEX-PLUGIN-008`, `CODEX-PLUGIN-009`；不改写或重编号这些既有 ID。'
来源汇总状态: 进行中（原文同时包含已完成与未完成项）。
原迁移记录 ID: '`CODEX-PLUGIN-001`。'
本文件原任务 ID: '`CODEX-PLUGIN-001`、`CODEX-PLUGIN-009`。'
原需求标题: Phase - Codex 插件首版（2026-10-01 确认）。
原迁移文件: '`issue/issue-CODEX-PLUGIN-001-DB-project-goal-versioncontrolid.md`（重命名前路径，仅用于历史追溯）。'
同源任务: '[提供宿主独立侧栏与对话内myIssue入口](issue_%E6%8F%90%E4%BE%9B%E5%AE%BF%E4%B8%BB%E7%8B%AC%E7%AB%8B%E4%BE%A7%E6%A0%8F%E4%B8%8E%E5%AF%B9%E8%AF%9D%E5%86%85myIssue%E5%85%A5%E5%8F%A3.md)、[从真实Markdown文件驱动myIssue看板与安全读写](issue_%E4%BB%8E%E7%9C%9F%E5%AE%9EMarkdown%E6%96%87%E4%BB%B6%E9%A9%B1%E5%8A%A8myIssue%E7%9C%8B%E6%9D%BF%E4%B8%8E%E5%AE%89%E5%85%A8%E8%AF%BB%E5%86%99.md)、[在myIssue与当前或新对话间传递Issue上下文](issue_%E5%9C%A8myIssue%E4%B8%8E%E5%BD%93%E5%89%8D%E6%88%96%E6%96%B0%E5%AF%B9%E8%AF%9D%E9%97%B4%E4%BC%A0%E9%80%92Issue%E4%B8%8A%E4%B8%8B%E6%96%87.md)。'
updated-time: '2026-10-24T16:22:34+00:00'
---

# Description

## 当前需求与范围
- [x] [CODEX-PLUGIN-001] 提供标准插件清单、Marketplace、安装命令和可分发包，实际检查本机安装状态。
- [x] [CODEX-PLUGIN-009] 分别验收文件测试、MCP 协议、真实页面交互、插件安装和宿主独立入口，不混淆已实现与已验证。


## 检查与验收边界

以上勾选与结果沿用迁移前的当前需求文档；历史记录中的实现、测试、编译、视觉与用户验收彼此独立。本次只迁移文档并检查结构 / 引用，没有重新执行产品构建或用户验收，也没有凭历史日志新增完成勾选。

# Comments

## 20261023-174433_Agent

原记录标题：2026-10-23 17:44:33 UTC — Agent（文档迁移）

按原有功能 / 工作目标标题拆分需求，保留原 ID、勾选、依赖、最新补充及来源。没有稳定根 ID或旧 ID 在不同上下文重用时，采用由来源路径和标题确定的迁移 Issue ID，原 ID 仍在正文保留。完整旧内容可从来源版本读取；独有未提交内容的版本化副本见迁移映射。

原记录未提供完整 Agent / 模型详情及原执行会话链接，未补造。

## 历史记录-时间未记录

原记录标题：20261001-myissue-codex-plugin.md — 历史证据迁移

来源：`agent-log/20261001-myissue-codex-plugin.md` @ `268e46933a376860f446dd7e98eab189612eeb21`。日期 / 时区沿用原记录；以下摘录不自动改变当前完成状态。

#### 用户原始请求

开发 myIssue 的 codex 插件，实现：

1. 插件形态安装。
2. 类似 Figma 插件在 ChatGPT desktop app 中的独立访问入口和页面。
3. 类似 Multica 的看板与具体细节，保持名称、属性、评论三个简单结构。
4. 实际看板功能，分发到对话，从对话启动。
5. Markdown Schema 可变，项目根目录 `issues/` 下多个 Markdown 的形态稳定。

#### 决策与范围

- 本次明确授权实现，优先于原“仅需求定义”阶段约定，先补充 CODEX-PLUGIN-001 至 009。
- my-issue 是本次通用实现来源；环境列出的 board 路径实际不存在，没有修改或同步另一仓库。
- 使用 Node.js 22+ / TypeScript；解析、校验、属性更新、追加评论、并发与看板推导集中在同一文件核心。
- 采用名称、任意属性、共享评论的界面；旧 Description 保留为名称下方的自由 Markdown，不增加业务子标题规则。
- 支持 `.myissue.json` 映射和清晰的失败行为，不冻结不可变业务 Schema，不自动迁移。
- 标准便携插件 manifest + stdio MCP + MCP Apps + OpenAI global/thread entrypoints；用户显式分发仅调用宿主消息接口。
- 未建立托管 Agent Runtime、Issue 数据库、跨项目 Git 同步、DSH 适配或公共插件目录发布。

#### 验证结果

- 构建：通过。前端脚本/CSS 内联；服务端依赖打进单个 CJS，运行时不依赖仓库 node_modules。
- TypeScript 静态检查：通过。
- 自动测试：14/14，通过真实文件测试、并发竞争、旧评论原文、CRLF、未知属性/状态、Schema 映射、关系错误、flow-style 安全失败、MCP stdio、资源 mention 及 SDK ui/message 的真实传输字段。
- 页面：在 `/tmp/myissue-ui-acceptance` 隔离验收目录，用真实浏览器创建 Issue、改名称和自由内容、追加评论、编辑嵌套扩展属性、搜索、列表切换、拖动待办到进行中；已读回文件核对。没有向产品仓库添加演示 Issue。
- 页面无宿主能力时，发送按钮禁用并明确解释，不模拟成功。
- 安装：通过 `codex plugin add` 安装 `myissue@myissue-local`，读取到 installed=true / enabled=true。
- Codex app-server：实际初始化并发现 9 个工具，toolsError=null；读取到 global/thread 入口与 `text/html;profile=mcp-app` 资源。
- 兼容修复：首轮旧 `${CLAUDE_PLUGIN_ROOT}` MCP 参数安装成功但握手失败；切换根目录便携 plugin.json/mcp.json，通过 `${PLUGIN_ROOT}` cwd 解析后实际工具连接成功。
- 包：`dist/myissue-0.1.0.zip`，根目录清单齐全。未上传公共插件目录。
- Skill：quick_validate 通过。
- 截图：`_builds/verification/myissue-board.jpg`；截图及验收文件不提交。

原记录未提供完整 Agent / 模型详情及原执行会话链接，未补造。

## 20261024-070634_Agent

原记录标题：2026-10-24 07:06:34 UTC — Agent（纠正迁移命名）

根据用户确认的原语言与下划线命名规则整理本记录；类型与原 ID 保留在 properties，原始勾选、取消／延后标记及验收边界照录。 本源文档按独立目标拆为 4 份，原始 Comments 完整留在本主记录。 未核实本任务实际实施提交，省略文件名版本后缀；未执行代码、构建或用户验收，未提交或推送。

原记录未提供完整 Agent / 模型详情及原执行会话链接，未补造。

## 20261024-162234_Codex

按用户最新手写模板迁移属性和正文结构，保留任务语义、来源、原始状态及历史内容；本次未重新执行业务验收。

原版本关联记录（照录来源，不将本次文档迁移提交当作业务实施提交）：
- 实施提交：未核实（现有记录未提供可直接对应本任务的实际实施提交；来源快照、当前 HEAD 与文档迁移提交不代替任务实施版本）。

本次执行环境未提供具体模型标识，未补造 Model-Detail。

[本次文档迁移对话](codex://threads/01a157b3-610c-73b4-ae06-163c0f8490d3)

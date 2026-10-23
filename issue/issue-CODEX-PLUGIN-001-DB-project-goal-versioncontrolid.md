# Phase - Codex 插件首版（2026-10-01 确认）

- ID：`CODEX-PLUGIN-001`。
- 类型：`DB`。
- 状态：进行中（原文同时包含已完成与未完成项）。
- 版本管理标识：`versioncontrolid`（含义待定义，不推断为 commit、branch 或 change）。
- 来源：`REQUIREMENTS.md` @ `268e46933a376860f446dd7e98eab189612eeb21`；标题路径：任务清单 / Phase - Codex 插件首版（2026-10-01 确认）。
- 原稳定 ID：`CODEX-PLUGIN-001`, `CODEX-PLUGIN-002`, `CODEX-PLUGIN-003`, `CODEX-PLUGIN-004`, `CODEX-PLUGIN-005`, `CODEX-PLUGIN-006`, `CODEX-PLUGIN-007`, `CODEX-PLUGIN-008`, `CODEX-PLUGIN-009`；不改写或重编号这些既有 ID。

## 当前需求与范围

- [x] [CODEX-PLUGIN-001] 提供标准插件清单、Marketplace、安装命令和可分发包，实际检查本机安装状态。
- [ ] [CODEX-PLUGIN-002] 提供 MCP Apps 全局独立侧栏入口及对话内入口，使用官方 OpenAI UI entrypoints；平台是否展示必须单独人工验收。已实现并由 Codex app-server 读取元数据；2026-10-02 用户截图已确认全局页面显示，对话侧栏入口仍未人工验收。
- [x] [CODEX-PLUGIN-003] 采用 Multica 风格状态列、卡片与详情面板，语义只围绕名称、自由属性、追加式评论；名称下自由 Markdown 内容兼容既有 Description。
- [x] [CODEX-PLUGIN-004] 创建、读取、修改名称与任意 YAML 属性、追加评论、搜索、筛选、看板/列表切换、拖动状态均操作真实文件。
- [ ] [CODEX-PLUGIN-005] 从看板显式发送 Issue 上下文到当前或新对话；从对话通过插件工具创建/读取/更新 Issue 或打开看板。发送成功才显示成功，宿主缺少能力时明确显示不可用。
- [x] [CODEX-PLUGIN-006] 项目根目录 `issues/*.md` 是稳定且唯一的事实来源；不引入 Issue 数据库。
- [x] [CODEX-PLUGIN-007] 通过项目级 `.myissue.json` 配置名称来源、属性字段映射、章节名和状态列；未知属性与未知状态必须保留。结构无法解析时只报告，不自动迁移或覆盖。
- [x] [CODEX-PLUGIN-008] 写入检查文件版本，插件进程之间串行写入并原子替换；保留既有评论与不相关正文。普通编辑器不参与锁协议，检测到外部修改即要求重新加载。
- [x] [CODEX-PLUGIN-009] 分别验收文件测试、MCP 协议、真实页面交互、插件安装和宿主独立入口，不混淆已实现与已验证。

## 检查与验收边界

以上勾选与结果沿用迁移前的当前需求文档；历史记录中的实现、测试、编译、视觉与用户验收彼此独立。本次只迁移文档并检查结构 / 引用，没有重新执行产品构建或用户验收，也没有凭历史日志新增完成勾选。

## Comments

### 2026-10-23 17:44:33 UTC — Agent（文档迁移）

按原有功能 / 工作目标标题拆分需求，保留原 ID、勾选、依赖、最新补充及来源。没有稳定根 ID或旧 ID 在不同上下文重用时，采用由来源路径和标题确定的迁移 Issue ID，原 ID 仍在正文保留。完整旧内容可从来源版本读取；独有未提交内容的版本化副本见迁移映射。

### 20261001-myissue-codex-plugin.md — 历史证据迁移

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

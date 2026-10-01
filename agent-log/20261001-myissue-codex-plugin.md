# 执行日志：myIssue Codex 插件首版

## 用户原始请求

开发 myIssue 的 codex 插件，实现：

1. 插件形态安装。
2. 类似 Figma 插件在 ChatGPT desktop app 中的独立访问入口和页面。
3. 类似 Multica 的看板与具体细节，保持名称、属性、评论三个简单结构。
4. 实际看板功能，分发到对话，从对话启动。
5. Markdown Schema 可变，项目根目录 `issues/` 下多个 Markdown 的形态稳定。

## 决策与范围

- 本次明确授权实现，优先于原“仅需求定义”阶段约定，先补充 CODEX-PLUGIN-001 至 009。
- my-issue 是本次通用实现来源；环境列出的 board 路径实际不存在，没有修改或同步另一仓库。
- 使用 Node.js 22+ / TypeScript；解析、校验、属性更新、追加评论、并发与看板推导集中在同一文件核心。
- 采用名称、任意属性、共享评论的界面；旧 Description 保留为名称下方的自由 Markdown，不增加业务子标题规则。
- 支持 `.myissue.json` 映射和清晰的失败行为，不冻结不可变业务 Schema，不自动迁移。
- 标准便携插件 manifest + stdio MCP + MCP Apps + OpenAI global/thread entrypoints；用户显式分发仅调用宿主消息接口。
- 未建立托管 Agent Runtime、Issue 数据库、跨项目 Git 同步、DSH 适配或公共插件目录发布。

## 实施

- `src/core.ts`：Markdown/YAML adapter、未知字段保留、原文局部补丁、评论追加、版本检查、原子替换与跨进程目录锁、关系/ready 推导。
- `src/service.ts` / `src/server.ts`：统一工具输入、CRUD、UI render、mention 搜索和 Markdown 资源。
- `src/web/`：实际状态看板、列表、搜索筛选、创建、名称/内容/任意 YAML 属性编辑、只读源文件、评论、拖动、分发目标与能力探测。
- `src/message.ts`：标准/扩展宿主消息适配，新对话与当前对话发送及拒绝处理。
- `scripts/`：自包含构建、安装与 ZIP；`plugins/myissue/`：安装产物、skill、图标及第三方 notices；`.agents/plugins/marketplace.json`：可安装的仓库 Marketplace。
- 更新 README、DESIGN、AGENTS、ARCHITECTURE、Schema 示例与需求状态。

## 验证结果

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

## 尚未验收

- ChatGPT 桌面原生独立入口的实际显示和真实新对话分发：Computer Use 工具禁止操作 com.openai.codex 原生窗口。因此 CODEX-PLUGIN-002 / 005 保持未完成验收。
- SDK 消息测试的接收方是隔离测试宿主，不是真实 ChatGPT 对话。Codex app-server 工具发现不是原生窗口交互验收。
- 普通编辑器不参与目录锁，最后检查到 rename 之间仍存在外部竞争窗口；不宣称任意写者的绝对 CAS。
- 不宣称公共目录发布、其他宿主/系统版本、Obsidian 或跨机器同步已验收。

## Git 状态

- 开始时：main 与 origin/main 对齐，工作区干净。
- 本日志写入时：实现与文档待提交；计划在文件检查完成后做范围内提交并推送 origin/main。最终实际提交及远端读回状态在本次回复中报告，不预先把计划记为成功。

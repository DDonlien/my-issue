# myIssue

myIssue 是项目内的 Markdown Issue 看板，也是可安装的 Codex 插件。把工作定义、任意属性和共享评论留在项目根目录 `issues/*.md`，从看板进入对话，在对话中创建、读取和更新 Issue。

## 当前能力

- 状态看板与列表，搜索名称、属性、自由内容和评论，状态筛选及可开始视图。
- 创建真实文件，修改名称与自由 Markdown，编辑任意 YAML 属性，拖动卡片改变状态。
- 详情页：名称及自由内容、属性侧栏、追加式人类/Agent 评论、只读源文件。
- 标准 MCP Apps 全局独立入口和对话侧栏入口，以及 Issue composer mention 搜索。
- 看板通过官方宿主消息能力发送最新 Issue 上下文到当前或新对话；没有对应能力时显示不可用。对话通过 MCP 工具创建或开始处理 Issue。
- 可配置的字段映射、名称来源、章节名与状态列。未知属性保留，未知状态增加派生列。

无需 Issue 数据库、云账号或 myIssue 托管的 Agent Runtime。核心操作不依赖页面。许可证尚未选择；公开可见不代表授予开源许可。

## 安装插件

需要 Node.js 22+ 和支持 Agent Plugins 的 Codex。已验证本机 `codex-cli 0.159.2`。

```sh
npm ci
npm run install:plugin
```

安装脚本构建自包含的插件，注册本仓库的 `myissue-local` Marketplace，安装并检查 `myissue@myissue-local`。运行时只需要 Node；使用插件无需本仓库的 `node_modules`。当前清单采用根目录 `plugin.json` / `mcp.json`，同时保留 `.codex-plugin/plugin.json`。便携清单负责展开 `${PLUGIN_ROOT}`，不要替换为旧式 `${CLAUDE_PLUGIN_ROOT}` 启动参数。

在桌面 Plugins Directory 的 **myIssue Local** 来源查看插件。如果桌面目录尚未刷新，按官方本地 Marketplace 流程重启桌面应用后查看。全局入口名为 **myIssue**；对话中也可要求“打开这个项目的 myIssue 看板”。第一次选择绝对项目根目录，随后宿主共享的文件夹和已成功打开的项目会出现在选择器中。

```sh
# 查看安装状态
codex plugin list --marketplace myissue-local --json

# 生成可分发 ZIP（无需在接收端构建）
npm run package:plugin
```

产物是 `dist/myissue-0.1.0.zip`。它用于本地/团队安装；尚未提交或发布到公共插件目录。ZIP 解压后的目录就是插件根。团队可以把它放进自己的 Marketplace，或直接添加这个 Git 仓库的 Marketplace。

## 文件与 Schema

稳定约定只有项目根目录 `issues/` 和其中多个平级 Markdown 文件。默认形态兼容已有协议：

```markdown
---
status: todo
priority: high
custom_property: 任何项目自己的属性
parent: "[[issue-001]]"
---

# Issue 名称

## Description

自由 Markdown 内容；不要求特定业务子标题。

## Comments

### 2026-10-01T10:30:00+10:00 · taobe · human

补充要求、进展或结果。
```

界面围绕名称、属性与评论组织；可选自由内容放在名称下方，兼容旧文件的 `Description`。新文件使用 `issue-<UUID>.md` 避免多人创建时抢占编号，已有名称和 frontmatter `id` 不会被自动重命名。工具中的 `id` 指文件名去掉 `.md`。

无需配置即可开始。要改 Schema，将 [`.myissue.example.json`](.myissue.example.json) 复制为目标项目根目录的 `.myissue.json`，按需保留配置项：

```json
{
  "version": 1,
  "name": { "source": "property", "key": "title" },
  "statusKey": "state",
  "descriptionHeading": "内容",
  "commentsHeading": "讨论",
  "columns": [
    { "value": "queue", "label": "排队", "color": "#6d86a3" },
    { "value": "finished", "label": "完成", "color": "#67a38e" }
  ],
  "readyStatuses": ["queue"],
  "doneStatuses": ["finished"]
}
```

配置在读取时生效，不自动迁移文件。请一起调整目标文件以符合新的映射。读取失败、重复章节、损坏 YAML 和不兼容配置会明确报错，原文件不被覆盖。行内 flow-style YAML 映射可读取，但属性修改会拒绝；需要先由用户转成分行映射。若未来不再使用 YAML/Markdown 章节布局，可替换 `src/core.ts` 的解析与修改边界，MCP 与页面使用同一份语义结果，无需各自发明解析器。

`parent`、`depends_on` 可配置，关系使用 `[[文件名或既有 id]]`。children、可开始状态和看板列都实时推导。配置不保存 Issue 副本；插件数据目录的 `projects.json` 只保存最近选择的文件夹路径，可直接删除并重建。

## 对话工作流

1. 从对话创建：调用 `create_issue`；名称、任意属性与内容写到同一项目的 `issues/`。
2. 从对话开始：调用 `get_issue` 读取最新内容和评论，按用户授权处理，再用 `append_comment` 追加实际进展或结果。
3. 从看板分发：打开详情 → 分发到对话 → 选择当前/新对话 → 发送并启动。准备阶段重新读取文件；发送不修改 Issue 状态，也不把派发等同于工作完成。

MCP 工具：`open_board`、`list_projects`、`list_issues`、`get_issue`、`create_issue`、`update_issue`、`append_comment`、`prepare_dispatch`，以及 SDK 的 `search_mentions`。工具接收绝对项目根目录。写入必须传入最近读取返回的 `revision`。

## 写入边界

- 结构化修改保留未涉及的 YAML 与 Markdown；既有评论只能读取，新增评论只能追加。
- 新评论保存带时区 ISO 8601 时间、作者和 `human` 或实际模型标识。正文中的非代码标题使用四级及更深标题，避免与评论条目三级标题混淆。旧评论原文不重写。
- 插件进程间使用每文件 `.lock` 目录串行写入，检查版本后原子替换。同一版本的竞争写入只有一个成功。
- 普通编辑器不参与锁协议。写入前检测到外部修改即失败并保留页面草稿，但普通文件系统没有对不参与协议的外部写者提供绝对的比较并交换保证。
- 崩溃遗留 `.lock` 不会自动抢占。先确认没有写入者，再手工移除对应锁目录。Issue 本身不受影响。
- 不跟随 `issues/` 或 Issue 文件的符号链接；单个文件上限 2 MB。

## 开发与验证

```sh
npm run build
npm run check
npm test

# 可选浏览器预览，不具备宿主对话分发能力
MYISSUE_ROOT=/absolute/project/root npm run dev
```

预览地址默认 `http://127.0.0.1:4310`，可用 `MYISSUE_PREVIEW_PORT` 改端口。绑定回环地址，并检查请求来源与 Host。预览是调试载体，不替代独立插件入口。

验收已覆盖真实文件、版本冲突、Schema 映射、评论保留、MCP stdio、实际 SDK 消息协议，以及浏览器页面创建/编辑/追加评论/搜索/列表/拖动。Codex app-server 已实际加载安装包，返回工具与全局/对话入口元数据。**ChatGPT 桌面原生窗口的独立入口显示与真实新对话分发尚未人工验收**：本执行环境禁止自动化操作该原生窗口。协议测试中的接收方是测试宿主，不是真实 ChatGPT 对话。

## 文档

- [`REQUIREMENTS.md`](REQUIREMENTS.md)：稳定需求 ID 与验收状态
- [`DESIGN.md`](DESIGN.md)：视觉与交互约束
- [`ARCHITECTURE.md`](ARCHITECTURE.md)：共用核心与宿主适配边界
- `agent-log/`：实施与验证记录

实现参考：[官方插件打包](https://developers.openai.com/plugins/build/plugins)、[独立侧栏及对话入口](https://developers.openai.com/plugins/build/extensions)、[MCP Apps UI](https://developers.openai.com/plugins/build/chatgpt-ui)。

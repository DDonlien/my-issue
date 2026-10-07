# myIssue

myIssue 是项目内的 Markdown Issue 看板，也是可安装的 Codex 插件。把工作定义、任意属性和共享评论留在项目根目录 `issues/*.md`，从看板进入对话，在对话中创建、读取和更新 Issue。

## 当前能力

- 状态看板与列表，搜索名称、属性、自由内容和评论，状态筛选及可开始视图。
- 创建真实文件，修改名称与自由 Markdown，编辑任意 YAML 属性，拖动卡片改变状态。
- 详情页：名称及自由内容、完整渲染任意属性、追加式人类/Agent 评论、只读源文件。
- 上传图片和文件附件，保存到项目内，在描述和评论正文直接预览图片、Markdown 和文本，其他文件显示下载卡片。
- 标准 MCP Apps 全局独立入口和对话侧栏入口，以及 Issue composer mention 搜索。
- 分发目标读取真实 Codex 对话名称。当前/新对话通过官方消息能力发送；已有对话通过宿主公开控制接口定向发送，按接口是否可用启用按钮。对话通过 MCP 工具创建或开始处理 Issue。
- 可配置的字段映射、名称来源、章节名与状态列。未知属性保留，未知状态增加派生列。
- ChatGPT 风格的中性页面与弹窗。跟随宿主浅色/深色和语义颜色，未提供主题时跟随系统；焦点与链接使用宿主传入的交互颜色。
- 左侧导航已移除；顶部名称菜单切换已有项目并添加项目，保留桌面项目名称。添加窗支持 macOS 文件夹浏览。
- 同一电脑的所有面板共享项目列表与最近项目，新面板自动恢复；已打开的面板可各自查看不同项目。常用控件使用标准 shadcn/ui 组件。
- 详情长名称完整换行，正文显示为“描述”。评论输入固定在主区底部，正文、评论和属性可滚动；作者默认使用本机用户名，不显示 human 标签或共享说明。

无需 Issue 数据库、云账号或 myIssue 托管的 Agent Runtime。核心操作不依赖页面。许可证尚未选择；公开可见不代表授予开源许可。

页面每 2 秒通过心跳读取文件，仅在数据有差异时更新；回到页面时立即检查。未保存草稿、打开的对话框和本页操作期间暂停自动更新，并丢弃失效的响应，无需手动刷新按钮。

## 安装插件

需要 Node.js 22+ 和支持 Agent Plugins 的 Codex。已验证本机 `codex-cli 0.159.2`。

```sh
npm ci
npm run install:plugin
```

安装脚本构建自包含的插件，注册本仓库的 `myissue-local` Marketplace，安装并检查 `myissue@myissue-local`。运行时只需要 Node；使用插件无需本仓库的 `node_modules`。当前清单采用根目录 `plugin.json` / `mcp.json`，同时保留 `.codex-plugin/plugin.json`。便携清单负责展开 `${PLUGIN_ROOT}`，不要替换为旧式 `${CLAUDE_PLUGIN_ROOT}` 启动参数。

在桌面 Plugins Directory 的 **myIssue Local** 来源查看插件。全局入口名为 **myIssue**；对话中也可要求“打开这个项目的 myIssue 看板”。顶部名称菜单切换已有项目，点击“添加项目…”打开添加窗；“浏览文件夹”打开 macOS 系统选择器，选中后填入路径，点击“添加并打开”才切换。也可输入绝对项目根目录，取消浏览保留已填路径。

打开项目菜单时，通过公开 Codex app-server `project/list` 刷新桌面已添加的本地项目，使用每个项目的主要根目录和桌面名称；没有本地目录的云项目不显示。需要可用的 Codex CLI（优先 PATH，可用 `MYISSUE_CODEX_BIN` 指定路径；macOS 也尝试桌面应用附带的 CLI）。读取超时或不可用时仍可输入路径、使用宿主共享文件夹和最近成功打开的项目。读取列表或选择文件夹不写入 Issue，也不自动打开新发现的项目。其他操作系统当前使用手动路径。

```sh
# 查看安装状态
codex plugin list --marketplace myissue-local --json

# 生成可分发 ZIP（无需在接收端构建）
npm run package:plugin
```

产物是 `dist/myissue-0.1.9.zip`。它用于本地/团队安装；尚未提交或发布到公共插件目录。ZIP 解压后的目录就是插件根。团队可以把它放进自己的 Marketplace，或直接添加这个 Git 仓库的 Marketplace。

已安装旧版时，重新执行安装命令更新，然后完全退出并重新启动 ChatGPT / Codex 桌面应用，见[官方本地插件更新流程](https://developers.openai.com/plugins/build/plugins)。仅关闭再打开 myIssue 页面不足以刷新旧对话保留的 MCP 服务进程。

页面入口固定为 `ui://myissue/board-v2.html`，不随发布版本改变，同时保留 `board-v1.html` 兼容地址。如果对话侧栏停在加载图标，而日志报告 `Resource ... not found`，通常是新版工具目录与旧对话进程错配，需重启桌面应用后再打开。

## 外观与重点色

页面消费 MCP Apps `hostContext.styles.variables` 的背景、文字、边框、字体和圆角变量，并响应宿主主题更新。主按钮使用 ChatGPT 常见的黑/白反色，输入框焦点继承 `--color-ring-primary`，链接继承 `--color-text-info`。撤回的变量会清除，避免切换主题后残留旧配色。

如果 ChatGPT 将用户自定义重点色映射到这些变量，页面自动同步。标准协议没有单独承诺用户重点色设置；不通过私有 API 读取，也不固定为截图中的橙色。已用实际 SDK 测试宿主验证橙色、蓝色及撤回后的默认色；当前用户的原生 ChatGPT 是否下发自定义色仍需原生页面确认。[官方主题更新说明](https://developers.openai.com/plugins/changelog#may-2026)

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

`parent`、`depends_on` 可配置，关系使用 `[[文件名或既有 id]]`。children、可开始状态和看板列都实时推导。配置不保存 Issue 副本；电脑上的共享 `projects.json` 只保存项目名称、路径和最近选择。

## 共享项目配置

项目列表和最近使用项目由服务端保存，同一电脑、同一用户的全局面板和对话面板读写同一份配置，不依赖 iframe localStorage 或插件会话的数据目录。成功打开才登记项目；新面板恢复最近项目，已打开的面板保留自己的选择。周期读取文件使用 `list_issues`，不会改写最近项目；项目菜单打开时刷新共同列表和桌面项目。

默认配置位置：macOS `~/Library/Application Support/myIssue/projects.json`；Windows `%APPDATA%/myIssue/projects.json`；Linux `$XDG_CONFIG_HOME/myissue/projects.json`（未设置时为 `~/.config/myissue/projects.json`）。用绝对路径 `MYISSUE_CONFIG_DIR` 可隔离测试配置。版本 1 保存项目名称、绝对路径和 `lastRoot`；旧的路径数组仍可读取，宿主提供 `PLUGIN_DATA` 时合入旧 `projects.json`，原文件保持原文。不猜测旧数组的最近顺序，也不自动打开新发现的项目。

多个进程通过独占目录锁、锁内重新读取和原子替换保存，避免并发新增丢失。失效目录不显示；显式指定项目优先。无法读取配置或写锁超时时显示明确错误，已有配置保留。文件删除后可以重新添加项目；这不影响项目里的 Issue 或项目级 `.myissue.json`。

## 附件与属性显示

创建 Issue 后，在描述旁点击“添加附件”，可一次选择多个文件；先保存正在编辑的内容。单个文件最大 10 MB，保存到项目内 `issues/attachments/<UUID>-<文件名>`，在描述正文追加普通相对 Markdown 引用。没有独立附件分组。描述和评论中的 PNG/JPEG/GIF/WebP 图片在引用位置直接预览，包括普通文件链接和图片语法；UTF-8 Markdown、文本、CSV、JSON、YAML 和日志文件默认展示正文，自动文本预览上限 64 KiB。其他文件、过大文本、SVG 和 HTML 使用可下载文件卡片，不执行文件内容。嵌入 Markdown 不递归读取其他文件。旧文件无需迁移；手工加入的 `attachments/` 引用同样支持正文预览。系统不改写既有评论，不增加必填附件属性。

附件引用由 Markdown 保存，复制或提交项目时一起保留 `issues/attachments/`。读取只接受当前 Issue 引用的本地附件，拒绝越出目录或符号链接；冲突时 Issue 保留原文，本次新附件清理。插件下载使用标准 MCP Apps 宿主接口，宿主不支持时显示文件所在目录；本地预览使用同源下载。

属性侧栏完整显示文本、数值、布尔、空值、数组与嵌套对象。URL 可打开，`[[issue-id|名称]]` 可跳转到项目内对应 Issue，找不到目标时明确标记。YAML 编辑和未知字段保留行为不变；卡片显示属性名称与值。可开始使用主区的筛选按钮，默认展示全部 Issue。

## 对话工作流

1. 从对话创建：调用 `create_issue`；名称、任意属性与内容写到同一项目的 `issues/`。
2. 从对话开始：调用 `get_issue` 读取最新内容和评论，按用户授权处理，再用 `append_comment` 追加实际进展或结果。
3. 从看板分发：打开详情 → 分发到对话 → 选择当前/新对话 → 发送并启动。准备阶段重新读取文件；发送不修改 Issue 状态，也不把派发等同于工作完成。

MCP 工具：`open_board`、`list_projects`、`list_issues`、`get_issue`、`create_issue`、`update_issue`、`append_comment`、`prepare_dispatch`、`link_conversation`、`upload_attachment`、`read_attachment`，以及 SDK 的 `search_mentions`。`browse_folder` 仅供页面的显式点击调用。Issue 工具接收绝对项目根目录；写入必须传入最近读取返回的 `revision`。

卡片底部的对话入口最多占 144px，长名称省略并保留完整名称提示；多个关联显示最近添加的对话和“+N”入口。点击链接直接打开目标，评论计数与卡片拖动保留。详情的“已分配对话 → 关联对话”可粘贴真实地址并填写名称，普通属性编辑也能维护或移除关联。

关联只是可选的普通属性，旧 Issue 无需迁移，仍能脱离插件读取：

```yaml
conversations:
  - title: 处理这个 Issue 的对话
    url: codex://threads/实际对话ID
```

支持实际 HTTP/HTTPS 对话链接及 `codex://threads/<id>`。`link_conversation` 使用最新 revision 追加或更新关联，同一 URL 不重复，未知关联字段和既有评论保留；已存在的 `conversations` 不是列表、或被 Schema 映射为名称/状态/关系时拒绝自动覆盖。接收分发的 Agent 在获得可信的当前对话 URL 后可调用此工具写回，缺少地址时跳过。公开发送接口没有承诺返回可跳转地址，匿名 `openai/session` 元数据也不能构造链接；页面不会根据发送成功或最近对话猜测目标。插件通过宿主 `openLink` 跳转，拒绝时报告并保留地址；Web 预览使用普通链接。

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

验收已覆盖真实文件、版本冲突、Schema 映射、评论保留、MCP stdio、实际 SDK 消息协议，以及浏览器页面创建/编辑/追加评论/搜索/列表/拖动。主题测试覆盖宿主与系统偏好冲突、运行时变更、重点色替换和清除；浏览器实际确认浅色/深色、控件颜色及弹窗键盘操作。

0.1.4 已安装并启用；独立交付源码通过构建、类型检查和 26 项自动测试，覆盖附件真实文件、版本冲突清理、目录限制、属性渲染及真实 SDK 下载协议。浏览器通过批量选择图片/文本、图片预览、下载内容核对、关系跳转、侧栏切换与浅色/深色检查。原生 MCP Apps 当前进程仍保留升级前页面，新版本须完全退出并重新打开桌面应用后确认；协议测试中的下载接收方是测试宿主，不能替代原生下载验收。真实新对话分发不在本次验证范围。

0.1.5 已安装并启用；标准控件、移除左侧栏、顶部项目菜单和共享配置通过类型检查、34 项自动测试及实际 SDK 测试宿主的 16 项页面交互验证。两个独立 stdio 进程验证并发添加、不同插件数据目录、旧路径配置、重启恢复及失效目录；浅色/深色、主题更新、弹窗焦点与 390px 布局通过浏览器验证。测试宿主使用隔离项目，不替代重启后原生 ChatGPT 的页面验收。

0.1.6 已安装并启用；详情名称换行、描述用语、默认用户名和底部固定评论输入通过独立构建、类型检查、34 项自动测试及 SDK 测试宿主的 8 项浏览器检查，覆盖 1201px/390px/短视口、标题伸缩、主题及真实评论写入。安装的 10 个文件与便携 ZIP 内容一致，原生桌面新版仍待重启后确认。

## 文档

- [`REQUIREMENTS.md`](REQUIREMENTS.md)：稳定需求 ID 与验收状态
- [`DESIGN.md`](DESIGN.md)：视觉与交互约束
- [`ARCHITECTURE.md`](ARCHITECTURE.md)：共用核心与宿主适配边界
- `agent-log/`：实施与验证记录

实现参考：[官方插件打包](https://developers.openai.com/plugins/build/plugins)、[独立侧栏及对话入口](https://developers.openai.com/plugins/build/extensions)、[MCP Apps UI](https://developers.openai.com/plugins/build/chatgpt-ui)。

## 选择已有 Codex 对话

打开“分发到对话”时，通过公开 `thread/list` 读取本机的非归档交互对话，显示真实名称，当前项目的对话优先分组；保留“新对话”和“当前对话”。读取失败可重试，选择目标只修改页面状态。

`list_codex_conversations` 和 `dispatch_to_conversation` 仅供页面调用。已有对话发送经 `codex app-server proxy` 连接宿主已运行的控制接口，以明确的 thread ID 调用 `thread/read`、必要时 `thread/resume`、然后 `turn/start`；不覆盖模型、权限或工作目录。只有宿主接受消息才显示成功，并使用确认后的实际名称和 URL 保存关联；关联冲突会另行反馈，已接受的发送保持成功。

当前本机桌面没有开放默认公开控制 socket，真实列表仍可读取，已有目标的发送按钮因此禁用。可用 `MYISSUE_CODEX_SOCKET` 指定宿主已开放的公开控制 socket，`MYISSUE_CODEX_BIN` 指定 CLI；新建/当前对话继续使用页面宿主的消息能力。myIssue 不启动独立执行进程来代替桌面中的目标对话，也不自动开启 daemon。

接口依据：[官方 App Server 文档](https://learn.chatgpt.com/docs/app-server)。


## 2026-10-07 正文内附件验收

0.1.8 移除独立附件分组，将添加入口放到描述旁。描述与评论中的图片引用默认显示，Markdown/UTF-8 文本附件展开正文，其他文件保留紧凑下载卡片。独立发布源码通过构建、类型检查和 47 项测试；Web 实际上传、评论追加、图片加载、文件下载及 390px 布局通过。已安装并启用 0.1.8，已安装页面和 ZIP 文件逐字节核对一致；现有原生桌面仍需完全退出并重开后独立验收。

# 任务清单

本文件是 myIssue 在协议能够自托管需求之前的需求事实来源。2026-10-01 用户明确授权开始 Codex 插件实现；本次确认优先于早期仅定义需求与不交付 GUI 的阶段限制。未验收的历史需求保持未完成。

## Phase - Codex 插件首版（2026-10-01 确认）

- [x] [CODEX-PLUGIN-001] 提供标准插件清单、Marketplace、安装命令和可分发包，实际检查本机安装状态。
- [ ] [CODEX-PLUGIN-002] 提供 MCP Apps 全局独立侧栏入口及对话内入口，使用官方 OpenAI UI entrypoints；平台是否展示必须单独人工验收。已实现并由 Codex app-server 读取元数据；2026-10-02 用户截图已确认全局页面显示，对话侧栏入口仍未人工验收。
- [x] [CODEX-PLUGIN-003] 采用 Multica 风格状态列、卡片与详情面板，语义只围绕名称、自由属性、追加式评论；名称下自由 Markdown 内容兼容既有 Description。
- [x] [CODEX-PLUGIN-004] 创建、读取、修改名称与任意 YAML 属性、追加评论、搜索、筛选、看板/列表切换、拖动状态均操作真实文件。
- [ ] [CODEX-PLUGIN-005] 从看板显式发送 Issue 上下文到当前或新对话；从对话通过插件工具创建/读取/更新 Issue 或打开看板。发送成功才显示成功，宿主缺少能力时明确显示不可用。
- [x] [CODEX-PLUGIN-006] 项目根目录 `issues/*.md` 是稳定且唯一的事实来源；不引入 Issue 数据库。
- [x] [CODEX-PLUGIN-007] 通过项目级 `.myissue.json` 配置名称来源、属性字段映射、章节名和状态列；未知属性与未知状态必须保留。结构无法解析时只报告，不自动迁移或覆盖。
- [x] [CODEX-PLUGIN-008] 写入检查文件版本，插件进程之间串行写入并原子替换；保留既有评论与不相关正文。普通编辑器不参与锁协议，检测到外部修改即要求重新加载。
- [x] [CODEX-PLUGIN-009] 分别验收文件测试、MCP 协议、真实页面交互、插件安装和宿主独立入口，不混淆已实现与已验证。

## Phase - ChatGPT 外观与主题（2026-10-02 确认）

- [x] [CODEX-PLUGIN-010] 项目选择弹窗、输入框、按钮、侧栏和页面使用 ChatGPT 的中性配色、字体与圆角逻辑。优先使用 MCP Apps 宿主语义颜色变量并响应主题变更；宿主明确的浅色/深色优先于系统偏好，未提供时跟随系统。重点色只继承宿主提供的焦点/交互变量，不硬编码用户截图的橙色或读取宿主私有设置。已完成隔离 SDK 宿主与浏览器验证；当前 ChatGPT 用户自定义重点色是否实际下发仍未验收。
- [x] [CODEX-PLUGIN-011] 修复升级后的对话侧栏启动：页面资源地址保持稳定，兼容已经发布的旧地址；安装更新后明确提示重启桌面应用，以清除旧对话保留的 MCP 进程。工具目录中的入口地址及兼容地址都必须能够通过实际 MCP 读取。2026-10-02 日志确认旧对话请求 board-v2.html，而保留的 0.1.0 进程只提供 board-v1.html。0.1.2 已安装，独立 Codex app-server 实际读取两个地址成功；重启桌面应用后的原生侧栏显示仍按 CODEX-PLUGIN-002 单独验收。
- [x] [CODEX-PLUGIN-012] 项目选择窗提供可点击的系统文件夹选择器，取消不切换项目；同时读取桌面已添加的本地项目并保留其名称，打开弹窗时刷新列表。通过公开 Codex app-server project/list 获取主要本地根目录，不把没有本地目录的云项目当作文件项目；不可用时保留手动路径和已打开项目。新增项目不自动打开或写入 Issue。弹窗背景必须不透明，宿主半透明颜色应在不透明底色上合成；保持宿主主题与焦点色。2026-10-02 已实现 macOS 文件夹选择器，协议测试与实际 SDK 浏览器点击通过，已安装服务读取 37 个本地项目；系统选择器实际返回目录。0.1.3 原生页面的刷新后显示仍按 CODEX-PLUGIN-002 单独验收。

- [x] [CODEX-PLUGIN-SCROLL-001] 页面所有滚动区域隐藏横向和纵向滚动条，保留滚轮、触控板和键盘滚动；不通过关闭 overflow 裁掉超出区域的内容。2026-10-07 确认并实现；Web 页面实际横向滚动通过，根页面、侧栏和看板的两种隐藏规则生效，overflow 保持 auto。

- [x] [CODEX-PLUGIN-FOOTER-001] 移除看板和列表主区域底部的说明栏及占用空间，不显示名称/属性/评论、同步状态、拖动和轮询说明。2026-10-07 确认并实现；移除共用 footer 节点及全部专用样式，Web 刷新后 footer 节点数为 0。

- [x] [CODEX-PLUGIN-LIVE-001] 移除主区手动刷新按钮，使用 2 秒心跳读取文件并比较数据差异，只有变化才更新界面；页面重新可见或获得焦点时立即检查。心跳请求不重叠，错误后后续心跳可重试；未保存草稿、打开的对话框和本页操作期间暂停，迟到的响应不得覆盖草稿、切换后的项目或刚保存的结果。2026-10-07 实现；新增四项自动测试通过，实际 Web 页面外修改名称/状态、删除和新增文件均自动同步。

首版工程决定：Node.js 22+ / TypeScript，共用文件核心；默认 YAML frontmatter、H1 名称、可选 `## Description`、追加式 `## Comments`。新评论使用带时区 ISO 8601 时间与 `· author · human/model`；旧评论原文保留。默认状态 backlog/todo/in_progress/in_review/done/blocked/cancelled 可配置；不识别的状态仍独立展示。ID 使用文件名 `issue-<UUID>.md`，不改已有文件名或 ID。`REQUIREMENTS.md` 暂继续独立保存。仅由宿主对话能力执行分发，不托管 Agent Runtime；原“不启动 Agent”边界不限制用户本次确认的对话启动动作。许可证仍待用户选择。

## Phase - 侧栏、附件与属性显示（2026-10-07 确认）

- [x] [CODEX-PLUGIN-013] 侧栏使用宿主的三级背景，选中项使用独立的中性背景；全部 Issue 与可开始只能有一个选中项，切换时显示对应视图。保留浅色、深色、主题动态切换与窄屏布局。 该侧栏布局随后由 CODEX-PLUGIN-017 的主区筛选和顶部项目菜单取代，保留原验收记录。
- [x] [CODEX-PLUGIN-014] Issue 详情允许选择附件，单个文件上限 10 MB。文件保存在项目内 `issues/attachments/`，使用唯一文件名；描述新增普通相对 Markdown 图片或文件链接，不增加必填属性或改写既有评论。读取、图片预览与下载复用 MCP 和预览服务；仅允许读取当前 Issue 已引用的附件，不跟随符号链接或越过附件目录。冲突或写入失败保留原 Issue 并清理本次新文件。旧 Issue 无需迁移，手工 Markdown 附件链接也可读取。
- [x] [CODEX-PLUGIN-015] 详情完整渲染任意属性：文本、数值、布尔、空值、数组与嵌套对象；URL 可以打开，Issue wikilink 可跳转，缺失目标明确显示。保留未知字段，卡片属性显示字段名与值，YAML 编辑保留现有入口。

本阶段三项已实现并通过独立源码、文件协议及浏览器验证；原生新版页面与用户验收仍待桌面应用重启后确认。

## Phase - 原生外观、标准组件与共享项目（2026-10-07 确认）

- [x] [CODEX-PLUGIN-016] 页面使用适配 ChatGPT 原生浅色/深色的中性配色并继承宿主主题；按钮、输入、弹窗、菜单、选择器及视图切换尽可能使用 shadcn/ui 标准组件，保留键盘和窄屏交互。
- [x] [CODEX-PLUGIN-017] 移除页面左侧导航。顶部名称菜单提供项目列表、添加和切换入口；全部 Issue/可开始、搜索、新建与看板/列表仍可从主区访问。
- [x] [CODEX-PLUGIN-018] 同一电脑、同一用户的所有 myIssue 面板读取统一项目配置。成功打开的项目与最近使用项目跨对话、面板、插件进程及版本持久保存；新面板恢复最近项目，现有面板保留各自选择并刷新共同列表。兼容迁入旧项目路径配置；并发添加不得丢失记录。显式指定项目优先，失效目录跳过；配置不保存 Issue 数据。 已通过两个独立 stdio 进程的并发/重启验证和真实 SDK 测试宿主的多面板交互；原生桌面刷新仍按 CODEX-PLUGIN-002 单独验收。

## Phase - 插件页面顶栏（2026-10-07 确认）

- [ ] [CODEX-PLUGIN-HEADER-001] 开启 myIssue 独立插件页面时，顶部不显示额外标题栏，参照 Map、Figma 的空白顶部。2026-10-07 已检查本机宿主：桌面额外标题栏由 Codex 绘制，当前公开插件配置不提供关闭入口；尚未实现或验收。插件内部项目切换菜单的范围待明确。

## Phase - 详情页显示与评论输入（2026-10-07 确认）

- [x] [CODEX-PLUGIN-DETAIL-001] Issue 长名称完整自动换行，编辑时随文字及宽度调整高度，仍保存单行 Markdown 标题；“内容”统一显示为“描述”。评论作者默认使用本机用户名并可编辑，隐藏 human 标签及“人类与 Agent 共用”说明，文件中的作者与身份信息保持不变。评论输入区下对齐并固定在详情主区底部，采用独立布局空间，不悬浮或遮挡正文；描述、评论和属性可滚动，窄屏仍保持输入区可见，保留草稿保护与追加评论行为。详情顶部操作、标题、描述、评论与固定输入区保持统一的水平内容基线；看板标题、工具栏、看板与列表共用响应式页边距。实际 SDK 测试宿主的浏览器已验证标题伸缩、1201px/390px/短视口布局、固定输入区、主题及真实追加评论；原生桌面仍单独验收。

- [x] [CODEX-PLUGIN-DETAIL-002] 详情右侧属性栏移除“事实来源”及 `issues/<filename>.md` 文件位置说明；保持顶部源文件入口和 Issue 文件读写行为。已通过构建、类型检查与实际 SDK 浏览器桌面/深色/窄屏查看；顶部源文件展开和收起正常。

## Phase - 卡片对话关联（2026-10-07 确认）

- [x] [CODEX-PLUGIN-CONVERSATION-001] 卡片底部显示被分发任务的对话链接，入口限制宽度、长名称省略，点击直接跳转且不触发 Issue 详情；多个对话仍可访问。关联保存为可选普通 YAML 属性 `conversations: [{title, url}]`，不增加必填字段或独立 Session 数据。已有文件无需迁移，未知属性和既有评论保持原文。详情允许显式关联真实对话链接，接收任务的对话可通过 `link_conversation` 写回已知地址；不从匿名会话标识、发送成功或最近对话猜测目标。普通属性编辑可维护或移除关联。写入使用最新 revision，冲突不覆盖，不可解析的既有关联属性或被项目 Schema 映射为名称、状态、关系的同名属性拒绝自动改写。原生跳转通过宿主公开 openLink 接口，拒绝时明确报告；Web 使用实际链接。 2026-10-07 已实现；文件/真实 SDK/构建 stdio 工具和 Web 关联、展开、跳转及拖动通过。现有卡片已根据实际分发对话补回关联；原生宿主是否接受 codex 深链接仍需单独验收。

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
  - [ ] [0.1.0-PM-A-007] 在首次对外发布前选择并加入明确的开源许可证；仓库公开可见不能被当作已经授予使用、修改或分发许可。

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

- myIssue 不自主启动、暂停、恢复或调度 Coding Agent。用户在本次确认的看板中显式分发到对话，由宿主执行，属于允许的展示层集成。
- myIssue 不管理模型供应商、Prompt、Agent Session、Branch、Worktree、代码 Review 或部署流水线。
- v0.1.0 不建立必须在线的服务端、账号体系、中心数据库或 SaaS。
- v0.1.0 不建立独立 Activity 数据库；有语义的进展进入 Comments，精确变更进入 Git。
- myIssue 不规定 Description 内的业务写法，也不增加系统级 `Acceptance Criteria`、`Context` 或 `Notes` section。
- myIssue 不在父 Issue 中保存 `children`，不通过嵌套目录或 `subtask` 类型重复表达层级。
- v0.1.0 不把一次 Agent Run 建模为 myIssue 托管的运行对象；外部 Harness 可通过 Comment 或未来协议扩展写回结果。

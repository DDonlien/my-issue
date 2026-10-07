# myIssue 插件架构

## 共用文件核心

`issues/*.md` 与 `.myissue.json` → `src/core.ts` → `src/service.ts` → `src/server.ts` → MCP Apps 看板与对话。

核心与 GUI、Agent、Codex 解耦。`core.ts` 拥有解析、未知属性保留、选定属性补丁、评论追加、版本检查、锁和关系推导。`service.ts` 定义所有 mutation 的输入；MCP 与本地预览复用同一实现。

文件结构适配集中在 `parseIssue`、`updateIssue`、`appendComment` 与配置解析。页面只使用 `Issue` / `Board` 语义对象。当前 adapter 接受 YAML 属性、H1 或属性名称、自定义章节名；不同底层结构应替换 adapter，而不是修改每个宿主读写路径。

## 插件及宿主

- `plugins/myissue/plugin.json` 是便携清单，`mcp.json` 定义本地 stdio 服务。
- `.codex-plugin/plugin.json` 是保留的兼容清单；当前已验收的是支持便携格式的 Codex 0.159.2。
- 构建把全部 Node 依赖打包进 `scripts/server.cjs`，全部界面脚本和 CSS 内联进 `assets/board.html`。
- `open_board` 声明 `openai/ui.entrypoints` 的 `global` 与 `thread`，仅这个 render 工具附带 UI 资源；数据工具独立返回结果。
- UI 通过标准 MCP Apps `callServerTool` 操作数据。对话分发使用 `openai/message` 的 `active`/`new` 目标；只支持标准消息的宿主可发送到当前对话，新增对话明确不可用。
- `prepare_dispatch` 重新读取文件并返回上下文，不自行创建对话或执行代码。不保存 myIssue Run、Agent 或 Session 对象。
- `search_mentions` 返回实时 Issue 资源。Markdown 资源可以脱离 UI 读取。
- 运行时需要 Node.js 22+。无远程凭据，也没有公网服务。浏览器预览只用于开发，分发功能在预览中禁用。

全局入口是否可见、对话启动是否被宿主接受属于宿主验收，清单正确、安装完成或协议通过都不替代真实桌面检查。

## 冲突与恢复

每文件版本是文件原文 SHA-256。所有结构化写入读取最新版本，与调用者 revision 比较；取得每文件独占目录锁后，写入临时文件，最后一次检查版本，再原子 rename。临时文件与锁在正常完成和异常时清理。进程崩溃后的锁保留并明确报错，不用时间推测并抢占他人的写锁。

外部编辑器不遵守插件锁，仍存在最后一次检查和 rename 之间的竞争窗口。首版不声称为任意写者提供绝对 CAS，不托管跨机器合并、Git 同步或独立 issue store；这些历史探索不属于当前实现。

## 项目内附件

`attachment-links.ts` 从普通 Markdown 图片/链接推导附件引用，`attachments.ts` 保存和读取真实文件；MCP 与预览均通过同一服务层。附件二进制保存在 `issues/attachments/`，Issue 仅保存相对链接，无附件数据库或必填字段。上传检查当前 revision，使用唯一文件名，Issue 写入失败清理本次文件；读取拒绝未引用路径、目录穿越和符号链接，限制 10 MB。浏览器不从任意相对路径加载资源，图片经工具读取后以临时 data URL 显示；宿主下载使用 ui/download-file。

## 共享项目偏好

`src/preferences.ts` 管理同一电脑用户的项目注册表和最近项目，运行入口从固定用户目录读取，插件版本或对话进程的数据目录只用于兼容迁入。MCP 与预览共用该实现；配置只包含路径和显示名称，Issue 内容仍只来自项目文件。多个进程的写入在锁内读取最新配置，合并新增项目后原子替换。自动刷新使用 `list_issues`，不改变最近选择；已有面板在项目菜单打开时重新读取共同配置。

界面的按钮、输入、菜单、弹窗、选择、页签、筛选、徽章与头像来自官方 shadcn/ui，Tailwind 在插件构建时生成 CSS；构建后的插件继续只有 Node.js 运行依赖。宿主语义主题映射到 shadcn 标准变量，浮动容器在不透明底色上合成可能带透明度的宿主颜色。

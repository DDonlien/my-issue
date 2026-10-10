# 执行日志：独立页面对话区与 Figma 顶栏对比

## 请求与事实来源

- myIssue 分发：处理“为什么单独打开的 my issue 页面右边有一个对话内容？”。事实文件位于项目根目录 issues/issue-c4138f07-2587-4b3a-98af-f74f9fb32a5c.md。
- 用户补充：“对比一下为什么 figma 的插件页面顶栏是空的”。
- 用 myIssue get_issue 重新读取全部属性、描述和评论；原状态 backlog，无评论。通过 read_attachment 查看原截图，右侧分栏、顶部关联对话名称及底部 ChatGPT Work 输入框属于宿主界面。遵守 README、DESIGN、REQUIREMENTS 和 AGENTS 的边界，使用 myIssue 与 OpenAI Docs 技能。
- 开始时 main 位于 a52447b，工作区干净，上游与本地一致。没有可信的本次对话地址，跳过 link_conversation，不把匿名 MCP session ID 转成链接。

## 核对与结论

- 从实际安装的 0.1.9 服务经 MCP stdio 读取工具目录及 board-v2 资源，验证 global/thread 两个入口、首选 fullscreen 及 inline/fullscreen/pip 可用模式。没有执行工具、修改项目配置或发送测试消息。报告：_builds/host-chat-investigation/installed-metadata.json。
- 官方 Extensions 文档说明 global 入口与 thread 面板入口；UI guidelines 说明 fullscreen 保留宿主 composer；公开 UI reference 和已安装 @openai/mcp-extensions 的严格元数据 Schema 未提供隐藏外层标题栏或宿主对话的开关。
- 只读检查当前 /Applications/ChatGPT.app 的打包源码，重新提取 global-view-3f553dc03e76.js 等相关模块。顶栏的渲染条件为 globalHeader 为 true，或应用身份不在宿主隐藏配置中；connectorId 存在时查 app_ids，否则按服务名查 mcp_servers。将 globalHeader 设为 false 无法覆盖另一条件，且该字段不是当前公开 SDK 的设置。
- 本地已安装 Figma 15.0.0 清单引用官方远程连接器；myIssue 清单启动本地 stdio MCP，当前独立入口已经满足公开 global/fullscreen 配置。两个身份走不同的宿主判断分支；Figma 空顶栏符合宿主隐藏路径，但没有取得其当前运行时隐藏名单或独立页面元数据，不将“Figma 命中豁免名单”表述成已证实。
- 通过 Figma 官方工具 open_figma_mcp_app_in_thread 打开并核对其入口返回信息，仅返回 surface: thread，不提供 globalHeader、隐藏名单或独立入口元数据；没有创建或修改 Figma 文件。这不能补足隐藏配置的运行时证据。
- 当前宿主源码另有工作区路由分支；不能将额外插件顶栏、应用最上方的窗口工具栏、myIssue 内部项目菜单或右侧对话区当作同一控件。是否隐藏额外标题栏不能据此推导是否关闭对话。
- 官方 macOS ⌘⇧F 进入/退出整页视图属于宿主工作区布局，不等于 iframe fullscreen。文档说明该使用方式，实际对 myIssue 的效果与状态保持未验收。

## 改动与验证边界

- 仅 README、REQUIREMENTS 和本日志；对应 CODEX-PLUGIN-002 / CODEX-PLUGIN-HEADER-001，后者保持未完成。没有新增运行时行为、改应用代码或配置、伪装 Figma 身份、加入不受支持的元数据，也没有升级插件版本。
- Computer Use 明确拒绝操作 com.openai.codex 原生应用（safety reasons）；没有通过其他输入技术绕过限制，没有点击原生布局按钮。因此本次证据是原截图、当前静态宿主代码、实际已安装 MCP 元数据与官方文档，不是原生交互验收。
- 此任务为原因调查与文档更新，不运行与改动无关的产品回归测试或重新打包；对已安装 MCP 的只读校验和文档差异检查分别执行。
- Issue 的状态与结果通过最新 revision 的 myIssue 工具维护，保留未知属性、原截图引用及既有评论；调查结论待用户验收，不表示自动隐藏已实现。

## 参考

- https://developers.openai.com/plugins/build/extensions
- https://developers.openai.com/plugins/concepts/ui-guidelines
- https://developers.openai.com/plugins/reference
- https://learn.chatgpt.com/docs/reference/commands

## Git

本次交付仅限定上述三个文档文件。提交、推送和远端读回在交付时执行并报告；调查产物留在被忽略的 _builds/host-chat-investigation/，不提交宿主源码。

- 文档提交 dbe441e22d89eeb280f72de73d940d20642b3f6e 已推送 origin/main，远端 SHA 读回一致。首次推送遇到 LibreSSL SSL_ERROR_SYSCALL，按单次 HTTP/1.1 传输重试成功，未修改全局 Git 配置。
- 用最新 revision 追加一条 Codex / gpt-6 调查结果评论，然后重新读取并转为 in_review。再次读回确认名称、原截图引用和既有评论均保留；调查结论待验收，自动隐藏仍未实现。
- 完成记录在此独立补记，后续 Git 提交只含本日志。

# 执行日志：升级后对话侧栏无法启动

## 原始请求

“服务在侧边栏无法正确启动”。用户 2026-10-02 21:58:58 截图显示本开发对话右侧 myIssue 标签停在 ChatGPT 加载图标。

## 原因与决策

- 桌面日志 2026-10-02T11:58:51.722Z 至 11:58:58.738Z 连续记录本对话读取 `ui://myissue/board-v2.html` 返回 -32602 / Resource not found；同一次 open_board 调用 9.7ms 成功。页面未到加载/宿主握手阶段，不是 TypeScript 渲染或项目文件读取故障。
- 同时新入口会话在 11:57:49 已成功读取 board-v2；进程工作目录检查显示旧服务仍留在安装器迁移的 plugin-backup 目录下，版本为 0.1.0。全局工具目录已更新，旧对话专属 MCP 进程仍只认识 board-v1。
- 上次把 URI 当作页面缓存版本、建议仅关闭页面重开，无法处理对话保留的旧进程。地址改为稳定入口身份；本次保留 board-v2，不再随版本改变，并兼容 board-v1。无法给已经运行的旧程序补注册新资源，因此本次升级必须完全退出并重启桌面应用。未终止其他对话或应用进程。
- 已在 REQUIREMENTS.md 先记录 CODEX-PLUGIN-011。未修改 Markdown Schema、文件读写核心、主题逻辑或分发协议。

## 改动

- 新版 MCP 服务同时提供 board-v1 / board-v2，同一页面正文与 UI 元数据，返回的 URI 保持请求地址。
- stdio 验收覆盖工具入口元数据、两个兼容地址，以及页面正文和元数据一致；新服务必须能够接收旧目录中的入口。
- 安装完成明确提示重启桌面应用；README 修正升级操作与原生验证边界。
- 升级 0.1.2；插件清单与 ZIP 文件名从 package.json 读取版本，避免安装包名称落后于实际版本。

## 验证

- 新兼容回归断言在旧 0.1.1 构建上失败，报 Resource board-v1.html not found；修复后通过。
- 构建、TypeScript 检查和 16/16 自动测试通过；原 CRUD、评论保留、版本冲突、分发协议和主题测试继续通过。
- 本机安装读取 installed=true / enabled=true / version=0.1.2。缓存 HTML 与服务文件 SHA-256 均与本仓库构建一致。
- 独立 Codex app-server 加载已安装插件：9 个工具，toolsError=null，全局/对话入口元数据保留；通过 mcpServer/resource/read 实际读取 board-v1 与 board-v2 均成功，text/html;profile=mcp-app，各 1299028 字符。
- 已生成 dist/myissue-0.1.2.zip。仅分发本地安装包，未提交公共插件目录。
- 当前 MCP Apps 自动化浏览器返回空 tab 列表；原生 ChatGPT 窗口不可自动化操作。未重启用户正在使用的应用，故修复后的原生侧栏显示仍需用户重启后确认。协议与安装成功不作为这项验收的替代。

## Git

- 起始 main 与 origin/main 对齐、工作区干净。
- 提交和推送状态将在交付前更新。

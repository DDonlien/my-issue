# 执行日志：具体对话目标与精简分发区

## 原始请求

用户在浏览器要求分发目标“能读出具体的 codex 里的对话”，并移除“在对话里继续”、上下文说明、“点击发送会立即启动所选对话”和常驻的宿主不可用说明。

## 决策与实现

- 实施前记录 CODEX-PLUGIN-DISPATCH-001/002。使用 OpenAI Docs 技能核对官方 App Server 文档 https://learn.chatgpt.com/docs/app-server，并从本机 CLI 0.159.2 生成公开协议类型核对请求字段。
- 新增只读 list_codex_conversations，打开分发区时刷新真实的非归档交互对话、保留实际名称，当前项目优先分组；读取失败可重试。选择目标只改变页面状态，保留新/当前对话的现有标准消息扩展。
- 提供 app-only dispatch_to_conversation，通过公开 app-server proxy 连接宿主现有控制 socket，用明确 thread ID 读取/必要时恢复并发送 turn/start；不覆盖模型、工作目录或权限，不自动批准宿主请求。控制接口不可用时不退回独立执行进程，不开启 daemon，也不打断用户任务。
- 定向发送被宿主接受后，使用实际返回的目标身份保存普通 conversations 关联；关联冲突单独报告，不把已接受的发送误报为未发送。失败不修改 Issue，草稿会阻止发送。
- 分发区移除四处文案及装饰图标/专用样式，保留标准 shadcn Select、Button、Label 和 Textarea；长名称省略并有完整 title，窄屏菜单限制宽度。
- 版本 0.1.9。交付期间另一个任务的正文附件以 0.1.8 提交；最终独立目录基于 b646971，保留已提交的对话关联、内容对齐与正文附件，并加上本次差异。最终版本重新通过构建、类型检查、52 项测试及五项 SDK 浏览器流程。

## 验证

- 独立目录构建、类型检查和 52/52 自动测试通过，其中新增五项：真实 JSONL RPC 的只读分页；精确目标发送且不覆盖设置；原宿主恢复未加载目标；不可用/目标不匹配/拒绝时不发送或转移目标；MCP 接受后关联与并发失败边界。
- 本机实际 thread/list 读取 103 个对话，包括“梳理 Issue 工具维护边界”“统一内容区左侧间距”“开发 myIssue Codex 插件”。默认公开 app-server-control.sock 不存在，proxy 连接失败；列表走只读 app-server，返回 canSend=false，不把该独立实例当成桌面运行状态或发送接口。
- 实际浏览器通过官方 AppBridge/PostMessageTransport 连接独立页面与真实 MCP 服务，在隔离测试宿主验证五项流程：选择实际提供的名称不写文件或发送；草稿保护与明确目标的模拟宿主接受/真实文件关联；接口缺失禁用发送、长名称/390px/深色布局；读取重试；宿主拒绝保留错误和文件。页面无 JavaScript 错误，四处文案均不存在。报告与截图在 _builds/dispatch-acceptance/browser-results.json、dropdown-mobile.png、dispatch-dark.png。
- 定向发送的控制接口使用隔离 JSONL 服务器和 SDK 测试宿主验证，没有向用户真实对话发送测试消息、开启/停止桌面 daemon、改变真实模型或权限，也未重启桌面应用。真实桌面定向发送与新版原生显示仍单独验收；CODEX-PLUGIN-005 保持未完成。

## 交付

- Git、安装目录、打包及当前预览的核对结果在交付时补记。

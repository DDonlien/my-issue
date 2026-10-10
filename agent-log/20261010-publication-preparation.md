# 执行日志：myIssue 公开发布准备

## 原始请求

用户在确认 Figma 的平台连接器身份不等于 OpenAI 开发后提出：“那我们也发布呗？”

## 决策

- 按进入 ChatGPT/Codex 公共插件目录的意图核对官方流程，同时准备当前本地安装包的可审查发布材料。
- 使用 OpenAI Docs 技能查阅实际官方提交页、提交错误参考、MCP 服务与插件打包文档。
- 当前完整插件是本机 stdio，目录 MCP 流程要求生产 HTTPS 地址、域名验证、认证开发者身份及审查材料。不能把现有 ZIP、GitHub Release 或平台连接器身份等同于上架或隐藏宿主顶栏。
- README、需求 0.1.0-PM-A-007 和插件 README 均记录许可证未决定。已询问发布渠道与许可证，未自行授予许可、上传用户文件、部署在线服务或改成 skills-only。
- 原生提交入口的浏览器工具连续两次初始化超时，没有取得登录、组织、开发者认证或已提交草稿状态；不把它当作平台拒绝或账号缺少权限。
- 首次检查之后发现主目录同时开发 0.1.10。为隔离发布基线，以 d6b9511 建立 codex/publication-preparation 工作树，将本任务文档改动移入其中；仅撤回主目录中本任务自己的文档片段，其他任务的源码、版本、需求和日志保留。

## 改动

- REQUIREMENTS.md 新增 PUBLIC-PLUGIN-001/002，保持未完成状态。
- docs/PUBLISHING.md 记录两个发布渠道、当前资料、待补条件及五项正向/三项负向审核案例初稿；案例不是生产执行记录。
- docs/releases/0.1.9.md 提供实际功能、安装、验证和已知边界的发布说明。
- README 与需求澄清 Figma 的“平台连接器身份”，避免“官方”被误解为 OpenAI 作者身份。
- 重新构建 dist/myissue-0.1.9.zip 和 dist/SHA256SUMS；产物、校验报告及临时验证脚本在忽略目录内。

## 验证

- npm run check 通过；npm test 52/52 通过；npm run package:plugin 通过。
- 解压 ZIP 到独立临时目录，不依赖该目录的 node_modules 即可实际启动自包含服务。确认 15 工具、global/thread 入口、board-v2 资源与 ZIP 内页面一致。
- 实际创建/读取 Issue、修改状态、追加评论、保留未知属性与原评论、拒绝过期 revision、附件字节往返和越界拒绝均通过。看板与准备上下文使用最新文件，未调用实际发送工具。
- 以已提交 0.1.9 的独立工作树重新安装锁定依赖、打包、类型检查和运行 52 项测试，全部通过；重建的插件文件与提交基线没有差异。先前在共享目录中的结果不作为最终发布基线。
- 最终独立 ZIP 有 10 个文件，719595 字节，SHA-256 c9ef05943cdc56383a2f7e4e81ec08a4876518da8816f4128a2aed36ea2a0755。没有混入项目 Issue、Git 元数据、node_modules 或正在开发的 0.1.10 源码。
- 临时服务关闭、临时项目删除；隔离报告保留于独立工作树的 _builds/publication/package-report.json。当前预览、插件安装与用户 Issue 未改动。
- 静态/文件/打包检查不代替原生桌面、在线 MCP 或目录审核。

## 交付状态

- 准备文档提交 01f0d4b552bde6cf3e837a72d631f402759b16fd 已推送独立分支 codex/publication-preparation，GitHub API 读回分支对象一致。主目录当前开发中的 0.1.10 未提交进本次候选版本。
- 已建立 GitHub Release 草稿：https://github.com/DDonlien/my-issue/releases/tag/untagged-4aad75897b5248480cc0 。实际读回 tagName=v0.1.9、isDraft=true、isPrerelease=true、targetCommitish=01f0d4b552bde6cf3e837a72d631f402759b16fd；两项附件均 uploaded，ZIP digest 与上面本地 SHA-256 一致。
- HTTPS Git 推送出现 LibreSSL 连接失败，使用同一仓库的已配置 SSH 认证和严格主机校验成功推送；没有关闭 TLS 校验或修改用户网络/认证配置。一次 GitHub API 读回 EOF 后重试成功。
- 目录提交和公开发布尚未完成；许可证与发布渠道等待用户答复。草稿是可检查的准备结果，不是已上架或已公开的发行版。

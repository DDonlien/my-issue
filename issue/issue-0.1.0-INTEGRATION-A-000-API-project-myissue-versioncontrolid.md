# integration/main: 让现有项目逐步采用 myIssue

- ID：`0.1.0-INTEGRATION-A-000`。
- 类型：`API`。
- 状态：待处理（原文未完成项保持未勾选）。
- 版本管理标识：`versioncontrolid`（含义待定义，不推断为 commit、branch 或 change）。
- 来源：`REQUIREMENTS.md` @ `268e46933a376860f446dd7e98eab189612eeb21`；标题路径：任务清单 / Phase - v0.1.0 - Markdown Issue Protocol 与最小可用流程 / integration/main: 让现有项目逐步采用 myIssue。
- 原稳定 ID：`0.1.0-INTEGRATION-A-000`, `0.1.0-INTEGRATION-A-001`, `0.1.0-INTEGRATION-A-002`, `0.1.0-INTEGRATION-A-003`, `0.1.0-INTEGRATION-A-004`；不改写或重编号这些既有 ID。

## 当前需求与范围

- [ ] [0.1.0-INTEGRATION-A-000] 项目能够在不迁移代码和 Git 历史的前提下采用 myIssue #epic #P0
  - [ ] [0.1.0-INTEGRATION-A-001] 初始化只添加协议所需文件和配置，不改变目标项目已有目录结构、分支策略或 Harness。
  - [ ] [0.1.0-INTEGRATION-A-002] 提供一份简短的 `AGENTS.md` 使用约定，使未知 Agent 只靠仓库说明即可读取、领取、评论和关闭 Issue。
  - [ ] [0.1.0-INTEGRATION-A-003] Issue 能关联现有长期需求，使 Agent 获得一次具体工作的目标、上下文、依赖与最新讨论。
  - [ ] [0.1.0-INTEGRATION-A-004] 项目不安装 myIssue CLI 时，仍可通过复制最小模板或手工创建兼容 Issue。

## 检查与验收边界

以上勾选与结果沿用迁移前的当前需求文档；历史记录中的实现、测试、编译、视觉与用户验收彼此独立。本次只迁移文档并检查结构 / 引用，没有重新执行产品构建或用户验收，也没有凭历史日志新增完成勾选。

## Comments

### 2026-10-23 17:44:33 UTC — Agent（文档迁移）

按原有功能 / 工作目标标题拆分需求，保留原 ID、勾选、依赖、最新补充及来源。没有稳定根 ID或旧 ID 在不同上下文重用时，采用由来源路径和标题确定的迁移 Issue ID，原 ID 仍在正文保留。完整旧内容可从来源版本读取；独有未提交内容的版本化副本见迁移映射。

### 20261010-publication-preparation.md — 历史证据迁移

来源：`agent-log/20261010-publication-preparation.md` @ `268e46933a376860f446dd7e98eab189612eeb21`。日期 / 时区沿用原记录；以下摘录不自动改变当前完成状态。

#### 决策

- 按进入 ChatGPT/Codex 公共插件目录的意图核对官方流程，同时准备当前本地安装包的可审查发布材料。
- 使用 OpenAI Docs 技能查阅实际官方提交页、提交错误参考、MCP 服务与插件打包文档。
- 当前完整插件是本机 stdio，目录 MCP 流程要求生产 HTTPS 地址、域名验证、认证开发者身份及审查材料。不能把现有 ZIP、GitHub Release 或平台连接器身份等同于上架或隐藏宿主顶栏。
- README、需求 0.1.0-PM-A-007 和插件 README 均记录许可证未决定。已询问发布渠道与许可证，未自行授予许可、上传用户文件、部署在线服务或改成 skills-only。
- 原生提交入口的浏览器工具连续两次初始化超时，没有取得登录、组织、开发者认证或已提交草稿状态；不把它当作平台拒绝或账号缺少权限。
- 首次检查之后发现主目录同时开发 0.1.10。为隔离发布基线，以 d6b9511 建立 codex/publication-preparation 工作树，将本任务文档改动移入其中；仅撤回主目录中本任务自己的文档片段，其他任务的源码、版本、需求和日志保留。

#### 验证

- npm run check 通过；npm test 52/52 通过；npm run package:plugin 通过。
- 解压 ZIP 到独立临时目录，不依赖该目录的 node_modules 即可实际启动自包含服务。确认 15 工具、global/thread 入口、board-v2 资源与 ZIP 内页面一致。
- 实际创建/读取 Issue、修改状态、追加评论、保留未知属性与原评论、拒绝过期 revision、附件字节往返和越界拒绝均通过。看板与准备上下文使用最新文件，未调用实际发送工具。
- 以已提交 0.1.9 的独立工作树重新安装锁定依赖、打包、类型检查和运行 52 项测试，全部通过；重建的插件文件与提交基线没有差异。先前在共享目录中的结果不作为最终发布基线。
- 最终独立 ZIP 有 10 个文件，719595 字节，SHA-256 c9ef05943cdc56383a2f7e4e81ec08a4876518da8816f4128a2aed36ea2a0755。没有混入项目 Issue、Git 元数据、node_modules 或正在开发的 0.1.10 源码。
- 临时服务关闭、临时项目删除；隔离报告保留于独立工作树的 _builds/publication/package-report.json。当前预览、插件安装与用户 Issue 未改动。
- 静态/文件/打包检查不代替原生桌面、在线 MCP 或目录审核。

#### 交付状态

- 准备文档提交 01f0d4b552bde6cf3e837a72d631f402759b16fd 已推送独立分支 codex/publication-preparation，GitHub API 读回分支对象一致。主目录当前开发中的 0.1.10 未提交进本次候选版本。
- 已建立 GitHub Release 草稿：https://github.com/DDonlien/my-issue/releases/tag/untagged-4aad75897b5248480cc0 。实际读回 tagName=v0.1.9、isDraft=true、isPrerelease=true、targetCommitish=01f0d4b552bde6cf3e837a72d631f402759b16fd；两项附件均 uploaded，ZIP digest 与上面本地 SHA-256 一致。
- HTTPS Git 推送出现 LibreSSL 连接失败，使用同一仓库的已配置 SSH 认证和严格主机校验成功推送；没有关闭 TLS 校验或修改用户网络/认证配置。一次 GitHub API 读回 EOF 后重试成功。
- 目录提交和公开发布尚未完成；许可证与发布渠道等待用户答复。草稿是可检查的准备结果，不是已上架或已公开的发行版。

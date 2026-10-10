# myIssue 发布准备

核对日期：2026-10-10。发布目标来自用户“那我们也发布呗？”。

## 当前版本

myIssue 0.1.9 是读取和修改本机项目文件的 stdio MCP 插件。`issues/*.md` 继续作为唯一事实来源，安装包包含看板、MCP 服务和配套 skill。运行时需要 Node.js 22+，不需要在插件目录安装 npm 依赖。

仓库 https://github.com/DDonlien/my-issue 已公开。公开源码、生成 ZIP、GitHub Release、提交目录审核和目录正式上架是不同的状态。当前发布状态应从 GitHub 和提交平台读回确认。

已建立 [v0.1.9 GitHub 发布草稿](https://github.com/DDonlien/my-issue/releases/tag/untagged-4aad75897b5248480cc0)，尚未公开发布。2026-10-10 读回 `draft=true`、目标提交 `01f0d4b552bde6cf3e837a72d631f402759b16fd`；ZIP 与校验文件均为 uploaded，ZIP 的平台 SHA-256 与本地一致。许可证与发布渠道仍等待用户选择。

## GitHub 本地安装版

发布材料：

- `dist/myissue-0.1.9.zip`：现有完整插件包。
- `docs/releases/0.1.9.md`：面向使用者的发布说明。
- `dist/SHA256SUMS`：ZIP 的校验值。
- `plugins/myissue/THIRD_PARTY_NOTICES.txt`：实际打入包内的依赖许可。

发布前还需选择项目许可证并把许可文件包含在 ZIP 中。目前 README、插件 README 与需求均明确记录项目许可证尚未决定，不能把第三方 notices 当作 myIssue 的许可。

本地检查使用 `npm run check`、`npm test` 和 `npm run package:plugin`。解压后的 ZIP 应能独立启动 stdio 服务并读取 `ui://myissue/board-v2.html`，同时验证真实文件写入、评论追加与过期 revision 拒绝；全部使用隔离项目，不发送真实对话消息。

源码安装方法见仓库 README。仓库 Marketplace 可供兼容的 Codex 安装；它不等同于公共目录身份，不承诺改变宿主顶栏。

## ChatGPT / Codex 公共目录

官方入口：[插件提交平台](https://platform.openai.com/plugins)。

当前完整包不能直接作为在线目录版本使用：服务通过 stdio 在用户电脑运行，未部署生产 HTTPS MCP 地址。单纯更改清单里的 transport 或放一个远程空壳不能使服务访问每位用户自己的项目。

还需完成：

- 决定在线接入如何取得用户明确选择的文件权限、隔离用户，以及保持 Markdown 文件事实来源。该设计尚未确认或实现。
- 提供稳定的生产 HTTPS MCP 服务并完成平台生成的域名验证。
- 在提交组织中验证实际个人或企业发布者身份，确认有提交权限；清单中的 `DDonlien` 不代替平台认证。
- 提供真实产品网站、支持、隐私和服务条款 HTTPS 页面，发布者身份一致。
- 对生产服务的每个工具填写三个行为注解及理由，完成工具和 skill 扫描。
- 提供五项正向、三项负向审查案例、发布说明、演示录屏与适用平台说明；自定义 UI 截图按平台尺寸与 starter prompt 数量要求准备。
- 在生产服务上重新执行审核案例。现有本机测试通过不替代在线版验证或人工审核。
- 审核通过后发布，再通过准确名称或目录地址确认公开上架。

不能为通过提交而把完整插件静默转换成 skills-only：现有 skill 依赖配套 MCP 工具，且官方流程目前不支持给已建立的 skills-only 插件增加 MCP。目录上架也不保证宿主隐藏额外顶栏或右侧对话。

## 审核案例初稿

下面描述当前产品预期行为；在线接入尚未实现，因此不是生产服务的执行记录。正式提交需按最终 transport、账号、权限及平台修订参数和步骤。

| 类型 | 使用者操作 | 预期结果 |
| --- | --- | --- |
| 正向 1 | 打开授权项目的看板 | 显示真实 Issue，状态列由文件推导，可进入详情 |
| 正向 2 | 从对话创建 Issue | 项目增加 Markdown 文件，名称、描述和未知属性正确保存 |
| 正向 3 | 用刚读取的 revision 修改状态 | 仅目标属性变化，描述及既有评论保持原文 |
| 正向 4 | 追加署名评论 | 新条目带时间、作者和实际身份，既有历史保持不变 |
| 正向 5 | 上传并读取正文附件 | 附件位于项目内，描述保存相对引用，读取返回原始内容 |
| 负向 1 | 用旧 revision 修改 Issue | 明确报告冲突，不覆盖当前文件 |
| 负向 2 | 读取越界、未引用或符号链接附件 | 拒绝读取，未授权文件不进入结果 |
| 负向 3 | 在宿主缺少发送能力时分发到已有对话 | 发送不可用或明确失败，不启动独立 Agent，不记录虚假成功 |

## 官方依据

- [完整提交流程](https://developers.openai.com/plugins/deploy/submission)
- [最终提交、MCP、截图与审核材料要求](https://developers.openai.com/plugins/deploy/submission-errors)
- [生产 MCP 服务部署要求](https://developers.openai.com/plugins/build/mcp-server)
- [本地 Marketplace 与公共目录区别](https://developers.openai.com/plugins/build/plugins)

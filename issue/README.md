# Issue 入口

本目录是当前工作副本的任务、检查与交接入口。旧需求的状态、ID 与来源保留在对应 Issue；历史 Comments 不自动更新当前完成度。Issue 使用 Obsidian YAML frontmatter 和 Description / Comments 两个一级标题；文件名仅为 issue_原语言任务描述.md。真实 Git / P4 编号写入对应 Comment，recorded-version 仅记录可选内容发布版本。

- [Issue 模板](issue_template.md)
- [本轮迁移记录](issue_%E8%BF%81%E7%A7%BB%E9%A1%B9%E7%9B%AE%E4%BB%BB%E5%8A%A1%E4%B8%8E%E5%8D%8F%E4%BD%9C%E8%AE%B0%E5%BD%95.md)
- [旧路径与来源映射](migration-map.json)

- [提供可安装的myIssue插件清单与分发包](issue_%E6%8F%90%E4%BE%9B%E5%8F%AF%E5%AE%89%E8%A3%85%E7%9A%84myIssue%E6%8F%92%E4%BB%B6%E6%B8%85%E5%8D%95%E4%B8%8E%E5%88%86%E5%8F%91%E5%8C%85.md)、[提供宿主独立侧栏与对话内myIssue入口](issue_%E6%8F%90%E4%BE%9B%E5%AE%BF%E4%B8%BB%E7%8B%AC%E7%AB%8B%E4%BE%A7%E6%A0%8F%E4%B8%8E%E5%AF%B9%E8%AF%9D%E5%86%85myIssue%E5%85%A5%E5%8F%A3.md)、[从真实Markdown文件驱动myIssue看板与安全读写](issue_%E4%BB%8E%E7%9C%9F%E5%AE%9EMarkdown%E6%96%87%E4%BB%B6%E9%A9%B1%E5%8A%A8myIssue%E7%9C%8B%E6%9D%BF%E4%B8%8E%E5%AE%89%E5%85%A8%E8%AF%BB%E5%86%99.md)、[在myIssue与当前或新对话间传递Issue上下文](issue_%E5%9C%A8myIssue%E4%B8%8E%E5%BD%93%E5%89%8D%E6%88%96%E6%96%B0%E5%AF%B9%E8%AF%9D%E9%97%B4%E4%BC%A0%E9%80%92Issue%E4%B8%8A%E4%B8%8B%E6%96%87.md) — `CODEX-PLUGIN-001`；进行中（原文同时包含已完成与未完成项）；原路径 `REQUIREMENTS.md`。

- [采用ChatGPT中性外观并精简看板页面](issue_%E9%87%87%E7%94%A8ChatGPT%E4%B8%AD%E6%80%A7%E5%A4%96%E8%A7%82%E5%B9%B6%E7%B2%BE%E7%AE%80%E7%9C%8B%E6%9D%BF%E9%A1%B5%E9%9D%A2.md)、[保持旧页面资源地址兼容并修复侧栏升级启动](issue_%E4%BF%9D%E6%8C%81%E6%97%A7%E9%A1%B5%E9%9D%A2%E8%B5%84%E6%BA%90%E5%9C%B0%E5%9D%80%E5%85%BC%E5%AE%B9%E5%B9%B6%E4%BF%AE%E5%A4%8D%E4%BE%A7%E6%A0%8F%E5%8D%87%E7%BA%A7%E5%90%AF%E5%8A%A8.md)、[通过系统文件夹选择器与桌面项目列表切换项目](issue_%E9%80%9A%E8%BF%87%E7%B3%BB%E7%BB%9F%E6%96%87%E4%BB%B6%E5%A4%B9%E9%80%89%E6%8B%A9%E5%99%A8%E4%B8%8E%E6%A1%8C%E9%9D%A2%E9%A1%B9%E7%9B%AE%E5%88%97%E8%A1%A8%E5%88%87%E6%8D%A2%E9%A1%B9%E7%9B%AE.md)、[用差异检测心跳同步文件变化并刷新可见页面](issue_%E7%94%A8%E5%B7%AE%E5%BC%82%E6%A3%80%E6%B5%8B%E5%BF%83%E8%B7%B3%E5%90%8C%E6%AD%A5%E6%96%87%E4%BB%B6%E5%8F%98%E5%8C%96%E5%B9%B6%E5%88%B7%E6%96%B0%E5%8F%AF%E8%A7%81%E9%A1%B5%E9%9D%A2.md) — `CODEX-PLUGIN-010`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [在侧栏单选全部Issue与可开始视图](issue_%E5%9C%A8%E4%BE%A7%E6%A0%8F%E5%8D%95%E9%80%89%E5%85%A8%E9%83%A8Issue%E4%B8%8E%E5%8F%AF%E5%BC%80%E5%A7%8B%E8%A7%86%E5%9B%BE.md)、[在Issue详情选择并上传受限附件](issue_%E5%9C%A8Issue%E8%AF%A6%E6%83%85%E9%80%89%E6%8B%A9%E5%B9%B6%E4%B8%8A%E4%BC%A0%E5%8F%97%E9%99%90%E9%99%84%E4%BB%B6.md)、[完整渲染任意属性并打开URL与Issue关联](issue_%E5%AE%8C%E6%95%B4%E6%B8%B2%E6%9F%93%E4%BB%BB%E6%84%8F%E5%B1%9E%E6%80%A7%E5%B9%B6%E6%89%93%E5%BC%80URL%E4%B8%8EIssue%E5%85%B3%E8%81%94.md) — `CODEX-PLUGIN-013`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [继承宿主浅深色主题并移除左侧导航](issue_%E7%BB%A7%E6%89%BF%E5%AE%BF%E4%B8%BB%E6%B5%85%E6%B7%B1%E8%89%B2%E4%B8%BB%E9%A2%98%E5%B9%B6%E7%A7%BB%E9%99%A4%E5%B7%A6%E4%BE%A7%E5%AF%BC%E8%88%AA.md)、[让同一用户的myIssue面板共享项目配置](issue_%E8%AE%A9%E5%90%8C%E4%B8%80%E7%94%A8%E6%88%B7%E7%9A%84myIssue%E9%9D%A2%E6%9D%BF%E5%85%B1%E4%BA%AB%E9%A1%B9%E7%9B%AE%E9%85%8D%E7%BD%AE.md) — `CODEX-PLUGIN-016`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [Phase - 插件页面顶栏（2026-10-07 确认）](issue_%E9%9A%90%E8%97%8F%E7%8B%AC%E7%AB%8BmyIssue%E9%A1%B5%E9%9D%A2%E7%9A%84%E5%AE%BF%E4%B8%BB%E9%A2%9D%E5%A4%96%E6%A0%87%E9%A2%98%E6%A0%8F.md) — `CODEX-PLUGIN-HEADER-001`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [自适应显示Issue长名称并保持评论输入布局](issue_%E8%87%AA%E9%80%82%E5%BA%94%E6%98%BE%E7%A4%BAIssue%E9%95%BF%E5%90%8D%E7%A7%B0%E5%B9%B6%E4%BF%9D%E6%8C%81%E8%AF%84%E8%AE%BA%E8%BE%93%E5%85%A5%E5%B8%83%E5%B1%80.md)、[调整详情属性区顺序并移除冗余文件位置说明](issue_%E8%B0%83%E6%95%B4%E8%AF%A6%E6%83%85%E5%B1%9E%E6%80%A7%E5%8C%BA%E9%A1%BA%E5%BA%8F%E5%B9%B6%E7%A7%BB%E9%99%A4%E5%86%97%E4%BD%99%E6%96%87%E4%BB%B6%E4%BD%8D%E7%BD%AE%E8%AF%B4%E6%98%8E.md) — `CODEX-PLUGIN-DETAIL-001`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [Phase - 卡片对话关联（2026-10-07 确认）](issue_%E5%9C%A8%E5%8D%A1%E7%89%87%E6%98%BE%E7%A4%BA%E5%8F%AF%E7%9B%B4%E6%8E%A5%E8%B7%B3%E8%BD%AC%E7%9A%84%E4%BB%BB%E5%8A%A1%E5%AF%B9%E8%AF%9D%E9%93%BE%E6%8E%A5.md) — `CODEX-PLUGIN-CONVERSATION-001`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [Phase - 当前对话、评论来源与完整模型名（2026-10-10 确认）](issue_%E5%8C%BA%E5%88%86%E5%BD%93%E5%89%8D%E6%89%A7%E8%A1%8C%E5%AF%B9%E8%AF%9D%E4%B8%8EAI%E8%AF%84%E8%AE%BA%E6%9D%A5%E6%BA%90%E5%B9%B6%E8%AE%B0%E5%BD%95%E5%AE%8C%E6%95%B4%E6%A8%A1%E5%9E%8B%E5%90%8D.md) — `CODEX-PLUGIN-CONVERSATION-002`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [Phase - 正文内附件（2026-10-07 确认）](issue_%E5%B0%86%E9%99%84%E4%BB%B6%E5%85%A5%E5%8F%A3%E4%B8%8E%E5%AA%92%E4%BD%93%E9%A2%84%E8%A7%88%E5%90%88%E5%B9%B6%E5%88%B0Issue%E6%8F%8F%E8%BF%B0%E5%8C%BA.md) — `CODEX-PLUGIN-ATTACHMENT-INLINE-001`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [Phase - 分发目标与精简界面（2026-10-07 确认）](issue_%E8%AF%BB%E5%8F%96%E7%9C%9F%E5%AE%9ECodex%E5%AF%B9%E8%AF%9D%E4%BD%9C%E4%B8%BA%E5%88%86%E5%8F%91%E7%9B%AE%E6%A0%87%E5%B9%B6%E7%B2%BE%E7%AE%80%E5%88%86%E5%8F%91%E8%AF%B4%E6%98%8E.md) — `CODEX-PLUGIN-DISPATCH-001`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [在新建与详情描述中粘贴安全图片和视频附件](issue_%E5%9C%A8%E6%96%B0%E5%BB%BA%E4%B8%8E%E8%AF%A6%E6%83%85%E6%8F%8F%E8%BF%B0%E4%B8%AD%E7%B2%98%E8%B4%B4%E5%AE%89%E5%85%A8%E5%9B%BE%E7%89%87%E5%92%8C%E8%A7%86%E9%A2%91%E9%99%84%E4%BB%B6.md)、[在新建Issue时逐行增删并填写任意类型属性](issue_%E5%9C%A8%E6%96%B0%E5%BB%BAIssue%E6%97%B6%E9%80%90%E8%A1%8C%E5%A2%9E%E5%88%A0%E5%B9%B6%E5%A1%AB%E5%86%99%E4%BB%BB%E6%84%8F%E7%B1%BB%E5%9E%8B%E5%B1%9E%E6%80%A7.md) — `CODEX-PLUGIN-COMPOSER-001`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [在宽屏用详情抽屉保留看板并适配窄屏](issue_%E5%9C%A8%E5%AE%BD%E5%B1%8F%E7%94%A8%E8%AF%A6%E6%83%85%E6%8A%BD%E5%B1%89%E4%BF%9D%E7%95%99%E7%9C%8B%E6%9D%BF%E5%B9%B6%E9%80%82%E9%85%8D%E7%AA%84%E5%B1%8F.md)、[将评论输入置顶并按最新优先显示评论](issue_%E5%B0%86%E8%AF%84%E8%AE%BA%E8%BE%93%E5%85%A5%E7%BD%AE%E9%A1%B6%E5%B9%B6%E6%8C%89%E6%9C%80%E6%96%B0%E4%BC%98%E5%85%88%E6%98%BE%E7%A4%BA%E8%AF%84%E8%AE%BA.md)、[在描述中拖入安全附件并保留媒体粘贴](issue_%E5%9C%A8%E6%8F%8F%E8%BF%B0%E4%B8%AD%E6%8B%96%E5%85%A5%E5%AE%89%E5%85%A8%E9%99%84%E4%BB%B6%E5%B9%B6%E4%BF%9D%E7%95%99%E5%AA%92%E4%BD%93%E7%B2%98%E8%B4%B4.md)、[让详情属性默认独立编辑并保留冲突草稿](issue_%E8%AE%A9%E8%AF%A6%E6%83%85%E5%B1%9E%E6%80%A7%E9%BB%98%E8%AE%A4%E7%8B%AC%E7%AB%8B%E7%BC%96%E8%BE%91%E5%B9%B6%E4%BF%9D%E7%95%99%E5%86%B2%E7%AA%81%E8%8D%89%E7%A8%BF.md)、[将当前对话与分发入口收敛为紧凑操作区](issue_%E5%B0%86%E5%BD%93%E5%89%8D%E5%AF%B9%E8%AF%9D%E4%B8%8E%E5%88%86%E5%8F%91%E5%85%A5%E5%8F%A3%E6%94%B6%E6%95%9B%E4%B8%BA%E7%B4%A7%E5%87%91%E6%93%8D%E4%BD%9C%E5%8C%BA.md) — `CODEX-PLUGIN-DETAIL-003`；已完成（沿用原需求记录；本轮未重新执行产品验收）；原路径 `REQUIREMENTS.md`。

- [protocol/main: 建立可脱离 Agent 与 Harness 的 Issue 协议](issue_%E4%BA%A4%E4%BB%98%E5%8F%AF%E8%84%B1%E7%A6%BBAgent%E4%B8%8EHarness%E7%9A%84Markdown-Issue%E5%8D%8F%E8%AE%AE.md) — `0.1.0-PROTO-A-000`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [protocol/main: 用扁平文件表达任意深度的 Issue Graph](issue_%E7%94%A8%E6%89%81%E5%B9%B3Markdown%E6%96%87%E4%BB%B6%E5%92%8C%E5%85%B3%E7%B3%BB%E8%A1%A8%E8%BE%BE%E4%BB%BB%E6%84%8F%E6%B7%B1%E5%BA%A6Issue%E5%9B%BE.md) — `0.1.0-PROTO-B-000`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [protocol/main: 定义最小且可读的 Issue 文件](issue_%E5%AE%9A%E4%B9%89%E5%8C%85%E5%90%ABProperties%E6%A0%87%E9%A2%98%E6%AD%A3%E6%96%87%E4%B8%8EComments%E7%9A%84%E6%9C%80%E5%B0%8FIssue%E6%96%87%E4%BB%B6.md) — `0.1.0-SCHEMA-A-000`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [cli/main: 提供薄而确定的结构化操作入口](issue_%E6%8F%90%E4%BE%9B%E4%BE%9B%E4%BA%BA%E7%B1%BB%E8%84%9A%E6%9C%AC%E4%B8%8EAgent%E5%85%B1%E7%94%A8%E7%9A%84%E6%9C%80%E5%B0%8FCLI.md) — `0.1.0-CLI-A-000`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [integration/main: 让现有项目逐步采用 myIssue](issue_%E8%AE%A9%E7%8E%B0%E6%9C%89%E9%A1%B9%E7%9B%AE%E6%B8%90%E8%BF%9B%E9%87%87%E7%94%A8myIssue%E5%B9%B6%E4%BF%9D%E7%95%99Git%E5%8E%86%E5%8F%B2.md) — `0.1.0-INTEGRATION-A-000`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [protocol/main: 关闭协议冻结前的关键待决策项](issue_%E5%86%BB%E7%BB%93Issue%E5%8D%8F%E8%AE%AESchema%E4%B8%8E%E5%85%B3%E9%94%AE%E8%BE%B9%E7%95%8C%E5%86%B3%E7%AD%96.md) — `0.1.0-PM-A-000`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [validation/main: 验证协议可恢复、可互操作且不损坏内容](issue_%E9%AA%8C%E8%AF%81Issue%E5%8D%8F%E8%AE%AE%E6%81%A2%E5%A4%8D%E4%BA%92%E6%93%8D%E4%BD%9C%E4%B8%8E%E5%86%85%E5%AE%B9%E4%BF%9D%E7%9C%9F.md) — `0.1.0-QA-A-000`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [collaboration/main: 支持多个执行者协作同一 Issue 集合](issue_%E6%94%AF%E6%8C%81%E5%A4%9A%E4%B8%AA%E6%89%A7%E8%A1%8C%E8%80%85%E5%8D%8F%E4%BD%9C%E5%90%8C%E4%B8%80Issue%E9%9B%86%E5%90%88.md) — `0.2.0-COLLAB-A-000`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [presentation/main: 在协议之上提供可替换视图](issue_%E6%8F%90%E4%BE%9B%E5%8F%AF%E6%9B%BF%E6%8D%A2%E7%9A%84Issue%E5%9B%BE%E6%B5%8F%E8%A7%88%E4%B8%8E%E6%93%8D%E4%BD%9C%E8%A7%86%E5%9B%BE.md) — `0.2.0-VIEW-A-000`；待处理（原文未完成项保持未勾选）；原路径 `REQUIREMENTS.md`。

- [既有 Issue：issue-MYI-UI-20261024-01-UI-notion-properties-versioncontrolid](issue_属性区与下拉统一为 Notion 样式.md)。
- [移除看板标题行并将新建按钮并入工具栏](issue_移除看板标题行并将新建按钮并入工具栏.md) — 看板顶部布局调整。

## 执行记录

- 2026-10-26：实现 [看板列固定高度，卡片裁切并在列内上下滚动](issue_看板列固定高度，卡片裁切并在列内上下滚动.md)。`npm run check` 和 `npm run build` 通过；未运行测试或进行宿主视觉验收，等待用户验收。
- 2026-10-26：实现 [移除看板标题行并将新建按钮并入工具栏](issue_移除看板标题行并将新建按钮并入工具栏.md)。`npm run build` 通过；未运行自动测试或进行宿主视觉验收，等待用户验收。

- 2026-10-28：实现 myIssue 兼容识别项目根目录下的 `Issue/` 与 `issues/`，新项目默认 `issues/`；两个目录同时存在时报告歧义。附件与分发路径跟随实际目录，并更新插件说明和数据架构文档。`npm run build`、`git diff --check` 通过；未运行自动化测试或真实目录读写验收。未提交、未推送。

> [本次执行对话](codex://threads/01a181ae-daf5-7f52-84cd-c552bb50260e)

## 20261026-205725_Codex_Unknown

- 原始请求：myissue本地有吗，没有从GitHub拉下来，然后模板ticket里加上仨属性，开始时间，完成时间，父任务。
- 决策与改动：本地常用项目目录未找到仓库，已克隆 `DDonlien/my-issue` 到 `D:\Projects\GitHub\Personal\my-issue`；在唯一模板新增默认留空的 `start-time`、`completed-time`、`parent`，沿用 ISO 8601 与现有父任务关系，不迁移既有 Issue。需求及执行记录归入[最小 Issue 文件](issue_定义包含Properties标题正文与Comments的最小Issue文件.md)。
- 验证：模板属性、空值、重复键、两个一级标题与原有 Comments 内容的静态检查通过；`git diff --check` 通过。未运行应用测试、构建或界面验收。
- 交付：未 Git commit，未 push。具体模型版本不可用，使用 Unknown。

[本次执行对话](codex://threads/01a17842-e93c-7a82-8947-3b1915817620)

## 20261028-081750_Codex_GPT-UNKNOWN-UNKNOWN-UNKNOWN-UNKNOWN

- 原始请求：定义功能 / 事务任务，以最终用户可直接或间接感知结果为唯一分类界限；自动匹配 Issue，尊重项目外部追踪和人工修正。
- 改动与决策：更新通用 AGENTS、模板说明和[本次规范任务](issue_定义功能与事务任务及双向追踪协作规范.md)，保留项目既有字段和工作流，不默认启用外部表格。
- 验证：相关规则、YAML、两项一级标题、链接和 scoped diff 轻量检查；未运行产品代码、GUI、构建或外部追踪写入。
- 交付：本条记录时本次提交尚未生成，提交 / 推送按实际回读记入交付报告；不填旧 HEAD 代替实施提交。Agent 为 Codex、厂牌 GPT；本次其余模型维度不可核实，使用 UNKNOWN。

> [对应执行对话](codex://threads/01a172bc-a59e-74ad-9553-ff4370c9a0f0)

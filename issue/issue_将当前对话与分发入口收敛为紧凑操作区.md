# 将当前对话与分发入口收敛为紧凑操作区

- ID：`CODEX-PLUGIN-DISPATCH-003`。
- 类型：`SEC`。
- 状态：已完成（仅沿用本任务原始勾选；本轮未重新执行产品验收）。
- 版本管理：Git。
- 实施提交：未核实（现有记录未提供可直接对应本任务的实际实施提交；来源快照、当前 HEAD 与文档迁移提交不代替任务实施版本）。
- 来源：`REQUIREMENTS.md` @ `f4834f13242293ffb522ee78c2de0669d6c08ead`；标题路径：任务清单 / Phase - 详情抽屉、评论顺序与直接编辑（2026-10-10 确认）。
- 原稳定 ID：`CODEX-PLUGIN-DETAIL-003`, `CODEX-PLUGIN-COMMENT-002`, `CODEX-PLUGIN-ATTACHMENT-002`, `CODEX-PLUGIN-PROPERTIES-002`, `CODEX-PLUGIN-DISPATCH-003`, `CODEX-PLUGIN-DISPATCH-004`；不改写或重编号这些既有 ID。
- 来源汇总状态：已完成（沿用原需求记录；本轮未重新执行产品验收）。
- 原迁移记录 ID：`CODEX-PLUGIN-DETAIL-003`。
- 本文件原任务 ID：`CODEX-PLUGIN-DISPATCH-003`、`CODEX-PLUGIN-DISPATCH-004`。
- 原需求标题：Phase - 详情抽屉、评论顺序与直接编辑（2026-10-10 确认）。
- 原迁移文件：`issue/issue-CODEX-PLUGIN-DETAIL-003-SEC-project-goal-versioncontrolid.md`（重命名前路径，仅用于历史追溯）。
- 同源任务：[在宽屏用详情抽屉保留看板并适配窄屏](issue_%E5%9C%A8%E5%AE%BD%E5%B1%8F%E7%94%A8%E8%AF%A6%E6%83%85%E6%8A%BD%E5%B1%89%E4%BF%9D%E7%95%99%E7%9C%8B%E6%9D%BF%E5%B9%B6%E9%80%82%E9%85%8D%E7%AA%84%E5%B1%8F.md)、[将评论输入置顶并按最新优先显示评论](issue_%E5%B0%86%E8%AF%84%E8%AE%BA%E8%BE%93%E5%85%A5%E7%BD%AE%E9%A1%B6%E5%B9%B6%E6%8C%89%E6%9C%80%E6%96%B0%E4%BC%98%E5%85%88%E6%98%BE%E7%A4%BA%E8%AF%84%E8%AE%BA.md)、[在描述中拖入安全附件并保留媒体粘贴](issue_%E5%9C%A8%E6%8F%8F%E8%BF%B0%E4%B8%AD%E6%8B%96%E5%85%A5%E5%AE%89%E5%85%A8%E9%99%84%E4%BB%B6%E5%B9%B6%E4%BF%9D%E7%95%99%E5%AA%92%E4%BD%93%E7%B2%98%E8%B4%B4.md)、[让详情属性默认独立编辑并保留冲突草稿](issue_%E8%AE%A9%E8%AF%A6%E6%83%85%E5%B1%9E%E6%80%A7%E9%BB%98%E8%AE%A4%E7%8B%AC%E7%AB%8B%E7%BC%96%E8%BE%91%E5%B9%B6%E4%BF%9D%E7%95%99%E5%86%B2%E7%AA%81%E8%8D%89%E7%A8%BF.md)。
- 共同约束与完整历史：[在宽屏用详情抽屉保留看板并适配窄屏](issue_%E5%9C%A8%E5%AE%BD%E5%B1%8F%E7%94%A8%E8%AF%A6%E6%83%85%E6%8A%BD%E5%B1%89%E4%BF%9D%E7%95%99%E7%9C%8B%E6%9D%BF%E5%B9%B6%E9%80%82%E9%85%8D%E7%AA%84%E5%B1%8F.md)（共享说明与源 Comments 保留在该主记录）。

## 当前需求与范围
- [x] [CODEX-PLUGIN-DISPATCH-003] 右侧分发入口采用紧凑按钮，保留目标和补充指令功能，不占用额外侧栏空间或使用大块主按钮。
- [x] [CODEX-PLUGIN-DISPATCH-004] 窄屏全页详情中，当前对话与分发入口合并为紧凑操作区，不在底部形成两个松散大块。目标因宿主消息能力、Codex 桌面对话控制接口或会话接收状态不可发送时，在展开的分发区显示对应原因；不显示常驻不可用说明。

2026-10-10 已完成；TypeScript 检查、插件构建打包和差异空白检查通过，生成 `dist/myissue-0.1.12.zip`。本机仍安装 0.1.11，现有 Marketplace 指向 GitHub；原生 Codex 页面需安装新版并完全重启桌面应用后验收。

## 检查与验收边界

以上勾选与结果沿用迁移前的当前需求文档；历史记录中的实现、测试、编译、视觉与用户验收彼此独立。本次只迁移文档并检查结构 / 引用，没有重新执行产品构建或用户验收，也没有凭历史日志新增完成勾选。

## Comments


### 2026-10-24 07:06:34 UTC — Agent（纠正迁移命名）

根据用户确认的原语言与下划线命名规则整理本记录；类型与原 ID 保留在 properties，原始勾选、取消／延后标记及验收边界照录。 本源文档按独立目标拆为 5 份，原始 Comments 与共同说明见上方主记录链接。 未核实本任务实际实施提交，省略文件名版本后缀；未执行代码、构建或用户验收，未提交或推送。

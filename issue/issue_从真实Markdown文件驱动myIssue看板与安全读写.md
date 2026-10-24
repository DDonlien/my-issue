# 从真实Markdown文件驱动myIssue看板与安全读写

- ID：`CODEX-PLUGIN-003`。
- 类型：`DB`。
- 状态：已完成（仅沿用本任务原始勾选；本轮未重新执行产品验收）。
- 版本管理：Git。
- 实施提交：未核实（现有记录未提供可直接对应本任务的实际实施提交；来源快照、当前 HEAD 与文档迁移提交不代替任务实施版本）。
- 来源：`REQUIREMENTS.md` @ `7649f547f4ea8214825f55d0746338becf1aea33`；标题路径：任务清单 / Phase - Codex 插件首版（2026-10-01 确认）。
- 原稳定 ID：`CODEX-PLUGIN-001`, `CODEX-PLUGIN-002`, `CODEX-PLUGIN-003`, `CODEX-PLUGIN-004`, `CODEX-PLUGIN-005`, `CODEX-PLUGIN-006`, `CODEX-PLUGIN-007`, `CODEX-PLUGIN-008`, `CODEX-PLUGIN-009`；不改写或重编号这些既有 ID。
- 来源汇总状态：进行中（原文同时包含已完成与未完成项）。
- 原迁移记录 ID：`CODEX-PLUGIN-001`。
- 本文件原任务 ID：`CODEX-PLUGIN-003`、`CODEX-PLUGIN-004`、`CODEX-PLUGIN-006`、`CODEX-PLUGIN-007`、`CODEX-PLUGIN-008`。
- 原需求标题：Phase - Codex 插件首版（2026-10-01 确认）。
- 原迁移文件：`issue/issue-CODEX-PLUGIN-001-DB-project-goal-versioncontrolid.md`（重命名前路径，仅用于历史追溯）。
- 同源任务：[提供可安装的myIssue插件清单与分发包](issue_%E6%8F%90%E4%BE%9B%E5%8F%AF%E5%AE%89%E8%A3%85%E7%9A%84myIssue%E6%8F%92%E4%BB%B6%E6%B8%85%E5%8D%95%E4%B8%8E%E5%88%86%E5%8F%91%E5%8C%85.md)、[提供宿主独立侧栏与对话内myIssue入口](issue_%E6%8F%90%E4%BE%9B%E5%AE%BF%E4%B8%BB%E7%8B%AC%E7%AB%8B%E4%BE%A7%E6%A0%8F%E4%B8%8E%E5%AF%B9%E8%AF%9D%E5%86%85myIssue%E5%85%A5%E5%8F%A3.md)、[在myIssue与当前或新对话间传递Issue上下文](issue_%E5%9C%A8myIssue%E4%B8%8E%E5%BD%93%E5%89%8D%E6%88%96%E6%96%B0%E5%AF%B9%E8%AF%9D%E9%97%B4%E4%BC%A0%E9%80%92Issue%E4%B8%8A%E4%B8%8B%E6%96%87.md)。
- 共同约束与完整历史：[提供可安装的myIssue插件清单与分发包](issue_%E6%8F%90%E4%BE%9B%E5%8F%AF%E5%AE%89%E8%A3%85%E7%9A%84myIssue%E6%8F%92%E4%BB%B6%E6%B8%85%E5%8D%95%E4%B8%8E%E5%88%86%E5%8F%91%E5%8C%85.md)（共享说明与源 Comments 保留在该主记录）。

## 当前需求与范围
- [x] [CODEX-PLUGIN-003] 采用 Multica 风格状态列、卡片与详情面板，语义只围绕名称、自由属性、追加式评论；名称下自由 Markdown 内容兼容既有 Description。
- [x] [CODEX-PLUGIN-004] 创建、读取、修改名称与任意 YAML 属性、追加评论、搜索、筛选、看板/列表切换、拖动状态均操作真实文件。
- [x] [CODEX-PLUGIN-006] 项目根目录 `issues/*.md` 是稳定且唯一的事实来源；不引入 Issue 数据库。
- [x] [CODEX-PLUGIN-007] 通过项目级 `.myissue.json` 配置名称来源、属性字段映射、章节名和状态列；未知属性与未知状态必须保留。结构无法解析时只报告，不自动迁移或覆盖。
- [x] [CODEX-PLUGIN-008] 写入检查文件版本，插件进程之间串行写入并原子替换；保留既有评论与不相关正文。普通编辑器不参与锁协议，检测到外部修改即要求重新加载。

## 检查与验收边界

以上勾选与结果沿用迁移前的当前需求文档；历史记录中的实现、测试、编译、视觉与用户验收彼此独立。本次只迁移文档并检查结构 / 引用，没有重新执行产品构建或用户验收，也没有凭历史日志新增完成勾选。

## Comments


### 2026-10-24 07:06:34 UTC — Agent（纠正迁移命名）

根据用户确认的原语言与下划线命名规则整理本记录；类型与原 ID 保留在 properties，原始勾选、取消／延后标记及验收边界照录。 本源文档按独立目标拆为 4 份，原始 Comments 与共同说明见上方主记录链接。 未核实本任务实际实施提交，省略文件名版本后缀；未执行代码、构建或用户验收，未提交或推送。

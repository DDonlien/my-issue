# 让现有项目渐进采用myIssue并保留Git历史

- ID：`0.1.0-INTEGRATION-A-000`。
- 类型：`API`。
- 状态：待处理（原文未完成项保持未勾选）。
- 版本管理：Git。
- 实施提交：未核实（现有记录未提供可直接对应本任务的实际实施提交；来源快照、当前 HEAD 与文档迁移提交不代替任务实施版本）。
- 来源：`REQUIREMENTS.md` @ `f4834f13242293ffb522ee78c2de0669d6c08ead`；标题路径：任务清单 / Phase - v0.1.0 - Markdown Issue Protocol 与最小可用流程 / integration/main: 让现有项目逐步采用 myIssue。
- 原稳定 ID：`0.1.0-INTEGRATION-A-000`, `0.1.0-INTEGRATION-A-001`, `0.1.0-INTEGRATION-A-002`, `0.1.0-INTEGRATION-A-003`, `0.1.0-INTEGRATION-A-004`；不改写或重编号这些既有 ID。
- 原需求标题：integration/main: 让现有项目逐步采用 myIssue。
- 原迁移文件：`issue/issue-0.1.0-INTEGRATION-A-000-API-project-myissue-versioncontrolid.md`（重命名前路径，仅用于历史追溯）。

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

### 2026-10-24 07:06:34 UTC — Agent（纠正迁移命名）

根据用户确认的原语言与下划线命名规则整理本记录；类型与原 ID 保留在 properties，原始勾选、取消／延后标记及验收边界照录。 未核实本任务实际实施提交，省略文件名版本后缀；未执行代码、构建或用户验收，未提交或推送。

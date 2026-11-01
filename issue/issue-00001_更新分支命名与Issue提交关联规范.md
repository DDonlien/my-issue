---
uid: '00001'
type: DOC
status: done
importance: p0
emergency: p0
updated-time: '2026-10-28T07:01:01.413545+00:00'
created-time: '2026-10-28T06:53:46.532163+00:00'
start-time: '2026-10-28T06:53:46.532163+00:00'
closed-time: '2026-10-28T07:01:01.413545+00:00'
created-version: null
closed-version: null
estimated-workhour: null
actual-workhour: null
commit-related:
- 05fc81a99b84c61b4682c5acc01f70ca256b2027
- 12d73d82dd7d00ea217da2e5763c26efd703205c
- 61f6674d503b767d00d9bb98c788d157ef3d31cb
- cb3097af11fa2ee7c36526bbe8740a88abe998fe
- cf3088405cdcdc40feb85b788751683a96743f5c
- deb0e173e6ac2965da6c61f56466ecc4bd24af63
- efeb81beb20f5a0f08f43f934001479d02f997fc
tags:
- agent-template
- collaboration
---
# Description

在 my-issue/main 合并已有两端文档并应用最新版协作规范：仓库内五位字符串 UID、用户授权创建分支命名、单行 Issues trailer，以及 AI Comment 五维模型标识。

- README 保留本地看板布局执行记录与远端时间、父任务属性记录。
- 模板采用源15个默认属性，保留 Windows 已新增的 completed-time、parent 可选扩展和 start-time 空值；不将 completed-time 擅自改成 closed-time，不回填业务时间。
- AI Model-Detail 按厂牌、确切版本、规模/型号档位、推理级别与加速选择五维记录；不可核实项用 UNKNOWN，不以系列名、响应速度或服务优先级猜测。
- 用户已明确批准将既有 d928e73129a303e3ac8d3d931260ecf98bac5196 看板布局提交随 main 正常发布；本次不新增或改写业务代码，不将其旧提交归为本规范实现。

## 当前范围与状态

- [x] 核对唯一 README 冲突与全部暂存内容；两侧文档内容可兼容保留。
- [x] 同步协作规则、模板及本记录，保留历史字段与原有 Comments。
- [x] 完成现有 merge commit，普通推送既有 origin/main 并读回真实 SHA。

commit-related 目前保存同一仓库已存在的两个侧分支规范实现、记录和五维修订提交，仅用于跨分支追溯，不冒充 main 已提交或已推送。main 本次提交生成后再记录真实 hash；自身 hash 留待下一次实际 Issue 更新，避免递归提交。

# Comments

## 20261028-065346_Codex_GPT-UNKNOWN-UNKNOWN-UNKNOWN-UNKNOWN

> 05fc81a99b84c61b4682c5acc01f70ca256b2027, 12d73d82dd7d00ea217da2e5763c26efd703205c, 61f6674d503b767d00d9bb98c788d157ef3d31cb, cb3097af11fa2ee7c36526bbe8740a88abe998fe, cf3088405cdcdc40feb85b788751683a96743f5c, deb0e173e6ac2965da6c61f56466ecc4bd24af63

用户明确批准保留 README 双方内容解决冲突，并连同已存在的 d928e73 看板布局提交和规范更新正常发布。准备的合并只在文档中解决冲突、保留 completed-time 与 parent，并写入五维模型标识；未新增应用代码。当前仅可核实 Agent 为 Codex、厂牌为 GPT，确切版本、规模/型号、推理级别、用户是否选择加速均无可验证运行元信息，使用 UNKNOWN；不把格式示例当作实际型号。未做新的产品或视觉验收。

> [本次合并及规范修订的明确授权与执行对话](codex://threads/01a172bc-a59e-74ad-9553-ff4370c9a0f0)

## 20261028-070101_Codex_GPT-UNKNOWN-UNKNOWN-UNKNOWN-UNKNOWN

> efeb81beb20f5a0f08f43f934001479d02f997fc

main 已完成两父合并，README双方内容保留，源15个默认属性与completed-time、parent扩展合计17项保留；仓库UID、Issues trailer和AI五维模型规范已通过文本、YAML、引用及scoped diff检查。按用户明确批准，既有d928e73看板布局随合并发布；合并本身仅改5份Markdown，未新增应用代码。origin/main已读回上述完整SHA，最新规范已可从远端拉取。

当前仅可核实Codex/GPT家族；确切版本、规模、推理级别与用户加速选择仍不可按本次执行验证，四项为UNKNOWN。全局默认配置不作为本次或历史参数证据，priority不等同选择FAST。承载本条的记录提交自身SHA留待下一次实际更新补入。未新增产品或视觉验收。

> [本次合并与规范修订的明确授权及执行对话](codex://threads/01a172bc-a59e-74ad-9553-ff4370c9a0f0)

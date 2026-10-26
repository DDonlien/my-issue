---
id: issue-ccec8842-e096-4a84-9064-ea16534cb548
type: UI
status: in_review
created-time: 2026-10-26T11:33:44+08:00
updated-time: 2026-10-26T11:33:44+08:00
source: ../../issues/issue-ccec8842-e096-4a84-9064-ea16534cb548.md
---
# Description

MyIssue 看板的列背景应保持在可用看板区域内固定高度。卡片数量增加时，列背景不随卡片内容继续变高；超出可见区域的卡片由列内纵向滚动查看，不能溢出背景。

来源：[`issue-ccec8842-e096-4a84-9064-ea16534cb548`](../../issues/issue-ccec8842-e096-4a84-9064-ea16534cb548.md)。

![看板卡片溢出背景](attachment/看板卡片溢出背景.png)

- [x] 看板列和列背景填满工具栏以下的可用高度，不由卡片总高度撑开。
- [x] 列标题保持固定，卡片列表在列背景内纵向滚动。
- [x] 保留看板横向滚动和卡片拖动状态列的行为。
- [x] `npm run check` 与 `npm run build` 通过；构建已更新插件内嵌看板页面。
- [ ] 用户验收：确认卡片不会越出列背景，且可在列内滚动查看。

# Comments

## 20261026-113344_Codex_Unknown

按当前用户要求实现来源 MyIssue issue 的看板列高度与卡片滚动行为。`src/web/style.css` 让看板面板受可用高度约束、看板保留横向滚动、列采用纵向 flex 并裁切边界，标题固定，卡片列表独立纵向滚动；生成的 `plugins/myissue/assets/board.html` 已同步更新。`npm run check` 和 `npm run build` 通过；未运行测试或进行宿主界面的视觉验收，保留用户验收项。

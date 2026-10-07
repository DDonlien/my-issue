# 执行日志：隐藏横向与纵向滚动条

## 原始请求

Web 看板的浏览器评论：“不要显示滚动条，上下左右都是”。截图中的 Issue 名称及其他页面文本仅作为定位证据，不扩展为本次附件或属性实现需求。

## 决策与改动

- 先记录滚动条需求，使用独立 ID CODEX-PLUGIN-SCROLL-001 避免与并行功能编号冲突。所有页面元素使用 scrollbar-width:none 和 ::-webkit-scrollbar 隐藏滚动条，保留现有 overflow，允许继续访问超出区域的内容。
- 仅修改滚动条规则、对应需求、设计约束和本日志。工作区已有侧栏、附件、属性及其他功能的并行未提交修改；不覆盖或纳入本次提交。
- 重新构建当前页面，重启本对话此前启动的 4310 预览进程，保持原项目根目录和服务日志。构建产物包含工作区已有功能，不单独作为本次提交的产物。

## 验证

- 当前页面构建成功，实际 Web 页面刷新后显示正常，未修改 Issue 文件。
- 看板 overflowX/overflowY 仍为 auto。实际向右滚动后 scrollLeft 从 0 到 880，随后返回起点。
- html、body、sidebar、board 的计算样式均为 scrollbar-width:none，::-webkit-scrollbar 的 display 为 none。当前看板只有一个 Issue，没有制造用户数据以增加纵向溢出；纵向隐藏由相同全局规则覆盖，未另建自动测试。
- 截图：_builds/verification/hidden-scrollbars-20261007.png。当前验证仅针对 Web 页面，未重装或验收原生插件。
- 预览继续运行：http://127.0.0.1:4310/。

## Git

- 仅选择本次 CSS 和需求行、DESIGN.md 与本日志；其余已有修改保留在工作区。
- 实现提交 84cff86 已推送 origin/main，返回 cdd0036..84cff86。交付记录随后以文档提交保存。

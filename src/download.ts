import type { App } from '@modelcontextprotocol/ext-apps';

export async function downloadAttachment(app: Pick<App, 'getHostCapabilities' | 'downloadFile'>, file: { name: string; mimeType: string; data: string }) {
  if (!app.getHostCapabilities()?.downloadFile) throw new Error('当前宿主不支持附件下载，文件保存在项目的 issues/attachments 文件夹中');
  const result = await app.downloadFile({ contents: [{ type: 'resource', resource: { uri: `file:///${encodeURIComponent(file.name)}`, mimeType: file.mimeType, blob: file.data } }] });
  if (result.isError) throw new Error('附件下载被取消或拒绝');
}

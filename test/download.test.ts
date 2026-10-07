import test from 'node:test';
import assert from 'node:assert/strict';
import { App } from '@modelcontextprotocol/ext-apps';
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { downloadAttachment } from '../src/download.js';

test('attachment downloads use the real SDK host protocol with original bytes and filename; cancellation stays failure', async t => {
  const app = new App({ name: 'myIssue', version: 'test' }, {}, { autoResize: false });
  const host = new AppBridge(null, { name: 'download-host', version: 'test' }, { downloadFile: {} });
  let received: unknown; let denied = false;
  host.ondownloadfile = async params => { received = params; return { isError: denied }; };
  const [appTransport, hostTransport] = InMemoryTransport.createLinkedPair();
  await host.connect(hostTransport); await app.connect(appTransport);
  t.after(async () => { await appTransport.close(); await hostTransport.close(); });
  const file = { name: '说明 [最终].txt', mimeType: 'application/octet-stream', data: Buffer.from('download content').toString('base64') };
  await downloadAttachment(app, file);
  assert.deepEqual(received, { contents: [{ type: 'resource', resource: { uri: `file:///${encodeURIComponent(file.name)}`, mimeType: file.mimeType, blob: file.data } }] });
  denied = true;
  await assert.rejects(downloadAttachment(app, file), /取消或拒绝/);
});

test('hosts without file downloads return an actionable limitation before making an unsupported request', async t => {
  const app = new App({ name: 'myIssue', version: 'test' }, {}, { autoResize: false });
  const host = new AppBridge(null, { name: 'no-download-host', version: 'test' }, {});
  const [appTransport, hostTransport] = InMemoryTransport.createLinkedPair();
  await host.connect(hostTransport); await app.connect(appTransport);
  t.after(async () => { await appTransport.close(); await hostTransport.close(); });
  await assert.rejects(downloadAttachment(app, { name: 'file.txt', mimeType: 'application/octet-stream', data: '' }), /宿主不支持附件下载/);
});

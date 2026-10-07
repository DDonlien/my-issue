import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('built stdio plugin accepts verified conversation links and exposes them in live board results', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'myissue-conversation-mcp-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const client = new Client({ name: 'conversation-acceptance', version: '1' });
  const transport = new StdioClientTransport({ command: process.execPath, args: [path.resolve('plugins/myissue/scripts/server.cjs')], env: { ...Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string')), MYISSUE_CONFIG_DIR: path.join(root, '.config'), MYISSUE_CODEX_BIN: path.join(root, 'missing-codex') } });
  await client.connect(transport); t.after(() => client.close());
  const catalog = await client.listTools();
  assert.equal(catalog.tools.find(tool => tool.name === 'link_conversation')?.annotations?.readOnlyHint, false);
  const invoke = async (name: string, args: Record<string, unknown>) => {
    const response = await client.callTool({ name, arguments: args });
    assert.ok(!response.isError, JSON.stringify(response.structuredContent));
    return response.structuredContent as any;
  };
  const { issue } = await invoke('create_issue', { root, name: '实际工具关联', properties: { status: 'todo' } });
  const url = 'codex://threads/verified-thread';
  const linked = await invoke('link_conversation', { root, id: issue.id, revision: issue.revision, url, title: '已确认的对话' });
  assert.deepEqual(linked.issue.properties.conversations, [{ url, title: '已确认的对话' }]);
  assert.deepEqual((await invoke('list_issues', { root })).board.issues[0].properties.conversations, linked.issue.properties.conversations);
  const stale = await client.callTool({ name: 'link_conversation', arguments: { root, id: issue.id, revision: issue.revision, url } });
  assert.equal(stale.isError, true);
  assert.equal((stale.structuredContent as any).error.code, 'CONFLICT');
});

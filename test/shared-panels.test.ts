import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

test('separate MCP processes share additions and restore the last project across restart and plugin data directories', async t => {
  const base = await mkdtemp(path.join(os.tmpdir(), 'myissue-panels-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const config = path.join(base, 'shared');
  const alpha = path.join(base, 'Alpha'), beta = path.join(base, 'Beta'), legacy = path.join(base, 'Legacy');
  await Promise.all([alpha, beta, legacy].map(root => mkdir(root)));
  const inherited = Object.fromEntries(Object.entries(process.env).filter((entry): entry is [string, string] => typeof entry[1] === 'string'));
  delete inherited.MYISSUE_ROOT;
  async function panel(name: string, initialRoot?: string) {
    const client = new Client({ name, version: '1' });
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [path.resolve('plugins/myissue/scripts/server.cjs'), ...(initialRoot ? ['--root', initialRoot] : [])],
      env: { ...inherited, MYISSUE_CONFIG_DIR: config, PLUGIN_DATA: path.join(base, name), MYISSUE_CODEX_BIN: path.join(base, 'unavailable-cli') },
    });
    await client.connect(transport);
    t.after(() => client.close());
    const invoke = async (name: string, args: Record<string, unknown> = {}) => {
      const response = await client.callTool({ name, arguments: args });
      assert.equal(response.isError, undefined, JSON.stringify(response.structuredContent));
      return response.structuredContent as any;
    };
    return { client, invoke };
  }
  const a = await panel('conversation-a');
  const b = await panel('conversation-b');
  assert.equal((await b.invoke('open_board')).board, undefined);
  await Promise.all([a.invoke('open_board', { root: alpha }), b.invoke('open_board', { root: beta })]);
  for (const session of [a, b]) {
    const data = await session.invoke('list_projects');
    assert.deepEqual(data.projects.map((project: any) => project.root), [alpha, beta]);
  }
  await b.invoke('open_board', { root: beta });
  // A still reads Alpha; periodic refresh must not steal B's last selection.
  await a.invoke('list_issues', { root: alpha });
  await a.client.close(); await b.client.close();
  await mkdir(path.join(base, 'new-plugin-version'));
  await writeFile(path.join(base, 'new-plugin-version', 'projects.json'), JSON.stringify([legacy]));
  const restarted = await panel('new-plugin-version');
  const opened = await restarted.invoke('open_board');
  assert.equal(opened.board.root, beta);
  assert.deepEqual(opened.projects.map((project: any) => project.root).sort(), [alpha, beta, legacy]);
  assert.equal(JSON.parse(await readFile(path.join(config, 'projects.json'), 'utf8')).lastRoot, beta);
  await restarted.invoke('open_board', { root: alpha });
  assert.equal(JSON.parse(await readFile(path.join(config, 'projects.json'), 'utf8')).lastRoot, alpha);
  const explicit = await panel('explicit-root', beta);
  assert.equal((await explicit.invoke('open_board')).board.root, beta);
  await rm(beta, { recursive: true });
  const afterRemoval = await panel('after-removal');
  const noSelection = await afterRemoval.invoke('open_board');
  assert.equal(noSelection.board, undefined);
  assert.deepEqual(noSelection.projects.map((project: any) => project.root).sort(), [alpha, legacy]);
});

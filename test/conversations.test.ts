import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { App } from '@modelcontextprotocol/ext-apps';
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { IssueStore } from '../src/core.js';
import { execute } from '../src/service.js';
import { conversationLinks, conversationUrl, currentConversation } from '../src/conversation-links.js';
import { openConversation } from '../src/conversation-navigation.js';
import { ConversationLinks } from '../src/web/conversations.js';

const url = 'codex://threads/01a0f765-35d5-7b50-9d69-3b15d5a47eb2';
async function fixture(t: test.TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'myissue-conversations-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  await mkdir(path.join(root, 'issues'));
  const raw = '---\nstatus: todo # untouched\ncustom: "keep quotes"\n---\n\n# Work\n\n## Description\n\n自由 Markdown\n\n## Comments\n\n### Old comment\n\nKeep **all bytes**.\n';
  await writeFile(path.join(root, 'issues/work.md'), raw);
  const store = new IssueStore(root);
  return { root, store, raw, issue: await store.get('work') };
}

test('linking a verified conversation persists ordinary properties and preserves original content/comments', async t => {
  const { root, raw, issue } = await fixture(t);
  const linked = await execute('link_conversation', { root, id: issue.id, revision: issue.revision, url, title: '开发 myIssue Codex 插件' });
  assert.deepEqual(currentConversation(linked.issue.properties), { url, title: '开发 myIssue Codex 插件' });
  assert.ok(linked.issue.raw.includes('status: todo # untouched\ncustom: "keep quotes"'));
  assert.equal(linked.issue.raw.slice(linked.issue.raw.indexOf('# Work')), raw.slice(raw.indexOf('# Work')));
  assert.equal(await readFile(path.join(root, 'issues/work.md'), 'utf8'), linked.issue.raw);
  assert.equal(linked.issue.status, 'todo');
  const again = await execute('link_conversation', { root, id: issue.id, revision: linked.issue.revision, url, title: '新的实际标题' });
  assert.deepEqual(again.issue.properties.current_conversation, { url, title: '新的实际标题' });
});

test('stale/competing association writes cannot overwrite a newer file', async t => {
  const { root, store, issue } = await fixture(t);
  const results = await Promise.allSettled([
    execute('link_conversation', { root, id: issue.id, revision: issue.revision, url, title: 'First' }),
    execute('link_conversation', { root, id: issue.id, revision: issue.revision, url: 'https://chatgpt.com/c/actual-chat', title: 'Second' }),
  ]);
  assert.equal(results.filter(result => result.status === 'fulfilled').length, 1);
  assert.equal((await store.get(issue.id)).comments[0].body, 'Keep **all bytes**.');
  const failed = results.find(result => result.status === 'rejected') as PromiseRejectedResult;
  assert.equal(failed.reason.code, 'CONFLICT');
});

test('unknown entries and metadata survive association updates; malformed existing property is not overwritten', async t => {
  const { root, store, issue } = await fixture(t);
  const legacy = [{ url, title: 'Legacy', future: { keep: true } }, { futureSchema: 2 }];
  const existing = await store.update(issue.id, issue.revision, { properties: { conversations: legacy, current_conversation: { url, title: 'Original', future: { keep: true } } } });
  const linked = await execute('link_conversation', { root, id: issue.id, revision: existing.revision, url, title: 'New' });
  assert.deepEqual(linked.issue.properties.conversations, legacy);
  assert.deepEqual(linked.issue.properties.current_conversation, { url, title: 'New', future: { keep: true } });
  const incompatible = await store.update(issue.id, linked.issue.revision, { properties: { current_conversation: ['unrecognized schema'] } });
  await assert.rejects(execute('link_conversation', { root, id: issue.id, revision: incompatible.revision, url }), { code: 'INVALID_CONVERSATIONS' });
  assert.equal((await store.get(issue.id)).raw, incompatible.raw);
});

test('link derivation handles old files, duplicate URLs and invalid targets without interpreting anonymous sessions', () => {
  assert.deepEqual(conversationLinks({ status: 'todo', session: 'anonymous-id' }), []);
  for (const invalid of ['javascript:alert(1)', 'data:text/html,test', 'file:///tmp/test', 'codex://review', 'codex://threads/', 'https://user:password@chatgpt.com/c/id']) assert.equal(conversationUrl(invalid), undefined);
  const links = conversationLinks({ conversations: [null, 'legacy', { url: 'javascript:alert(1)' }, { url, title: 'Valid' }, { url, title: 'Duplicate' }, { url: 'https://example.com/chat/2' }] });
  assert.deepEqual(links, [{ url, title: 'Valid' }, { url: 'https://example.com/chat/2', title: '对话' }]);
  assert.equal(currentConversation({ conversations: links }), undefined);
  assert.deepEqual(currentConversation({ conversations: links.slice(0, 1) }), links[0]);
  assert.equal(currentConversation({ current_conversation: null, conversations: links.slice(0, 1) }), undefined);
});

test('custom schema mappings cannot be overwritten by an optional conversation property', async t => {
  const { root, store, issue } = await fixture(t);
  for (const config of [{ statusKey: 'current_conversation' }, { parentKey: 'current_conversation' }, { dependenciesKey: 'current_conversation' }, { name: { source: 'property', key: 'current_conversation' } }]) {
    await writeFile(path.join(root, '.myissue.json'), JSON.stringify(config));
    const before = await readFile(path.join(root, 'issues/work.md'), 'utf8');
    await assert.rejects(execute('link_conversation', { root, id: issue.id, revision: issue.revision, url }));
    assert.equal(await readFile(path.join(root, 'issues/work.md'), 'utf8'), before);
  }
});

test('compact links show only the explicit current conversation and escape titles', () => {
  const properties = { conversations: [{ url, title: 'Older' }], current_conversation: { url: 'https://chatgpt.com/c/actual', title: '<script>long name</script>' } };
  const html = renderToStaticMarkup(React.createElement(ConversationLinks, { compact: true, properties }));
  assert.match(html, /class="card-conversations"/);
  assert.match(html, /href="https:\/\/chatgpt.com\/c\/actual"/);
  assert.match(html, /&lt;script&gt;long name&lt;\/script&gt;/);
  assert.doesNotMatch(html, /查看其余|Older|codex:\/\/threads\//);
  assert.doesNotMatch(html, /<script>|<button/);
});

test('actual SDK navigation uses the saved target and surfaces host rejection', async t => {
  const app = new App({ name: 'myissue', version: 'test' }, {}, { autoResize: false });
  const host = new AppBridge(null, { name: 'test-host', version: '1' }, { openLinks: {} });
  const [appTransport, hostTransport] = InMemoryTransport.createLinkedPair();
  await host.connect(hostTransport); await app.connect(appTransport);
  t.after(async () => { await appTransport.close(); await hostTransport.close(); });
  const received: string[] = [];
  let reject = false;
  host.onopenlink = async params => { received.push(params.url); return { isError: reject }; };
  await openConversation(app, url);
  assert.deepEqual(received, [url]);
  reject = true;
  await assert.rejects(openConversation(app, url), /未能打开/);
  await assert.rejects(openConversation(app, 'javascript:alert(1)'), /无效/);
  assert.equal(received.length, 2);
});

test('dispatch preparation requests verified association without changing issue facts', async t => {
  const { root, store, issue } = await fixture(t);
  const prepared = await execute('prepare_dispatch', { root, id: issue.id });
  assert.match(prepared.prompt, /link_conversation/);
  assert.match(prepared.prompt, /没有真实地址时跳过/);
  assert.equal((await store.get(issue.id)).raw, issue.raw);
});

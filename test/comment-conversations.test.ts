import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { IssueStore, appendComment, defaultSchema, parseIssue } from '../src/core.js';
import { execute } from '../src/service.js';
import { commentConversation, commentModel, currentConversation } from '../src/conversation-links.js';
import { CommentMetadata } from '../src/web/comments.js';

const first = { url: 'codex://threads/source-a', title: '第一条来源' };
const second = { url: 'codex://threads/source-b', title: '第二条来源' };
async function fixture(t: test.TestContext) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'myissue-comment-sources-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const store = new IssueStore(root);
  const issue = await store.create('独立的来源', { status: 'in_progress', custom: { keep: true } }, '描述不解释');
  return { root, store, issue };
}

test('switching execution conversations never changes per-comment sources or models', async t => {
  const { root, issue } = await fixture(t);
  let latest = (await execute('link_conversation', { root, id: issue.id, revision: issue.revision, ...first })).issue;
  latest = (await execute('append_comment', { root, id: issue.id, revision: latest.revision, author: 'Codex', actor: 'gpt-6-sol', body: '第一条进展', conversation: first })).issue;
  latest = (await execute('append_comment', { root, id: issue.id, revision: latest.revision, author: 'Codex', actor: 'gpt-6-luna', body: '第二条进展', conversation: second })).issue;
  const saved = latest;
  latest = (await execute('link_conversation', { root, id: issue.id, revision: latest.revision, ...second })).issue;
  assert.deepEqual(currentConversation(latest.properties), second);
  assert.deepEqual(commentConversation(latest.properties, latest.comments[0].id), first);
  assert.deepEqual(commentConversation(latest.properties, latest.comments[1].id), second);
  assert.deepEqual(latest.comments, saved.comments);
  latest = (await execute('append_comment', { root, id: issue.id, revision: latest.revision, author: 'Codex', actor: 'gpt-6.1-sol', body: '地址不可获得，不继承当前对话' })).issue;
  assert.equal(commentConversation(latest.properties, latest.comments[2].id), undefined);
});

test('legacy comment associations leave every Markdown byte unchanged and preserve unknown metadata', async t => {
  const { root, store, issue } = await fixture(t);
  let latest = await store.comment(issue.id, issue.revision, '旧正文', 'Codex', 'gpt-6-sol');
  const commentId = latest.comments[0].id;
  latest = await store.update(issue.id, latest.revision, { properties: { comment_conversations: { [commentId]: { ...first, future: { keep: true } }, futureKey: 'untouched' } } });
  const originalMarkdown = latest.raw.slice(latest.raw.indexOf('# 独立的来源'));
  const linked = (await execute('link_comment_conversation', { root, id: issue.id, revision: latest.revision, commentId, ...second })).issue;
  assert.equal(linked.raw.slice(linked.raw.indexOf('# 独立的来源')), originalMarkdown);
  assert.deepEqual(linked.properties.comment_conversations, { [commentId]: { ...second, future: { keep: true } }, futureKey: 'untouched' });
  assert.equal(currentConversation(linked.properties), undefined);
  const stale = execute('link_comment_conversation', { root, id: issue.id, revision: latest.revision, commentId, ...first });
  await assert.rejects(stale, { code: 'CONFLICT' });
  const missing = execute('link_comment_conversation', { root, id: issue.id, revision: linked.revision, commentId: 'comment-' + '0'.repeat(64), ...first });
  await assert.rejects(missing, { code: 'COMMENT_NOT_FOUND' });
  assert.equal((await store.get(issue.id)).raw, linked.raw);
});

test('comment identity survives property/title/description changes, CRLF and repeated comments', async t => {
  const { store, issue } = await fixture(t);
  const text = appendComment(issue.raw, defaultSchema, '正文\n下一行', 'Codex', 'gpt-6-sol', '2026-10-10T08:00:00Z');
  const twice = appendComment(text, defaultSchema, '正文\n下一行', 'Codex', 'gpt-6-sol', '2026-10-10T08:00:00Z');
  const parsed = parseIssue(twice, 'original.md');
  assert.notEqual(parsed.comments[0].id, parsed.comments[1].id);
  assert.equal(parsed.comments[1].id, parsed.comments[0].id + '-2');
  assert.deepEqual(parseIssue(twice.replace(/\n/g, '\r\n'), 'renamed.md').comments.map(c => c.id), parsed.comments.map(c => c.id));
  const original = await store.comment(issue.id, issue.revision, '稳定的历史', 'Codex', 'gpt-6-sol');
  const updated = await store.update(issue.id, original.revision, { name: '新名称', description: '新描述', properties: { status: 'in_review' } });
  assert.deepEqual(updated.comments, original.comments);
});

test('an invalid source, schema collision or malformed association aborts the entire append', async t => {
  const { root, store, issue } = await fixture(t);
  const input = { root, id: issue.id, author: 'Codex', actor: 'gpt-6.1-sol', body: '不能留下半条记录', conversation: first };
  await assert.rejects(execute('append_comment', { ...input, revision: issue.revision, conversation: { url: 'javascript:alert(1)' } }));
  assert.equal((await store.get(issue.id)).raw, issue.raw);
  const malformed = await store.update(issue.id, issue.revision, { properties: { comment_conversations: [] } });
  await assert.rejects(execute('append_comment', { ...input, revision: malformed.revision }), { code: 'INVALID_CONVERSATIONS' });
  assert.equal((await store.get(issue.id)).raw, malformed.raw);
  await writeFile(path.join(root, '.myissue.json'), JSON.stringify({ parentKey: 'comment_conversations' }));
  await assert.rejects(execute('append_comment', { ...input, revision: malformed.revision }), { code: 'INVALID_CONVERSATIONS' });
  assert.equal((await store.get(issue.id)).raw, malformed.raw);
});

test('new comments require precise gpt-6 model variants while historical family labels remain readable', async t => {
  const { root, store, issue } = await fixture(t);
  for (const actor of ['gpt-6', 'gpt-6.1', ' GPT-6 ']) {
    await assert.rejects(execute('append_comment', { root, id: issue.id, revision: issue.revision, author: 'Codex', actor, body: '无版本不能写入' }), { code: 'INVALID_MODEL' });
    assert.equal((await store.get(issue.id)).raw, issue.raw);
  }
  const old = parseIssue(issue.raw + '\n### 2026-10-01T10:00:00Z · Codex · gpt-6\n\n保留旧记录\n', issue.filename);
  assert.match(old.comments[0].heading, /gpt-6$/);
  const unknown = (await execute('append_comment', { root, id: issue.id, revision: issue.revision, author: 'Codex', actor: 'unknown', body: '宿主未提供具体模型身份' })).issue;
  assert.match(unknown.comments[0].heading, /unknown$/);
});

test('rendered AI comments show exact models and their own escaped links; human comments have no model tag', async t => {
  const { root, issue } = await fixture(t);
  let latest = (await execute('append_comment', { root, id: issue.id, revision: issue.revision, author: 'Codex', actor: 'gpt-6.1-sol', body: 'AI 结果', conversation: { ...first, title: '<script>来源</script>' } })).issue;
  latest = (await execute('append_comment', { root, id: issue.id, revision: latest.revision, author: 'taobe', actor: 'human', body: '用户反馈' })).issue;
  const html = latest.comments.map(comment => renderToStaticMarkup(React.createElement(CommentMetadata, { comment, properties: { ...latest.properties, current_conversation: second }, disabled: false, onEditing() {}, onLink: async () => true }))).join('');
  assert.match(html, /gpt-6\.1-sol/);
  assert.match(html, /打开评论对话：&lt;script&gt;来源&lt;\/script&gt;/);
  assert.match(html, /href="codex:\/\/threads\/source-a"/);
  assert.doesNotMatch(html, /source-b|>human<|<script>/);
  assert.equal((html.match(/更换评论对话/g) ?? []).length, 1);
});

test('verified historical model corrections update display without rewriting the original heading', async t => {
  const { root, store, issue } = await fixture(t);
  const raw = issue.raw + '\n### 2026-10-07T15:30:11.517Z · Codex · gpt-6\n\n保留历史评论\n';
  await writeFile(path.join(root, 'issues', issue.filename), raw);
  const original = await store.get(issue.id);
  const comment = original.comments[0];
  const linked = (await execute('link_comment_conversation', { root, id: issue.id, revision: original.revision, commentId: comment.id, ...first, model: 'gpt-6.1-sol' })).issue;
  assert.deepEqual(linked.comments, original.comments);
  assert.equal(commentModel(linked.properties, comment.id, 'gpt-6'), 'gpt-6.1-sol');
  const html = renderToStaticMarkup(React.createElement(CommentMetadata, { comment, properties: linked.properties, disabled: false, onEditing() {}, onLink: async () => true }));
  assert.match(html, />gpt-6\.1-sol</);
  assert.doesNotMatch(html, />gpt-6</);
  const changedSource = (await execute('link_comment_conversation', { root, id: issue.id, revision: linked.revision, commentId: comment.id, ...second })).issue;
  assert.equal(commentModel(changedSource.properties, comment.id, 'gpt-6'), 'gpt-6');
  await assert.rejects(execute('link_comment_conversation', { root, id: issue.id, revision: changedSource.revision, commentId: comment.id, ...first, model: 'gpt-6.1' }), { code: 'INVALID_MODEL' });
});

test('comment linking cannot replace an already precise model or relabel human comments', async t => {
  const { root, store, issue } = await fixture(t);
  let latest = await store.comment(issue.id, issue.revision, '精确版本', 'Codex', 'gpt-6-sol');
  const ai = latest.comments[0];
  latest = await store.comment(issue.id, latest.revision, '用户记录', 'taobe', 'human');
  for (const [commentId, model] of [[ai.id, 'gpt-6-luna'], [latest.comments[1].id, 'gpt-6.1-sol']]) {
    await assert.rejects(execute('link_comment_conversation', { root, id: issue.id, revision: latest.revision, commentId, ...first, model }), { code: 'INVALID_MODEL' });
    assert.equal((await store.get(issue.id)).raw, latest.raw);
  }
  assert.equal(commentModel({ comment_conversations: { [ai.id]: { ...first, model: 'gpt-6-luna' } } }, ai.id, 'gpt-6-sol'), 'gpt-6-sol');
});

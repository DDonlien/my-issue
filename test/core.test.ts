import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { IssueStore, appendComment, defaultSchema, parseIssue, updateIssue } from '../src/core.js';

const source = `---\n# untouched header\nstatus: todo # original status\ncustom: "keep quotes" # keep comment\nnested:\n  key: value\n---\n\n# Original name\n\n## Description\n\nFree **Markdown**.\n\n\`\`\`markdown\n## Comments\n# not a name\n\`\`\`\n\n## Comments\n\n### 2026-09-02 11:04 · taobe · human\n\nOriginal comment **unaltered**.\n`;
async function temp(t: test.TestContext) { const root = await mkdtemp(path.join(os.tmpdir(), 'myissue-test-')); t.after(() => rm(root, { recursive: true, force: true })); return root; }
test('parse ignores headings in code fences and retains arbitrary properties', () => {
  const issue = parseIssue(source, 'issue-001.md');
  assert.equal(issue.name, 'Original name'); assert.equal(issue.comments.length, 1);
  assert.deepEqual(issue.properties.nested, { key: 'value' }); assert.match(issue.description, /# not a name/);
});
test('selected property patches leave unrelated YAML, Markdown and comment bytes unchanged', () => {
  const changed = updateIssue(source, defaultSchema, { properties: { status: 'done', future: { flag: true } } });
  assert.equal(parseIssue(changed, 'a.md').status, 'done');
  assert.ok(changed.includes('custom: "keep quotes" # keep comment\nnested:\n  key: value\n'));
  assert.equal(changed.slice(changed.indexOf('# Original name')), source.slice(source.indexOf('# Original name')));
});
test('flow-style frontmatter refuses a destructive patch and free Markdown headings remain content', () => {
  const flow = '---\n{status: todo, future: keep}\n---\n# Name\n';
  assert.throws(() => updateIssue(flow, defaultSchema, { properties: { status: 'done' } }), { code: 'UNSUPPORTED_FORMAT' });
  const changed = updateIssue(source, defaultSchema, { description: '# Free heading\n\n## Arbitrary business heading\n\nKeep content free.' });
  assert.equal(parseIssue(changed, 'a.md').name, 'Original name');
  assert.ok(parseIssue(changed, 'a.md').description.includes('# Free heading'));
});
test('null, inline and block YAML values patch without deleting adjacent pairs', () => {
  const raw = `---\nstatus:\nother: yes\nblock: |\n  line one\n  line two\nlast: 3\n---\n# Name\n`;
  const changed = updateIssue(raw, defaultSchema, { properties: { status: 'todo', block: 'replacement' }, removeProperties: ['last'] });
  assert.deepEqual(parseIssue(changed, 'a.md').properties, { status: 'todo', other: 'yes', block: 'replacement' });
});
test('name/content changes preserve all existing comments, CRLF and unknown properties', () => {
  const raw = source.replace(/\n/g, '\r\n');
  const changed = updateIssue(raw, defaultSchema, { name: 'Renamed', description: 'New free content.' });
  assert.equal(changed.slice(changed.lastIndexOf('## Comments')), raw.slice(raw.lastIndexOf('## Comments')));
  assert.equal(changed.includes('\n') && !/(?<!\r)\n/.test(changed), true);
  assert.equal(parseIssue(changed, 'a.md').name, 'Renamed');
});
test('comments only append and do not interpret fenced headings as new comments', () => {
  const changed = appendComment(source, defaultSchema, 'Hello\n\n```\n### inside code\n```', 'taobe', 'human', '2026-10-01T12:00:00Z');
  assert.ok(changed.startsWith(source)); assert.equal(parseIssue(changed, 'a.md').comments.length, 2);
  assert.throws(() => appendComment(source, defaultSchema, '## Comments', 'taobe', 'human'));
});
test('store CRUD writes real files and rejects stale revisions and unsafe paths', async t => {
  const root = await temp(t); const store = new IssueStore(root);
  const issue = await store.create('真实 Issue', { status: 'todo', custom: ['one', 'two'] }, 'Free content');
  const changed = await store.update(issue.id, issue.revision, { name: '更新名称', properties: { status: 'done' } });
  await assert.rejects(store.update(issue.id, issue.revision, { name: 'Overwrite' }), { code: 'CONFLICT' });
  const commented = await store.comment(issue.id, changed.revision, '人工验收记录', 'taobe', 'human');
  assert.equal(commented.comments.length, 1); assert.equal(commented.name, '更新名称');
  assert.equal(await readFile(path.join(root, 'issues', issue.filename), 'utf8'), commented.raw);
  await assert.rejects(store.get('../README'), { code: 'UNSAFE_PATH' });
});
test('simultaneous writers with the same revision cannot both overwrite', async t => {
  const root = await temp(t); const first = new IssueStore(root); const second = new IssueStore(root);
  const issue = await first.create('Concurrent');
  const results = await Promise.allSettled([first.comment(issue.id, issue.revision, 'A', 'alice', 'human'), second.comment(issue.id, issue.revision, 'B', 'bob', 'human')]);
  assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal((await first.get(issue.id)).comments.length, 1);
});
test('schema mappings support property names, renamed sections and unknown states without migrations', async t => {
  const root = await temp(t);
  await writeFile(path.join(root, '.myissue.json'), JSON.stringify({ name: { source: 'property', key: 'title' }, commentsHeading: '讨论', descriptionHeading: '内容', statusKey: 'state', columns: [{ value: 'queue', label: '排队', color: '#123456' }] }));
  const store = new IssueStore(root); const issue = await store.create('Property title', { state: 'custom-state', preserved: 'yes' });
  const updated = await store.update(issue.id, issue.revision, { name: 'Changed title' });
  assert.equal(updated.properties.title, 'Changed title'); assert.ok(updated.raw.includes('## 讨论'));
  const board = await store.board(); assert.ok(board.columns.some(c => c.value === 'custom-state'));
  await writeFile(path.join(root, '.myissue.json'), '{bad schema');
  await assert.rejects(store.board(), { code: 'INVALID_SCHEMA' });
});
test('board derives hierarchy, dependencies, ready and diagnoses invalid files/cycles', async t => {
  const root = await temp(t); await mkdir(path.join(root, 'issues'));
  const file = (name: string, props: string) => writeFile(path.join(root, 'issues', name + '.md'), `---\n${props}\n---\n# ${name}\n`);
  await file('issue-001', 'status: done'); await file('issue-002', 'status: todo\nparent: "[[issue-001]]"\ndepends_on: ["[[issue-001]]"]');
  await writeFile(path.join(root, 'issues/broken.md'), '---\nbad: [\n---\n# Broken');
  let board = await new IssueStore(root).board();
  assert.equal(board.issues.find(i => i.id === 'issue-002')?.ready, true);
  assert.deepEqual(board.issues.find(i => i.id === 'issue-001')?.children, ['issue-002']); assert.equal(board.errors.length, 1);
  await file('issue-001', 'status: todo\nparent: "[[issue-002]]"');
  board = await new IssueStore(root).board(); assert.ok(board.errors.some(e => e.message.includes('循环')));
});
test('symbolic links cannot write issues outside a selected project', async t => {
  const root = await temp(t); const outside = await temp(t);
  await symlink(outside, path.join(root, 'issues'));
  await assert.rejects(new IssueStore(root).create('Unsafe'), { code: 'UNSAFE_PATH' });
});

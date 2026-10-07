import test from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { IssueStore } from '../src/core.js';
import { uploadAttachment, readAttachment } from '../src/attachments.js';
import { attachmentReferences, localAttachmentPath, MAX_ATTACHMENT_BYTES } from '../src/attachment-links.js';

const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+j8WQAAAAASUVORK5CYII=';
async function fixture(t: { after: (fn: () => Promise<unknown>) => void }) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'myissue-attachments-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const store = new IssueStore(root);
  const created = await store.create('附件 Issue', { status: 'todo', unknown: { nested: ['保留', true, null] } }, '原始内容');
  const issue = await store.comment(created.id, created.revision, '既有评论，保持原文。', 'tester', 'human');
  return { root, store, issue };
}

test('upload persists portable Markdown and bytes while preserving properties and the existing comment suffix', async t => {
  const { store, issue } = await fixture(t);
  const uploaded = await uploadAttachment(store, issue.id, issue.revision, '截图 [最终].png', png);
  assert.deepEqual(uploaded.issue.properties, issue.properties);
  assert.equal(uploaded.issue.raw.slice(uploaded.issue.raw.indexOf('## Comments')), issue.raw.slice(issue.raw.indexOf('## Comments')));
  assert.ok(uploaded.issue.description.startsWith('原始内容\n\n!['));
  const refs = attachmentReferences(uploaded.issue.description);
  assert.equal(refs.length, 1);
  assert.equal(refs[0].label, '截图 [最终].png');
  assert.equal(uploaded.attachment.mimeType, 'image/png');
  const read = await readAttachment(store, issue.id, refs[0].href);
  assert.equal(read.data, png); assert.equal(read.mimeType, 'image/png');
  assert.equal(read.size, Buffer.from(png, 'base64').length);
});

test('competing uploads leave only the successful referenced file; stale uploads preserve the issue', async t => {
  const { root, store, issue } = await fixture(t);
  const outcomes = await Promise.allSettled(['one.txt', 'two.txt'].map(name => uploadAttachment(store, issue.id, issue.revision, name, Buffer.from(name).toString('base64'))));
  assert.equal(outcomes.filter(outcome => outcome.status === 'fulfilled').length, 1);
  assert.equal((outcomes.find(outcome => outcome.status === 'rejected') as PromiseRejectedResult).reason.code, 'CONFLICT');
  assert.equal((await fs.readdir(path.join(root, 'issues/attachments'))).length, 1);
  const latest = await store.get(issue.id);
  await assert.rejects(uploadAttachment(store, issue.id, issue.revision, 'stale.txt', ''), { code: 'CONFLICT' });
  assert.equal((await store.get(issue.id)).raw, latest.raw);
});

test('attachment reads reject traversal, unreferenced files, fenced examples and symbolic links', async t => {
  const { root, store, issue } = await fixture(t);
  const directory = path.join(root, 'issues/attachments');
  await fs.mkdir(directory);
  await fs.writeFile(path.join(directory, 'secret.txt'), 'not referenced');
  await assert.rejects(readAttachment(store, issue.id, 'attachments/secret.txt'), { code: 'UNSAFE_PATH' });
  for (const unsafe of ['../secret.txt', 'attachments/../secret.txt', 'attachments/%2e%2e/secret.txt', 'attachments%2f..%2fsecret.txt', 'attachments/..%5csecret.txt', '/attachments/secret.txt']) {
    await assert.rejects(readAttachment(store, issue.id, unsafe), { code: 'UNSAFE_PATH' });
  }
  const example = await store.update(issue.id, issue.revision, { description: '```md\n[example](attachments/secret.txt)\n```' });
  await assert.rejects(readAttachment(store, issue.id, 'attachments/secret.txt'), { code: 'UNSAFE_PATH' });
  await fs.symlink(path.join(directory, 'secret.txt'), path.join(directory, 'linked.txt'));
  const linked = await store.update(issue.id, example.revision, { description: '[linked](attachments/linked.txt)' });
  await assert.rejects(readAttachment(store, issue.id, 'attachments/linked.txt'), { code: 'UNSAFE_PATH' });
  await fs.mkdir(path.join(root, 'outside'));
  await fs.symlink(path.join(root, 'outside'), path.join(directory, 'nested'));
  await store.update(issue.id, linked.revision, { description: '[nested](attachments/nested/file.txt)' });
  await assert.rejects(readAttachment(store, issue.id, 'attachments/nested/file.txt'), { code: 'UNSAFE_PATH' });
});

test('manual attachment links in comments support encoded names; SVG and mislabeled images remain file downloads', async t => {
  const { root, store, issue } = await fixture(t);
  await fs.mkdir(path.join(root, 'issues/attachments'));
  await fs.writeFile(path.join(root, 'issues/attachments/manual file.txt'), 'manual');
  const commented = await store.comment(issue.id, issue.revision, '[手工文件](./attachments/manual%20file.txt)', 'tester', 'human');
  assert.equal((await readAttachment(store, issue.id, 'attachments/manual%20file.txt')).data, Buffer.from('manual').toString('base64'));
  const svg = await uploadAttachment(store, issue.id, commented.revision, 'vector.svg', Buffer.from('<svg onload="alert(1)"/>').toString('base64'));
  assert.equal(svg.attachment.mimeType, 'application/octet-stream'); assert.ok(svg.attachment.markdown.startsWith('[vector.svg]'));
  const fake = await uploadAttachment(store, issue.id, svg.issue.revision, 'fake.png', Buffer.from('not an image').toString('base64'));
  assert.equal(fake.attachment.mimeType, 'application/octet-stream');
});

test('invalid or oversized uploads and a symbolic attachment directory do not mutate the issue', async t => {
  const { root, store, issue } = await fixture(t);
  await assert.rejects(uploadAttachment(store, issue.id, issue.revision, '../escape.txt', ''), { code: 'INVALID_INPUT' });
  await assert.rejects(uploadAttachment(store, issue.id, issue.revision, 'bad.txt', 'not-base64'), { code: 'INVALID_INPUT' });
  await assert.rejects(uploadAttachment(store, issue.id, issue.revision, 'large.bin', Buffer.alloc(MAX_ATTACHMENT_BYTES + 1).toString('base64')), { code: 'FILE_TOO_LARGE' });
  const outside = path.join(root, 'outside'); await fs.mkdir(outside);
  await fs.symlink(outside, path.join(root, 'issues/attachments'));
  await assert.rejects(uploadAttachment(store, issue.id, issue.revision, 'safe.txt', ''), { code: 'UNSAFE_PATH' });
  assert.equal((await store.get(issue.id)).raw, issue.raw);
  assert.deepEqual(await fs.readdir(outside), []);
  assert.equal(localAttachmentPath('attachments/%E4%B8%AD%E6%96%87.txt'), 'attachments/中文.txt');
});

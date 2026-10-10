import * as fs from 'node:fs/promises';
import { constants } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { IssueStore, IssueError } from './core.js';
import { attachmentReferences, localAttachmentPath, MAX_ATTACHMENT_BYTES } from './attachment-links.js';

function attachmentMimeType(bytes: Buffer, filename: string) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png' && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return 'image/png';
  if (['.jpg', '.jpeg'].includes(ext) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  if (ext === '.gif' && /^GIF8[79]a$/.test(bytes.subarray(0, 6).toString('ascii'))) return 'image/gif';
  if (ext === '.webp' && bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
  if (ext === '.bmp' && bytes.subarray(0, 2).toString('ascii') === 'BM') return 'image/bmp';
  if (ext === '.avif' && bytes.subarray(4, 8).toString('ascii') === 'ftyp' && bytes.subarray(8, 16).toString('ascii').includes('avif')) return 'image/avif';
  if (['.mp4', '.m4v', '.mov'].includes(ext) && bytes.subarray(4, 8).toString('ascii') === 'ftyp') return ext === '.mov' ? 'video/quicktime' : 'video/mp4';
  if (ext === '.webm' && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'video/webm';
  if (ext === '.ogv' && bytes.subarray(0, 4).toString('ascii') === 'OggS') return 'video/ogg';
  if (ext === '.mkv' && bytes.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return 'video/x-matroska';
  return 'application/octet-stream';
}

export async function uploadAttachment(store: IssueStore, id: string, revision: string, name: string, data: string) {
  if (!name.trim() || name.length > 240 || /[/\\\x00-\x1f]/.test(name)) throw new IssueError('INVALID_INPUT', '附件名称必须是普通文件名');
  if (data.length > Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4) throw new IssueError('FILE_TOO_LARGE', '单个附件不能超过 10 MB');
  const bytes = Buffer.from(data, 'base64');
  if (bytes.toString('base64') !== data) throw new IssueError('INVALID_INPUT', '附件数据不是合法 Base64');
  if (bytes.length > MAX_ATTACHMENT_BYTES) throw new IssueError('FILE_TOO_LARGE', '单个附件不能超过 10 MB');
  const issue = await store.get(id);
  if (issue.revision !== revision) throw new IssueError('CONFLICT', '文件已更新，请重新读取后再添加附件');
  const directory = path.join(await store.directory(), 'attachments');
  await fs.mkdir(directory, { recursive: true });
  const stat = await fs.lstat(directory);
  if (stat.isSymbolicLink() || !stat.isDirectory()) throw new IssueError('UNSAFE_PATH', '附件必须保存在项目内的真实目录');
  const filename = `${randomUUID()}-${name.replace(/[^\p{L}\p{N}._-]/gu, '_')}`;
  const file = path.join(directory, filename);
  const href = `attachments/${encodeURIComponent(filename)}`;
  const label = name.replace(/[\\[\]`!*_<>]/g, '\\$&');
  const mimeType = attachmentMimeType(bytes, name);
  const markdown = `${mimeType.startsWith('image/') ? '!' : ''}[${label}](${href})`;
  await fs.writeFile(file, bytes, { flag: 'wx' });
  try {
    const updated = await store.update(id, revision, { description: [issue.description, markdown].filter(Boolean).join('\n\n') });
    return { issue: updated, attachment: { path: href, name, mimeType, size: bytes.length, markdown } };
  } catch (error) {
    await fs.rm(file, { force: true });
    throw error;
  }
}

export async function readAttachment(store: IssueStore, id: string, href: string) {
  const local = localAttachmentPath(href);
  if (!local) throw new IssueError('UNSAFE_PATH', '附件路径必须位于 attachments 目录');
  const issue = await store.get(id);
  const ref = attachmentReferences([issue.description, ...issue.comments.map(c => c.body)].join('\n\n')).find(ref => ref.path === local);
  if (!ref) throw new IssueError('UNSAFE_PATH', '只能读取当前 Issue 已引用的附件');
  let file = await store.directory();
  const parts = local.split('/');
  for (const [index, part] of parts.entries()) {
    file = path.join(file, part);
    const stat = await fs.lstat(file);
    if (stat.isSymbolicLink() || (index < parts.length - 1 ? !stat.isDirectory() : !stat.isFile())) throw new IssueError('UNSAFE_PATH', '附件路径不能包含符号链接或特殊文件');
  }
  const handle = await fs.open(file, constants.O_RDONLY | constants.O_NOFOLLOW);
  try {
    if ((await handle.stat()).size > MAX_ATTACHMENT_BYTES) throw new IssueError('FILE_TOO_LARGE', '附件超过 10 MB，未读取');
    const bytes = await handle.readFile();
    if (bytes.length > MAX_ATTACHMENT_BYTES) throw new IssueError('FILE_TOO_LARGE', '附件超过 10 MB，未读取');
    const name = path.extname(ref.label).toLowerCase() === path.extname(file).toLowerCase() && !/[/\\\x00-\x1f]/.test(ref.label) ? ref.label : path.basename(file).replace(/^[\da-f-]{36}-/i, '');
    return { path: ref.href, name, mimeType: attachmentMimeType(bytes, file), size: bytes.length, data: bytes.toString('base64') };
  } finally { await handle.close(); }
}

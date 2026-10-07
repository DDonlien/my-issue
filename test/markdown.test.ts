import test from 'node:test';
import assert from 'node:assert/strict';
import { attachmentView, renderMarkdown, escapeHtml, MAX_INLINE_TEXT_BYTES, type InlineAttachment } from '../src/web/markdown-renderer.js';

const file = (name: string, text: string): InlineAttachment => ({ name, mimeType: 'application/octet-stream', data: Buffer.from(text).toString('base64'), size: Buffer.byteLength(text) });
const render = (text: string, files: Record<string, InlineAttachment> = {}, failures: Record<string, string> = {}) => renderMarkdown(text, {
  files, failures, downloadHref: href => '/api/attachment?' + new URLSearchParams({ path: href }), sanitizeSourceHtml: escapeHtml,
});

test('local images render at the reference position for both image syntax and ordinary links', () => {
  const image = { name: '截图.png', mimeType: 'image/png', data: 'iVBORw0KGgo=', size: 8 };
  const html = render('前文\n\n![截图](attachments/a.png)\n\n后文 [同一图片][shot]\n\n[shot]: ./attachments/a.png', { 'attachments/a.png': image });
  assert.equal((html.match(/<img /g) ?? []).length, 2);
  assert.match(html, /src="data:image\/png;base64,iVBORw0KGgo="/);
  assert.ok(html.indexOf('前文') < html.indexOf('<img') && html.indexOf('后文') > html.indexOf('<img'));
  assert.match(html, /aria-label="下载 截图.png"/);
  assert.doesNotMatch(render('```md\n![example](attachments/a.png)\n```', { 'attachments/a.png': image }), /<img /);
});

test('Markdown and UTF-8 text display content by default, without recursively expanding attached document links', () => {
  const document = file('设计.md', '#### 正文中的方案\n\n**已渲染**\n\n[nested](attachments/other.txt)\n\n![remote](https://example.com/private.png)\n\n<script>alert(1)</script>');
  const html = render('上下文 [文档](attachments/design.md) 继续讨论。', { 'attachments/design.md': document, 'attachments/other.txt': file('other.txt', '不应递归读取') });
  assert.match(html, /<h4>正文中的方案<\/h4>/);
  assert.match(html, /<strong>已渲染<\/strong>/);
  assert.equal((html.match(/data-attachment-path=/g) ?? []).length, 1);
  assert.doesNotMatch(html, /<img|<script|不应递归读取/);
  assert.match(html, /<div class="markdown-paragraph">上下文/);
  const text = render('[text](attachments/context.txt)', { 'attachments/context.txt': file('context.txt', 'line 1\n<img onerror="bad()">') });
  assert.match(text, /<pre>line 1\n&lt;img onerror=&quot;bad\(\)&quot;&gt;<\/pre>/);
});

test('non-previewable, oversized, malformed and executable attachments stay downloadable without executing content', () => {
  for (const attachment of [file('vector.svg', '<svg onload="bad()"/>'), file('page.html', '<script>bad()</script>'), file('archive.zip', 'PK')]) {
    const html = render('[file](attachments/file)', { 'attachments/file': attachment });
    assert.match(html, /class="attachment-inline-file"/);
    assert.match(html, /data-attachment-path="attachments\/file"/);
    assert.doesNotMatch(html, /<svg|<script/);
  }
  assert.deepEqual(attachmentView(file('large.txt', 'a'.repeat(MAX_INLINE_TEXT_BYTES + 1))), { kind: 'file', large: true });
  assert.deepEqual(attachmentView({ ...file('bad.txt', ''), data: Buffer.from([255, 0]).toString('base64') }), { kind: 'file' });
  assert.deepEqual(attachmentView({ ...file('fake.png', 'not an image') }), { kind: 'file' });
  const maliciousName = render('[file](attachments/file)', { 'attachments/file': file('\"><img src=x onerror=bad()>.txt', 'safe') });
  assert.doesNotMatch(maliciousName, /<img/);
  assert.match(maliciousName, /&quot;&gt;&lt;img/);
});

test('missing attachments fail in place and unsafe paths never become download references', () => {
  assert.match(render('[失效文件](attachments/missing.txt)', {}, { 'attachments/missing.txt': '文件不可用 <test>' }), /role="alert"[^>]*>失效文件 · 文件不可用 &lt;test&gt;/);
  assert.doesNotMatch(render('[escape](attachments/%2e%2e/secret.txt)'), /data-attachment-path/);
  assert.doesNotMatch(render('![remote](https://example.com/x.png)'), /<img /);
});

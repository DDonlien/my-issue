import { marked } from 'marked';
import { localAttachmentPath } from '../attachment-links.js';

export interface InlineAttachment { name: string; mimeType: string; data: string; size?: number }
export const MAX_INLINE_TEXT_BYTES = 64 * 1024;
const imageTypes = new Set(['image/png', 'image/jpeg', 'image/gif', 'image/webp']);
const textExtensions = new Set(['md', 'markdown', 'txt', 'csv', 'json', 'yaml', 'yml', 'log']);
export const escapeHtml = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export function attachmentView(file: InlineAttachment): { kind: 'image'; src: string } | { kind: 'markdown' | 'text'; text: string } | { kind: 'file'; large?: boolean } {
  if (imageTypes.has(file.mimeType) && /^[A-Za-z0-9+/]*={0,2}$/.test(file.data)) return { kind: 'image', src: `data:${file.mimeType};base64,${file.data}` };
  const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
  if (!textExtensions.has(extension)) return { kind: 'file' };
  if ((file.size ?? Math.floor(file.data.length * 3 / 4)) > MAX_INLINE_TEXT_BYTES) return { kind: 'file', large: true };
  try {
    const bytes = Uint8Array.from(atob(file.data), char => char.charCodeAt(0));
    if (bytes.length > MAX_INLINE_TEXT_BYTES) return { kind: 'file', large: true };
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) return { kind: 'file' };
    return { kind: ['md', 'markdown'].includes(extension) ? 'markdown' : 'text', text };
  } catch { return { kind: 'file' }; }
}

interface RenderOptions {
  files: Record<string, InlineAttachment>;
  failures: Record<string, string>;
  downloadHref: (href: string) => string;
  sanitizeSourceHtml: (html: string) => string;
  expandAttachments?: boolean;
}
export function renderMarkdown(text: string, options: RenderOptions): string {
  const renderer = new marked.Renderer();
  renderer.html = token => options.sanitizeSourceHtml(token.text);
  function attachment(href: string, label: string, imageSyntax = false) {
    const local = localAttachmentPath(href)!;
    if (options.expandAttachments === false) return `<span class="attachment-placeholder">${escapeHtml(label || '文件引用')}</span>`;
    const file = options.files[local];
    if (!file) return `<span class="attachment-placeholder"${options.failures[local] ? ' role="alert"' : ''}>${escapeHtml(label || '附件')} · ${escapeHtml(options.failures[local] || '正在读取…')}</span>`;
    const view = attachmentView(file);
    const size = file.size === undefined ? '' : file.size < 1024 ? `${file.size} B` : file.size < 1024 * 1024 ? `${(file.size / 1024).toFixed(1)} KB` : `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    const link = `<a class="attachment-file" href="${escapeHtml(options.downloadHref(href))}" data-attachment-path="${escapeHtml(href)}" download aria-label="下载 ${escapeHtml(file.name)}"><span class="attachment-file-name">${escapeHtml(file.name)}</span><span class="attachment-file-size">${size}${size ? ' · ' : ''}下载 ↓</span></a>`;
    if (view.kind === 'image') return `<span class="attachment-inline-image">${imageSyntax ? '' : link}<img src="${view.src}" alt="${escapeHtml(label || file.name)}" loading="lazy"></span>`;
    if (view.kind === 'file') return `<span class="attachment-inline-file">${link}${view.large ? '<span class="attachment-placeholder">文件较大，请下载查看。</span>' : ''}</span>`;
    const body = view.kind === 'text' ? `<pre>${escapeHtml(view.text)}</pre>` : renderMarkdown(view.text, { ...options, expandAttachments: false });
    return `<div class="attachment-inline-document">${link}<div class="attachment-document-body">${body}</div></div>`;
  }
  renderer.image = ({ href, text }) => localAttachmentPath(href) ? attachment(href, text, true) : `<span class="attachment-placeholder">${escapeHtml(text || '图片')}</span>`;
  const originalLink = renderer.link.bind(renderer);
  renderer.link = token => localAttachmentPath(token.href) ? attachment(token.href, token.text) : originalLink(token);
  const originalParagraph = renderer.paragraph.bind(renderer);
  renderer.paragraph = token => {
    let embedded = false;
    marked.walkTokens(token.tokens, child => { if ((child.type === 'image' || child.type === 'link') && localAttachmentPath(child.href)) embedded = true; });
    // Attachment documents contain block content and must not be placed inside a paragraph.
    return embedded ? `<div class="markdown-paragraph">${renderer.parser.parseInline(token.tokens)}</div>\n` : originalParagraph(token);
  };
  return marked.parse(text, { async: false, renderer });
}

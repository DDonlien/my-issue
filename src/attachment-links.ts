import { marked } from 'marked';

export const MAX_ATTACHMENT_BYTES = 10_000_000;
export interface AttachmentReference { href: string; path: string; label: string; image: boolean }

/** Attachment links are relative to the Issue Markdown file, including in Obsidian. */
export function localAttachmentPath(href: string): string | undefined {
  let decoded: string;
  try { decoded = decodeURIComponent(href).replace(/^\.\//, ''); } catch { return; }
  if (!decoded.startsWith('attachments/') || /[\\\x00-\x1f?#]/.test(decoded)) return;
  const parts = decoded.split('/');
  if (parts.some(part => !part || part === '.' || part === '..')) return;
  return parts.join('/');
}

export function attachmentReferences(markdown: string): AttachmentReference[] {
  const refs = new Map<string, AttachmentReference>();
  marked.walkTokens(marked.lexer(markdown), token => {
    if (token.type !== 'image' && token.type !== 'link') return;
    const file = localAttachmentPath(token.href);
    if (!file) return;
    const existing = refs.get(file);
    refs.set(file, { href: token.href, path: file, label: token.text || file.split('/').at(-1)!, image: token.type === 'image' || !!existing?.image });
  });
  return [...refs.values()];
}

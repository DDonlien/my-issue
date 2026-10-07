import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import { attachmentReferences, localAttachmentPath } from '../attachment-links.js';
import * as bridge from './bridge.js';

interface Attachment { name: string; mimeType: string; data: string }
interface Scope { read: (href: string) => Promise<Attachment>; downloadUrl: (href: string) => string }
const AttachmentContext = createContext<Scope | undefined>(undefined);
export function AttachmentProvider({ root, id, revision, children }: { root: string; id: string; revision: string; children: React.ReactNode }) {
  const scope = useMemo(() => {
    const cache = new Map<string, Promise<Attachment>>();
    return { downloadUrl: (href: string) => '/api/attachment?' + new URLSearchParams({ root, id, path: href }), read: (href: string) => {
      const key = localAttachmentPath(href) ?? href;
      if (!cache.has(key)) cache.set(key, bridge.call('read_attachment', { root, id, path: href }).then(data => data.attachment));
      return cache.get(key)!;
    } };
  }, [root, id, revision]);
  return <AttachmentContext.Provider value={scope}>{children}</AttachmentContext.Provider>;
}
const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!);

export function Markdown({ text }: { text: string }) {
  const scope = useContext(AttachmentContext);
  const [images, setImages] = useState<Record<string, string>>({});
  const [failures, setFailures] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setImages({}); setFailures({}); setError('');
    if (scope) for (const ref of attachmentReferences(text).filter(ref => ref.image)) {
      scope.read(ref.href).then(file => {
        if (!cancelled && file.mimeType.startsWith('image/')) setImages(current => ({ ...current, [ref.path]: `data:${file.mimeType};base64,${file.data}` }));
        else if (!cancelled) setFailures(current => ({ ...current, [ref.path]: '此附件可下载查看' }));
      }).catch(error => { if (!cancelled) setFailures(current => ({ ...current, [ref.path]: error.message })); });
    }
    return () => { cancelled = true; };
  }, [text, scope]);
  const renderer = new marked.Renderer();
  renderer.html = token => DOMPurify.sanitize(token.text, { FORBID_TAGS: ['img', 'iframe', 'video', 'audio', 'form', 'input', 'style'], FORBID_ATTR: ['style'] });
  renderer.image = ({ href, text }) => {
    const local = localAttachmentPath(href);
    if (local && images[local]) return `<img src="${images[local]}" alt="${escape(text)}" loading="lazy">`;
    return `<span class="attachment-placeholder">${escape(text || '图片')}${local ? ` · ${escape(failures[local] || '正在读取…')}` : ''}</span>`;
  };
  const originalLink = renderer.link.bind(renderer);
  renderer.link = token => localAttachmentPath(token.href) ? `<a href="${escape(bridge.preview && scope ? scope.downloadUrl(token.href) : token.href)}" data-attachment-path="${escape(token.href)}"${bridge.preview ? ' download' : ''}>${renderer.parser.parseInline(token.tokens)}</a>` : originalLink(token);
  const html = DOMPurify.sanitize(marked.parse(text, { async: false, renderer }), { FORBID_TAGS: ['iframe', 'video', 'audio', 'form', 'input', 'style'], FORBID_ATTR: ['style'] });
  return <><div className="markdown" dangerouslySetInnerHTML={{ __html: html }} onClick={async event => {
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-attachment-path]');
    if (!link) return;
    if (bridge.preview) return;
    event.preventDefault();
    if (!scope) return;
    try {
      const file = await scope.read(link.dataset.attachmentPath!);
      await bridge.download(file);
    } catch (error) { setError((error as Error).message); }
  }} />{error && <p role="alert" className="attachment-error">{error}</p>}</>;
}

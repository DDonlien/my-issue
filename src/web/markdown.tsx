import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import DOMPurify from 'dompurify';
import { attachmentReferences, localAttachmentPath } from '../attachment-links.js';
import * as bridge from './bridge.js';
import { renderMarkdown, type InlineAttachment } from './markdown-renderer.js';

interface Scope { read: (href: string) => Promise<InlineAttachment>; downloadUrl: (href: string) => string }
const AttachmentContext = createContext<Scope | undefined>(undefined);
export function AttachmentProvider({ root, id, revision, children }: { root: string; id: string; revision: string; children: React.ReactNode }) {
  const scope = useMemo(() => {
    const cache = new Map<string, Promise<InlineAttachment>>();
    return { downloadUrl: (href: string) => '/api/attachment?' + new URLSearchParams({ root, id, path: href }), read: (href: string) => {
      const key = localAttachmentPath(href) ?? href;
      if (!cache.has(key)) cache.set(key, bridge.call('read_attachment', { root, id, path: href }).then(data => data.attachment));
      return cache.get(key)!;
    } };
  }, [root, id, revision]);
  return <AttachmentContext.Provider value={scope}>{children}</AttachmentContext.Provider>;
}
export function Markdown({ text }: { text: string }) {
  const scope = useContext(AttachmentContext);
  const [loaded, setLoaded] = useState<{ scope: Scope | undefined; text: string; files: Record<string, InlineAttachment>; failures: Record<string, string> }>();
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    setLoaded({ scope, text, files: {}, failures: {} }); setError('');
    if (scope) for (const ref of attachmentReferences(text)) {
      scope.read(ref.href).then(file => {
        if (!cancelled) setLoaded(current => ({ scope, text, failures: current?.failures ?? {}, files: { ...current?.files, [ref.path]: file } }));
      }).catch(error => {
        const message = error instanceof Error ? error.message : '读取附件失败';
        if (!cancelled) setLoaded(current => ({ scope, text, files: current?.files ?? {}, failures: { ...current?.failures, [ref.path]: /ENOENT/.test(message) ? '文件不存在或已移动' : message } }));
      });
    }
    return () => { cancelled = true; };
  }, [text, scope]);
  const current = loaded?.scope === scope && loaded?.text === text ? loaded : undefined;
  const html = DOMPurify.sanitize(renderMarkdown(text, {
    files: current?.files ?? {}, failures: current?.failures ?? {},
    downloadHref: href => bridge.preview && scope ? scope.downloadUrl(href) : href,
    sanitizeSourceHtml: html => DOMPurify.sanitize(html, { FORBID_TAGS: ['img', 'iframe', 'video', 'audio', 'form', 'input', 'style'], FORBID_ATTR: ['style'] }),
  }), { FORBID_TAGS: ['iframe', 'video', 'audio', 'form', 'input', 'style'], FORBID_ATTR: ['style'] });
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

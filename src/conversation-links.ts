export const CONVERSATIONS_PROPERTY = 'conversations';
export interface ConversationLink { url: string; title: string }

/** Ordinary file properties remain host independent; never turn anonymous IDs into links. */
export function conversationUrl(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 2048) return;
  const text = value.trim();
  try {
    const url = new URL(text);
    if (url.username || url.password) return;
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.href;
    if (url.protocol === 'codex:' && url.hostname === 'threads' && /^\/[a-zA-Z0-9_-]+$/.test(url.pathname) && !url.search && !url.hash) return url.href;
  } catch { /* Invalid properties stay in the file but cannot become navigation targets. */ }
}

export function conversationLinks(properties: Record<string, unknown>): ConversationLink[] {
  const values = properties[CONVERSATIONS_PROPERTY];
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  return values.flatMap(value => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
    const url = conversationUrl(value.url);
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{ url, title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : '已分配对话' }];
  });
}

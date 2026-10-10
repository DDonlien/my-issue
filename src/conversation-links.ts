export const CONVERSATIONS_PROPERTY = 'conversations';
export const CURRENT_CONVERSATION_PROPERTY = 'current_conversation';
export const COMMENT_CONVERSATIONS_PROPERTY = 'comment_conversations';
export const CONVERSATION_PROPERTIES = [CONVERSATIONS_PROPERTY, CURRENT_CONVERSATION_PROPERTY, COMMENT_CONVERSATIONS_PROPERTY];
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
    return [{ url, title: typeof value.title === 'string' && value.title.trim() ? value.title.trim() : '对话' }];
  });
}

export function conversationLink(value: unknown, fallback = '对话'): ConversationLink | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return;
  const entry = value as Record<string, unknown>;
  const url = conversationUrl(entry.url);
  if (url) return { url, title: typeof entry.title === 'string' && entry.title.trim() ? entry.title.trim() : fallback };
}

export function currentConversation(properties: Record<string, unknown>): ConversationLink | undefined {
  if (Object.hasOwn(properties, CURRENT_CONVERSATION_PROPERTY)) return conversationLink(properties[CURRENT_CONVERSATION_PROPERTY], '当前对话');
  const legacy = conversationLinks(properties);
  return legacy.length === 1 ? legacy[0] : undefined;
}

export function commentConversation(properties: Record<string, unknown>, commentId: string): ConversationLink | undefined {
  const entries = properties[COMMENT_CONVERSATIONS_PROPERTY];
  if (!entries || typeof entries !== 'object' || Array.isArray(entries) || !Object.hasOwn(entries, commentId)) return;
  return conversationLink((entries as Record<string, unknown>)[commentId], '评论对话');
}

/** A verified correction can refine an incomplete historical label, never replace a precise one. */
export function commentModel(properties: Record<string, unknown>, commentId: string, recorded: string | undefined): string | undefined {
  if (recorded !== 'unknown' && !/^gpt-6(?:\.\d+)?$/i.test(recorded ?? '')) return recorded;
  const entries = properties[COMMENT_CONVERSATIONS_PROPERTY];
  if (!entries || typeof entries !== 'object' || Array.isArray(entries) || !Object.hasOwn(entries, commentId)) return recorded;
  const source = (entries as Record<string, unknown>)[commentId];
  if (!source || typeof source !== 'object' || Array.isArray(source)) return recorded;
  const model = (source as Record<string, unknown>).model;
  return conversationLink(source) && typeof model === 'string' && model.trim() && !['human', 'unknown'].includes(model.trim()) && !/[\r\n·]/.test(model) && !/^gpt-6(?:\.\d+)?$/i.test(model.trim()) ? model.trim() : recorded;
}

import { IssueError, appendComment, parseIssue, updateIssue, validateModel, type IssueStore, type Schema } from './core.js';
import { COMMENT_CONVERSATIONS_PROPERTY, CURRENT_CONVERSATION_PROPERTY, conversationUrl } from './conversation-links.js';

function unmapped(schema: Schema, key: string) {
  const mapped = [schema.statusKey, schema.parentKey, schema.dependenciesKey, ...(schema.name.source === 'property' ? [schema.name.key] : [])];
  if (mapped.includes(key)) throw new IssueError('INVALID_CONVERSATIONS', `项目 Schema 已将 ${key} 用于名称、状态或关系；原文已保留`);
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value); }
function target(url: string, title: string | undefined, previous: Record<string, unknown>, fallback: string): Record<string, unknown> & { url: string; title: string } {
  const normalized = conversationUrl(url);
  if (!normalized) throw new IssueError('INVALID_CONVERSATION', '请填写有效的对话链接');
  return { ...previous, url: normalized, title: title?.trim() || (conversationUrl(previous.url) === normalized && typeof previous.title === 'string' ? previous.title : fallback) };
}

export async function linkConversation(store: IssueStore, id: string, revision: string, url: string, title?: string) {
  return { issue: await store.mutate(id, revision, (raw, schema) => {
    unmapped(schema, CURRENT_CONVERSATION_PROPERTY);
    const current = parseIssue(raw, `${id}.md`, schema).properties[CURRENT_CONVERSATION_PROPERTY];
    if (current !== undefined && current !== null && !record(current)) throw new IssueError('INVALID_CONVERSATIONS', 'current_conversation 属性不是对象；原文已保留');
    return updateIssue(raw, schema, { properties: { [CURRENT_CONVERSATION_PROPERTY]: target(url, title, current ?? {}, '当前对话') } });
  }) };
}

function associateComment(raw: string, schema: Schema, id: string, commentId: string, url: string, title?: string, model?: string) {
  unmapped(schema, COMMENT_CONVERSATIONS_PROPERTY);
  const issue = parseIssue(raw, `${id}.md`, schema);
  const comment = issue.comments.find(comment => comment.id === commentId);
  if (!comment) throw new IssueError('COMMENT_NOT_FOUND', '评论不存在或原文已改变，请重新读取 Issue');
  if (model !== undefined) {
    validateModel(model);
    const recorded = comment.heading.split(' · ')[2]?.trim();
    if (!recorded || recorded === 'human' || model === 'human' || model === 'unknown') throw new IssueError('INVALID_MODEL', '只能用经过核实的具体模型补充 AI 评论');
    if (recorded !== 'unknown' && !/^gpt-6(?:\.\d+)?$/i.test(recorded) && recorded !== model.trim()) throw new IssueError('INVALID_MODEL', '既有评论已记录具体模型，不能用关联操作替换');
  }
  const current = issue.properties[COMMENT_CONVERSATIONS_PROPERTY];
  if (current !== undefined && !record(current)) throw new IssueError('INVALID_CONVERSATIONS', 'comment_conversations 属性不是对象；原文已保留');
  const values = { ...(current ?? {}) };
  const previous = values[commentId];
  if (previous !== undefined && !record(previous)) throw new IssueError('INVALID_CONVERSATIONS', '此评论的关联格式无法识别；原文已保留');
  const entry = target(url, title, previous ?? {}, '评论对话');
  if (model === undefined && previous && conversationUrl(previous.url) !== entry.url) delete entry.model;
  values[commentId] = { ...entry, ...(model !== undefined ? { model: model.trim() } : {}) };
  return updateIssue(raw, schema, { properties: { [COMMENT_CONVERSATIONS_PROPERTY]: values } });
}

export async function linkCommentConversation(store: IssueStore, id: string, revision: string, commentId: string, url: string, title?: string, model?: string) {
  return { issue: await store.mutate(id, revision, (raw, schema) => associateComment(raw, schema, id, commentId, url, title, model)) };
}

export async function appendCommentWithConversation(store: IssueStore, input: { id: string; revision: string; body: string; author: string; actor: string; conversation?: { url: string; title?: string } }) {
  return { issue: await store.mutate(input.id, input.revision, (raw, schema) => {
    const next = appendComment(raw, schema, input.body, input.author, input.actor);
    if (!input.conversation) return next;
    const comment = parseIssue(next, `${input.id}.md`, schema).comments.at(-1)!;
    return associateComment(next, schema, input.id, comment.id, input.conversation.url, input.conversation.title);
  }) };
}

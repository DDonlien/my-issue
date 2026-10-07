import { IssueError, type IssueStore } from './core.js';
import { CONVERSATIONS_PROPERTY, conversationUrl } from './conversation-links.js';

export async function linkConversation(store: IssueStore, id: string, revision: string, url: string, title?: string) {
  const target = conversationUrl(url);
  if (!target) throw new IssueError('INVALID_CONVERSATION', '请填写有效的对话链接');
  const schema = await store.schema();
  const mapped = [schema.statusKey, schema.parentKey, schema.dependenciesKey, ...(schema.name.source === 'property' ? [schema.name.key] : [])];
  if (mapped.includes(CONVERSATIONS_PROPERTY)) throw new IssueError('INVALID_CONVERSATIONS', '项目 Schema 已将 conversations 用于名称、状态或关系；请先确认属性映射，原文已保留');
  const issue = await store.get(id);
  if (issue.revision !== revision) throw new IssueError('CONFLICT', 'Issue 已被修改，请重新读取后再关联对话');
  const current = issue.properties[CONVERSATIONS_PROPERTY];
  if (current !== undefined && !Array.isArray(current)) throw new IssueError('INVALID_CONVERSATIONS', 'conversations 属性不是列表，请先在属性中确认格式；原文已保留');
  const values: unknown[] = [...(current ?? [])];
  const index = values.findIndex(value => value && typeof value === 'object' && conversationUrl((value as Record<string, unknown>).url) === target);
  const previous = index >= 0 ? values[index] as Record<string, unknown> : {};
  const entry = { ...previous, url: target, title: title?.trim() || (typeof previous.title === 'string' ? previous.title : '已分配对话') };
  if (index >= 0) values[index] = entry;
  else values.push(entry);
  return { issue: await store.update(id, revision, { properties: { [CONVERSATIONS_PROPERTY]: values } }) };
}

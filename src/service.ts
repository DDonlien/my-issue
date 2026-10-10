import { IssueStore, dispatchPrompt, IssueError, type Issue, type Board } from './core.js';
import { z } from 'zod';
import { uploadAttachment, readAttachment } from './attachments.js';
import { MAX_ATTACHMENT_BYTES } from './attachment-links.js';
import { appendCommentWithConversation, linkCommentConversation, linkConversation } from './conversations.js';
import { conversationUrl } from './conversation-links.js';

const root = z.string().min(1);
const id = z.string().min(1);
const revision = z.string().min(1).describe('Use the revision returned by the latest read; conflicts require a fresh read.');
const properties = z.record(z.string(), z.unknown());
const conversation = z.object({ url: z.string().min(1).max(2048).refine(value => !!conversationUrl(value), 'Invalid conversation URL'), title: z.string().trim().min(1).max(500).optional() });
export const inputs = {
  open_board: z.object({ root: root.optional(), issueId: id.optional() }),
  list_issues: z.object({ root }),
  get_issue: z.object({ root, id }),
  create_issue: z.object({ root, name: z.string().min(1).max(500), properties: properties.optional(), description: z.string().optional() }),
  update_issue: z.object({ root, id, revision, name: z.string().min(1).max(500).optional(), description: z.string().optional(), properties: properties.optional(), removeProperties: z.array(z.string()).optional() }),
  append_comment: z.object({ root, id, revision, body: z.string().min(1), author: z.string().min(1), actor: z.string().min(1).describe('human or the exact available model identifier including variant, e.g. gpt-6-sol, gpt-6-luna or gpt-6.1-sol. Use unknown if unavailable; never guess or shorten to gpt-6.'), conversation: conversation.optional().describe('Verified source of this individual comment. Do not inherit the issue current conversation or infer a URL from anonymous session metadata.') }),
  prepare_dispatch: z.object({ root, id, instruction: z.string().optional() }),
  link_conversation: z.object({ root, id, revision, ...conversation.shape }),
  link_comment_conversation: z.object({ root, id, revision, commentId: z.string().regex(/^comment-[a-f0-9]{64}(?:-\d+)?$/).describe('The id returned for this exact comment by get_issue. Existing comment text is never changed.'), ...conversation.shape, model: z.string().trim().min(1).optional().describe('Only use to refine an incomplete historical AI label after verifying the exact original writing turn and model. Never guess a version or replace an already precise heading.') }),
  upload_attachment: z.object({ root, id, revision, name: z.string().min(1).max(240), data: z.string().max(Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4) }),
  read_attachment: z.object({ root, id, path: z.string().min(1) }),
};
export type Operation = keyof typeof inputs;
type Results = {
  open_board: { board: Board; issueId?: string };
  list_issues: { board: Board };
  get_issue: { issue: Issue };
  create_issue: { issue: Issue };
  update_issue: { issue: Issue };
  append_comment: { issue: Issue };
  prepare_dispatch: { prompt: string; issue: Issue; root: string };
  link_conversation: Awaited<ReturnType<typeof linkConversation>>;
  link_comment_conversation: Awaited<ReturnType<typeof linkCommentConversation>>;
  upload_attachment: Awaited<ReturnType<typeof uploadAttachment>>;
  read_attachment: { attachment: Awaited<ReturnType<typeof readAttachment>> };
};
export function execute<T extends Operation>(operation: T, args: unknown): Promise<Results[T]>;
export async function execute(operation: Operation, args: unknown) {
  const input = inputs[operation].parse(args) as Record<string, any>;
  if (operation === 'open_board' && !input.root) throw new IssueError('INVALID_ROOT', '请先选择项目');
  const store = new IssueStore(input.root);
  switch (operation) {
    case 'open_board': return { board: await store.board(), issueId: input.issueId };
    case 'list_issues': return { board: await store.board() };
    case 'get_issue': return { issue: await store.get(input.id) };
    case 'create_issue': return { issue: await store.create(input.name, input.properties, input.description) };
    case 'update_issue': return { issue: await store.update(input.id, input.revision, { name: input.name, description: input.description, properties: input.properties, removeProperties: input.removeProperties }) };
    case 'append_comment': return appendCommentWithConversation(store, input as Parameters<typeof appendCommentWithConversation>[1]);
    case 'prepare_dispatch': { const issue = await store.get(input.id); return { prompt: dispatchPrompt(store.root, issue, input.instruction ?? ''), issue, root: store.root }; }
    case 'link_conversation': return linkConversation(store, input.id, input.revision, input.url, input.title);
    case 'link_comment_conversation': return linkCommentConversation(store, input.id, input.revision, input.commentId, input.url, input.title, input.model);
    case 'upload_attachment': return uploadAttachment(store, input.id, input.revision, input.name, input.data);
    case 'read_attachment': return { attachment: await readAttachment(store, input.id, input.path) };
  }
}

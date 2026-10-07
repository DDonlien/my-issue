import { IssueStore, dispatchPrompt, IssueError, type Issue, type Board } from './core.js';
import { z } from 'zod';
import { uploadAttachment, readAttachment } from './attachments.js';
import { MAX_ATTACHMENT_BYTES } from './attachment-links.js';

const root = z.string().min(1);
const id = z.string().min(1);
const revision = z.string().min(1).describe('Use the revision returned by the latest read; conflicts require a fresh read.');
const properties = z.record(z.string(), z.unknown());
export const inputs = {
  open_board: z.object({ root: root.optional(), issueId: id.optional() }),
  list_issues: z.object({ root }),
  get_issue: z.object({ root, id }),
  create_issue: z.object({ root, name: z.string().min(1).max(500), properties: properties.optional(), description: z.string().optional() }),
  update_issue: z.object({ root, id, revision, name: z.string().min(1).max(500).optional(), description: z.string().optional(), properties: properties.optional(), removeProperties: z.array(z.string()).optional() }),
  append_comment: z.object({ root, id, revision, body: z.string().min(1), author: z.string().min(1), actor: z.string().min(1).describe('human or the actual available model identifier; never invent a model.') }),
  prepare_dispatch: z.object({ root, id, instruction: z.string().optional() }),
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
    case 'append_comment': return { issue: await store.comment(input.id, input.revision, input.body, input.author, input.actor) };
    case 'prepare_dispatch': { const issue = await store.get(input.id); return { prompt: dispatchPrompt(store.root, issue, input.instruction ?? ''), issue, root: store.root }; }
    case 'upload_attachment': return uploadAttachment(store, input.id, input.revision, input.name, input.data);
    case 'read_attachment': return { attachment: await readAttachment(store, input.id, input.path) };
  }
}

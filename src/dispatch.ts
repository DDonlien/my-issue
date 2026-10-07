import { readCodexConversations, sendToCodexConversation, type CodexConversationList } from './codex-chats.js';
import { execute } from './service.js';

export const codexDispatch = { list: readCodexConversations, send: sendToCodexConversation };
export type CodexDispatch = { list: () => Promise<CodexConversationList>; send: typeof sendToCodexConversation };

export async function dispatchToConversation(input: { root: string; id: string; threadId: string; instruction?: string }, host: CodexDispatch = codexDispatch) {
  const prepared = await execute('prepare_dispatch', input);
  const accepted = await host.send(input.threadId, prepared.prompt);
  let associationError: string | undefined;
  try { await execute('link_conversation', { root: input.root, id: input.id, revision: prepared.issue.revision, url: accepted.conversation.url, title: accepted.conversation.title }); }
  catch (error) { associationError = (error as Error).message; }
  return { ...accepted, sent: true, ...(associationError ? { associationError } : {}) };
}

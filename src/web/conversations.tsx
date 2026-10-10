import React from 'react';
import { ArrowUpRight, MessagesSquare } from 'lucide-react';
import { commentConversation, currentConversation, type ConversationLink } from '../conversation-links.js';
import { ConversationPicker } from './conversation-picker.js';

type Open = (url: string) => Promise<unknown>;
export function ConversationLinkView({ conversation, onOpen, label }: { conversation: ConversationLink; onOpen?: Open; label?: string }) {
  return <a className="conversation-link" href={conversation.url} title={conversation.title} aria-label={label ?? `打开对话：${conversation.title}`} target="_blank" rel="noopener noreferrer" draggable={false} onClick={event => {
    event.stopPropagation();
    if (onOpen) { event.preventDefault(); void onOpen(conversation.url); }
  }}><MessagesSquare size={12} aria-hidden="true" /><span>{conversation.title}</span><ArrowUpRight size={11} aria-hidden="true" /></a>;
}

export function ConversationLinks({ properties, onOpen, compact = false }: { properties: Record<string, unknown>; onOpen?: Open; compact?: boolean }) {
  const conversation = currentConversation(properties);
  if (!conversation) return null;
  return <div className={compact ? 'card-conversations' : 'conversation-list'} onClick={event => event.stopPropagation()} onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}>
    <ConversationLinkView conversation={conversation} onOpen={onOpen} />
  </div>;
}

type Editing = { disabled: boolean; onOpen?: Open; onEditing: (open: boolean) => void; onLink: (url: string, title: string) => Promise<boolean> };
export function ConversationSection({ properties, ...editing }: { properties: Record<string, unknown> } & Editing) {
  const conversation = currentConversation(properties);
  return <section className="current-conversation" aria-label="当前对话">
    <h3>当前对话</h3>
    <div className="current-conversation-controls">{conversation && <ConversationLinkView conversation={conversation} onOpen={editing.onOpen} />}
      <ConversationPicker kind="current" conversation={conversation} disabled={editing.disabled} onSave={editing.onLink} onEditing={editing.onEditing} />
    </div>
  </section>;
}

export function CommentConversation({ properties, commentId, ...editing }: { properties: Record<string, unknown>; commentId: string } & Editing) {
  const conversation = commentConversation(properties, commentId);
  return <span className="comment-conversation">
    {conversation && <ConversationLinkView conversation={conversation} onOpen={editing.onOpen} label={`打开评论对话：${conversation.title}`} />}
    <ConversationPicker kind="comment" conversation={conversation} disabled={editing.disabled} onSave={editing.onLink} onEditing={editing.onEditing} />
  </span>;
}

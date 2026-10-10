import React from 'react';
import type { Comment } from '../core.js';
import { commentModel } from '../conversation-links.js';
import { Avatar, AvatarFallback } from './components/ui/avatar.js';
import { Badge } from './components/ui/badge.js';
import { CommentConversation } from './conversations.js';
import { Markdown } from './markdown.js';

type ConversationActions = { properties: Record<string, unknown>; disabled: boolean; onOpen?: (url: string) => Promise<unknown>; onEditing: (open: boolean) => void; onLink: (commentId: string, url: string, title: string) => Promise<boolean> };
export function CommentMetadata({ comment, properties, disabled, onOpen, onEditing, onLink }: { comment: Comment } & ConversationActions) {
  const parts = comment.heading.split(' · ');
  const who = parts[1] ?? '评论';
  const actor = commentModel(properties, comment.id, parts[2]?.trim());
  const isAgent = !!actor && actor !== 'human';
  return <div className="comment-meta">
    <strong>{who}</strong>
    {isAgent && <Badge variant="outline" title={/^gpt-6(?:\.\d+)?$/i.test(actor) ? '这条历史评论未记录具体模型版本' : undefined}>{actor === 'unknown' ? '模型未知' : actor}</Badge>}
    <time>{parts[0]}</time>
    {isAgent && <CommentConversation properties={properties} commentId={comment.id} disabled={disabled} onOpen={onOpen} onEditing={onEditing} onLink={(url, title) => onLink(comment.id, url, title)} />}
  </div>;
}

export function IssueComments({ comments, ...actions }: { comments: Comment[] } & ConversationActions) {
  return <div className="comments">{comments.map(comment => {
    const who = comment.heading.split(' · ')[1] ?? '评论';
    return <div className="comment" key={comment.id}>
      <Avatar className="size-8"><AvatarFallback>{who.slice(0, 1).toUpperCase()}</AvatarFallback></Avatar>
      <div className="comment-body"><CommentMetadata comment={comment} {...actions} /><Markdown text={comment.body} /></div>
    </div>;
  })}{!comments.length && <div className="no-comments">补充要求、讨论方案，或者记录工作进展。</div>}</div>;
}

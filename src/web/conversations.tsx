import React, { useState } from 'react';
import { ArrowUpRight, MessagesSquare, Plus } from 'lucide-react';
import { conversationLinks, type ConversationLink } from '../conversation-links.js';

type Open = (url: string) => Promise<unknown>;
function Link({ conversation, onOpen }: { conversation: ConversationLink; onOpen?: Open }) {
  return <a className="conversation-link" href={conversation.url} title={conversation.title} aria-label={`打开对话：${conversation.title}`} target="_blank" rel="noopener noreferrer" draggable={false} onClick={event => {
    event.stopPropagation();
    if (onOpen) { event.preventDefault(); void onOpen(conversation.url); }
  }}><MessagesSquare size={12} aria-hidden="true" /><span>{conversation.title}</span><ArrowUpRight size={11} aria-hidden="true" /></a>;
}

export function ConversationLinks({ properties, onOpen, compact = false }: { properties: Record<string, unknown>; onOpen?: Open; compact?: boolean }) {
  const links = conversationLinks(properties);
  if (!links.length) return null;
  if (!compact) return <div className="conversation-list">{links.map(link => <Link key={link.url} conversation={link} onOpen={onOpen} />)}</div>;
  const latest = links.at(-1)!;
  return <div className="card-conversations" onClick={event => event.stopPropagation()} onDragStart={event => { event.preventDefault(); event.stopPropagation(); }}>
    <Link conversation={latest} onOpen={onOpen} />
    {links.length > 1 && <details className="more-conversations"><summary aria-label={`查看其余 ${links.length - 1} 个对话`}>+{links.length - 1}</summary><div className="conversation-popover">{links.slice(0, -1).map(link => <Link key={link.url} conversation={link} onOpen={onOpen} />)}</div></details>}
  </div>;
}

export function ConversationSection({ properties, disabled, onOpen, onLink }: { properties: Record<string, unknown>; disabled: boolean; onOpen?: Open; onLink: (url: string, title: string) => Promise<boolean> }) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [expanded, setExpanded] = useState(false);
  return <section className="assigned-conversations" aria-label="已分配对话">
    <h3>已分配对话</h3>
    <ConversationLinks properties={properties} onOpen={onOpen} />
    <details open={expanded} onToggle={event => setExpanded(event.currentTarget.open)}><summary><Plus size={13} />关联对话</summary>
      <form onSubmit={async event => {
        event.preventDefault();
        if (await onLink(url.trim(), title.trim())) { setUrl(''); setTitle(''); setExpanded(false); }
      }}>
        <label>对话链接<input aria-label="对话链接" required type="text" placeholder="粘贴对话链接…" value={url} onChange={event => setUrl(event.target.value)} maxLength={2048} /></label>
        <label>名称（可选）<input aria-label="对话名称" value={title} onChange={event => setTitle(event.target.value)} placeholder="对话名称" maxLength={500} /></label>
        <button className="conversation-save" type="submit" disabled={disabled || !url.trim()}>保存关联</button>
      </form>
    </details>
  </section>;
}

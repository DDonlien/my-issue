import { CornerDownLeft } from 'lucide-react';
import { Button } from './components/ui/button.js';
import { Input } from './components/ui/input.js';
import { Textarea } from './components/ui/textarea.js';

export function CommentComposer({ value, author, busy, onChange, onAuthorChange, onSubmit }: {
  value: string; author: string; busy: boolean;
  onChange: (value: string) => void; onAuthorChange: (value: string) => void; onSubmit: () => void;
}) {
  return <form className="comment-compose" aria-label="追加评论" onSubmit={event => { event.preventDefault(); onSubmit(); }}>
    <Textarea className="min-h-[90px] resize-none rounded-none border-0 bg-transparent px-0 py-3 shadow-none dark:bg-transparent" aria-label="评论内容" placeholder="留下评论…" rows={3} value={value} onChange={event => onChange(event.target.value)} />
    <div><label>作者<Input className="h-8 w-36" aria-label="评论作者" placeholder="用户名" value={author} onChange={event => onAuthorChange(event.target.value)} /></label><Button disabled={busy || !value.trim() || !author.trim()}>追加评论<CornerDownLeft size={14} /></Button></div>
  </form>;
}

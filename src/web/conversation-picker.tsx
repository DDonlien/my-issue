import React, { useId, useState } from 'react';
import { MessagesSquare, Pencil, Plus } from 'lucide-react';
import { conversationUrl, type ConversationLink } from '../conversation-links.js';
import { Button } from './components/ui/button.js';
import { Input } from './components/ui/input.js';
import { Label } from './components/ui/label.js';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './components/ui/dialog.js';

export function ConversationPicker({ kind, conversation, disabled, onSave, onEditing }: { kind: 'current' | 'comment'; conversation?: ConversationLink; disabled: boolean; onSave: (url: string, title: string) => Promise<boolean>; onEditing: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const id = useId();
  const label = kind === 'current' ? '当前对话' : '评论对话';
  function changeOpen(value: boolean) {
    if (saving) return;
    if (value) { setUrl(conversation?.url ?? ''); setTitle(conversation?.title ?? ''); setError(''); }
    setOpen(value); onEditing(value);
  }
  return <Dialog open={open} onOpenChange={changeOpen}>
    <DialogTrigger asChild><Button type="button" variant="ghost" size="sm" className="conversation-edit" disabled={disabled} aria-label={conversation ? `更换${label}` : `关联${label}`}>
      {conversation ? <Pencil size={12} /> : kind === 'comment' ? <MessagesSquare size={12} /> : <Plus size={13} />}
      {!conversation && (kind === 'current' ? '关联当前对话' : '关联对话')}
    </Button></DialogTrigger>
    <DialogContent className="rounded-2xl" onEscapeKeyDown={event => { if (saving) event.preventDefault(); }} onPointerDownOutside={event => { if (saving) event.preventDefault(); }}>
      <DialogHeader><DialogTitle>{label}</DialogTitle><DialogDescription>{kind === 'current' ? '选择正在处理这个 Issue 的对话。' : '关联这条评论的来源对话。'}</DialogDescription></DialogHeader>
      <form className="dialog-form" onSubmit={async event => {
        event.preventDefault();
        if (!conversationUrl(url.trim())) { setError('请填写有效的对话链接'); return; }
        setSaving(true); setError('');
        try { if (await onSave(url.trim(), title.trim())) { setOpen(false); onEditing(false); } }
        catch (failure) { setError((failure as Error).message); }
        finally { setSaving(false); }
      }}>
        <div className="field"><Label htmlFor={id + '-url'}>对话链接</Label><Input id={id + '-url'} required disabled={saving} placeholder="粘贴对话链接…" value={url} onChange={event => setUrl(event.target.value)} maxLength={2048} /></div>
        <div className="field"><Label htmlFor={id + '-title'}>名称（可选）</Label><Input id={id + '-title'} disabled={saving} value={title} onChange={event => setTitle(event.target.value)} placeholder="对话名称" maxLength={500} /></div>
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <DialogFooter><Button type="button" variant="outline" disabled={saving} onClick={() => changeOpen(false)}>取消</Button><Button type="submit" disabled={saving || disabled || !url.trim()}>{saving ? '保存中…' : '保存关联'}</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

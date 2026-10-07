import { useEffect, useState } from 'react';
import { ArrowUpRight, Loader2 } from 'lucide-react';
import type { CodexConversation } from '../codex-chats.js';
import * as bridge from './bridge.js';
import { Button } from './components/ui/button.js';
import { Label } from './components/ui/label.js';
import { Textarea } from './components/ui/textarea.js';
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from './components/ui/select.js';

type Props = { root: string; id: string; busy: boolean; connected: boolean; hasDraft: boolean; run: <T>(action: () => Promise<T>) => Promise<T | undefined>; onSaved: () => Promise<void>; notify: (text: string) => void };

export function DispatchPanel({ root, id, busy, connected, hasDraft, run, onSaved, notify }: Props) {
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState('new');
  const [instruction, setInstruction] = useState('');
  const [conversations, setConversations] = useState<CodexConversation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refresh, setRefresh] = useState(0);
  useEffect(() => {
    if (!open || !connected) return;
    let cancelled = false;
    setLoading(true); setError(''); setConversations([]);
    bridge.call('list_codex_conversations').then(data => {
      if (!Array.isArray(data.conversations)) throw new Error('Codex 对话列表无效');
      if (!cancelled) setConversations(data.conversations);
    }).catch(error => { if (!cancelled) setError(error.message); }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [open, connected, root, id, refresh]);
  const selected = conversations.find(chat => target === `thread:${chat.id}`);
  const available = target === 'new' || target === 'active' ? bridge.canDispatch(target) : !!selected?.canSend && !loading;
  const project = conversations.filter(chat => chat.cwd === root);
  const other = conversations.filter(chat => chat.cwd !== root);
  function options(chats: CodexConversation[]) {
    return chats.map(chat => <SelectItem key={chat.id} value={`thread:${chat.id}`} title={chat.title} className="dispatch-target-item"><span>{chat.title}</span></SelectItem>);
  }
  return <div className="dispatch-box">
    <Button disabled={busy || !connected} onClick={() => setOpen(!open)}>分发到对话<ArrowUpRight size={14} /></Button>
    {open && <div className="dispatch-options">
      <Label htmlFor="dispatch-target">目标</Label>
      <Select value={target} onValueChange={setTarget} disabled={busy}>
        <SelectTrigger id="dispatch-target" aria-label="分发目标"><SelectValue /></SelectTrigger>
        <SelectContent position="popper" className="dispatch-target-menu">
          <SelectItem value="new">新对话</SelectItem><SelectItem value="active">当前对话</SelectItem>
          {!!project.length && <SelectGroup><SelectLabel>当前项目</SelectLabel>{options(project)}</SelectGroup>}
          {!!other.length && <SelectGroup><SelectLabel>已有对话</SelectLabel>{options(other)}</SelectGroup>}
          {loading && <SelectItem value="loading" disabled>正在读取对话…</SelectItem>}
          {!loading && !conversations.length && <SelectItem value="empty" disabled>{error ? '未能读取对话' : '暂无已有对话'}</SelectItem>}
        </SelectContent>
      </Select>
      {error && <div className="dispatch-retry"><Button variant="ghost" size="sm" onClick={() => setRefresh(value => value + 1)}>重新读取对话</Button></div>}
      <Textarea rows={3} aria-label="分发指令" placeholder="补充这次对话要做的事（可选）" value={instruction} onChange={event => setInstruction(event.target.value)} disabled={busy} />
      <Button disabled={busy || !available || hasDraft} onClick={() => run(async () => {
        if (hasDraft) throw new Error('请先保存修改或追加评论，再分发最新内容');
        if (target === 'new' || target === 'active') {
          const data = await bridge.call('prepare_dispatch', { root, id, instruction });
          await bridge.send(data.prompt, target);
          notify(target === 'new' ? '已发送到新对话' : '已发送到当前对话');
        } else {
          if (!selected?.canSend) throw new Error('所选对话暂不可发送');
          const result = await bridge.call('dispatch_to_conversation', { root, id, threadId: selected.id, instruction });
          notify(`已发送到「${result.conversation.title}」${result.associationError ? '；对话关联未保存：' + result.associationError : ''}`);
          setOpen(false); setInstruction('');
          await onSaved();
          return;
        }
        setOpen(false); setInstruction('');
      })}>{busy ? <Loader2 className="animate-spin" /> : null}发送<ArrowUpRight size={14} /></Button>
    </div>}
  </div>;
}

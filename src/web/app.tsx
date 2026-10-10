import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Columns3, List, Search, Plus, MessageSquare, X, Folder, Circle, Check, FileText, SlidersHorizontal, ArrowLeft, CheckCircle2, Pencil, AlertCircle, Loader2, Paperclip } from 'lucide-react';
import { parseDocument, stringify } from 'yaml';
import type { Board, Issue } from '../core.js';
import * as bridge from './bridge.js';
import { Markdown, AttachmentProvider } from './markdown.js';
import { PropertyList } from './properties.js';
import { ConversationLinks, ConversationSection } from './conversations.js';
import { CONVERSATION_PROPERTIES } from '../conversation-links.js';
import { IssueComments } from './comments.js';
import { MAX_ATTACHMENT_BYTES } from '../attachment-links.js';
import type { Project } from '../preferences.js';
import { ProjectMenu, ProjectDialog } from './project-menu.js';
import { Button } from './components/ui/button.js';
import { Input } from './components/ui/input.js';
import { Textarea } from './components/ui/textarea.js';
import { Label } from './components/ui/label.js';
import { Badge } from './components/ui/badge.js';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog.js';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './components/ui/select.js';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs.js';
import { Toggle } from './components/ui/toggle.js';
import { createHeartbeat, retainSnapshot } from './heartbeat.js';
import { IssueName } from './issue-name.js';
import { CommentComposer } from './comment-composer.js';
import './style.css';
import './conversations.css';
import { DispatchPanel } from './dispatch.js';

function yaml(text: string) {
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length) throw new Error(doc.errors[0].message);
  const data = doc.toJS({ maxAliasCount: 30 }) ?? {};
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error('属性需要 key: value 格式');
  return data as Record<string, unknown>;
}
function short(value: unknown) { return typeof value === 'string' ? value : JSON.stringify(value); }
function readAuthor(username: string) { try { const saved = localStorage.getItem('myissue-author')?.trim(); return saved && saved !== '我' ? saved : username; } catch { return username; } }
function rememberAuthor(author: string) { try { localStorage.setItem('myissue-author', author); } catch { /* Sandboxed hosts may disable storage. */ } }
function App() {
  const [board, setBoard] = useState<Board>();
  const [projects, setProjects] = useState<Project[]>([]);
  const [username, setUsername] = useState('');
  const [selected, setSelected] = useState<string>();
  const [view, setView] = useState<'board' | 'list'>('board');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('*');
  const [readyOnly, setReadyOnly] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [connected, setConnected] = useState(false);
  const [creating, setCreating] = useState<string | null>(null);
  const [projectModal, setProjectModal] = useState(false);
  const [projectLoading, setProjectLoading] = useState(false);
  const [projectMenuOpen, setProjectMenuOpen] = useState(false);
  const [rootDraft, setRootDraft] = useState('');
  const [dragging, setDragging] = useState<string>();
  const [dropColumn, setDropColumn] = useState<string>();
  const dirty = useRef(false);
  const refreshGeneration = useRef(0);
  const connectionReady = useRef(false);
  const dialogOpen = useRef(false);
  dialogOpen.current = projectModal || projectMenuOpen || creating !== null;
  const rootRef = useRef<string | undefined>(undefined);
  const busyRef = useRef(false);
  const selectedIssue = board?.issues.find(i => i.id === selected);
  const projectName = projects.find(project => project.root === board?.root)?.name ?? board?.project;
  const filtered = board?.issues.filter(i => (!query || `${i.name} ${i.id} ${i.description} ${stringify(i.properties)} ${i.comments.map(c => c.body).join(' ')}`.toLowerCase().includes(query.toLowerCase())) && (statusFilter === '*' || i.status === statusFilter) && (!readyOnly || i.ready)) ?? [];

  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    if (busyRef.current) return;
    refreshGeneration.current++;
    busyRef.current = true; setBusy(true); setError('');
    try { return await action(); } catch (e) { setError((e as Error).message); return undefined; }
    finally { busyRef.current = false; setBusy(false); }
  }
  function accept(data: bridge.ToolData) {
    if (data.error) { setError(data.error.message); return; }
    if (typeof data.username === 'string') setUsername(data.username);
    if (data.projects) setProjects(previous => retainSnapshot(previous, data.projects));
    if (data.board) {
      if (rootRef.current !== data.board.root) { setSelected(undefined); setStatusFilter('*'); }
      rootRef.current = data.board.root; setBoard(previous => retainSnapshot(previous, data.board));
    }
    if (data.issueId) setSelected(data.issueId);
  }
  async function load(root = rootRef.current, activate = false) {
    if (!root) return;
    const data = await bridge.call(activate ? 'open_board' : 'list_issues', { root });
    if (activate || rootRef.current === root) accept(data);
  }
  useEffect(() => {
    bridge.onResult(accept);
    bridge.connect().then(async () => {
      connectionReady.current = true; setConnected(true);
      if (!rootRef.current) accept(await bridge.call('open_board'));
    }).catch(e => setError(e.message));
    const heartbeat = createHeartbeat({
      canRead: () => connectionReady.current && !dialogOpen.current && !dirty.current && !busyRef.current && document.visibilityState === 'visible',
      generation: () => refreshGeneration.current,
      read: async () => {
        const root = rootRef.current;
        const [issues, projects] = await Promise.all([
          root ? bridge.call('list_issues', { root }) : Promise.resolve(undefined),
          bridge.call('list_projects', { refresh: false }),
        ]);
        return { root, issues, projects };
      },
      apply: ({ root, issues, projects }) => {
        if (root !== rootRef.current) return;
        if (issues) accept(issues);
        accept(projects);
      },
      onError: error => setError((error as Error).message),
    });
    const check = () => { void heartbeat.tick(); };
    const interval = setInterval(check, 2000);
    window.addEventListener('focus', check);
    document.addEventListener('visibilitychange', check);
    return () => {
      connectionReady.current = false; heartbeat.stop(); clearInterval(interval);
      window.removeEventListener('focus', check);
      document.removeEventListener('visibilitychange', check);
    };
  }, []);
  useEffect(() => { if (selected && board) bridge.context(board.root, selected).catch(() => {}); }, [selected, board?.root]);
  useEffect(() => { if (!notice) return; const timer = setTimeout(() => setNotice(''), 5000); return () => clearTimeout(timer); }, [notice]);
  useEffect(() => {
    if (!projectMenuOpen || !connected) return;
    let cancelled = false;
    setProjectLoading(true);
    bridge.call('list_projects').then(data => { if (!cancelled) accept(data); }).catch(e => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setProjectLoading(false); });
    return () => { cancelled = true; };
  }, [projectMenuOpen, connected]);

  async function openProject(root: string) {
    await run(async () => {
      if (dirty.current && !window.confirm('丢弃当前草稿并切换项目？')) return;
      await load(root, true);
      dirty.current = false; setSelected(undefined); setProjectModal(false);
    });
  }

  function choose(id?: string) {
    if (dirty.current && !window.confirm('当前有未保存草稿。丢弃草稿并切换？')) return false;
    dirty.current = false; setSelected(id);
    return true;
  }
  async function move(issue: Issue, status: string) {
    if (!board || issue.status === status) return;
    await run(async () => {
      await bridge.call('update_issue', { root: board.root, id: issue.id, revision: issue.revision, properties: { [board.schema.statusKey]: status } });
      await load(); setNotice('状态已保存');
    });
  }
  return <div className="shell" aria-busy={busy}>
    <main className="main">
      <header className="topbar">
        <ProjectMenu projects={projects} root={board?.root} name={projectName} busy={busy} loading={projectLoading} onOpenChange={setProjectMenuOpen} onSelect={openProject} onAdd={() => { setRootDraft(''); setError(''); setProjectModal(true); }} />
      </header>
      {error && !projectModal && <div className="banner error" role="alert"><AlertCircle size={16} /><span>{error}</span><Button variant="ghost" size="icon-sm" onClick={() => setError('')} aria-label="关闭错误"><X /></Button></div>}
      {notice && <div className="toast" role="status"><Check size={15} />{notice}</div>}
      {!board ? <div className="welcome"><div className="welcome-icon"><Columns3 size={30} /></div><h1>让工作留在项目里</h1><p>把 Issue 放进 Markdown，<br />从这里看进度，在对话里继续工作。</p><Button onClick={() => { setRootDraft(''); setProjectModal(true); }}><Folder />添加项目</Button><span>{connected ? '项目配置会在这台电脑的所有面板间共享' : '正在连接宿主…'}</span></div> : selectedIssue ?
        <Detail key={board.root + selectedIssue.id} issue={selectedIssue} board={board} username={username} busy={busy} connected={connected} onClose={() => choose()} onSelect={id => { choose(id); }} onDirty={value => { if (dirty.current !== value) refreshGeneration.current++; dirty.current = value; }} run={run} onSaved={async () => { await load(); }} notify={setNotice} /> : <>
          <div className="page-heading"><h1>{readyOnly ? '可开始的 Issue' : 'Issues'}<Badge variant="secondary">{filtered.length}</Badge></h1><Button data-create-issue disabled={busy} onClick={() => setCreating(board.schema.columns[0].value)}><Plus />新建 Issue</Button></div>
          <Tabs className="board-workspace" value={view} onValueChange={value => setView(value as 'board' | 'list')}>
          <div className="toolbar"><div className="toolbar-views"><TabsList aria-label="Issue 视图"><TabsTrigger value="board"><Columns3 />看板</TabsTrigger><TabsTrigger value="list"><List />列表</TabsTrigger></TabsList><Toggle aria-label="只看可开始" pressed={readyOnly} onPressedChange={value => setReadyOnly(value)}><CheckCircle2 />可开始</Toggle></div><div className="toolbar-right"><div className="search"><Search className="size-4" /><Input id="search" className="pl-9" aria-label="搜索 Issue" placeholder="搜索名称、属性、评论…" value={query} onChange={e => setQuery(e.target.value)} /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger aria-label="按状态筛选"><SlidersHorizontal /><SelectValue /></SelectTrigger><SelectContent position="popper"><SelectItem value="*">全部状态</SelectItem>{board.columns.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div></div>
          {board.errors.length > 0 && <details className="file-errors"><summary><AlertCircle size={14} />{board.errors.length} 条文件或关系问题</summary>{board.errors.map((e, i) => <p key={i}><code>{e.filename}</code> {e.message}</p>)}</details>}
          <TabsContent value="board" className="board-panel"><div className="board">{board.columns.map(column => <section key={column.value} className={'column ' + (dropColumn === column.value ? 'drop-target' : '')} style={{ '--column-color': column.color } as React.CSSProperties} aria-label={column.label} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropColumn(column.value); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropColumn(undefined); }} onDrop={e => { e.preventDefault(); const issue = board.issues.find(i => i.id === e.dataTransfer.getData('text/plain')); if (issue) move(issue, column.value); setDropColumn(undefined); setDragging(undefined); }}>
            <div className="column-heading"><span className="status-dot" /><strong>{column.label}</strong><span className="count">{filtered.filter(i => i.status === column.value).length}</span><Button variant="ghost" size="icon-sm" title={'新建' + column.label + ' Issue'} aria-label={'新建' + column.label + ' Issue'} onClick={() => setCreating(column.value)}><Plus /></Button></div>
            <div className="cards">{filtered.filter(i => i.status === column.value).map(issue => <article key={issue.id} className={'issue-card ' + (dragging === issue.id ? 'dragging' : '')} draggable={!busy} onDragStart={e => { e.dataTransfer.setData('text/plain', issue.id); setDragging(issue.id); }} onDragEnd={() => { setDragging(undefined); setDropColumn(undefined); }} onClick={() => choose(issue.id)}>
              <button type="button" className="card-open"><div className="card-id">{issue.id.startsWith('issue-') && issue.id.length > 20 ? issue.id.slice(0, 14) : issue.id}{issue.ready && <span className="ready-dot" title="依赖已满足，可开始" />}</div><h3>{issue.name}</h3>{issue.description && <p className="card-description">{issue.description.replace(/[#*`>]/g, '').slice(0, 110)}</p>}</button><div className="card-footer"><div className="chips">{Object.entries(issue.properties).filter(([k]) => ![board.schema.statusKey, 'id', ...CONVERSATION_PROPERTIES].includes(k)).slice(0, 2).map(([k, v]) => <span key={k} className="chip" title={`${k}: ${short(v)}`}>{k}: {short(v)}</span>)}</div><ConversationLinks properties={issue.properties} compact onOpen={bridge.preview ? undefined : url => run(() => bridge.openConversation(url))} />{issue.comments.length > 0 && <span className="comment-count"><MessageSquare size={12} />{issue.comments.length}</span>}</div>
            </article>)}{filtered.every(i => i.status !== column.value) && <button className="empty-column" onClick={() => setCreating(column.value)}><Plus size={14} />添加 Issue</button>}</div>
          </section>)}</div></TabsContent><TabsContent value="list" className="list-panel"><div className="issue-list"><div className="list-heading"><span>名称</span><span>状态</span><span>评论</span></div>{filtered.map(issue => <button className="list-row" key={issue.id} onClick={() => choose(issue.id)}><span><Circle size={14} style={{ color: board.columns.find(c => c.value === issue.status)?.color }} /><strong>{issue.name}</strong><code>{issue.id.slice(0, 16)}</code></span><span>{board.columns.find(c => c.value === issue.status)?.label}</span><span><MessageSquare size={13} />{issue.comments.length}</span></button>)}{!filtered.length && <div className="empty-list">没有匹配的 Issue</div>}</div></TabsContent>
          </Tabs>
        </>}
    </main>
    <ProjectDialog open={projectModal} busy={busy} connected={connected} draft={rootDraft} error={error} onOpenChange={setProjectModal} onDraftChange={setRootDraft} onSubmit={() => openProject(rootDraft.trim())} onBrowse={() => run(async () => { const data = await bridge.call('browse_folder'); if (data.root) setRootDraft(data.root); })} />
    {creating !== null && board && <CreateModal status={creating} board={board} busy={busy} run={run} close={() => setCreating(null)} created={async issue => { await load(); setCreating(null); setSelected(issue.id); setNotice('Issue 已创建'); }} />}
  </div>;
}

type Run = <T>(action: () => Promise<T>) => Promise<T | undefined>;
function CreateModal({ status, board, busy, run, close, created }: { status: string; board: Board; busy: boolean; run: Run; close: () => void; created: (issue: Issue) => Promise<void> }) {
  const [name, setName] = useState(''); const [content, setContent] = useState(''); const [props, setProps] = useState(stringify({ [board.schema.statusKey]: status }));
  const input = useRef<HTMLInputElement>(null);
  return <Dialog open onOpenChange={open => { if (!open) close(); }}><DialogContent className="create-dialog rounded-2xl" showCloseButton={false} onOpenAutoFocus={event => { event.preventDefault(); input.current?.focus(); }}><DialogHeader><DialogTitle>新建 Issue</DialogTitle><DialogDescription>写下需要完成的事，再补充描述和属性。</DialogDescription></DialogHeader><form className="dialog-form" onSubmit={e => { e.preventDefault(); run(async () => { const data = await bridge.call('create_issue', { root: board.root, name, description: content, properties: yaml(props) }); await created(data.issue); }); }}><div className="field"><Label htmlFor="create-name">名称</Label><Input ref={input} id="create-name" required placeholder="这件事需要做什么？" value={name} onChange={e => setName(e.target.value)} /></div><div className="field"><Label htmlFor="create-content">描述 <span className="muted">可选 · Markdown</span></Label><Textarea id="create-content" rows={5} placeholder="补充上下文、目标或具体要求…" value={content} onChange={e => setContent(e.target.value)} /></div><div className="field"><Label htmlFor="create-properties">属性 <span className="muted">YAML</span></Label><Textarea id="create-properties" className="code-input" rows={4} value={props} onChange={e => setProps(e.target.value)} /></div><DialogFooter><DialogClose asChild><Button type="button" variant="outline">取消</Button></DialogClose><Button disabled={busy || !name.trim()}>{busy ? <Loader2 className="animate-spin" /> : <Plus />}创建 Issue</Button></DialogFooter></form></DialogContent></Dialog>;
}
function fileData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error(`无法读取附件：${file.name}`));
    reader.readAsDataURL(file);
  });
}
function Detail({ issue, board, username, busy, connected, onClose, onSelect, onDirty, run, onSaved, notify }: { issue: Issue; board: Board; username: string; busy: boolean; connected: boolean; onClose: () => void; onSelect: (id: string) => void; onDirty: (dirty: boolean) => void; run: Run; onSaved: () => Promise<void>; notify: (text: string) => void }) {
  const [baseline, setBaseline] = useState(issue);
  const [name, setName] = useState(issue.name);
  const [content, setContent] = useState(issue.description);
  const [properties, setProperties] = useState(stringify(issue.properties));
  const [editingContent, setEditingContent] = useState(false);
  const [editingProperties, setEditingProperties] = useState(false);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState(() => readAuthor(username));
  useEffect(() => { if (username) setAuthor(current => current || readAuthor(username)); }, [username]);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [linkingConversation, setLinkingConversation] = useState(false);
  const [draftRevision, setDraftRevision] = useState(issue.revision);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const changed = name !== baseline.name || content !== baseline.description || properties !== stringify(baseline.properties);
  const dirtyRef = useRef(false);
  dirtyRef.current = changed || !!comment;
  useEffect(() => { onDirty(changed || !!comment || linkingConversation); }, [changed, comment, linkingConversation]);
  useEffect(() => {
    if (!dirtyRef.current) { setBaseline(issue); setName(issue.name); setContent(issue.description); setProperties(stringify(issue.properties)); setDraftRevision(issue.revision); }
  }, [issue.revision]);
  async function save() {
    await run(async () => {
      const data = yaml(properties); const patch: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(data)) if (JSON.stringify(value) !== JSON.stringify(baseline.properties[key])) patch[key] = value;
      const removeProperties = Object.keys(baseline.properties).filter(key => !Object.hasOwn(data, key));
      const saved = await bridge.call('update_issue', { root: board.root, id: issue.id, revision: draftRevision, ...(name !== baseline.name ? { name } : {}), ...(content !== baseline.description ? { description: content } : {}), properties: patch, removeProperties });
      setBaseline(saved.issue); setName(saved.issue.name); setContent(saved.issue.description); setProperties(stringify(saved.issue.properties)); setDraftRevision(saved.issue.revision);
      dirtyRef.current = false; onDirty(false); await onSaved(); setEditingContent(false); setEditingProperties(false); notify('修改已保存');
    });
  }
  async function attach(files: File[]) {
    await run(async () => {
      if (changed) throw new Error('请先保存修改，再添加附件');
      if (files.some(file => file.size > MAX_ATTACHMENT_BYTES)) throw new Error('单个附件不能超过 10 MB');
      let latest = issue;
      try {
        for (const file of files) {
          const data = await bridge.call('upload_attachment', { root: board.root, id: issue.id, revision: latest.revision, name: file.name, data: await fileData(file) });
          latest = data.issue;
          setBaseline(latest); setContent(latest.description); setProperties(stringify(latest.properties)); setDraftRevision(latest.revision);
        }
      } finally { if (latest.revision !== issue.revision) { setEditingContent(false); await onSaved(); } }
      notify(`已添加 ${files.length} 个附件`);
    });
  }
  async function link(url: string, title: string, commentId?: string) {
    let failure: Error | undefined;
    const saved = await run(async () => {
      try {
        if (changed || comment.trim()) throw new Error('请先保存修改或追加评论，再关联对话');
        await bridge.call(commentId ? 'link_comment_conversation' : 'link_conversation', { root: board.root, id: issue.id, revision: issue.revision, url, ...(title ? { title } : {}), ...(commentId ? { commentId } : {}) });
        await onSaved(); notify(commentId ? '评论对话已关联' : '当前对话已更新'); return true;
      } catch (error) { failure = error as Error; throw error; }
    });
    if (failure) throw failure;
    return !!saved;
  }
  const col = board.columns.find(c => c.value === issue.status);
  return <AttachmentProvider root={board.root} id={issue.id} revision={issue.revision}><div className="detail-layout"><div className="detail-body">
    <article className="detail-main">
      <div className="detail-nav"><Button variant="ghost" size="sm" className="text-button" onClick={onClose}><ArrowLeft size={14} />返回看板</Button><code>{issue.filename}</code><Button variant="ghost" size="sm" className="text-button" onClick={() => setSourceOpen(!sourceOpen)}><FileText size={14} />源文件</Button></div>
      <div className="detail-content">
      <IssueName value={name} onChange={setName} />
      <div className="detail-meta"><span className="status-badge" style={{ color: col?.color }}><Circle size={13} />{col?.label}</span>{issue.ready && <span className="ready-badge"><CheckCircle2 size={12} />可开始</span>}<span><MessageSquare size={12} />{issue.comments.length} 条评论</span></div>
      <section className="detail-properties" aria-label="Issue 属性"><div className="properties-heading"><h2>属性</h2><Button variant="ghost" size="sm" className="text-button" onClick={() => setEditingProperties(!editingProperties)}><Pencil size={13} />{editingProperties ? '收起' : '编辑'}</Button></div><div className="status-control"><Label htmlFor="issue-status">状态</Label><Select value={issue.status} disabled={busy || changed} onValueChange={status => run(async () => { await bridge.call('update_issue', { root: board.root, id: issue.id, revision: issue.revision, properties: { [board.schema.statusKey]: status } }); dirtyRef.current = false; await onSaved(); notify('状态已保存'); })}><SelectTrigger id="issue-status" aria-label="Issue 状态"><SelectValue /></SelectTrigger><SelectContent position="popper">{board.columns.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
      {editingProperties ? <><Textarea className="properties-editor code-input" aria-label="YAML 属性" rows={10} value={properties} onChange={e => setProperties(e.target.value)} /><p className="muted">保留任意属性。删除一行会删除该属性；状态列由状态属性推导。</p></> : <><PropertyList properties={issue.properties} board={board} onSelect={onSelect} /><Button variant="ghost" size="sm" className="add-property" onClick={() => setEditingProperties(true)}><Plus size={14} />添加属性</Button></>}
      {!!issue.children?.length && <div className="derived"><span>子 Issue</span>{issue.children.map(child => <code key={child}>{child}</code>)}</div>}
      </section>
      {draftRevision !== issue.revision && changed && <div className="draft-warning"><AlertCircle size={14} />文件已更新。草稿保留，先查看源文件，再重新加载。<Button variant="ghost" size="sm" className="text-button" onClick={() => { if (window.confirm('丢弃草稿并载入最新文件？')) { setBaseline(issue); setName(issue.name); setContent(issue.description); setProperties(stringify(issue.properties)); setDraftRevision(issue.revision); } }}>载入最新</Button></div>}
      {sourceOpen && <pre className="source-view">{issue.raw}</pre>}
      <div className="content-heading"><span>描述</span><div className="content-actions"><Button variant="ghost" size="sm" className="text-button" disabled={busy || changed || !connected} onClick={() => attachmentInput.current?.click()}><Paperclip size={13} />添加附件</Button><Button variant="ghost" size="sm" className="text-button" onClick={() => setEditingContent(!editingContent)}><Pencil size={13} />{editingContent ? '预览' : '编辑'}</Button></div><input className="attachment-input" ref={attachmentInput} type="file" multiple aria-label="选择附件" onChange={event => { const files = [...(event.currentTarget.files ?? [])]; event.currentTarget.value = ''; if (files.length) attach(files); }} /></div>
      {editingContent ? <Textarea className="content-editor" rows={9} value={content} onChange={e => setContent(e.target.value)} aria-label="Issue 描述" /> : content ? <Markdown text={content} /> : <Button variant="ghost" className="empty-content" onClick={() => setEditingContent(true)}>补充这件事的上下文…</Button>}
      {changed && <div className="save-row"><span>有未保存的修改</span><Button disabled={busy} onClick={save}><Check size={14} />保存修改</Button></div>}
      <div className="comments-heading"><h2>评论<span>{issue.comments.length}</span></h2></div>
      <IssueComments comments={issue.comments} properties={issue.properties} disabled={busy || changed || !!comment.trim()} onOpen={bridge.preview ? undefined : url => run(() => bridge.openConversation(url))} onEditing={setLinkingConversation} onLink={(commentId, url, title) => link(url, title, commentId)} />
      </div>
    </article>
    <aside className="detail-aside">
      <ConversationSection properties={issue.properties} disabled={busy || changed || !!comment.trim()} onOpen={bridge.preview ? undefined : url => run(() => bridge.openConversation(url))} onEditing={setLinkingConversation} onLink={link} />
      <DispatchPanel root={board.root} id={issue.id} busy={busy} connected={connected} hasDraft={changed || !!comment.trim()} run={run} onSaved={onSaved} notify={notify} />
    </aside>
    </div><CommentComposer value={comment} author={author} busy={busy} onChange={setComment} onAuthorChange={setAuthor} onSubmit={() => run(async () => { if (changed) throw new Error('请先保存名称、描述或属性修改，再追加评论'); await bridge.call('append_comment', { root: board.root, id: issue.id, revision: issue.revision, body: comment, author: author.trim(), actor: 'human' }); rememberAuthor(author.trim()); setComment(''); dirtyRef.current = false; onDirty(false); await onSaved(); notify('评论已追加'); })} />
  </div></AttachmentProvider>;
}

document.addEventListener('keydown', e => {
  if (e.defaultPrevented || (e.target as HTMLElement)?.closest('input,textarea,select,[contenteditable="true"],[role="combobox"],[role="dialog"],[role="menu"],[role="listbox"]') || document.querySelector('[data-slot="dialog-content"],[data-slot="dropdown-menu-content"],[data-slot="select-content"]') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === '/') { e.preventDefault(); document.getElementById('search')?.focus(); }
  if (e.key.toLowerCase() === 'c') document.querySelector<HTMLButtonElement>('[data-create-issue]')?.click();
});
createRoot(document.getElementById('root')!).render(<App />);

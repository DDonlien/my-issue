import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Columns3, List, Search, Plus, ArrowUpRight, MessageSquare, X, ChevronDown, Folder, Circle, Check, FileText, SlidersHorizontal, ArrowLeft, CheckCircle2, Pencil, AlertCircle, Loader2, CornerDownLeft, Paperclip } from 'lucide-react';
import { parseDocument, stringify } from 'yaml';
import type { Board, Issue } from '../core.js';
import * as bridge from './bridge.js';
import { Markdown, AttachmentProvider } from './markdown.js';
import { PropertyList } from './properties.js';
import { attachmentReferences, MAX_ATTACHMENT_BYTES } from '../attachment-links.js';
import { createHeartbeat, retainSnapshot } from './heartbeat.js';
import './style.css';

type Project = { root: string; name: string };
function yaml(text: string) {
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length) throw new Error(doc.errors[0].message);
  const data = doc.toJS({ maxAliasCount: 30 }) ?? {};
  if (typeof data !== 'object' || Array.isArray(data)) throw new Error('属性需要 key: value 格式');
  return data as Record<string, unknown>;
}
function short(value: unknown) { return typeof value === 'string' ? value : JSON.stringify(value); }
function readAuthor() { try { return localStorage.getItem('myissue-author') ?? '我'; } catch { return '我'; } }
function rememberAuthor(author: string) { try { localStorage.setItem('myissue-author', author); } catch { /* Sandboxed hosts may disable storage. */ } }
function DialogForm({ children, onClose, ...props }: React.ComponentProps<'form'> & { onClose: () => void }) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus();
    return () => { if (previous?.isConnected) previous.focus(); };
  }, []);
  return <form {...props} ref={ref} role="dialog" aria-modal="true" onKeyDown={e => {
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    if (e.key !== 'Tab') return;
    const controls = [...e.currentTarget.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(el => el.getClientRects().length);
    const first = controls[0], last = controls.at(-1);
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
  }}>{children}</form>;
}
function App() {
  const [board, setBoard] = useState<Board>();
  const [projects, setProjects] = useState<Project[]>([]);
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
  const [rootDraft, setRootDraft] = useState('');
  const [dragging, setDragging] = useState<string>();
  const [dropColumn, setDropColumn] = useState<string>();
  const dirty = useRef(false);
  const refreshGeneration = useRef(0);
  const connectionReady = useRef(false);
  const dialogOpen = useRef(false);
  dialogOpen.current = projectModal || creating !== null;
  const rootRef = useRef<string | undefined>(undefined);
  const busyRef = useRef(false);
  const selectedIssue = board?.issues.find(i => i.id === selected);
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
    if (data.projects) setProjects(previous => retainSnapshot(previous, data.projects));
    if (data.board) { rootRef.current = data.board.root; setBoard(previous => retainSnapshot(previous, data.board)); setRootDraft(data.board.root); }
    if (data.issueId) setSelected(data.issueId);
  }
  async function load(root = rootRef.current) {
    if (!root) return;
    accept(await bridge.call('open_board', { root }));
  }
  useEffect(() => {
    bridge.onResult(accept);
    bridge.connect().then(async () => {
      connectionReady.current = true; setConnected(true);
      if (bridge.preview) accept(await bridge.call('open_board'));
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
    if (!projectModal || !connected) return;
    let cancelled = false;
    setProjectLoading(true);
    bridge.call('list_projects').then(data => { if (!cancelled) accept(data); }).catch(e => { if (!cancelled) setError(e.message); }).finally(() => { if (!cancelled) setProjectLoading(false); });
    return () => { cancelled = true; };
  }, [projectModal, connected]);

  async function openProject(root: string) {
    await run(async () => {
      if (dirty.current && !window.confirm('丢弃当前草稿并切换项目？')) return;
      await load(root);
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
    <aside className="sidebar" inert={projectModal || creating !== null}>
      <div className="brand"><div className="brand-icon"><Columns3 size={19} /></div><span>myIssue</span><span className="version">local</span></div>
      <button className="project-button" onClick={() => setProjectModal(true)}><Folder size={16} /><span>{board?.project ?? '选择项目'}</span><ChevronDown size={14} /></button>
      <button className="nav-search" onClick={() => document.getElementById('search')?.focus()}><Search size={16} />搜索 Issue<span className="key">/</span></button>
      <button className="nav-create" disabled={!board} onClick={() => setCreating(board!.schema.columns[0].value)}><Plus size={16} />新建 Issue<span className="key">C</span></button>
      <div className="nav-label">工作空间</div>
      <button className={'nav-item ' + (!readyOnly ? 'active' : '')} aria-current={!readyOnly ? 'page' : undefined} onClick={() => { if (choose()) setReadyOnly(false); }}><Columns3 size={16} />全部 Issue<span>{board?.issues.length ?? 0}</span></button>
      <button className={'nav-item ' + (readyOnly ? 'active' : '')} aria-current={readyOnly ? 'page' : undefined} onClick={() => { if (choose()) setReadyOnly(true); }}><CheckCircle2 size={16} />可开始<span>{board?.issues.filter(i => i.ready).length ?? 0}</span></button>
      <div className="sidebar-footer"><div className="small-dot" />文件实时同步<div className="store-label" title={board?.root}>{board ? `${board.project}/issues/*.md` : '项目根目录 / issues'}</div></div>
    </aside>
    <main className="main" inert={projectModal || creating !== null}>
      <header className="topbar"><span className="breadcrumb"><Columns3 size={16} />Issue <span>/</span><strong>{selectedIssue ? selectedIssue.name : readyOnly ? '可开始' : '全部'}</strong></span></header>
      {error && !projectModal && <div className="banner error" role="alert"><AlertCircle size={16} /><span>{error}</span><button onClick={() => setError('')} aria-label="关闭错误"><X size={15} /></button></div>}
      {notice && <div className="toast" role="status"><Check size={15} />{notice}</div>}
      {!board ? <div className="welcome"><div className="welcome-icon"><Columns3 size={30} /></div><h1>让工作留在项目里</h1><p>把 Issue 放进 Markdown，<br />从这里看进度，在对话里继续工作。</p><button className="primary" onClick={() => setProjectModal(true)}><Folder size={16} />选择项目文件夹</button><span>{connected ? '从项目根目录的 issues 文件夹读取' : '正在连接宿主…'}</span></div> : selectedIssue ?
        <Detail key={selectedIssue.id} issue={selectedIssue} board={board} busy={busy} connected={connected} onClose={() => choose()} onSelect={id => { choose(id); }} onDirty={value => { if (dirty.current !== value) refreshGeneration.current++; dirty.current = value; }} run={run} onSaved={async () => { await load(); }} notify={setNotice} /> : <>
          <div className="page-heading"><div><div className="eyebrow">{board.project}</div><h1>{readyOnly ? '可开始的 Issue' : 'Issue 看板'}<span>{filtered.length}</span></h1></div><button className="primary" disabled={busy} onClick={() => setCreating(board.schema.columns[0].value)}><Plus size={16} />新建 Issue</button></div>
          <div className="toolbar"><div className="segmented"><button className={view === 'board' ? 'selected' : ''} onClick={() => setView('board')}><Columns3 size={14} />看板</button><button className={view === 'list' ? 'selected' : ''} onClick={() => setView('list')}><List size={14} />列表</button></div><div className="toolbar-right"><div className="search"><Search size={14} /><input id="search" placeholder="搜索名称、属性、评论…" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="filter"><SlidersHorizontal size={14} /><select aria-label="按状态筛选" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}><option value="*">全部状态</option>{board.columns.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div></div></div>
          {board.errors.length > 0 && <details className="file-errors"><summary><AlertCircle size={14} />{board.errors.length} 条文件或关系问题</summary>{board.errors.map((e, i) => <p key={i}><code>{e.filename}</code> {e.message}</p>)}</details>}
          {view === 'board' ? <div className="board">{board.columns.map(column => <section key={column.value} className={'column ' + (dropColumn === column.value ? 'drop-target' : '')} style={{ '--column-color': column.color } as React.CSSProperties} aria-label={column.label} onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDropColumn(column.value); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDropColumn(undefined); }} onDrop={e => { e.preventDefault(); const issue = board.issues.find(i => i.id === e.dataTransfer.getData('text/plain')); if (issue) move(issue, column.value); setDropColumn(undefined); setDragging(undefined); }}>
            <div className="column-heading"><span className="status-dot" /><strong>{column.label}</strong><span className="count">{filtered.filter(i => i.status === column.value).length}</span><button className="icon-button" title={'新建' + column.label + ' Issue'} aria-label={'新建' + column.label + ' Issue'} onClick={() => setCreating(column.value)}><Plus size={15} /></button></div>
            <div className="cards">{filtered.filter(i => i.status === column.value).map(issue => <button key={issue.id} className={'issue-card ' + (dragging === issue.id ? 'dragging' : '')} draggable={!busy} onDragStart={e => { e.dataTransfer.setData('text/plain', issue.id); setDragging(issue.id); }} onDragEnd={() => { setDragging(undefined); setDropColumn(undefined); }} onClick={() => choose(issue.id)}>
              <div className="card-id">{issue.id.startsWith('issue-') && issue.id.length > 20 ? issue.id.slice(0, 14) : issue.id}{issue.ready && <span className="ready-dot" title="依赖已满足，可开始" />}</div><h3>{issue.name}</h3>{issue.description && <p className="card-description">{issue.description.replace(/[#*`>]/g, '').slice(0, 110)}</p>}<div className="card-footer"><div className="chips">{Object.entries(issue.properties).filter(([k]) => ![board.schema.statusKey, 'id'].includes(k)).slice(0, 2).map(([k, v]) => <span key={k} className="chip" title={`${k}: ${short(v)}`}>{k}: {short(v)}</span>)}</div>{issue.comments.length > 0 && <span className="comment-count"><MessageSquare size={12} />{issue.comments.length}</span>}</div>
            </button>)}{filtered.every(i => i.status !== column.value) && <button className="empty-column" onClick={() => setCreating(column.value)}><Plus size={14} />添加 Issue</button>}</div>
          </section>)}</div> : <div className="issue-list"><div className="list-heading"><span>名称</span><span>属性 · 状态</span><span>评论</span></div>{filtered.map(issue => <button className="list-row" key={issue.id} onClick={() => choose(issue.id)}><span><Circle size={14} style={{ color: board.columns.find(c => c.value === issue.status)?.color }} /><strong>{issue.name}</strong><code>{issue.id.slice(0, 16)}</code></span><span>{board.columns.find(c => c.value === issue.status)?.label}</span><span><MessageSquare size={13} />{issue.comments.length}</span></button>)}{!filtered.length && <div className="empty-list">没有匹配的 Issue</div>}</div>}
        </>}
    </main>
    {projectModal && <div className="overlay" onMouseDown={e => { if (e.target === e.currentTarget) setProjectModal(false); }}>
      <DialogForm className="modal project-modal" aria-labelledby="project-dialog-title" onClose={() => setProjectModal(false)} onSubmit={e => { e.preventDefault(); openProject(rootDraft.trim()); }}>
        <div className="modal-heading"><h2 id="project-dialog-title">选择项目</h2><button type="button" className="icon-button" aria-label="关闭" onClick={() => setProjectModal(false)}><X size={18} /></button></div>
        <label htmlFor="project-root">项目文件夹</label>
        <div className="folder-input"><Folder size={20} aria-hidden="true" /><input id="project-root" data-autofocus required placeholder="/Users/你/Projects/项目" value={rootDraft} onChange={e => setRootDraft(e.target.value)} /></div>
        <button type="button" className="project-browse" disabled={!connected || busy} onClick={() => run(async () => { const data = await bridge.call('browse_folder'); if (data.root) setRootDraft(data.root); })}><Folder size={20} aria-hidden="true" /><span>浏览文件夹</span>{busy ? <Loader2 className="spin" size={16} /> : <ChevronDown size={16} />}</button>
        {projectLoading && <p className="project-loading" role="status">正在读取已添加的项目…</p>}
        {projects.length > 0 && <div className="recent-projects"><p>已添加的项目</p>{projects.map(p => <button type="button" className="project-option" disabled={busy || !connected} key={p.root} onClick={() => openProject(p.root)}><Folder size={18} /><span><strong>{p.name}</strong><small>{p.root}</small></span>{p.root === board?.root && <Check size={16} />}</button>)}</div>}
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <p className="project-caption">名称、属性和评论保存在项目的 issues 文件夹中。</p>
        <div className="modal-footer"><button type="button" className="secondary" onClick={() => setProjectModal(false)}>取消</button><button className="primary" disabled={!connected || busy || !rootDraft.trim()}>{busy ? <Loader2 className="spin" size={15} /> : null}打开项目</button></div>
      </DialogForm>
    </div>}
    {creating !== null && board && <CreateModal status={creating} board={board} busy={busy} run={run} close={() => setCreating(null)} created={async issue => { await load(); setCreating(null); setSelected(issue.id); setNotice('Issue 已创建'); }} />}
  </div>;
}

type Run = <T>(action: () => Promise<T>) => Promise<T | undefined>;
function CreateModal({ status, board, busy, run, close, created }: { status: string; board: Board; busy: boolean; run: Run; close: () => void; created: (issue: Issue) => Promise<void> }) {
  const [name, setName] = useState(''); const [content, setContent] = useState(''); const [props, setProps] = useState(stringify({ [board.schema.statusKey]: status }));
  return <div className="overlay"><DialogForm className="modal create-modal" aria-label="新建 Issue" onClose={close} onSubmit={e => { e.preventDefault(); run(async () => { const data = await bridge.call('create_issue', { root: board.root, name, description: content, properties: yaml(props) }); await created(data.issue); }); }}><div className="modal-heading"><h2>新建 Issue</h2><button type="button" className="icon-button" aria-label="关闭新建" onClick={close}><X size={18} /></button></div><label>名称<input data-autofocus required placeholder="这件事需要做什么？" value={name} onChange={e => setName(e.target.value)} /></label><label>内容 <span className="muted">可选 · Markdown</span><textarea rows={5} placeholder="补充上下文、目标或具体要求…" value={content} onChange={e => setContent(e.target.value)} /></label><label>属性 <span className="muted">任意 YAML 属性</span><textarea className="code-input" rows={4} value={props} onChange={e => setProps(e.target.value)} /></label><div className="modal-footer"><span className="muted"><FileText size={13} />保存在 issues/*.md</span><button className="primary" disabled={busy || !name.trim()}>{busy ? <Loader2 className="spin" size={15} /> : <Plus size={15} />}创建 Issue</button></div></DialogForm></div>;
}
function fileData(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(new Error(`无法读取附件：${file.name}`));
    reader.readAsDataURL(file);
  });
}
function Detail({ issue, board, busy, connected, onClose, onSelect, onDirty, run, onSaved, notify }: { issue: Issue; board: Board; busy: boolean; connected: boolean; onClose: () => void; onSelect: (id: string) => void; onDirty: (dirty: boolean) => void; run: Run; onSaved: () => Promise<void>; notify: (text: string) => void }) {
  const [baseline, setBaseline] = useState(issue);
  const [name, setName] = useState(issue.name);
  const [content, setContent] = useState(issue.description);
  const [properties, setProperties] = useState(stringify(issue.properties));
  const [editingContent, setEditingContent] = useState(false);
  const [editingProperties, setEditingProperties] = useState(false);
  const [comment, setComment] = useState('');
  const [author, setAuthor] = useState(readAuthor);
  const [target, setTarget] = useState<'active' | 'new'>('new');
  const [instruction, setInstruction] = useState('');
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [draftRevision, setDraftRevision] = useState(issue.revision);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const changed = name !== baseline.name || content !== baseline.description || properties !== stringify(baseline.properties);
  const dirtyRef = useRef(false);
  dirtyRef.current = changed || !!comment;
  useEffect(() => { onDirty(changed || !!comment); }, [changed, comment]);
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
      } finally { if (latest.revision !== issue.revision) await onSaved(); }
      notify(`已添加 ${files.length} 个附件`);
    });
  }
  const attachments = attachmentReferences([issue.description, ...issue.comments.map(comment => comment.body)].join('\n\n'));
  const col = board.columns.find(c => c.value === issue.status);
  return <AttachmentProvider root={board.root} id={issue.id} revision={issue.revision}><div className="detail-layout">
    <article className="detail-main">
      <div className="detail-nav"><button className="text-button" onClick={onClose}><ArrowLeft size={14} />返回看板</button><code>{issue.filename}</code><button className="text-button" onClick={() => setSourceOpen(!sourceOpen)}><FileText size={14} />源文件</button></div>
      <input className="issue-name" aria-label="Issue 名称" value={name} onChange={e => setName(e.target.value)} />
      <div className="detail-meta"><span className="status-badge" style={{ color: col?.color }}><Circle size={13} />{col?.label}</span>{issue.ready && <span className="ready-badge"><CheckCircle2 size={12} />可开始</span>}<span><MessageSquare size={12} />{issue.comments.length} 条评论</span></div>
      {draftRevision !== issue.revision && changed && <div className="draft-warning"><AlertCircle size={14} />文件已更新。草稿保留，先查看源文件，再重新加载。<button className="text-button" onClick={() => { if (window.confirm('丢弃草稿并载入最新文件？')) { setBaseline(issue); setName(issue.name); setContent(issue.description); setProperties(stringify(issue.properties)); setDraftRevision(issue.revision); } }}>载入最新</button></div>}
      {sourceOpen && <pre className="source-view">{issue.raw}</pre>}
      <div className="content-heading"><span>内容</span><button className="text-button" onClick={() => setEditingContent(!editingContent)}><Pencil size={13} />{editingContent ? '预览' : '编辑'}</button></div>
      {editingContent ? <textarea className="content-editor" rows={9} value={content} onChange={e => setContent(e.target.value)} aria-label="Issue 内容" /> : content ? <Markdown text={content} /> : <button className="empty-content" onClick={() => setEditingContent(true)}>补充这件事的上下文…</button>}
      <section className="attachments" aria-label="Issue 附件"><div className="content-heading"><span>附件{attachments.length ? ` · ${attachments.length}` : ''}</span><button className="text-button" disabled={busy || changed || !connected} onClick={() => attachmentInput.current?.click()}><Paperclip size={13} />添加附件</button><input className="attachment-input" ref={attachmentInput} type="file" multiple aria-label="选择附件" onChange={event => { const files = [...(event.currentTarget.files ?? [])]; event.currentTarget.value = ''; if (files.length) attach(files); }} /></div>{attachments.length ? <Markdown text={attachments.map(ref => `[${ref.label.replace(/[\\[\]]/g, '\\$&')}](${ref.href})`).join('\n\n')} /> : <p className="attachment-caption">添加图片或文件，单个文件最大 10 MB。</p>}</section>
      {changed && <div className="save-row"><span>有未保存的修改</span><button className="primary" disabled={busy} onClick={save}><Check size={14} />保存修改</button></div>}
      <div className="comments-heading"><h2>评论<span>{issue.comments.length}</span></h2><span>人类与 Agent 共用</span></div>
      <div className="comments">{issue.comments.map((c, i) => { const parts = c.heading.split(' · '); const who = parts[1] ?? '评论'; return <div className="comment" key={i}><div className="avatar">{who.slice(0, 1).toUpperCase()}</div><div className="comment-body"><div className="comment-meta"><strong>{who}</strong>{parts[2] && <span className="actor">{parts[2]}</span>}<time>{parts[0]}</time></div><Markdown text={c.body} /></div></div>; })}{!issue.comments.length && <div className="no-comments">补充要求、讨论方案，或者记录工作进展。</div>}</div>
      <form className="comment-compose" onSubmit={e => { e.preventDefault(); run(async () => { if (changed) throw new Error('请先保存名称、内容或属性修改，再追加评论'); await bridge.call('append_comment', { root: board.root, id: issue.id, revision: issue.revision, body: comment, author, actor: 'human' }); rememberAuthor(author); setComment(''); dirtyRef.current = false; onDirty(false); await onSaved(); notify('评论已追加'); }); }}><textarea aria-label="评论内容" placeholder="留下评论…" rows={3} value={comment} onChange={e => setComment(e.target.value)} /><div><label>作者<input aria-label="评论作者" value={author} onChange={e => setAuthor(e.target.value)} /></label><span className="muted">human</span><button className="primary" disabled={busy || !comment.trim() || !author.trim()}>追加评论<CornerDownLeft size={14} /></button></div></form>
    </article>
    <aside className="detail-aside"><div className="aside-heading"><h2>属性</h2><button className="text-button" onClick={() => setEditingProperties(!editingProperties)}><Pencil size={13} />{editingProperties ? '收起' : '编辑'}</button></div><label className="status-control"><span>状态</span><select aria-label="Issue 状态" value={issue.status} disabled={busy || changed} onChange={e => run(async () => { await bridge.call('update_issue', { root: board.root, id: issue.id, revision: issue.revision, properties: { [board.schema.statusKey]: e.target.value } }); dirtyRef.current = false; await onSaved(); notify('状态已保存'); })}>{board.columns.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></label>
      {editingProperties ? <><textarea className="properties-editor code-input" aria-label="YAML 属性" rows={10} value={properties} onChange={e => setProperties(e.target.value)} /><p className="muted">保留任意属性。删除一行会删除该属性；状态列由状态属性推导。</p></> : <><PropertyList properties={issue.properties} board={board} onSelect={onSelect} /><button className="add-property" onClick={() => setEditingProperties(true)}><Plus size={14} />添加属性</button></>}
      {!!issue.children?.length && <div className="derived"><span>子 Issue</span>{issue.children.map(child => <code key={child}>{child}</code>)}</div>}
      <div className="dispatch-box"><div className="dispatch-icon"><ArrowUpRight size={20} /></div><h3>在对话里继续</h3><p>把名称、属性与最新评论交给对话，一起完成这件事。</p><button className="primary" disabled={busy || !connected} onClick={() => setDispatchOpen(!dispatchOpen)}>分发到对话<ArrowUpRight size={14} /></button>{dispatchOpen && <div className="dispatch-options"><label>目标<select aria-label="分发目标" value={target} onChange={e => setTarget(e.target.value as 'active' | 'new')}><option value="new">新对话</option><option value="active">当前对话</option></select></label><textarea rows={3} aria-label="分发指令" placeholder="补充这次对话要做的事（可选）" value={instruction} onChange={e => setInstruction(e.target.value)} /><p className="muted">点击发送会立即启动所选对话。</p>{!bridge.canDispatch(target) && <p className="dispatch-unavailable">当前页面没有可用的宿主对话能力。在已安装插件的页面中使用。</p>}<button className="primary" disabled={busy || !bridge.canDispatch(target)} onClick={() => run(async () => { if (changed || comment.trim()) throw new Error('请先保存修改或追加评论，再分发最新内容'); const data = await bridge.call('prepare_dispatch', { root: board.root, id: issue.id, instruction }); await bridge.send(data.prompt, target); notify(target === 'new' ? '已发送到新对话' : '已发送到当前对话'); setDispatchOpen(false); })}>发送并启动<ArrowUpRight size={14} /></button></div>}</div>
      <div className="file-location"><FileText size={14} /><span>事实来源<code>issues/{issue.filename}</code></span></div>
    </aside>
  </div></AttachmentProvider>;
}

document.addEventListener('keydown', e => {
  if ((e.target as HTMLElement)?.matches('input,textarea,select') || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === '/') { e.preventDefault(); document.getElementById('search')?.focus(); }
  if (e.key.toLowerCase() === 'c') (document.querySelector('.nav-create') as HTMLButtonElement)?.click();
});
createRoot(document.getElementById('root')!).render(<App />);

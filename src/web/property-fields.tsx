import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { ArrowUpRight, Braces, Check, ChevronRight, Loader2, Trash2, Undo2 } from 'lucide-react';
import type { Board } from '../core.js';
import type { PropertyDraftRow } from './properties.js';
import { PropertyValue } from './property-value.js';
import { AddPropertyMenu, ChoicePropertyEditor, DatePropertyEditor, PersonTag, PropertyIcon, PropertyPopover, PropertyTag } from './property-controls.js';
import { isDateRange, parsePropertyText, propertyText, propertyType, relationTarget, visibleProperties, type PropertyPreset, type PropertyType } from './property-model.js';

const TYPE_LABELS: Record<PropertyType, string> = { text: '文本', number: '数字', select: '单选', 'multi-select': '多选', status: '状态', date: '日期', person: '人员', checkbox: '复选框', url: '网址', email: '电子邮箱', phone: '电话号码', relation: '关联', structured: 'YAML' };
const PRESET_LABELS: Record<string, string> = { text: '文本', number: '数字', select: '单选', multi_select: '多选', date: '日期', person: '人员', checkbox: '复选框', url: '网址', email: '电子邮箱', phone: '电话号码', relation: '关联' };
const ignoreDirty = () => {};

function PropertyDisplay({ type, value, board }: { type: PropertyType; value: unknown; board: Board }) {
  if (type === 'checkbox') return <span className="notion-checkbox" data-checked={value === true} aria-hidden="true">{value === true && <Check size={12} strokeWidth={3} />}</span>;
  if (value == null || value === '' || (Array.isArray(value) && !value.length)) return <span className="notion-empty">空</span>;
  if (type === 'status') { const column = board.columns.find(item => item.value === value); return <PropertyTag value={column?.label ?? String(value)} color={column?.color} status />; }
  if (type === 'select') return <PropertyTag value={String(value)} />;
  if (type === 'multi-select' && Array.isArray(value)) return <span className="notion-tags">{value.map((item, index) => <PropertyTag key={index} value={String(item)} />)}</span>;
  if (type === 'person') return <span className="notion-tags">{(Array.isArray(value) ? value : [value]).map((name, index) => <PersonTag key={index} name={String(name)} />)}</span>;
  if (type === 'date') {
    const format = (date: string) => { const parsed = new Date(date.length === 10 ? `${date}T12:00:00` : date); return Number.isNaN(parsed.getTime()) ? date : parsed.toLocaleString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', ...(date.includes('T') ? { hour: '2-digit', minute: '2-digit' } as const : {}) }); };
    return <span>{isDateRange(value) ? `${format(value.start)} → ${format(value.end)}` : format(String(value))}</span>;
  }
  if (type === 'relation') return <span className="notion-tags">{(Array.isArray(value) ? value : [value]).map((item, index) => <span className="notion-relation" key={index}><ArrowUpRight size={14} />{typeof item === 'string' && !item.startsWith('[[') && relationTarget(item, board) ? relationTarget(item, board)!.name : <PropertyValue value={item} board={board} onSelect={ignoreDirty} interactive={false} />}</span>)}</span>;
  return <PropertyValue value={value} board={board} onSelect={ignoreDirty} interactive={false} />;
}

function PropertyLinks({ value, type, board, onSelect }: { value: unknown; type: PropertyType; board: Board; onSelect: (id: string) => void }) {
  const items: string[] = [];
  const seen = new Set<object>();
  function collect(item: unknown) {
    if (typeof item === 'string') items.push(item);
    else if (item && typeof item === 'object' && !seen.has(item)) {
      seen.add(item);
      for (const child of Object.values(item)) collect(child);
    }
  }
  collect(value);
  const hrefs = new Map<string, string>();
  for (const item of items) {
    const text = item.trim();
    const href = /^(https?:\/\/|mailto:)/i.test(text) ? text : type === 'email' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text) ? `mailto:${text}` : type === 'phone' && /^\+?[\d\s().-]+$/.test(text) ? `tel:${text.replace(/[^\d+]/g, '')}` : undefined;
    if (href) hrefs.set(href, text);
  }
  const targets = items.flatMap(item => {
    if (typeof item !== 'string') return [];
    const ids = [...item.matchAll(/\[\[([^|\]]+)(?:\|[^\]]+)?\]\]/g)].map(match => match[1].replace(/\.md$/i, ''));
    if (type === 'relation' && !ids.length) ids.push(item);
    return ids.flatMap(id => { const issue = board.issues.find(issue => issue.id === id || issue.properties.id === id); return issue ? [issue] : []; });
  });
  return <>{[...hrefs].map(([href, text]) => <a key={href} className="notion-open-link" href={href} target="_blank" rel="noopener noreferrer" aria-label={`打开 ${text}`}><ArrowUpRight size={14} /></a>)}{[...new Map(targets.map(issue => [issue.id, issue])).values()].map(issue => <button type="button" key={issue.id} className="notion-open-link" aria-label={`打开关联 ${issue.name}`} title={issue.name} onClick={() => onSelect(issue.id)}><ArrowUpRight size={14} /></button>)}</>;
}

interface PropertyFieldProps {
  propertyKey: string; value: unknown; board: Board; disabled: boolean; initiallyOpen?: boolean; isNew?: boolean;
  onDirty: (dirty: boolean) => void; onSave: (value: unknown) => Promise<boolean>; onRemove?: () => Promise<boolean>;
  onRename?: (key: string) => Promise<boolean>; onSelect: (id: string) => void;
  onDraftChange?: (value: unknown) => void;
}
function PropertyField({ propertyKey, value, board, disabled, initiallyOpen = false, isNew = false, onDirty, onSave, onRemove, onRename, onSelect, onDraftChange }: PropertyFieldProps) {
  const [open, setOpen] = useState(initiallyOpen && propertyType(propertyKey, value, board) !== 'checkbox');
  const [menuOpen, setMenuOpen] = useState(false);
  const [draft, setDraft] = useState(value);
  const [raw, setRaw] = useState(() => propertyText(value));
  const [baseline, setBaseline] = useState(() => propertyText(value));
  const [rawMode, setRawMode] = useState(false);
  const [name, setName] = useState(propertyKey);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const checkboxTrigger = useRef<HTMLButtonElement>(null);
  const baseText = propertyText(value);
  const dirty = isNew || raw !== baseline;
  const type = propertyType(propertyKey, value, board);
  const label = type === 'status' ? '状态' : Object.hasOwn(PRESET_LABELS, propertyKey) ? PRESET_LABELS[propertyKey] : propertyKey;
  const locked = disabled || saving;
  const structured = rawMode || type === 'structured';
  const choice = ['status', 'select', 'multi-select', 'person', 'relation'].includes(type);
  useEffect(() => { if (initiallyOpen && type === 'checkbox') checkboxTrigger.current?.focus(); }, [initiallyOpen, type]);
  useEffect(() => { onDirty(dirty || open || menuOpen); }, [dirty, open, menuOpen, onDirty]);
  useEffect(() => {
    if (baseline !== baseText && (raw === baseline || raw === baseText)) { setBaseline(baseText); setDraft(value); setRaw(baseText); }
  }, [baseText, baseline, raw, value]);
  function change(next: unknown) {
    setDraft(next); setRaw(propertyText(next)); setError('');
    if (!(type === 'date' && isDateRange(next) && next.end && next.start > next.end)) onDraftChange?.(next);
  }
  async function commit(next = draft, close = true) {
    if (savingRef.current || locked) return;
    try {
      if (structured) next = parsePropertyText(propertyKey, raw);
      if (!structured && type === 'number' && next !== null && (typeof next !== 'number' || !Number.isFinite(next))) throw new Error('请输入有效数字');
      if (!structured && type === 'date' && isDateRange(next) && next.end && next.start > next.end) throw new Error('结束日期不能早于开始日期');
      change(next);
      if (!isNew && propertyText(next) === baseText) { if (close) setOpen(false); return; }
      savingRef.current = true; setSaving(true);
      if (await onSave(next)) { if (close) setOpen(false); }
      else setError('保存未完成，草稿已保留');
    } catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { savingRef.current = false; setSaving(false); }
  }
  async function rename() {
    if (!onRename || locked || !name.trim() || name.trim() === propertyKey) return;
    if (dirty) { setError('请先完成属性值编辑，再重命名'); return; }
    setSaving(true);
    try { if (await onRename(name.trim())) setMenuOpen(false); else setError('重命名未完成'); }
    catch (cause) { setError(cause instanceof Error ? cause.message : String(cause)); }
    finally { setSaving(false); }
  }
  const editor = structured ? <div className="notion-text-editor"><textarea autoFocus aria-label={`YAML 属性值：${propertyKey}`} className="code-input" rows={Math.min(10, Math.max(3, raw.split('\n').length))} disabled={locked} value={raw} onChange={event => { setRaw(event.target.value); setError(''); }} onKeyDown={event => { if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) { event.preventDefault(); void commit(); } }} /><div className="notion-editor-footer"><span>YAML</span><button type="button" disabled={locked} onClick={() => void commit()}>完成</button></div></div> : choice ?
    <ChoicePropertyEditor propertyKey={propertyKey} type={type} value={draft} board={board} disabled={locked} onChange={(next, close) => { change(next); void commit(next, close); }} /> : type === 'date' ?
    <DatePropertyEditor value={draft} disabled={locked} onChange={change} onSave={next => void commit(next)} /> :
    <div className="notion-text-editor">{type === 'text' ? <textarea autoFocus aria-label={`属性值：${propertyKey}`} rows={Math.min(6, Math.max(1, String(draft ?? '').split('\n').length))} placeholder="输入文本…" value={String(draft ?? '')} disabled={locked} onChange={event => change(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); void commit(); } }} /> :
      <input autoFocus aria-label={`属性值：${propertyKey}`} type={type === 'number' ? 'number' : type === 'email' ? 'email' : type === 'phone' ? 'tel' : 'url'} step={type === 'number' ? 'any' : undefined} placeholder={type === 'number' ? '输入数字…' : '输入或粘贴…'} value={draft == null ? '' : String(draft)} disabled={locked} onChange={event => change(type === 'number' ? event.target.value === '' ? null : Number(event.target.value) : event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); void commit(); } }} />}</div>;
  return <div className="notion-property-row" data-dirty={dirty}>
    <dt><Popover.Root open={menuOpen} onOpenChange={next => { setMenuOpen(next); if (next) setName(propertyKey); }}><Popover.Trigger asChild><button type="button" className="notion-property-name" disabled={locked} title={propertyKey}><PropertyIcon type={type} /><span>{label}</span><ChevronRight size={12} className="notion-name-chevron" /></button></Popover.Trigger><PropertyPopover className="notion-property-menu" aria-label={`属性设置：${propertyKey}`} onCloseAutoFocus={event => { if (open) event.preventDefault(); }}>
      {onRename ? <form className="notion-rename" onSubmit={event => { event.preventDefault(); event.stopPropagation(); void rename(); }}><PropertyIcon type={type} /><input aria-label="属性名" value={name} disabled={locked || dirty} onChange={event => setName(event.target.value)} /><button type="submit" aria-label="保存属性名" disabled={locked || dirty || !name.trim() || name.trim() === propertyKey}><Check size={15} /></button></form> : <div className="notion-menu-heading">{label}</div>}
      <div className="notion-property-type"><span>类型</span><span><PropertyIcon type={type} />{TYPE_LABELS[type]}</span></div>
      {type !== 'status' && <><div className="notion-menu-separator" /><button type="button" className="notion-option" disabled={locked} onClick={() => { setRawMode(true); setMenuOpen(false); setOpen(true); }}><Braces size={16} />以 YAML 编辑</button></>}
      {dirty && !isNew && <button type="button" className="notion-option" disabled={locked} onClick={() => { change(value); setMenuOpen(false); }}><Undo2 size={16} />撤销修改</button>}
      {onRemove && <><div className="notion-menu-separator" /><button type="button" className="notion-option notion-destructive" disabled={locked} onClick={async () => { if (await onRemove()) { onDirty(false); setMenuOpen(false); } }}><Trash2 size={16} />删除属性</button></>}
      {!!error && <p className="property-error" role="alert">{error}</p>}
    </PropertyPopover></Popover.Root></dt>
    <dd className="notion-property-cell">
      {type === 'checkbox' && !rawMode ? <button ref={checkboxTrigger} type="button" className="notion-property-value" role="checkbox" aria-checked={draft === true} aria-label={label} disabled={locked} onClick={() => { change(draft !== true); void commit(draft !== true); }}><PropertyDisplay type={type} value={draft} board={board} /></button> : <Popover.Root open={open} onOpenChange={next => { setOpen(next); if (next && !dirty) change(value); }}>
        <Popover.Trigger asChild><button type="button" className="notion-property-value" disabled={locked} aria-label={`编辑属性：${label}`}><PropertyDisplay type={type} value={dirty ? draft : value} board={board} /></button></Popover.Trigger>
        <PropertyPopover className={type === 'date' && !structured ? 'notion-date-popover' : ''} aria-label={`编辑属性：${label}`} onInteractOutside={event => { if (savingRef.current) event.preventDefault(); else if (dirty) { event.preventDefault(); void commit(); } }} onEscapeKeyDown={event => { event.preventDefault(); setOpen(false); }}>
          {editor}
          {!!error && <p className="property-error" role="alert">{error}</p>}
          {type !== 'status' && !structured && choice && <div className="notion-editor-footer"><button type="button" disabled={locked} onClick={() => { const next = Array.isArray(draft) ? [] : ''; change(next); void commit(next); }}>清除</button></div>}
        </PropertyPopover>
      </Popover.Root>}
      <PropertyLinks value={dirty ? draft : value} type={type} board={board} onSelect={onSelect} />
      {saving ? <Loader2 className="notion-saving" size={13} /> : dirty && <span className="notion-dirty-dot" title="有未保存的修改" aria-label="有未保存的修改" />}
      {isNew && type === 'checkbox' && <button type="button" className="notion-commit-new" disabled={locked} aria-label={`保存属性：${label}`} onClick={() => void commit()}><Check size={14} /></button>}
      {!open && !!error && <p className="property-error" role="alert">{error}</p>}
    </dd>
  </div>;
}

export function PropertyRowsEditor({ rows, onChange, board, disabled = false, onDirty = ignoreDirty }: { rows: PropertyDraftRow[]; onChange: (rows: PropertyDraftRow[]) => void; board: Board; disabled?: boolean; onDirty?: (dirty: boolean) => void }) {
  const [focusId, setFocusId] = useState<string | null>(null);
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});
  const reportDirty = useCallback((key: string, dirty: boolean) => setDirtyFields(current => current[key] === dirty ? current : { ...current, [key]: dirty }), []);
  useEffect(() => { onDirty(rows.some(row => dirtyFields[row.id])); }, [rows, dirtyFields, onDirty]);
  function add(item: PropertyPreset) {
    const row = { id: crypto.randomUUID(), key: item.key, value: propertyText(item.value) };
    onChange([...rows, row]); setFocusId(row.id);
  }
  return <div className="notion-properties"><dl className="notion-property-list">{rows.map(row => <PropertyField key={row.id} propertyKey={row.key} value={parsePropertyText(row.key, row.value)} board={board} disabled={disabled} initiallyOpen={row.id === focusId} onDirty={dirty => reportDirty(row.id, dirty)} onSelect={ignoreDirty} onDraftChange={value => onChange(rows.map(item => item.id === row.id ? { ...item, value: propertyText(value) } : item))} onSave={async value => { onChange(rows.map(item => item.id === row.id ? { ...item, value: propertyText(value) } : item)); return true; }} onRename={row.key === board.schema.statusKey ? undefined : async key => {
    if (rows.some(item => item.id !== row.id && item.key.trim().toLocaleLowerCase() === key.toLocaleLowerCase())) throw new Error('属性名已存在');
    onChange(rows.map(item => item.id === row.id ? { ...item, key } : item)); return true;
  }} onRemove={row.key === board.schema.statusKey ? undefined : async () => { onChange(rows.filter(item => item.id !== row.id)); return true; }} />)}</dl><AddPropertyMenu board={board} usedKeys={rows.map(row => row.key)} disabled={disabled} onAdd={add} /></div>;
}

export function EditablePropertyList({ properties, board, disabled, onDirty, onSave, onRemove, onRename, onSelect }: {
  properties: Record<string, unknown>; board: Board; disabled: boolean; onDirty: (dirty: boolean) => void;
  onSave: (key: string, value: unknown) => Promise<boolean>; onRemove: (key: string) => Promise<boolean>;
  onRename: (key: string, nextKey: string) => Promise<boolean>; onSelect: (id: string) => void;
}) {
  const [newRows, setNewRows] = useState<PropertyPreset[]>([]);
  const [dirtyFields, setDirtyFields] = useState<Record<string, boolean>>({});
  const [adding, setAdding] = useState(false);
  const entries = visibleProperties(properties, board);
  if (!Object.hasOwn(properties, board.schema.statusKey)) entries.unshift([board.schema.statusKey, board.columns[0]?.value ?? '']);
  const reportDirty = useCallback((key: string, dirty: boolean) => setDirtyFields(current => current[key] === dirty ? current : { ...current, [key]: dirty }), []);
  useEffect(() => { onDirty(adding || newRows.length > 0 || Object.values(dirtyFields).some(Boolean)); }, [adding, newRows.length, dirtyFields, onDirty]);
  const mapped = [board.schema.statusKey, board.schema.parentKey, board.schema.dependenciesKey, ...(board.schema.name.source === 'property' ? [board.schema.name.key] : [])];
  return <div className="notion-properties"><dl className="notion-property-list">{entries.map(([key, value]) => <PropertyField key={key} propertyKey={key} value={value} board={board} disabled={disabled} onDirty={dirty => reportDirty(key, dirty)} onSave={next => onSave(key, next)} onRemove={key === board.schema.statusKey ? undefined : async () => { const saved = await onRemove(key); if (saved) reportDirty(key, false); return saved; }} onRename={mapped.includes(key) ? undefined : async nextKey => {
    if (nextKey === board.schema.statusKey || Object.keys(properties).some(item => item.toLocaleLowerCase() === nextKey.toLocaleLowerCase()) || newRows.some(row => row.key.toLocaleLowerCase() === nextKey.toLocaleLowerCase())) throw new Error('属性名已存在');
    const saved = await onRename(key, nextKey); if (saved) reportDirty(key, false); return saved;
  }} onSelect={onSelect} />)}{newRows.map(row => <PropertyField key={`new:${row.key}`} propertyKey={row.key} value={row.value} board={board} disabled={disabled} isNew initiallyOpen onDirty={dirty => reportDirty(`new:${row.key}`, dirty)} onSave={async value => {
    const saved = await onSave(row.key, value);
    if (saved) { setNewRows(current => current.filter(item => item.key !== row.key)); reportDirty(`new:${row.key}`, false); }
    return saved;
  }} onRemove={async () => { setNewRows(current => current.filter(item => item.key !== row.key)); reportDirty(`new:${row.key}`, false); return true; }} onSelect={onSelect} />)}</dl><AddPropertyMenu board={board} usedKeys={[...Object.keys(properties), board.schema.statusKey, ...newRows.map(row => row.key)]} disabled={disabled} onOpenChange={setAdding} onAdd={row => setNewRows(current => [...current, row])} /></div>;
}

import React, { useEffect, useRef, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { parseDocument, stringify } from 'yaml';
import type { Board } from '../core.js';
import { CONVERSATION_PROPERTIES } from '../conversation-links.js';
import { Button } from './components/ui/button.js';
import { Input } from './components/ui/input.js';
import { Label } from './components/ui/label.js';
import { Textarea } from './components/ui/textarea.js';

export interface PropertyDraftRow { id: string; key: string; value: string }

export function createPropertyRows(properties: Record<string, unknown>): PropertyDraftRow[] {
  return Object.entries(properties).map(([key, value]) => ({ id: crypto.randomUUID(), key, value: typeof value === 'string' ? value : stringify(value).trim() }));
}

export function createPropertyRow(key = '', value = ''): PropertyDraftRow {
  return { id: crypto.randomUUID(), key, value };
}

export function parsePropertyRows(rows: PropertyDraftRow[]): Record<string, unknown> {
  const properties: Record<string, unknown> = Object.create(null);
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) {
      if (row.value.trim()) throw new Error('请为已填写的属性值补充属性名');
      continue;
    }
    if (Object.hasOwn(properties, key)) throw new Error(`属性名重复：${key}`);
    if (!row.value.trim()) { properties[key] = ''; continue; }
    const doc = parseDocument(row.value, { uniqueKeys: true });
    if (doc.errors.length) throw new Error(`属性“${key}”：${doc.errors[0].message}`);
    const value = doc.toJS({ maxAliasCount: 30 });
    properties[key] = value === undefined ? '' : value;
  }
  return properties;
}

function PropertyRowEditorItem({ row, rows, suggestions, autoFocusName, disabled, onRowChange, onRemove }: {
  row: PropertyDraftRow;
  rows: PropertyDraftRow[];
  suggestions: string[];
  autoFocusName: boolean;
  disabled: boolean;
  onRowChange: (row: PropertyDraftRow) => void;
  onRemove: () => void;
}) {
  const nameInput = useRef<HTMLInputElement>(null);
  const valueInput = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (autoFocusName) nameInput.current?.focus();
  }, [autoFocusName]);

  const usedNames = new Set(rows.filter(item => item.id !== row.id && item.key.trim()).map(item => item.key.trim().toLocaleLowerCase()));
  const query = row.key.trim();
  const normalizedQuery = query.toLocaleLowerCase();
  const matches = suggestions
    .filter(name => !usedNames.has(name.toLocaleLowerCase()) && (!normalizedQuery || name.toLocaleLowerCase().includes(normalizedQuery)))
    .sort((a, b) => Number(b.toLocaleLowerCase() === normalizedQuery) - Number(a.toLocaleLowerCase() === normalizedQuery))
    .slice(0, 8);
  const knownName = suggestions.some(name => name.toLocaleLowerCase() === normalizedQuery);
  const duplicate = !!normalizedQuery && usedNames.has(normalizedQuery);
  const canCreate = !!query && !knownName && !duplicate;
  const options = [...matches.map(key => ({ key, create: false })), ...(canCreate ? [{ key: query, create: true }] : [])];
  const listId = `property-name-options-${row.id}`;

  function chooseName(key: string) {
    onRowChange({ ...row, key });
    setOpen(false);
    requestAnimationFrame(() => valueInput.current?.focus());
  }

  function handleNameKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); return; }
    if (event.key === 'ArrowDown' && open && options.length) { event.preventDefault(); setActiveIndex(index => (index + 1) % options.length); return; }
    if (event.key === 'ArrowUp' && open && options.length) { event.preventDefault(); setActiveIndex(index => (index - 1 + options.length) % options.length); return; }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (duplicate) return;
      const option = open ? options[activeIndex] : undefined;
      chooseName(option?.key ?? query);
    }
  }

  return <div className="property-row" key={row.id}>
    <div className="property-key-field">
      <Input
        ref={nameInput}
        disabled={disabled}
        aria-label={`属性名${row.key ? `：${row.key}` : ''}`}
        aria-autocomplete="list"
        aria-controls={open ? listId : undefined}
        aria-expanded={open && (options.length > 0 || duplicate)}
        aria-activedescendant={open && options.length ? `${listId}-${activeIndex}` : undefined}
        role="combobox"
        placeholder="属性名"
        value={row.key}
        onFocus={() => { setOpen(true); setActiveIndex(0); }}
        onBlur={() => setOpen(false)}
        onKeyDown={handleNameKeyDown}
        onChange={event => { onRowChange({ ...row, key: event.target.value }); setOpen(true); setActiveIndex(0); }}
      />
      {open && !disabled && <div className="property-name-options" id={listId} role="listbox" aria-label="选择或创建属性">
        {options.map((option, index) => <button
          type="button"
          role="option"
          tabIndex={-1}
          aria-selected={index === activeIndex}
          id={`${listId}-${index}`}
          className="property-name-option"
          key={`${option.create ? 'create:' : 'known:'}${option.key}`}
          onMouseDown={event => event.preventDefault()}
          onMouseEnter={() => setActiveIndex(index)}
          onClick={() => chooseName(option.key)}
        >{option.create ? <><Plus size={13} /><span>创建“{option.key}”</span></> : <span>{option.key}</span>}{!option.create && <span className="muted">已有属性</span>}</button>)}
        {duplicate && <div className="property-name-empty">当前 Issue 已有此属性</div>}
        {!options.length && !duplicate && <div className="property-name-empty">输入新名称以创建属性</div>}
      </div>}
    </div>
    <Input ref={valueInput} disabled={disabled} aria-label={`属性值${row.key ? `：${row.key}` : ''}`} placeholder="值" value={row.value} onChange={event => onRowChange({ ...row, value: event.target.value })} />
    <Button type="button" disabled={disabled} variant="ghost" size="icon-sm" title={row.key ? `删除属性 ${row.key}` : '删除属性'} aria-label={row.key ? `删除属性 ${row.key}` : '删除属性'} onClick={onRemove}><X /></Button>
  </div>;
}

export function PropertyRowsEditor({ rows, onChange, suggestions = [], disabled = false }: { rows: PropertyDraftRow[]; onChange: (rows: PropertyDraftRow[]) => void; suggestions?: string[]; disabled?: boolean }) {
  const [focusRowId, setFocusRowId] = useState<string | null>(null);
  function addRow() {
    const row = createPropertyRow();
    onChange([...rows, row]);
    setFocusRowId(row.id);
  }

  return <div className="property-row-editor">
    <div className="property-row-list">
      {rows.map(row => <PropertyRowEditorItem
        key={row.id}
        row={row}
        rows={rows}
        suggestions={suggestions}
        autoFocusName={focusRowId === row.id}
        disabled={disabled}
        onRowChange={updated => onChange(rows.map(item => item.id === updated.id ? updated : item))}
        onRemove={() => onChange(rows.filter(item => item.id !== row.id))}
      />)}
    </div>
    <div className="property-row-footer"><Button type="button" disabled={disabled} variant="ghost" size="sm" className="text-button" onClick={addRow}><Plus size={14} />添加属性</Button><span className="muted">选择已有名称或输入新名称；值支持文本、数字、布尔值、列表和对象。</span></div>
  </div>;
}

export function PropertyValue({ value, board, onSelect, ancestors = [] }: { value: unknown; board: Board; onSelect: (id: string) => void; ancestors?: unknown[] }) {
  if (value === null || value === undefined) return <span className="property-empty">空值</span>;
  if (typeof value === 'boolean') return <span className="property-boolean">{String(value)}</span>;
  if (typeof value === 'object') {
    if (ancestors.includes(value)) return <span className="property-empty">循环引用</span>;
    const next = [...ancestors, value];
    if (Array.isArray(value)) return value.length ? <ul className="property-array">{value.map((item, index) => <li key={index}><PropertyValue value={item} board={board} onSelect={onSelect} ancestors={next} /></li>)}</ul> : <span className="property-empty">[]</span>;
    const entries = Object.entries(value);
    return entries.length ? <dl className="property-object">{entries.map(([key, item]) => <div key={key}><dt>{key}</dt><dd><PropertyValue value={item} board={board} onSelect={onSelect} ancestors={next} /></dd></div>)}</dl> : <span className="property-empty">{'{}'}</span>;
  }
  if (typeof value !== 'string') return <span>{String(value)}</span>;
  if (/^(https?:\/\/|mailto:)/i.test(value.trim())) return <a href={value.trim()} target="_blank" rel="noopener noreferrer">{value}</a>;
  const segments = value.split(/(\[\[[^\]]+\]\])/g);
  return <>{segments.map((segment, index) => {
    const match = /^\[\[([^|\]]+)(?:\|([^\]]+))?\]\]$/.exec(segment);
    if (!match) return <React.Fragment key={index}>{segment}</React.Fragment>;
    const id = match[1].replace(/\.md$/i, '');
    const target = board.issues.find(issue => issue.id === id || issue.properties.id === id);
    return target ? <button key={index} type="button" className="property-link" onClick={() => onSelect(target.id)} title={target.name}>{match[2] || target.name}</button> : <span key={index} className="property-missing" title="Issue 不存在">{match[2] || match[1]}（未找到）</span>;
  })}</>;
}

export function PropertyList({ properties, board, onSelect }: { properties: Record<string, unknown>; board: Board; onSelect: (id: string) => void }) {
  const mapped = [board.schema.parentKey, board.schema.dependenciesKey, ...(board.schema.name.source === 'property' ? [board.schema.name.key] : [])];
  return <dl className="property-list">{Object.entries(properties).filter(([key]) => key !== board.schema.statusKey && (!CONVERSATION_PROPERTIES.includes(key) || mapped.includes(key))).map(([key, value]) => <div className="property" key={key}><dt>{key}</dt><dd><PropertyValue value={value} board={board} onSelect={onSelect} /></dd></div>)}</dl>;
}

function propertyText(value: unknown) { return stringify(value).trimEnd(); }
function parsePropertyText(key: string, text: string) {
  if (!text.trim()) return '';
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length) throw new Error(`属性“${key}”：${doc.errors[0].message}`);
  return doc.toJS({ maxAliasCount: 30 });
}

export function EditablePropertyList({ properties, board, disabled, onDirty, onSave, onRemove }: {
  properties: Record<string, unknown>;
  board: Board;
  disabled: boolean;
  onDirty: (dirty: boolean) => void;
  onSave: (key: string, value: unknown) => Promise<boolean>;
  onRemove: (key: string) => Promise<boolean>;
}) {
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [newRows, setNewRows] = useState<PropertyDraftRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [focusId, setFocusId] = useState<string | null>(null);
  const mapped = [board.schema.parentKey, board.schema.dependenciesKey, ...(board.schema.name.source === 'property' ? [board.schema.name.key] : [])];
  const entries = Object.entries(properties).filter(([key]) => key !== board.schema.statusKey && (!CONVERSATION_PROPERTIES.includes(key) || mapped.includes(key)));
  useEffect(() => {
    const changedExisting = entries.some(([key, value]) => Object.hasOwn(drafts, key) && drafts[key] !== propertyText(value));
    const changedNew = newRows.some(row => !!row.key.trim() || !!row.value.trim());
    onDirty(changedExisting || changedNew);
  }, [drafts, newRows, properties, onDirty]);

  function addProperty() {
    const row = createPropertyRow();
    setNewRows(current => [...current, row]);
    setFocusId(row.id);
  }
  async function saveExisting(key: string, value: unknown) {
    try {
      const parsed = parsePropertyText(key, drafts[key] ?? propertyText(value));
      if (await onSave(key, parsed)) {
        setDrafts(current => { const next = { ...current }; delete next[key]; return next; });
        setErrors(current => { const next = { ...current }; delete next[key]; return next; });
      }
    } catch (error) {
      setErrors(current => ({ ...current, [key]: error instanceof Error ? error.message : String(error) }));
    }
  }
  async function removeExisting(key: string) {
    if (await onRemove(key)) {
      setDrafts(current => { const next = { ...current }; delete next[key]; return next; });
      setErrors(current => { const next = { ...current }; delete next[key]; return next; });
    }
  }
  async function saveNew(row: PropertyDraftRow) {
    const key = row.key.trim();
    if (!key) { setErrors(current => ({ ...current, [row.id]: '请填写属性名' })); return; }
    if (key === board.schema.statusKey || Object.hasOwn(properties, key) || newRows.some(item => item.id !== row.id && item.key.trim() === key)) {
      setErrors(current => ({ ...current, [row.id]: '属性名已存在或由状态单独管理' })); return;
    }
    try {
      const value = parsePropertyText(key, row.value);
      if (await onSave(key, value)) {
        setNewRows(current => current.filter(item => item.id !== row.id));
        setErrors(current => { const next = { ...current }; delete next[row.id]; return next; });
      }
    } catch (error) {
      setErrors(current => ({ ...current, [row.id]: error instanceof Error ? error.message : String(error) }));
    }
  }

  return <div className="editable-properties">
    <dl className="property-list property-edit-list">{entries.map(([key, value]) => {
      const text = drafts[key] ?? propertyText(value);
      const changed = text !== propertyText(value);
      const inputId = `property-value-${encodeURIComponent(key)}`;
      return <div className="property property-edit-row" key={key}>
        <dt><Label htmlFor={inputId}>{key}</Label></dt>
        <dd><Textarea id={inputId} className="property-value-input code-input" aria-label={`属性值：${key}`} rows={typeof value === 'object' && value !== null ? Math.min(5, Math.max(2, text.split('\n').length)) : 1} disabled={disabled} value={text} onChange={event => setDrafts(current => ({ ...current, [key]: event.target.value }))} />
          <div className="property-row-actions"><Button type="button" size="icon-sm" variant="ghost" title={`删除属性 ${key}`} aria-label={`删除属性 ${key}`} disabled={disabled} onClick={() => void removeExisting(key)}><X /></Button>{changed && <Button type="button" size="icon-sm" variant="ghost" title={`保存属性 ${key}`} aria-label={`保存属性 ${key}`} disabled={disabled} onClick={() => void saveExisting(key, value)}><Check /></Button>}</div>
          {errors[key] && <p className="property-error" role="alert">{errors[key]}</p>}
        </dd>
      </div>;
    })}</dl>
    {newRows.map(row => <div className="property property-edit-row property-new-row" key={row.id}>
      <dt><Input autoFocus={focusId === row.id} aria-label="新属性名" placeholder="属性名" value={row.key} disabled={disabled} onChange={event => setNewRows(current => current.map(item => item.id === row.id ? { ...item, key: event.target.value } : item))} /></dt>
      <dd><Textarea className="property-value-input code-input" aria-label={`新属性值${row.key ? `：${row.key}` : ''}`} rows={row.value.includes('\n') ? Math.min(5, Math.max(2, row.value.split('\n').length)) : 1} placeholder="值" value={row.value} disabled={disabled} onChange={event => setNewRows(current => current.map(item => item.id === row.id ? { ...item, value: event.target.value } : item))} />
        <div className="property-row-actions"><Button type="button" size="icon-sm" variant="ghost" title="移除新属性" aria-label="移除新属性" disabled={disabled} onClick={() => setNewRows(current => current.filter(item => item.id !== row.id))}><X /></Button><Button type="button" size="icon-sm" variant="ghost" title="保存新属性" aria-label="保存新属性" disabled={disabled || !row.key.trim()} onClick={() => void saveNew(row)}><Check /></Button></div>
        {errors[row.id] && <p className="property-error" role="alert">{errors[row.id]}</p>}
      </dd>
    </div>)}
    <Button type="button" variant="ghost" size="sm" className="add-property" disabled={disabled} onClick={addProperty}><Plus size={14} />添加属性</Button>
  </div>;
}

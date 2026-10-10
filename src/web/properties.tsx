import React, { useEffect, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { parseDocument, stringify } from 'yaml';
import type { Board } from '../core.js';
import { CONVERSATION_PROPERTIES } from '../conversation-links.js';
import { Button } from './components/ui/button.js';
import { Input } from './components/ui/input.js';

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

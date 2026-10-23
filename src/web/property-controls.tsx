import React, { useEffect, useId, useRef, useState } from 'react';
import { Popover } from 'radix-ui';
import { ArrowUpRight, CalendarDays, Check, CheckSquare, ChevronLeft, ChevronRight, CircleDot, Hash, Link, ListFilter, Mail, Phone, Plus, Search, Type, Users, X, Braces } from 'lucide-react';
import type { Board } from '../core.js';
import { PROPERTY_PRESETS, isDateRange, propertyOptions, propertySuggestions, relationTarget, statusGroup, tagColor, type PropertyPreset, type PropertyType } from './property-model.js';

const ICONS = { text: Type, number: Hash, select: ListFilter, 'multi-select': ListFilter, status: CircleDot, date: CalendarDays, person: Users, checkbox: CheckSquare, url: Link, email: Mail, phone: Phone, relation: ArrowUpRight, structured: Braces };
export function PropertyIcon({ type }: { type: PropertyType }) { const Icon = ICONS[type]; return <Icon size={16} strokeWidth={1.7} aria-hidden="true" />; }
export function PropertyTag({ value, status, color }: { value: string; status?: boolean; color?: string }) {
  return <span className={`notion-tag${status ? ' notion-status' : ''}`} data-color={color ? undefined : tagColor(value)} style={color ? { '--tag-color': color } as React.CSSProperties : undefined}>{status && <span className="notion-status-dot" />}{value}</span>;
}
export function PersonTag({ name }: { name: string }) { return <span className="notion-person"><span className="notion-avatar" data-color={tagColor(name)}>{Array.from(name)[0]?.toUpperCase()}</span>{name}</span>; }

export function PropertyPopover({ children, className = '', ...props }: React.ComponentProps<typeof Popover.Content>) {
  return <Popover.Portal><Popover.Content {...props} align={props.align ?? 'start'} sideOffset={4} collisionPadding={12} className={`notion-popover ${className}`}>{children}</Popover.Content></Popover.Portal>;
}

interface Choice { id: string; label: string; content: React.ReactNode; group?: string }
function ChoiceList({ label, placeholder, choices, selected = [], onChoose, create, disabled, children, excluded = [], multiple = false }: {
  label: string; placeholder: string; choices: Choice[]; selected?: string[]; onChoose: (id: string) => void;
  create?: (query: string) => void; disabled: boolean; children?: React.ReactNode; excluded?: string[]; multiple?: boolean;
}) {
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const listId = useId();
  const list = useRef<HTMLDivElement>(null);
  const matches = choices.filter(choice => choice.label.toLocaleLowerCase().includes(query.toLocaleLowerCase().trim()));
  const duplicate = excluded.some(key => key.toLocaleLowerCase() === query.trim().toLocaleLowerCase());
  const canCreate = !!create && !!query.trim() && !duplicate && !choices.some(choice => choice.id.toLocaleLowerCase() === query.trim().toLocaleLowerCase());
  const count = matches.length + Number(canCreate);
  const activeIndex = Math.min(active, Math.max(0, count - 1));
  useEffect(() => { list.current?.querySelector(`[data-index="${activeIndex}"]`)?.scrollIntoView({ block: 'nearest' }); }, [activeIndex]);
  function choose(index: number) {
    if (disabled) return;
    if (index < matches.length) onChoose(matches[index].id);
    else if (canCreate) create!(query.trim());
    setQuery(''); setActive(0);
  }
  return <>
    {children}
    <div className="notion-search"><Search size={15} aria-hidden="true" /><input autoFocus aria-label={label} placeholder={placeholder} role="combobox" aria-autocomplete="list" aria-controls={listId} aria-expanded="true" aria-activedescendant={count ? `${listId}-${activeIndex}` : undefined} readOnly={disabled} value={query} onChange={event => { setQuery(event.target.value); setActive(0); }} onKeyDown={event => {
      if (event.key === 'Enter') { event.preventDefault(); if (count) choose(activeIndex); }
      if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && count) { event.preventDefault(); setActive((activeIndex + (event.key === 'ArrowDown' ? 1 : -1) + count) % count); }
    }} /></div>
    <div ref={list} className="notion-options" role="listbox" aria-label={label} id={listId} aria-multiselectable={multiple || undefined}>
      {matches.map((choice, index) => <React.Fragment key={choice.id}>
        {choice.group && (index === 0 || matches[index - 1].group !== choice.group) && <div className="notion-menu-heading" role="presentation">{choice.group}</div>}
        <button type="button" role="option" id={`${listId}-${index}`} data-index={index} tabIndex={-1} aria-selected={selected.includes(choice.id)} data-active={index === activeIndex} className="notion-option" disabled={disabled} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(index)} onClick={() => choose(index)}>{choice.content}{selected.includes(choice.id) && <Check size={15} className="notion-option-check" />}</button>
      </React.Fragment>)}
      {canCreate && <button type="button" role="option" id={`${listId}-${matches.length}`} data-index={matches.length} tabIndex={-1} aria-selected={false} data-active={activeIndex === matches.length} className="notion-option" disabled={disabled} onMouseDown={event => event.preventDefault()} onMouseEnter={() => setActive(matches.length)} onClick={() => choose(matches.length)}><Plus size={16} /><span>创建「{query.trim()}」</span></button>}
      {!count && <div className="notion-menu-empty">{duplicate ? '当前 Issue 已有此属性' : '无匹配结果'}</div>}
    </div>
  </>;
}

export function AddPropertyMenu({ board, usedKeys, disabled, onAdd, onOpenChange }: { board: Board; usedKeys: string[]; disabled: boolean; onAdd: (preset: PropertyPreset) => void; onOpenChange?: (open: boolean) => void }) {
  const [open, setOpen] = useState(false);
  const added = useRef(false);
  const used = new Set(usedKeys.map(key => key.toLocaleLowerCase()));
  const existing = propertySuggestions(board).filter(item => !used.has(item.key.toLocaleLowerCase()));
  const presets = PROPERTY_PRESETS.map(item => item.type === 'status' ? { ...item, key: board.schema.statusKey, value: board.columns[0]?.value ?? '' } : item)
    .filter(item => !used.has(item.key.toLocaleLowerCase()) && !existing.some(known => known.key === item.key));
  const all = [...existing, ...presets];
  function add(item: PropertyPreset) { added.current = true; onAdd(item); setOpen(false); onOpenChange?.(false); }
  return <Popover.Root open={open} onOpenChange={next => { setOpen(next); onOpenChange?.(next); }}>
    <Popover.Trigger asChild><button type="button" className="notion-add-property" disabled={disabled}><Plus size={16} />添加属性</button></Popover.Trigger>
    <PropertyPopover className="notion-add-menu" aria-label="添加属性" onCloseAutoFocus={event => { if (added.current) { event.preventDefault(); added.current = false; } }}>
      <ChoiceList label="搜索或输入属性名" placeholder="搜索或输入属性名…" disabled={disabled} excluded={usedKeys} choices={all.map(item => ({ id: item.key, label: `${item.key} ${item.label} ${item.type}`, group: existing.includes(item) ? '已有属性' : '属性类型', content: <><PropertyIcon type={item.type} /><span>{item.label}</span></> }))} onChoose={key => add(all.find(item => item.key === key)!)} create={query => {
        if (!used.has(query.toLocaleLowerCase())) add({ key: query, label: query, type: 'text', value: '' });
      }} />
    </PropertyPopover>
  </Popover.Root>;
}

export function ChoicePropertyEditor({ propertyKey, type, value, board, disabled, onChange }: { propertyKey: string; type: PropertyType; value: unknown; board: Board; disabled: boolean; onChange: (value: unknown, close: boolean) => void }) {
  const selected = (Array.isArray(value) ? value : value == null || value === '' ? [] : [value]).map(String);
  const multiple = type === 'multi-select' || type === 'person' || (type === 'relation' && propertyKey !== board.schema.parentKey && Array.isArray(value));
  const options = [...new Set([...propertyOptions(propertyKey, type, board), ...selected])];
  function toggle(id: string) {
    const next = multiple ? selected.includes(id) ? selected.filter(item => item !== id) : [...selected, id] : id;
    onChange(next, !multiple);
  }
  let choices: Choice[];
  if (type === 'status') {
    const groups = ['待办', '进行中', '已完成'];
    choices = groups.flatMap(group => board.columns.filter(column => statusGroup(column.value, board) === group).map(column => ({ id: column.value, label: `${column.label} ${column.value}`, group, content: <PropertyTag value={column.label} status color={column.color} /> })));
  } else if (type === 'relation') {
    // Keep legacy ID aliases selected without rewriting their stored representation.
    const selectedByTarget = new Map(selected.map(item => [relationTarget(item, board)?.id, item]));
    choices = board.issues.map(issue => ({ id: selectedByTarget.get(issue.id) ?? `[[${issue.id}]]`, label: `${issue.name} ${issue.id}`, content: <><ArrowUpRight size={16} /><span className="notion-relation-name">{issue.name}<small>{issue.id}</small></span></> }));
  } else choices = options.map(option => ({ id: option, label: option, content: type === 'person' ? <PersonTag name={option} /> : <PropertyTag value={option} /> }));
  return <ChoiceList label={`搜索${propertyKey}`} placeholder={type === 'person' ? '搜索人员…' : type === 'relation' ? '搜索页面…' : type === 'status' ? '搜索状态…' : '搜索或创建选项…'} disabled={disabled} choices={choices} selected={selected} multiple={multiple} onChoose={toggle} create={type === 'status' || type === 'relation' ? undefined : toggle}>
    {!!selected.length && multiple && <div className="notion-selected-tags">{selected.map(item => <button type="button" key={item} className="notion-remove-tag" disabled={disabled} aria-label={`移除 ${item}`} onClick={() => toggle(item)}>{type === 'person' ? <PersonTag name={item} /> : type === 'relation' ? <span>{board.issues.find(issue => item === `[[${issue.id}]]` || item === issue.id)?.name ?? item}</span> : <PropertyTag value={item} />}<X size={12} /></button>)}</div>}
  </ChoiceList>;
}

const dateString = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function DatePropertyEditor({ value, disabled, onChange, onSave }: { value: unknown; disabled: boolean; onChange: (value: unknown) => void; onSave: (value?: unknown) => void }) {
  const range = isDateRange(value);
  const start = range ? value.start : typeof value === 'string' ? value : '';
  const end = range ? value.end : '';
  const timed = start.includes('T');
  const inputValue = (date: string) => {
    if (!date.includes('T') || !/Z$|[+-]\d{2}:\d{2}$/.test(date)) return date;
    const local = new Date(date);
    return Number.isNaN(local.getTime()) ? date : `${dateString(local)}T${String(local.getHours()).padStart(2, '0')}:${String(local.getMinutes()).padStart(2, '0')}`;
  };
  const [month, setMonth] = useState(() => {
    const date = new Date(`${start.slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime()) ? new Date() : date;
  });
  const [activeEnd, setActiveEnd] = useState(false);
  const [focusDate, setFocusDate] = useState(start.slice(0, 10) || dateString(new Date()));
  const calendar = useRef<HTMLDivElement>(null);
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const today = dateString(new Date());
  const days = Array.from({ length: 42 }, (_, index) => new Date(month.getFullYear(), month.getMonth(), 1 - first.getDay() + index));
  function change(nextStart: string, nextEnd = end) { onChange(range ? { start: nextStart, end: nextEnd } : nextStart); }
  function choose(date: string) {
    const current = activeEnd ? end : start;
    const next = date + (timed ? current.slice(10) || 'T09:00' : '');
    change(activeEnd ? start : next, activeEnd ? next : end);
  }
  return <div className="notion-date-editor">
    <input autoFocus aria-label="开始日期" type={timed ? 'datetime-local' : 'date'} disabled={disabled} value={inputValue(start)} onFocus={() => setActiveEnd(false)} onChange={event => change(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); onSave(); } }} />
    {range && <input aria-label="结束日期" type={timed ? 'datetime-local' : 'date'} min={inputValue(start)} disabled={disabled} value={inputValue(end)} onFocus={() => setActiveEnd(true)} onChange={event => change(start, event.target.value)} />}
    <div className="notion-calendar-heading"><span>{month.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}</span><button type="button" aria-label="上个月" disabled={disabled} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}><ChevronLeft size={16} /></button><button type="button" aria-label="下个月" disabled={disabled} onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}><ChevronRight size={16} /></button></div>
    <div ref={calendar} className="notion-calendar" role="grid" aria-label="选择日期">
      <div role="row">{['日', '一', '二', '三', '四', '五', '六'].map(day => <span key={day} role="columnheader">{day}</span>)}</div>
      {Array.from({ length: 6 }, (_, week) => <div role="row" key={week}>{days.slice(week * 7, week * 7 + 7).map(day => {
        const date = dateString(day);
        return <button type="button" role="gridcell" key={date} data-date={date} tabIndex={date === focusDate || (!days.some(item => dateString(item) === focusDate) && date === dateString(first)) ? 0 : -1} aria-label={date} aria-selected={date === start.slice(0, 10) || date === end.slice(0, 10)} aria-current={date === today ? 'date' : undefined} data-outside={day.getMonth() !== month.getMonth()} data-in-range={range && date > start.slice(0, 10) && date < end.slice(0, 10)} disabled={disabled} onClick={() => { setFocusDate(date); choose(date); }} onKeyDown={event => {
          const delta = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 }[event.key];
          if (delta === undefined) return;
          event.preventDefault();
          const next = new Date(day.getFullYear(), day.getMonth(), day.getDate() + delta);
          const nextDate = dateString(next);
          setFocusDate(nextDate); setMonth(next);
          requestAnimationFrame(() => calendar.current?.querySelector<HTMLButtonElement>(`[data-date="${nextDate}"]`)?.focus());
        }}>{day.getDate()}</button>;
      })}</div>)}
    </div>
    <div className="notion-date-settings"><label>结束日期<input type="checkbox" role="switch" checked={range} disabled={disabled} onChange={event => { setActiveEnd(false); onChange(event.target.checked ? { start, end: start } : start); }} /></label><label>包含时间<input type="checkbox" role="switch" checked={timed} disabled={disabled} onChange={event => {
      const convert = (date: string) => event.target.checked ? `${date.slice(0, 10) || today}T09:00` : date.slice(0, 10);
      onChange(range ? { start: convert(start), end: convert(end) } : convert(start));
    }} /></label></div>
    <div className="notion-editor-footer"><button type="button" disabled={disabled} onClick={() => { onChange(''); onSave(''); }}>清除</button><button type="button" disabled={disabled || (range && !!end && start > end)} onClick={() => onSave()}>完成</button></div>
    {range && !!end && start > end && <p className="property-error" role="alert">结束日期不能早于开始日期</p>}
  </div>;
}

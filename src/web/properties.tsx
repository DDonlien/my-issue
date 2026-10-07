import React from 'react';
import type { Board } from '../core.js';

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
  return <dl className="property-list">{Object.entries(properties).filter(([key]) => key !== board.schema.statusKey).map(([key, value]) => <div className="property" key={key}><dt>{key}</dt><dd><PropertyValue value={value} board={board} onSelect={onSelect} /></dd></div>)}</dl>;
}

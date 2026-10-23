import { parseDocument, stringify } from 'yaml';
import type { Board } from '../core.js';
import { CONVERSATION_PROPERTIES } from '../conversation-links.js';

export type PropertyType = 'text' | 'number' | 'select' | 'multi-select' | 'status' | 'date' | 'person' | 'checkbox' | 'url' | 'email' | 'phone' | 'relation' | 'structured';
export interface PropertyPreset { key: string; label: string; type: PropertyType; value: unknown }

export const PROPERTY_PRESETS: PropertyPreset[] = [
  { key: 'text', label: '文本', type: 'text', value: '' },
  { key: 'number', label: '数字', type: 'number', value: null },
  { key: 'select', label: '单选', type: 'select', value: '' },
  { key: 'status', label: '状态', type: 'status', value: '' },
  { key: 'multi_select', label: '多选', type: 'multi-select', value: [] },
  { key: 'date', label: '日期', type: 'date', value: '' },
  { key: 'person', label: '人员', type: 'person', value: [] },
  { key: 'checkbox', label: '复选框', type: 'checkbox', value: false },
  { key: 'url', label: '网址', type: 'url', value: '' },
  { key: 'email', label: '电子邮箱', type: 'email', value: '' },
  { key: 'phone', label: '电话号码', type: 'phone', value: '' },
  { key: 'relation', label: '关联', type: 'relation', value: [] },
];

const normalizedKey = (key: string) => key.toLowerCase().replace(/[\s_-]/g, '');
const keys: Partial<Record<PropertyType, string[]>> = {
  number: ['number', 'count', 'estimate', 'points', '数字', '数量', '估时'],
  select: ['select', 'priority', 'type', 'category', '单选', '优先级', '类型', '分类'],
  'multi-select': ['multiselect', 'tags', 'labels', '多选', '标签'],
  date: ['date', 'due', 'duedate', 'deadline', 'startdate', 'enddate', '日期', '截止日期', '开始日期'],
  person: ['person', 'people', 'assignee', 'assignees', 'owner', 'owners', '负责人', '人员'],
  checkbox: ['checkbox', 'checked', 'enabled', '复选框'],
  url: ['url', 'website', 'link', '网址', '链接'],
  email: ['email', '邮箱', '电子邮箱'],
  phone: ['phone', 'telephone', '电话', '电话号码'],
  relation: ['relation', 'related', '关联'],
};

export function propertyType(key: string, value: unknown, board: Board, inferFromProject = true): PropertyType {
  if (key === board.schema.statusKey) return 'status';
  if (board.schema.name.source === 'property' && key === board.schema.name.key) return 'text';
  const name = normalizedKey(key);
  const semantic = key === board.schema.parentKey || key === board.schema.dependenciesKey ? 'relation' :
    (Object.entries(keys).find(([, names]) => names!.includes(name))?.[0] as PropertyType | undefined);
  if (!semantic && inferFromProject && (value == null || value === '' || (Array.isArray(value) && !value.length))) {
    const example = board.issues.map(issue => issue.properties[key]).find(item => item != null && item !== '' && !(Array.isArray(item) && !item.length));
    if (example !== undefined) return propertyType(key, example, board, false);
  }
  // Complex existing YAML remains structured even when its name matches a preset.
  if (value !== null && typeof value === 'object') {
    if (Array.isArray(value) && value.every(item => typeof item === 'string')) return semantic === 'relation' || semantic === 'person' ? semantic : 'multi-select';
    if (semantic === 'date' && isDateRange(value)) return 'date';
    return 'structured';
  }
  if (typeof value === 'boolean') return 'checkbox';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}(?:T[\d:.+Z-]+)?$/.test(value)) return 'date';
  if (semantic === 'number' || semantic === 'checkbox') return value == null || value === '' ? semantic : 'text';
  return semantic ?? 'text';
}

export function isDateRange(value: unknown): value is { start: string; end: string } {
  return !!value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).every(key => key === 'start' || key === 'end') &&
    typeof (value as Record<string, unknown>).start === 'string' && typeof (value as Record<string, unknown>).end === 'string';
}

export function propertyText(value: unknown): string { return stringify(value).trimEnd(); }
export function parsePropertyText(key: string, text: string): unknown {
  if (!text.trim()) return '';
  const doc = parseDocument(text, { uniqueKeys: true });
  if (doc.errors.length) throw new Error(`属性“${key}”：${doc.errors[0].message}`);
  return doc.toJS({ maxAliasCount: 30 });
}

export function visibleProperties(properties: Record<string, unknown>, board: Board): Array<[string, unknown]> {
  const mapped = [board.schema.parentKey, board.schema.dependenciesKey, ...(board.schema.name.source === 'property' ? [board.schema.name.key] : [])];
  return Object.entries(properties).filter(([key]) => !CONVERSATION_PROPERTIES.includes(key) || mapped.includes(key));
}

export function propertySuggestions(board: Board): PropertyPreset[] {
  const result = new Map<string, PropertyPreset>();
  for (const issue of board.issues) for (const [key, value] of visibleProperties(issue.properties, board)) {
    if (!result.has(key)) result.set(key, { key, label: key, type: propertyType(key, value, board), value: emptyPropertyValue(propertyType(key, value, board)) });
  }
  for (const key of [board.schema.parentKey, board.schema.dependenciesKey]) {
    if (!result.has(key)) result.set(key, { key, label: key, type: 'relation', value: key === board.schema.parentKey ? '' : [] });
  }
  return [...result.values()];
}

export function emptyPropertyValue(type: PropertyType): unknown {
  if (type === 'checkbox') return false;
  if (type === 'number') return null;
  if (type === 'multi-select' || type === 'person' || type === 'relation') return [];
  if (type === 'structured') return {};
  return '';
}

export function propertyOptions(key: string, type: PropertyType, board: Board): string[] {
  const result = new Set<string>();
  if (type === 'select' && ['priority', '优先级'].includes(normalizedKey(key))) for (const value of ['High', 'Medium', 'Low']) result.add(value);
  for (const issue of board.issues) {
    const value = issue.properties[key];
    if (typeof value === 'string' && value) result.add(value);
    if (Array.isArray(value)) for (const item of value) if (typeof item === 'string' && item) result.add(item);
  }
  return [...result];
}

export function statusGroup(value: string, board: Board): '待办' | '进行中' | '已完成' {
  if (board.schema.doneStatuses.includes(value)) return '已完成';
  if (/progress|review|doing|进行|验收/i.test(value)) return '进行中';
  return '待办';
}

export function relationTarget(value: string, board: Board) {
  const match = /^\[\[([^|\]]+)(?:\|[^\]]+)?\]\]$/.exec(value);
  const id = (match?.[1] ?? value).replace(/\.md$/i, '');
  return board.issues.find(issue => issue.id === id || issue.properties.id === id);
}

export function tagColor(value: string): string {
  const known: Record<string, string> = { high: 'red', medium: 'yellow', low: 'blue', p0: 'red', p1: 'orange', p2: 'yellow', p3: 'gray', 高: 'red', 中: 'yellow', 低: 'blue' };
  if (Object.hasOwn(known, value.toLowerCase())) return known[value.toLowerCase()];
  let hash = 0;
  for (const char of value) hash = (hash * 31 + char.charCodeAt(0)) | 0;
  return ['gray', 'brown', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink', 'red'][Math.abs(hash) % 9];
}

import { parsePropertyText, propertyText } from './property-model.js';
export { PropertyValue, PropertyList } from './property-value.js';
export { PropertyRowsEditor, EditablePropertyList } from './property-fields.js';

export interface PropertyDraftRow { id: string; key: string; value: string }
export function createPropertyRows(properties: Record<string, unknown>): PropertyDraftRow[] {
  return Object.entries(properties).map(([key, value]) => createPropertyRow(key, propertyText(value)));
}
export function createPropertyRow(key = '', value = ''): PropertyDraftRow { return { id: crypto.randomUUID(), key, value }; }
export function parsePropertyRows(rows: PropertyDraftRow[]): Record<string, unknown> {
  const properties: Record<string, unknown> = Object.create(null);
  for (const row of rows) {
    const key = row.key.trim();
    if (!key) { if (row.value.trim()) throw new Error('请为已填写的属性值补充属性名'); continue; }
    if (Object.hasOwn(properties, key)) throw new Error(`属性名重复：${key}`);
    properties[key] = parsePropertyText(key, row.value);
  }
  return properties;
}

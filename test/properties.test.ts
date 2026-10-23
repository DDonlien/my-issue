import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createPropertyRows, parsePropertyRows, EditablePropertyList, PropertyList } from '../src/web/properties.js';
import { propertyOptions, propertySuggestions, propertyType, statusGroup, visibleProperties } from '../src/web/property-model.js';
import { defaultSchema, parseIssue, type Board } from '../src/core.js';

test('property rendering retains typed nested values, links, and missing relation diagnostics without exposing HTML', () => {
  const target = parseIssue('---\nid: legacy-id\nstatus: todo\n---\n# 关联 Issue\n', 'issue-target.md');
  const board: Board = { root: '/tmp/project', project: 'project', schema: defaultSchema, issues: [target], columns: defaultSchema.columns, errors: [] };
  const properties = { status: 'todo', count: 0, enabled: false, blank: null, tags: ['界面', '附件'], options: { nested: { finish: true }, empty: [], owner: 'taobe' }, relation: '[[legacy-id|父任务]]', missing: '[[absent]]', url: 'https://example.com/issue', text: '<script>alert(1)</script>', unsafe: 'javascript:alert(1)' };
  const html = renderToStaticMarkup(React.createElement(PropertyList, { properties, board, onSelect: () => {} }));
  assert.match(html, /<dt>count<\/dt><dd><span>0<\/span>/);
  assert.match(html, />false</); assert.match(html, />空值</);
  assert.match(html, /property-array/); assert.match(html, /<dt>nested<\/dt>/); assert.match(html, />true</);
  assert.match(html, /property-link[^>]*title="关联 Issue">父任务<\/button>/);
  assert.match(html, /absent（未找到）/);
  assert.match(html, /href="https:\/\/example.com\/issue"/);
  assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>|href="javascript:|<dt>status<\/dt>/);
});

test('property form round-trips YAML-looking text and nested values without changing their types', () => {
  const properties = { text: 'true', numericText: '00123', yamlText: '[one, two]', dateText: '2026-10-24', colon: 'key: value', empty: '', checked: false, number: 0, nullable: null, tags: ['true', '00123'], nested: { enabled: true, count: 2, notes: 'null' } };
  assert.deepEqual({ ...parsePropertyRows(createPropertyRows(properties)) }, properties);
  assert.throws(() => parsePropertyRows([{ id: 'a', key: 'duplicate', value: '1' }, { id: 'b', key: 'duplicate', value: '2' }]), /属性名重复/);
  assert.throws(() => parsePropertyRows([{ id: 'a', key: 'broken', value: '[one,' }]), /属性“broken”/);
});

test('Notion property presets respect custom schema, preserve complex YAML, and use actual project choices', () => {
  const schema = { ...defaultSchema, statusKey: 'stage', parentKey: 'epic', dependenciesKey: 'needs', doneStatuses: ['finished'] };
  const issue = parseIssue('---\nstage: todo\nowner: taobe\npriority: P0\nlabels: [UI, API]\ncurrent_conversation: {url: "codex://threads/example"}\n---\n# Test\n', 'issue-a.md', schema);
  const board: Board = { root: '/tmp/project', project: 'project', schema, issues: [issue], columns: schema.columns, errors: [] };
  assert.equal(propertyType('stage', 'todo', board), 'status');
  assert.equal(propertyType('epic', '[[issue-a]]', board), 'relation');
  assert.equal(propertyType('needs', ['[[issue-a]]'], board), 'relation');
  assert.equal(propertyType('owner', 'taobe', board), 'person');
  assert.equal(propertyType('labels', ['UI', 'API'], board), 'multi-select');
  assert.equal(propertyType('enabled', 'false', board), 'text');
  assert.equal(propertyType('count', '123', board), 'text');
  assert.equal(propertyType('tags', ['UI', { nested: true }], board), 'structured');
  assert.equal(propertyType('date', { start: '2026-10-24', end: '2026-10-25' }, board), 'date');
  assert.equal(propertyType('date', { start: '2026-10-24', end: '2026-10-25', timezone: 'UTC' }, board), 'structured');
  assert.equal(propertyType('owner', { name: 'taobe', custom: 'keep' }, board), 'structured');
  assert.deepEqual(propertyOptions('owner', 'person', board), ['taobe']);
  assert.deepEqual(propertyOptions('priority', 'select', board), ['High', 'Medium', 'Low', 'P0']);
  assert.deepEqual(propertyOptions('labels', 'multi-select', board), ['UI', 'API']);
  assert.ok(propertySuggestions(board).some(item => item.key === 'epic'));
  assert.ok(!propertySuggestions(board).some(item => item.key === 'current_conversation'));
  assert.ok(!visibleProperties(issue.properties, board).some(([key]) => key === 'current_conversation'));
  assert.equal(statusGroup('finished', board), '已完成');
  assert.equal(statusGroup('in_review', board), '进行中');
});

test('editable properties show typed values and safe links while conversation metadata stays separate', () => {
  const properties = { status: 'todo', enabled: false, count: 0, tags: ['UI', 'API'], owner: 'taobe', url: 'https://example.com/task', current_conversation: { url: 'codex://threads/example' }, toString: 'kept', nested: { text: '<script>unsafe</script>', url: 'https://example.com/nested' } };
  const board: Board = { root: '/tmp/project', project: 'project', schema: defaultSchema, issues: [], columns: defaultSchema.columns, errors: [] };
  const html = renderToStaticMarkup(React.createElement(EditablePropertyList, { properties, board, disabled: false, onDirty: () => {}, onSave: async () => true, onRemove: async () => true, onRename: async () => true, onSelect: () => {} }));
  assert.match(html, /aria-checked="false"/);
  assert.match(html, />0<\/span>/);
  assert.match(html, />UI<\/span>/);
  assert.match(html, />API<\/span>/);
  assert.match(html, />taobe<\/span>/);
  assert.match(html, /href="https:\/\/example.com\/task"/);
  assert.match(html, /href="https:\/\/example.com\/nested"/);
  assert.match(html, />toString<\/span>/);
  assert.match(html, /&lt;script&gt;unsafe&lt;\/script&gt;/);
  assert.doesNotMatch(html, /current_conversation|<script>|<textarea|<input/);
  assert.match(html, /添加属性/);
});

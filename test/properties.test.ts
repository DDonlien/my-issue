import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { PropertyList } from '../src/web/properties.js';
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

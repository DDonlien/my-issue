import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { readCodexConversations, sendToCodexConversation } from '../src/codex-chats.js';
import { IssueStore } from '../src/core.js';
import { createServer } from '../src/server.js';

const thread = { id: 'thread-1', name: '实际对话名称', cwd: '/actual/project', updatedAt: 12, status: { type: 'idle' }, canAcceptDirectInput: true };
async function rpcFixture(t: test.TestContext, spec: Record<string, any> = {}) {
  const root = await mkdtemp(path.join(os.tmpdir(), 'myissue-dispatch-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const file = path.join(root, 'host.mjs'), log = path.join(root, 'requests.jsonl');
  await writeFile(file, `
    import {createInterface} from 'node:readline';
    import {appendFileSync} from 'node:fs';
    const spec=${JSON.stringify(spec)}, thread=${JSON.stringify(thread)}, log=${JSON.stringify(log)};
    createInterface({input:process.stdin}).on('line',line=>{
      const r=JSON.parse(line); if(!r.id)return;
      appendFileSync(log,JSON.stringify(r)+'\\n');
      let result={};
      if(r.method===spec.errorMethod){process.stdout.write(JSON.stringify({id:r.id,error:{message:'Host rejected request'}})+'\\n');return;}
      if(r.method==='thread/list')result=r.params.cursor?{data:[thread,{...thread,id:'thread-2',name:'第二个对话',canAcceptDirectInput:false}],nextCursor:null}:{data:[thread,{id:'../invalid',cwd:'/tmp'}],nextCursor:'page-2'};
      if(r.method==='thread/read')result={thread:spec.read??thread};
      if(r.method==='thread/resume')result={thread:spec.resumed??thread};
      if(r.method==='turn/start')result={turn:spec.turn??{id:'turn-accepted',status:'inProgress'}};
      process.stdout.write(JSON.stringify({id:r.id,result})+'\\n');
    });`);
  return { root, options: { command: process.execPath, args: [file] }, requests: async () => (await readFile(log, 'utf8')).trim().split('\n').map(line => JSON.parse(line)) };
}

test('real RPC discovery paginates, preserves titles and only performs read requests', async t => {
  const fixture = await rpcFixture(t);
  const result = await readCodexConversations(fixture.options);
  assert.deepEqual(result.conversations.map(chat => [chat.id, chat.title, chat.canSend]), [['thread-1', '实际对话名称', true], ['thread-2', '第二个对话', false]]);
  assert.deepEqual((await fixture.requests()).map(r => r.method), ['initialize', 'thread/list', 'thread/list']);
  const request = (await fixture.requests())[1];
  assert.equal(request.params.archived, false); assert.equal(request.params.useStateDbOnly, true);
  assert.deepEqual(request.params.sourceKinds, ['cli', 'vscode', 'appServer']);
});

test('directed send addresses the exact existing thread and preserves its settings', async t => {
  const fixture = await rpcFixture(t);
  const accepted = await sendToCodexConversation('thread-1', '最新 Issue 上下文', fixture.options);
  assert.equal(accepted.conversation.title, thread.name); assert.equal(accepted.conversation.url, 'codex://threads/thread-1');
  const requests = await fixture.requests();
  assert.deepEqual(requests.map(r => r.method), ['initialize', 'thread/read', 'turn/start']);
  assert.deepEqual(requests[2].params, { threadId: 'thread-1', input: [{ type: 'text', text: '最新 Issue 上下文', text_elements: [] }] });
});

test('unloaded targets resume on the same host without model or permission overrides', async t => {
  const fixture = await rpcFixture(t, { read: { ...thread, status: { type: 'notLoaded' }, canAcceptDirectInput: null } });
  await sendToCodexConversation('thread-1', 'context', fixture.options);
  const requests = await fixture.requests();
  assert.deepEqual(requests.map(r => r.method), ['initialize', 'thread/read', 'thread/resume', 'turn/start']);
  assert.deepEqual(requests[2].params, { threadId: 'thread-1' });
});

test('unavailable control, mismatched targets and host rejection never fall back or send elsewhere', async t => {
  for (const [spec, error, methods] of [
    [{ errorMethod: 'initialize' }, /无法连接/, ['initialize']],
    [{ read: { ...thread, id: 'different-thread' } }, /不一致/, ['initialize', 'thread/read']],
    [{ read: { ...thread, canAcceptDirectInput: false } }, /不接受/, ['initialize', 'thread/read']],
    [{ errorMethod: 'turn/start' }, /Host rejected/, ['initialize', 'thread/read', 'turn/start']],
    [{ turn: { id: 'failed', status: 'failed' } }, /未接受/, ['initialize', 'thread/read', 'turn/start']],
  ] as const) {
    const fixture = await rpcFixture(t, spec);
    await assert.rejects(sendToCodexConversation('thread-1', 'context', fixture.options), error);
    assert.deepEqual((await fixture.requests()).map(r => r.method), methods);
  }
});

test('MCP dispatch records a verified association only after host acceptance and retains failure semantics', async t => {
  const fixture = await rpcFixture(t);
  const store = new IssueStore(fixture.root);
  let issue = await store.create('派发原题', { status: 'todo', custom: { keep: true } }, '描述原文');
  issue = await store.comment(issue.id, issue.revision, '已有评论', 'taobe', 'human');
  const accepted = { conversation: { id: thread.id, title: thread.name, url: 'codex://threads/thread-1', cwd: thread.cwd, updatedAt: 12, canSend: true }, turnId: 'accepted' };
  let rejected = true, raced = false;
  const sent: any[] = [];
  const server = createServer('test', fixture.root, path.join(fixture.root, 'prefs.json'), { projects: async () => [], chooseFolder: async () => undefined }, undefined, {
    list: async () => ({ conversations: [accepted.conversation], canSend: true }),
    send: async (threadId, prompt) => {
      sent.push({ threadId, prompt });
      if (rejected) throw new Error('Host rejected');
      if (raced) { const latest = await store.get(issue.id); await store.update(issue.id, latest.revision, { properties: { external: true } }); }
      return accepted;
    },
  });
  const client = new Client({ name: 'dispatch-test', version: '1' });
  const [a, b] = InMemoryTransport.createLinkedPair();
  await server.connect(a); await client.connect(b);
  t.after(async () => { await client.close(); await server.close(); });
  const call = (name: string, args: Record<string, unknown> = {}) => client.callTool({ name, arguments: args });
  const tools = (await client.listTools()).tools;
  assert.deepEqual((tools.find(tool => tool.name === 'dispatch_to_conversation')?._meta?.ui as any).visibility, ['app']);
  assert.equal(tools.find(tool => tool.name === 'dispatch_to_conversation')?.annotations?.readOnlyHint, false);
  assert.equal((await call('list_codex_conversations')).isError, undefined);
  assert.equal((await store.get(issue.id)).raw, issue.raw);
  const args = { root: fixture.root, id: issue.id, threadId: 'thread-1', instruction: '这次的指令' };
  assert.equal((await call('dispatch_to_conversation', args)).isError, true);
  assert.equal((await store.get(issue.id)).raw, issue.raw);
  rejected = false;
  const result = (await call('dispatch_to_conversation', args)).structuredContent as any;
  assert.equal(result.sent, true);
  assert.match(sent.at(-1).prompt, /这次的指令/); assert.match(sent.at(-1).prompt, /已有评论/);
  const linked = await store.get(issue.id);
  assert.deepEqual(linked.properties.current_conversation, { url: accepted.conversation.url, title: thread.name });
  assert.deepEqual(linked.comments, issue.comments); assert.deepEqual(linked.properties.custom, { keep: true });
  raced = true;
  const racedResult = (await call('dispatch_to_conversation', args)).structuredContent as any;
  assert.equal(racedResult.sent, true); assert.ok(racedResult.associationError);
  assert.equal((await store.get(issue.id)).properties.external, true);
});

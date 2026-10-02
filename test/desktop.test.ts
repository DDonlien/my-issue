import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { createServer } from '../src/server.js';
import { readDesktopProjects } from '../src/desktop.js';

test('desktop project discovery paginates and accepts only absolute local roots', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'myissue-desktop-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const script = path.join(root, 'host.mjs');
  await writeFile(script, `
    import {createInterface} from 'node:readline';
    createInterface({input:process.stdin}).on('line',line=>{
      const r=JSON.parse(line);if(!r.id)return;
      let result={};
      if(r.method==='project/list')result=r.params.cursor?{data:[{name:'Second',roots:[{path:'/local/second'}]}],nextCursor:null}:{data:[{name:'Desktop label',roots:[{path:'/local/first'},{path:'/shared/attachment'}]},{name:'Cloud',roots:[]},{name:'Relative',roots:[{path:'relative'}]}],nextCursor:'next'};
      process.stdout.write(JSON.stringify({id:r.id,result})+'\\n');
    });`);
  assert.deepEqual(await readDesktopProjects(process.execPath, [script]), [{ root: '/local/first', name: 'Desktop label' }, { root: '/local/second', name: 'Second' }]);
  await writeFile(script, 'process.stdin.resume();');
  await assert.rejects(readDesktopProjects(process.execPath, [script], 100), /超时/);
  await assert.rejects(readDesktopProjects(path.join(root, 'missing')), { code: 'ENOENT' });
});

test('saved projects preserve labels without auto-opening; chooser cancellation and selection do not write files', async t => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'myissue-projects-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const folder = path.join(root, 'actual-folder'); await mkdir(folder);
  let chosen: string | undefined, fail = false;
  const server = createServer('test', undefined, undefined, {
    projects: async () => { if (fail) throw new Error('Desktop unavailable'); return [{ root: folder, name: 'ChatGPT 中的名字' }, { root: folder, name: 'ChatGPT 中的名字' }, { root: path.join(root, 'deleted'), name: 'Deleted' }]; },
    chooseFolder: async () => chosen,
  });
  const client = new Client({ name: 'project-test', version: '1' });
  const [serverTransport, clientTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport); await client.connect(clientTransport);
  t.after(async () => { await client.close(); await server.close(); });
  const call = async (name: string, args = {}) => (await client.callTool({ name, arguments: args })).structuredContent as any;
  const initial = await call('open_board');
  assert.equal(initial.board, undefined);
  assert.deepEqual(initial.projects, [{ root: folder, name: 'ChatGPT 中的名字' }]);
  assert.equal((await call('browse_folder')).root, undefined);
  chosen = folder;
  assert.equal((await call('browse_folder')).root, folder);
  assert.deepEqual(await readdir(folder), []);
  fail = true;
  assert.deepEqual((await call('list_projects')).projects, []);
  assert.equal((await call('open_board', { root: folder })).board.root, folder);
  assert.equal((await call('list_projects')).projects[0].root, folder);
  assert.deepEqual(await readdir(folder), []);
});

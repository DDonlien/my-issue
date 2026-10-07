import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { ProjectPreferences, sharedPreferencesFile } from '../src/preferences.js';

test('configuration location is stable across plugin data directories and versions', () => {
  const env = { PLUGIN_DATA: '/session-one/v1' };
  const expected = '/user/Library/Application Support/myIssue/projects.json';
  assert.equal(sharedPreferencesFile(env, 'darwin', '/user'), expected);
  assert.equal(sharedPreferencesFile({ PLUGIN_DATA: '/session-two/v2' }, 'darwin', '/user'), expected);
  assert.equal(sharedPreferencesFile({ MYISSUE_CONFIG_DIR: '/isolated/config' }, 'darwin', '/user'), '/isolated/config/projects.json');
  assert.equal(sharedPreferencesFile({ XDG_CONFIG_HOME: '/user/config' }, 'linux', '/user'), '/user/config/myissue/projects.json');
});

test('independent preference instances preserve simultaneous additions, last selection and legacy paths', async t => {
  const base = await mkdtemp(path.join(os.tmpdir(), 'myissue-preferences-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const file = path.join(base, 'shared', 'projects.json');
  const roots = Array.from({ length: 12 }, (_, i) => path.join(base, 'project-' + i));
  await Promise.all(roots.map(root => new ProjectPreferences(file).remember({ root, name: path.basename(root) })));
  const prefs = await new ProjectPreferences(file).read();
  assert.deepEqual(prefs.projects.map(project => project.root).sort(), roots.sort());
  await new ProjectPreferences(file).remember({ root: roots[0], name: '用户的项目名称' });
  const reopened = await new ProjectPreferences(file).read();
  assert.equal(reopened.lastRoot, roots[0]);
  assert.equal(reopened.projects.find(project => project.root === roots[0])!.name, '用户的项目名称');
  const legacy = path.join(base, 'old-process.json');
  const old = JSON.stringify([roots[0], path.join(base, 'legacy-only'), 'relative-path']);
  await writeFile(legacy, old);
  const migrated = await new ProjectPreferences(file, legacy).read();
  assert.equal(migrated.projects.length, 13);
  assert.equal(migrated.lastRoot, roots[0]);
  assert.equal(migrated.projects.find(project => project.root === roots[0])!.name, '用户的项目名称');
  assert.equal(await readFile(legacy, 'utf8'), old);
  assert.deepEqual(await new ProjectPreferences(file).read(), migrated);
});

test('old shared array remains readable and invalid configuration is never overwritten', async t => {
  const base = await mkdtemp(path.join(os.tmpdir(), 'myissue-preferences-'));
  t.after(() => rm(base, { recursive: true, force: true }));
  const file = path.join(base, 'projects.json');
  await writeFile(file, JSON.stringify([path.join(base, 'old')]));
  const prefs = new ProjectPreferences(file);
  assert.equal((await prefs.read()).projects[0].name, 'old');
  await prefs.remember({ root: path.join(base, 'new'), name: 'New' });
  assert.equal((await prefs.read()).projects.length, 2);
  await writeFile(file, 'invalid-config');
  await assert.rejects(prefs.remember({ root: base, name: 'Ignored' }), /共享项目配置/);
  assert.equal(await readFile(file, 'utf8'), 'invalid-config');
  await rm(file);
  await mkdir(file + '.lock');
  assert.equal((await prefs.read()).projects.length, 0);
});

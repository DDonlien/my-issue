import test from 'node:test';
import assert from 'node:assert/strict';
import { createHeartbeat, retainSnapshot } from '../src/web/heartbeat.js';

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(yes => { resolve = yes; });
  return { promise, resolve };
}

test('unchanged file snapshots retain their identity; content, additions, removals and schema changes replace them', () => {
  const initial = { issues: [{ id: 'one', revision: 'v1', comments: [] as string[] }], schema: { statusKey: 'status' }, errors: [] as string[] };
  assert.equal(retainSnapshot(initial, structuredClone(initial)), initial);
  for (const update of [
    { ...initial, issues: [{ ...initial.issues[0], revision: 'v2', comments: ['new comment'] }] },
    { ...initial, issues: [...initial.issues, { id: 'two', revision: 'v1', comments: [] }] },
    { ...initial, issues: [] },
    { ...initial, schema: { statusKey: 'state' } },
    { ...initial, errors: ['Invalid YAML'] },
  ]) assert.equal(retainSnapshot(initial, update), update);
});

test('heartbeat serializes requests and discards results invalidated by a local save or project switch', async () => {
  const pending = deferred<string>();
  let reads = 0, generation = 0;
  const applied: string[] = [];
  const heartbeat = createHeartbeat({ canRead: () => true, generation: () => generation, read: () => { reads++; return pending.promise; }, apply: value => applied.push(value), onError: error => { throw error; } });
  const first = heartbeat.tick();
  await heartbeat.tick();
  assert.equal(reads, 1);
  generation++;
  pending.resolve('outdated files'); await first;
  assert.deepEqual(applied, []);
  await heartbeat.tick();
  assert.deepEqual(applied, ['outdated files']);
});

test('drafts block new reads and pending applies; later heartbeats resume and stopped pages discard pending results', async () => {
  const pending = deferred<string>();
  let eligible = false, reads = 0;
  const applied: string[] = [];
  const heartbeat = createHeartbeat({ canRead: () => eligible, generation: () => 0, read: () => { reads++; return pending.promise; }, apply: value => applied.push(value), onError: error => { throw error; } });
  await heartbeat.tick(); assert.equal(reads, 0);
  eligible = true; const first = heartbeat.tick(); eligible = false;
  pending.resolve('files'); await first; assert.deepEqual(applied, []);
  eligible = true; await heartbeat.tick(); assert.deepEqual(applied, ['files']);
  const last = heartbeat.tick(); heartbeat.stop(); await last;
  assert.deepEqual(applied, ['files']);
  await heartbeat.tick(); assert.equal(reads, 3);
});

test('failed heartbeats report an error and retry on the next tick', async () => {
  let failed = true;
  const errors: unknown[] = [], applied: string[] = [];
  const heartbeat = createHeartbeat({ canRead: () => true, generation: () => 0, read: async () => { if (failed) throw new Error('offline'); return 'latest'; }, apply: value => applied.push(value), onError: error => errors.push(error) });
  await heartbeat.tick(); assert.equal(errors.length, 1);
  failed = false; await heartbeat.tick(); assert.deepEqual(applied, ['latest']);
});

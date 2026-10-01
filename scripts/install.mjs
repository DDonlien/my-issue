import { spawnSync } from 'node:child_process';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');
function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: 'inherit' });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
run(process.execPath, ['scripts/build.mjs']);
run('codex', ['plugin', 'marketplace', 'add', root, '--json']);
run('codex', ['plugin', 'add', 'myissue@myissue-local', '--json']);
run('codex', ['plugin', 'list', '--marketplace', 'myissue-local', '--json']);

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
console.log('安装/更新完成后，请完全退出并重新启动 ChatGPT / Codex 桌面应用，再打开 myIssue。仅关闭页面不会刷新旧对话保留的 MCP 服务进程。');

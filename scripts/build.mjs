import { build } from 'esbuild';
import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
const base = path.resolve(import.meta.dirname, '..');
const plugin = path.join(base, 'plugins/myissue');
await mkdir(path.join(plugin, 'scripts'), { recursive: true });
await mkdir(path.join(plugin, 'assets'), { recursive: true });
const ui = await build({ entryPoints: [path.join(base, 'src/web/app.tsx')], bundle: true, minify: true, write: false, outfile: 'app.js', format: 'iife', target: 'es2022', define: { 'process.env.NODE_ENV': '"production"' }, legalComments: 'none', metafile: true });
const js = ui.outputFiles.find(f => f.path.endsWith('.js')).text;
const css = ui.outputFiles.find(f => f.path.endsWith('.css')).text;
const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>myIssue</title><style>${css}</style></head><body><div id="root"></div><script>${js.replaceAll('</script', '<\\/script')}</script></body></html>`;
await writeFile(path.join(plugin, 'assets/board.html'), html);
const serverBuild = await build({ entryPoints: [path.join(base, 'src/mcp.ts')], bundle: true, minify: true, platform: 'node', format: 'cjs', target: 'node22', outfile: path.join(plugin, 'scripts/server.cjs'), legalComments: 'none', metafile: true });
const packages = new Set();
for (const input of [...Object.keys(ui.metafile.inputs), ...Object.keys(serverBuild.metafile.inputs)]) {
  const absolute = path.resolve(base, input).replaceAll('\\', '/');
  const index = absolute.lastIndexOf('/node_modules/');
  if (index < 0) continue;
  const tail = absolute.slice(index + 14).split('/');
  packages.add(absolute.slice(0, index + 14) + tail.slice(0, tail[0].startsWith('@') ? 2 : 1).join('/'));
}
const notices = ['Third-party notices for the bundled myIssue runtime.\n'];
for (const folder of [...packages].sort()) {
  const pkg = JSON.parse(await readFile(path.join(folder, 'package.json'), 'utf8'));
  notices.push(`\n===== ${pkg.name}@${pkg.version} (${pkg.license ?? 'see license below'}) =====\n`);
  for (const name of (await readdir(folder)).filter(n => /^(license|copying|notice)(?:\.|-|$)/i.test(n)).sort()) {
    try { notices.push(name + '\n' + await readFile(path.join(folder, name), 'utf8') + '\n'); } catch { /* Some packages use a directory of notices. */ }
  }
}
await writeFile(path.join(plugin, 'THIRD_PARTY_NOTICES.txt'), notices.join(''));
const manifest = {
  name: 'myissue', version: '0.1.1', description: 'Local Markdown issue boards with editable properties, shared comments and conversation dispatch.',
  author: { name: 'DDonlien', url: 'https://github.com/DDonlien' }, repository: 'https://github.com/DDonlien/my-issue',
  keywords: ['issues', 'markdown', 'kanban', 'local'], skills: './skills/', mcpServers: './.mcp.json',
  interface: { displayName: 'myIssue', shortDescription: '项目里的 Issue，对话里的工作', longDescription: '从项目根目录 issues/*.md 读取看板。编辑名称和任意属性、追加人类与 Agent 评论，在宿主支持时发送到当前或新对话。支持全局和对话侧栏入口。', developerName: 'DDonlien', category: 'Productivity', capabilities: ['Interactive', 'Write'], brandColor: '#424242', composerIcon: './assets/icon.svg', logo: './assets/icon.svg', defaultPrompt: ['打开这个项目的 myIssue 看板', '把这段对话整理成一个 Issue', '读取 Issue 和最新评论，开始处理'] },
};
await writeFile(path.join(plugin, '.codex-plugin/plugin.json'), JSON.stringify(manifest, null, 2) + '\n');
// The portable manifest enables Codex's plugin-root path resolution for stdio.
await writeFile(path.join(plugin, 'plugin.json'), JSON.stringify({
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  name: manifest.name, version: manifest.version, description: manifest.description,
  author: manifest.author, extensions: { 'com.openai': { interface: manifest.interface } },
}, null, 2) + '\n');
await writeFile(path.join(plugin, 'mcp.json'), JSON.stringify({
  $schema: 'https://agent-plugins.org/schemas/1.0.0/mcp.schema.json',
  mcpServers: { myissue: { type: 'stdio', command: 'node', args: ['./scripts/server.cjs'], cwd: '${PLUGIN_ROOT}' } },
}, null, 2) + '\n');
await writeFile(path.join(plugin, '.mcp.json'), JSON.stringify({ mcpServers: { myissue: { command: 'node', args: ['./scripts/server.cjs'], cwd: '${PLUGIN_ROOT}', startup_timeout_sec: 15 } } }, null, 2) + '\n');
await writeFile(path.join(base, '.agents/plugins/marketplace.json'), JSON.stringify({ name: 'myissue-local', interface: { displayName: 'myIssue Local' }, plugins: [{ name: 'myissue', source: { source: 'local', path: './plugins/myissue' }, policy: { installation: 'AVAILABLE', authentication: 'ON_INSTALL' }, category: 'Productivity' }] }, null, 2) + '\n');
console.log('Built self-contained myissue plugin. Node.js 22+ is the only runtime dependency.');

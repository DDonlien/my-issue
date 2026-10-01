import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { execute, type Operation } from './service.js';
import { IssueError } from './core.js';

const port = Number(process.env.MYISSUE_PREVIEW_PORT ?? 4310);
const projectRoot = path.resolve(process.env.MYISSUE_ROOT ?? process.cwd());
const html = await readFile(path.join(import.meta.dirname, '../plugins/myissue/assets/board.html'));
const origin = `http://127.0.0.1:${port}`;
const server = createServer(async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Content-Security-Policy', "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'self'; img-src data:; base-uri 'none'; frame-ancestors 'none'");
  if (req.headers.host !== `127.0.0.1:${port}` || (req.headers.origin && req.headers.origin !== origin)) { res.writeHead(403); res.end(); return; }
  try {
    if (req.method === 'GET' && req.url === '/') { res.setHeader('Content-Type', 'text/html; charset=utf-8'); res.end(html); return; }
    if (req.method !== 'POST' || !req.url?.startsWith('/api/') || !req.headers['content-type']?.startsWith('application/json')) { res.writeHead(404); res.end(); return; }
    let text = '';
    for await (const chunk of req) { text += chunk; if (Buffer.byteLength(text) > 2_000_000) throw new Error('请求过大'); }
    const args = JSON.parse(text || '{}'); const operation = req.url.slice(5);
    const projects = [{ root: projectRoot, name: path.basename(projectRoot) }];
    let data;
    if (operation === 'list_projects') data = { projects };
    else if (operation === 'open_board') data = { ...(await execute('open_board', { root: projectRoot, ...args })), projects };
    else data = await execute(operation as Operation, args);
    res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(data));
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: { code: e instanceof IssueError ? e.code : 'INVALID_INPUT', message: (e as Error).message } }));
  }
});
server.listen(port, '127.0.0.1', () => console.log(`${origin} — ${projectRoot}`));

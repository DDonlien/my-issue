import { spawn, execFile } from 'node:child_process';
import { createInterface } from 'node:readline';
import { promisify } from 'node:util';
import path from 'node:path';
import { stat } from 'node:fs/promises';

export type DesktopProject = { root: string; name: string };

/** Read the public app-server project inventory, without starting or resuming chats. */
export function readDesktopProjects(command = 'codex', args = ['app-server'], timeoutMs = 3000): Promise<DesktopProject[]> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    const lines = createInterface({ input: child.stdout });
    let settled = false, bytes = 0, requestId = 2;
    const projects: DesktopProject[] = [];
    const seenCursors = new Set<string>();
    function finish(error?: Error) {
      if (settled) return;
      settled = true; clearTimeout(timer); lines.close(); child.kill();
      error ? reject(error) : resolve(projects);
    }
    function send(id: number, method: string, params: unknown) { child.stdin.write(JSON.stringify({ id, method, params }) + '\n'); }
    const timer = setTimeout(() => finish(new Error('桌面项目读取超时')), timeoutMs);
    child.on('error', finish);
    child.on('exit', () => { if (!settled) finish(new Error('桌面项目服务已退出')); });
    child.stdin.on('error', finish);
    child.stderr.on('data', () => {});
    child.stdout.on('data', chunk => { bytes += chunk.length; if (bytes > 2_000_000) finish(new Error('桌面项目响应过大')); });
    lines.on('line', line => {
      if (settled) return;
      try {
        const message = JSON.parse(line);
        if (message.id !== 1 && message.id !== requestId) return;
        if (message.error) throw new Error(message.error.message ?? '桌面项目读取失败');
        if (message.id === 1) {
          child.stdin.write(JSON.stringify({ method: 'initialized' }) + '\n');
          send(requestId, 'project/list', { limit: 100 });
          return;
        }
        if (!Array.isArray(message.result?.data)) throw new Error('桌面项目响应无效');
        for (const project of message.result.data) {
          if (typeof project.name !== 'string' || !Array.isArray(project.roots)) continue;
          // Match the desktop project's primary folder. Extra workspace roots can
          // be shared dependencies/attachments rather than independent projects.
          const root = project.roots[0];
          if (typeof root?.path === 'string' && path.isAbsolute(root.path)) projects.push({ root: path.resolve(root.path), name: project.name });
        }
        const cursor = message.result.nextCursor;
        if (cursor == null) { finish(); return; }
        if (typeof cursor !== 'string' || seenCursors.has(cursor) || seenCursors.size >= 10) throw new Error('桌面项目分页无效');
        seenCursors.add(cursor); send(++requestId, 'project/list', { limit: 100, cursor });
      } catch (e) { finish(e as Error); }
    });
    send(1, 'initialize', { clientInfo: { name: 'myissue_projects', title: 'myIssue', version: '0.1.3' }, capabilities: { experimentalApi: true } });
  });
}

let cached: DesktopProject[] | undefined;
let expiresAt = 0;
let pending: Promise<DesktopProject[]> | undefined;
export async function desktopProjects(refresh = false): Promise<DesktopProject[]> {
  if (!refresh && cached && Date.now() < expiresAt) return cached;
  if (pending) return pending;
  pending = (async () => {
    try {
      let projects: DesktopProject[];
      try { projects = await readDesktopProjects(process.env.MYISSUE_CODEX_BIN ?? 'codex'); }
      catch (e) {
        // Desktop installations can include the CLI without putting it on PATH.
        if (process.env.MYISSUE_CODEX_BIN || process.platform !== 'darwin' || (e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
        projects = await readDesktopProjects('/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex');
      }
      cached = projects; expiresAt = Date.now() + 10_000;
      return projects;
    } finally { pending = undefined; }
  })();
  return pending;
}

/** The local plugin opens an OS chooser, not a browser upload of directory contents. */
export async function chooseDesktopFolder(): Promise<string | undefined> {
  if (process.platform !== 'darwin') throw new Error('当前系统暂不支持文件夹选择器，请输入项目路径');
  const script = 'try\nreturn POSIX path of (choose folder with prompt "选择 myIssue 项目文件夹")\non error number -128\nreturn ""\nend try';
  let stdout: string;
  try { ({ stdout } = await promisify(execFile)('/usr/bin/osascript', ['-e', script], { timeout: 180_000, maxBuffer: 64_000 })); }
  catch { throw new Error('无法完成文件夹选择，请重试或输入项目路径'); }
  const selected = stdout.trim();
  if (!selected) return undefined;
  const root = path.resolve(selected);
  if (!(await stat(root)).isDirectory()) throw new Error('请选择项目文件夹');
  return root;
}

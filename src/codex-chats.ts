import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { createInterface } from 'node:readline';
import { IssueError } from './core.js';
import { version } from './version.js';

export type CodexConversation = { id: string; title: string; url: string; cwd: string; updatedAt: number; canSend: boolean };
export type CodexConversationList = { conversations: CodexConversation[]; canSend: boolean };
type Options = { command?: string; args?: string[]; timeoutMs?: number; socket?: string };
type Thread = { id?: unknown; name?: unknown; cwd?: unknown; updatedAt?: unknown; status?: { type?: string }; canAcceptDirectInput?: boolean | null };

// A proxy joins the host's existing control socket. Only read-only discovery may
// use an independent app-server; we never start a daemon or an execution host.
class Rpc {
  private child: ChildProcessWithoutNullStreams;
  private lines;
  private pending = new Map<number, { resolve: (value: any) => void; reject: (error: Error) => void; timer: ReturnType<typeof setTimeout> }>();
  private id = 0;
  private ended = false;
  private bytes = 0;
  constructor(command: string, args: string[], private timeoutMs: number) {
    this.child = spawn(command, args, { stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true });
    this.lines = createInterface({ input: this.child.stdout });
    this.child.on('error', error => this.close(error));
    this.child.on('exit', () => this.close(new Error('Codex 对话接口已断开')));
    this.child.stdin.on('error', error => this.close(error));
    this.child.stderr.on('data', () => {});
    this.child.stdout.on('data', chunk => { this.bytes += chunk.length; if (this.bytes > 8_000_000) this.close(new Error('Codex 对话响应过大')); });
    this.lines.on('line', line => {
      try {
        const message = JSON.parse(line);
        if (message.method) {
          if (message.id != null) this.write({ id: message.id, error: { code: -32601, message: 'myIssue does not handle host approval requests' } });
          return;
        }
        const request = this.pending.get(message.id);
        if (!request) return;
        clearTimeout(request.timer); this.pending.delete(message.id);
        message.error ? request.reject(new Error(message.error.message ?? 'Codex 对话请求失败')) : request.resolve(message.result);
      } catch { this.close(new Error('Codex 对话响应无效')); }
    });
  }
  private write(value: unknown) { if (!this.ended) this.child.stdin.write(JSON.stringify(value) + '\n'); }
  request(method: string, params: unknown): Promise<any> {
    if (this.ended) return Promise.reject(new Error('Codex 对话接口未连接'));
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => this.close(new Error('Codex 对话读取超时')), this.timeoutMs);
      this.pending.set(id, { resolve, reject, timer }); this.write({ id, method, params });
    });
  }
  async initialize() {
    await this.request('initialize', { clientInfo: { name: 'myissue_conversations', title: 'myIssue', version }, capabilities: { experimentalApi: true } });
    this.write({ method: 'initialized' });
  }
  close(error = new Error('Codex 对话接口已关闭')) {
    if (this.ended) return;
    this.ended = true;
    for (const request of this.pending.values()) { clearTimeout(request.timer); request.reject(error); }
    this.pending.clear(); this.lines.close(); this.child.kill();
  }
}

async function connect(proxy: boolean, options: Options): Promise<Rpc> {
  const socket = options.socket ?? process.env.MYISSUE_CODEX_SOCKET;
  const args = options.args ?? (proxy ? ['app-server', 'proxy', ...(socket ? ['--sock', socket] : [])] : ['app-server']);
  const command = options.command ?? process.env.MYISSUE_CODEX_BIN ?? 'codex';
  const rpc = new Rpc(command, args, options.timeoutMs ?? 5000);
  try { await rpc.initialize(); return rpc; }
  catch (error) {
    rpc.close();
    if (!options.command && !process.env.MYISSUE_CODEX_BIN && process.platform === 'darwin' && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      return connect(proxy, { ...options, command: '/Applications/ChatGPT.app/Contents/Resources/codex-cli/CodexCLI.app/Contents/MacOS/codex' });
    }
    throw error;
  }
}

function conversation(thread: Thread, canSend: boolean): CodexConversation | undefined {
  if (typeof thread?.id !== 'string' || !/^[\w-]{1,128}$/.test(thread.id) || typeof thread.cwd !== 'string') return;
  return { id: thread.id, title: typeof thread.name === 'string' && thread.name.trim() ? thread.name : '未命名对话', url: `codex://threads/${thread.id}`, cwd: thread.cwd, updatedAt: typeof thread.updatedAt === 'number' ? thread.updatedAt : 0, canSend: canSend && thread.canAcceptDirectInput !== false };
}

export async function readCodexConversations(options: Options = {}): Promise<CodexConversationList> {
  let rpc: Rpc, canSend = true;
  try { rpc = await connect(true, options); }
  catch { canSend = false; rpc = await connect(false, options); }
  try {
    const conversations: CodexConversation[] = [], ids = new Set<string>(), cursors = new Set<string>();
    let cursor: string | undefined;
    for (;;) {
      const page = await rpc.request('thread/list', { limit: 100, sortKey: 'updated_at', sourceKinds: ['cli', 'vscode', 'appServer'], archived: false, useStateDbOnly: true, ...(cursor ? { cursor } : {}) });
      if (!Array.isArray(page?.data)) throw new Error('Codex 对话列表无效');
      for (const thread of page.data) {
        const entry = conversation(thread, canSend);
        if (entry && !ids.has(entry.id)) { ids.add(entry.id); conversations.push(entry); }
      }
      if (page.nextCursor == null) break;
      if (typeof page.nextCursor !== 'string' || cursors.has(page.nextCursor) || cursors.size >= 50) throw new Error('Codex 对话分页无效');
      const next: string = page.nextCursor;
      cursor = next; cursors.add(next);
    }
    return { conversations, canSend };
  } finally { rpc.close(); }
}

export async function sendToCodexConversation(threadId: string, prompt: string, options: Options = {}) {
  // Never fall back to resuming this ID in an independent server: that could run
  // a second agent against a conversation already active in the desktop app.
  let rpc: Rpc;
  try { rpc = await connect(true, options); }
  catch { throw new IssueError('CODEX_UNAVAILABLE', '无法连接 Codex 桌面对话，请在桌面对话中继续'); }
  try {
    let { thread } = await rpc.request('thread/read', { threadId, includeTurns: false });
    if (thread?.id !== threadId) throw new Error('Codex 返回的对话与所选目标不一致');
    if (thread.status?.type === 'notLoaded') ({ thread } = await rpc.request('thread/resume', { threadId }));
    const target = conversation(thread, true);
    if (!target || target.id !== threadId || !target.canSend) throw new Error('所选 Codex 对话不接受消息');
    const { turn } = await rpc.request('turn/start', { threadId, input: [{ type: 'text', text: prompt, text_elements: [] }] });
    if (!turn || typeof turn.id !== 'string' || turn.status === 'failed' || turn.status === 'interrupted' || turn.error) throw new Error('Codex 未接受发送，尚未分发');
    return { conversation: target, turnId: turn.id };
  } finally { rpc.close(); }
}

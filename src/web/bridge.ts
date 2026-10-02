import { App } from '@modelcontextprotocol/ext-apps';
import { OpenAIExtensions } from '@openai/mcp-extensions/app';
import { dispatchAvailable, dispatchMessage } from '../message.js';
import { followHostTheme } from './theme.js';

export type ToolData = Record<string, any>;
let app: App | undefined;
let extensions: OpenAIExtensions | undefined;
let handler: (data: ToolData) => void = () => {};
export const preview = window.parent === window;
export function onResult(callback: typeof handler) { handler = callback; }
export async function connect() {
  if (preview) return;
  app = new App({ name: 'myIssue', version: '0.1.3' });
  extensions = new OpenAIExtensions(app);
  app.ontoolresult = result => { if (result.structuredContent) handler(result.structuredContent); };
  const theme = followHostTheme(app);
  await app.connect();
  theme();
}
export async function call(name: string, args: ToolData = {}): Promise<ToolData> {
  let data: ToolData;
  if (preview) {
    const response = await fetch('/api/' + name, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(args) });
    data = await response.json();
  } else {
    if (!app) throw new Error('宿主尚未连接');
    const response = await app.callServerTool({ name, arguments: args }, name === 'browse_folder' ? { timeout: 180_000 } : undefined);
    data = response.structuredContent ?? {};
    if (response.isError && !data.error) throw new Error(response.content?.filter(c => c.type === 'text').map(c => c.text).join('\n') ?? '操作失败');
  }
  if (data.error) throw Object.assign(new Error(data.error.message), { code: data.error.code });
  return data;
}
export function canDispatch(target: 'active' | 'new') {
  return !preview && dispatchAvailable(app, extensions, target);
}
export async function send(prompt: string, target: 'active' | 'new') {
  if (!canDispatch(target)) throw new Error('当前页面没有宿主对话能力，请在 myIssue 插件页面中分发');
  return dispatchMessage(app!, extensions!, prompt, target);
}
export async function context(root: string, id: string) {
  if (!app) return;
  await app.updateModelContext({ content: [{ type: 'text', text: `myIssue 当前选择：${root}/issues/${id}.md。需要操作时请先通过 get_issue 读取最新内容。` }] });
}

import type { App } from '@modelcontextprotocol/ext-apps';
import type { OpenAIExtensions } from '@openai/mcp-extensions/app';

export function dispatchAvailable(app: App | undefined, extensions: OpenAIExtensions | undefined, target: 'active' | 'new') {
  return extensions?.message != null || (target === 'active' && !!app?.getHostCapabilities()?.message);
}
export async function dispatchMessage(app: App, extensions: OpenAIExtensions, prompt: string, target: 'active' | 'new') {
  if (!dispatchAvailable(app, extensions, target)) throw new Error('宿主不支持这个对话目标');
  const message = { role: 'user' as const, content: [{ type: 'text' as const, text: prompt }] };
  const result = extensions.message
    ? await extensions.message.send({ ...message, _meta: { 'openai/message': { target, send: true } } })
    : await app.sendMessage(message);
  if (result.isError) throw new Error('宿主未接受发送；尚未分发。');
  return result;
}

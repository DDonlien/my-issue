import type { App } from '@modelcontextprotocol/ext-apps';
import { conversationUrl } from './conversation-links.js';

export async function openConversation(app: App, value: string) {
  const url = conversationUrl(value);
  if (!url) throw new Error('对话链接无效');
  const result = await app.openLink({ url });
  if (result.isError) throw new Error('宿主未能打开对话，请在详情中复制对话链接');
}

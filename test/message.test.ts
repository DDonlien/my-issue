import test from 'node:test';
import assert from 'node:assert/strict';
import { App } from '@modelcontextprotocol/ext-apps';
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { OpenAIExtensions } from '@openai/mcp-extensions/app';
import { dispatchAvailable, dispatchMessage } from '../src/message.js';

async function fixture(t: test.TestContext, extensions = true) {
  const app = new App({ name: 'myissue', version: '0.1.0' }, {}, { autoResize: false });
  const openai = new OpenAIExtensions(app);
  const host = new AppBridge(null, { name: 'protocol-test-host', version: '1' }, { message: {}, ...(extensions ? { experimental: { 'openai/message': {} } } : {}) });
  const [appTransport, hostTransport] = InMemoryTransport.createLinkedPair();
  const requests: any[] = [];
  const send = appTransport.send.bind(appTransport);
  appTransport.send = async (message, options) => { requests.push(message); await send(message, options); };
  await host.connect(hostTransport); await app.connect(appTransport);
  t.after(async () => { await appTransport.close(); await hostTransport.close(); });
  return { app, openai, host, requests };
}
test('actual UI bridge sends new and active targets with latest context; host rejection stays failure', async t => {
  const { app, openai, host, requests } = await fixture(t);
  const received: any[] = [];
  let rejected = false;
  host.onmessage = async params => { received.push(params); return rejected ? { isError: true } : {}; };
  await dispatchMessage(app, openai, 'latest issue and comments', 'new');
  await dispatchMessage(app, openai, 'follow up', 'active');
  const sent = requests.filter(request => request.method === 'ui/message');
  // The generic AppBridge callback strips extension fields; inspect the actual wire messages.
  assert.equal(sent[0].params._meta['openai/message'].target, 'new'); assert.equal(sent[0].params._meta['openai/message'].send, true);
  assert.deepEqual(received[0].content, [{ type: 'text', text: 'latest issue and comments' }]);
  assert.equal(sent[1].params._meta['openai/message'].target, 'active');
  rejected = true;
  await assert.rejects(dispatchMessage(app, openai, 'rejected', 'new'), /未接受/);
});
test('portable hosts can send to active conversation; new is explicitly unavailable', async t => {
  const { app, openai, host } = await fixture(t, false);
  host.onmessage = async () => ({});
  assert.equal(dispatchAvailable(app, openai, 'active'), true);
  assert.equal(dispatchAvailable(app, openai, 'new'), false);
  await assert.rejects(dispatchMessage(app, openai, 'unsupported', 'new'), /不支持/);
  await dispatchMessage(app, openai, 'supported', 'active');
});

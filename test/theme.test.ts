import test from 'node:test';
import assert from 'node:assert/strict';
import { App } from '@modelcontextprotocol/ext-apps';
import { AppBridge } from '@modelcontextprotocol/ext-apps/app-bridge';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { followHostTheme, themeSynchronizer } from '../src/web/theme.js';

function themeRoot() {
  const attributes = new Map<string, string>();
  const properties = new Map<string, string>();
  const element = {
    setAttribute: (key: string, value: string) => attributes.set(key, value),
    removeAttribute: (key: string) => attributes.delete(key),
    style: {
      set colorScheme(value: string) { properties.set('color-scheme', value); },
      setProperty: (key: string, value: string) => properties.set(key, value),
      removeProperty: (key: string) => properties.delete(key),
    },
  } as unknown as HTMLElement;
  return { element, attributes, properties };
}

test('theme reset removes withdrawn colors and explicit scheme so system preference can resume', () => {
  const root = themeRoot();
  const sync = themeSynchronizer(root.element);
  sync({ theme: 'dark', styles: { variables: { '--color-ring-primary': '#e57931', '--color-text-primary': '#ececec' } } });
  assert.equal(root.attributes.get('data-theme'), 'dark');
  assert.equal(root.properties.get('--color-ring-primary'), '#e57931');
  sync({ theme: 'light', styles: { variables: { '--color-ring-primary': undefined, '--color-text-primary': '#0d0d0d' } } });
  assert.equal(root.properties.has('--color-ring-primary'), false);
  assert.equal(root.properties.get('color-scheme'), 'light');
  sync(undefined);
  assert.equal(root.attributes.has('data-theme'), false);
  assert.equal(root.properties.size, 0);
});

test('real SDK context notifications preserve theme on partial updates and replace withdrawn styles', async t => {
  const app = new App({ name: 'myissue', version: '0.1.1' }, {}, { autoResize: false });
  const host = new AppBridge(null, { name: 'theme-test-host', version: '1' }, {}, {
    hostContext: { theme: 'dark', styles: { variables: { '--color-ring-primary': '#e57931', '--color-background-primary': '#181818' } } },
  });
  const [appTransport, hostTransport] = InMemoryTransport.createLinkedPair();
  const root = themeRoot();
  const refresh = followHostTheme(app, root.element);
  await host.connect(hostTransport);
  await app.connect(appTransport);
  refresh();
  t.after(async () => { await appTransport.close(); await hostTransport.close(); });
  assert.equal(root.properties.get('--color-ring-primary'), '#e57931');
  host.setHostContext({ theme: 'light' });
  await new Promise<void>(resolve => queueMicrotask(resolve));
  assert.equal(root.attributes.get('data-theme'), 'light');
  assert.equal(root.properties.get('--color-ring-primary'), '#e57931');
  host.setHostContext({ styles: { variables: { '--color-ring-primary': '#2984d9' } } });
  await new Promise<void>(resolve => queueMicrotask(resolve));
  assert.equal(root.attributes.get('data-theme'), 'light');
  assert.equal(root.properties.get('--color-ring-primary'), '#2984d9');
  assert.equal(root.properties.has('--color-background-primary'), false);
  host.setHostContext({ styles: { variables: {} } });
  await new Promise<void>(resolve => queueMicrotask(resolve));
  assert.equal(root.properties.has('--color-ring-primary'), false);
});

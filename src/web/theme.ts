import { applyHostStyleVariables, type App } from '@modelcontextprotocol/ext-apps';

/** Reconcile full host snapshots, including tokens withdrawn by a new theme. */
export function themeSynchronizer(root: HTMLElement) {
  let applied = new Set<string>();
  return (context: ReturnType<App['getHostContext']>) => {
    if (context?.theme) {
      root.setAttribute('data-theme', context.theme);
      root.style.colorScheme = context.theme;
    } else {
      root.removeAttribute('data-theme');
      root.style.removeProperty('color-scheme');
    }
    const variables = context?.styles?.variables ?? {};
    const next = new Set(Object.entries(variables).filter(([, value]) => typeof value === 'string' && value.trim()).map(([key]) => key));
    for (const key of applied) if (!next.has(key)) root.style.removeProperty(key);
    applyHostStyleVariables(Object.fromEntries(Object.entries(variables).filter(([key]) => next.has(key))), root);
    applied = next;
  };
}

export function followHostTheme(app: App, root = document.documentElement) {
  const sync = themeSynchronizer(root);
  // Notifications can be partial; App merges them before dispatching this event.
  const update = () => sync(app.getHostContext());
  app.addEventListener('hostcontextchanged', update);
  update();
  return update;
}

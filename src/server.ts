import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { OpenAIExtensions } from '@openai/mcp-extensions/server';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import * as fs from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { IssueStore, IssueError } from './core.js';
import { execute, inputs, type Operation } from './service.js';

export const UI_URI = 'ui://myissue/board-v2.html';
export function createServer(html: string, fallbackRoot?: string, preferencesFile?: string) {
  const server = new McpServer({ name: 'myissue', version: '0.1.1' }, { instructions: 'myIssue is a local Markdown issue board. Files under project-root/issues/*.md are the only source of truth. Use open_board for the UI. Always read the current revision before editing. Append comments; never rewrite history. Dispatch is an explicit user action performed by the host, not an Agent runtime owned by myIssue.' });
  const extensions = new OpenAIExtensions(server);
  const knownRoots = new Set<string>(fallbackRoot ? [fallbackRoot] : []);
  async function loadPreferences() {
    if (!preferencesFile) return;
    try {
      const roots = z.array(z.string()).parse(JSON.parse(await fs.readFile(preferencesFile, 'utf8')));
      for (const root of roots) if (path.isAbsolute(root)) knownRoots.add(root);
    } catch { /* Preferences are disposable; never affect issue files. */ }
  }
  async function remember(root: string) {
    knownRoots.add(root);
    if (!preferencesFile) return;
    await loadPreferences();
    const temp = preferencesFile + '.' + randomUUID() + '.tmp';
    try {
      await fs.mkdir(path.dirname(preferencesFile), { recursive: true });
      await fs.writeFile(temp, JSON.stringify([...knownRoots]) + '\n', { flag: 'wx' });
      await fs.rename(temp, preferencesFile);
    } catch { /* Losing a recent-folder preference must never block the board. */ }
    finally { await fs.rm(temp, { force: true }).catch(() => {}); }
  }
  async function projects() {
    await loadPreferences();
    try {
      const roots = await server.server.listRoots();
      for (const root of roots.roots) if (root.uri.startsWith('file:')) knownRoots.add(fileURLToPath(root.uri));
    } catch { /* Hosts without roots can select an absolute path in the board. */ }
    const available = [];
    for (const root of knownRoots) { try { if ((await fs.stat(root)).isDirectory()) available.push({ root, name: path.basename(root) }); } catch { /* Hide folders that no longer exist. */ } }
    return available;
  }
  const readAnnotations = { readOnlyHint: true, destructiveHint: false, openWorldHint: false };
  const writeAnnotations = { readOnlyHint: false, destructiveHint: false, openWorldHint: false };
  const result = (data: Record<string, unknown>) => ({ content: [{ type: 'text' as const, text: JSON.stringify(data) }], structuredContent: data });
  const wrap = (action: (args: any) => Promise<Record<string, unknown>>) => async (args: any) => {
    try { return result(await action(args)); }
    catch (e) { return { content: [{ type: 'text' as const, text: (e as Error).message }], structuredContent: { error: { code: e instanceof IssueError ? e.code : 'INVALID_INPUT', message: (e as Error).message } }, isError: true }; }
  };
  registerAppResource(server, 'myissue-board', UI_URI, { description: 'myIssue board, issue details, properties and comments' }, async () => ({
    contents: [{ uri: UI_URI, mimeType: RESOURCE_MIME_TYPE, text: html, _meta: {
      ui: { prefersBorder: false, csp: { connectDomains: [], resourceDomains: [] } },
      'openai/ui': { preferredDisplayMode: 'fullscreen', availableDisplayModes: ['inline', 'fullscreen', 'pip'] },
    } }],
  }));
  registerAppTool(server, 'open_board', {
    title: 'myIssue', description: 'Open the independent myIssue board or an issue beside this conversation. Select the project root that contains issues/*.md.', inputSchema: inputs.open_board,
    annotations: readAnnotations,
    _meta: { ui: { resourceUri: UI_URI, visibility: ['model', 'app'] }, 'openai/outputTemplate': UI_URI, 'openai/ui': { entrypoints: [{ type: 'global' }, { type: 'thread' }] } },
  }, wrap(async args => {
    const list = await projects();
    const chosenRoot = args.root ?? list[0]?.root;
    if (!chosenRoot) return { projects: list };
    const data = await execute('open_board', { ...args, root: chosenRoot });
    // Remember only a root that was successfully read. This stores folder paths, not issue data.
    await remember(chosenRoot);
    return { ...data, projects: await projects() };
  }));
  server.registerTool('list_projects', { description: 'List project folders shared by the host. Additional project roots can be entered explicitly in the board.', inputSchema: z.object({}), annotations: readAnnotations }, wrap(async () => ({ projects: await projects() })));
  const descriptions: Record<Exclude<Operation, 'open_board'>, string> = {
    list_issues: 'Read the current Markdown files and derive the board, ready state and relation errors. Unknown properties and statuses remain visible.',
    get_issue: 'Read one issue by its filename stem and return the current content and revision.',
    create_issue: 'Create a new issue in project-root/issues/*.md from this conversation. Name, arbitrary YAML properties and optional free Markdown content.',
    update_issue: 'Update an issue name, free content or selected YAML properties with revision checking. Existing comments remain immutable. Removing properties must be explicit.',
    append_comment: 'Append a shared human/Agent comment to the issue file. Pass the actual author and human or actual available model identifier.',
    prepare_dispatch: 'Read the latest issue and prepare context for a user-requested conversation dispatch. This tool alone does not send or start a conversation.',
  };
  for (const operation of Object.keys(descriptions) as Exclude<Operation, 'open_board'>[]) {
    server.registerTool(operation, { description: descriptions[operation], inputSchema: inputs[operation], annotations: ['create_issue', 'update_issue', 'append_comment'].includes(operation) ? writeAnnotations : readAnnotations }, wrap(async args => {
      knownRoots.add(args.root);
      return await execute(operation, args);
    }));
  }
  server.registerResource('issue-file', new ResourceTemplate('myissue://issue/{root}/{id}', { list: undefined }), { mimeType: 'text/markdown', description: 'Live issue source; root is an encoded absolute project path.' }, async (uri, variables) => {
    const root = decodeURIComponent(String(variables.root)); const issue = await new IssueStore(root).get(decodeURIComponent(String(variables.id)));
    return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: issue.raw }] };
  });
  extensions.mentions.setHandler(async ({ query }) => {
    const matches = [];
    for (const project of await projects()) {
      try {
        const board = await new IssueStore(project.root).board();
        for (const issue of board.issues) if (`${issue.name} ${issue.id}`.toLowerCase().includes(query.toLowerCase())) matches.push({ type: 'resource' as const, resourceUri: `myissue://issue/${encodeURIComponent(project.root)}/${encodeURIComponent(issue.id)}`, title: issue.name, subtitle: `${project.name} · ${issue.id}` });
      } catch { /* An unreadable project must not hide other projects. */ }
    }
    return { items: matches.slice(0, 30) };
  });
  return server;
}

import * as fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { randomUUID } from 'node:crypto';
import { setTimeout as delay } from 'node:timers/promises';
import { z } from 'zod';

export interface Project { root: string; name: string }
export const projectOrder = (a: Project, b: Project) => a.name.localeCompare(b.name, 'zh-CN') || a.root.localeCompare(b.root);
const schema = z.object({
  version: z.literal(1),
  projects: z.array(z.object({ root: z.string(), name: z.string() })),
  lastRoot: z.string().optional(),
});
export type Preferences = z.infer<typeof schema>;
const empty = (): Preferences => ({ version: 1, projects: [] });

/** Stable per-user location: never scoped to a conversation or plugin version. */
export function sharedPreferencesFile(env = process.env, platform = process.platform, home = os.homedir()) {
  const folder = env.MYISSUE_CONFIG_DIR ?? (platform === 'darwin'
    ? path.join(home, 'Library', 'Application Support', 'myIssue')
    : platform === 'win32' ? path.join(env.APPDATA ?? path.join(home, 'AppData', 'Roaming'), 'myIssue')
    : path.join(env.XDG_CONFIG_HOME ?? path.join(home, '.config'), 'myissue'));
  return path.join(folder, 'projects.json');
}

function parse(text: string): Preferences {
  const value: unknown = JSON.parse(text);
  // 0.1.x saved a simple array. Read it without changing the source file.
  const prefs = Array.isArray(value)
    ? { version: 1 as const, projects: z.array(z.string()).parse(value).map(root => ({ root, name: path.basename(root) })) }
    : schema.parse(value);
  const projects = new Map<string, Project>();
  for (const project of prefs.projects) if (path.isAbsolute(project.root)) {
    const root = path.resolve(project.root);
    projects.set(root, { root, name: project.name || path.basename(root) });
  }
  return { version: 1, projects: [...projects.values()], ...(prefs.lastRoot && path.isAbsolute(prefs.lastRoot) ? { lastRoot: path.resolve(prefs.lastRoot) } : {}) };
}

export class ProjectPreferences {
  private memory = empty();
  constructor(readonly file?: string, private legacyFile?: string) {}

  private async readFile(file: string): Promise<Preferences> {
    try { return parse(await fs.readFile(file, 'utf8')); }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return empty();
      throw new Error('无法读取共享项目配置，请检查文件：' + file, { cause: error });
    }
  }

  async read(): Promise<Preferences> {
    if (!this.file) return this.memory;
    let prefs = await this.readFile(this.file);
    if (this.legacyFile && this.legacyFile !== this.file) {
      const legacy = await this.readFile(this.legacyFile);
      if (legacy.projects.some(project => !prefs.projects.some(saved => saved.root === project.root))) {
        prefs = await this.mutate(current => {
          for (const project of legacy.projects) if (!current.projects.some(saved => saved.root === project.root)) current.projects.push(project);
          // An old array has no ordering contract; never guess the active project.
        });
      }
    }
    return prefs;
  }

  async remember(project: Project): Promise<Preferences> {
    if (!path.isAbsolute(project.root)) throw new Error('项目需要绝对路径');
    await this.read();
    return this.mutate(current => {
      const root = path.resolve(project.root);
      const saved = current.projects.find(item => item.root === root);
      if (saved) saved.name = project.name;
      else current.projects.push({ root, name: project.name });
      current.lastRoot = root;
    });
  }

  private async mutate(update: (prefs: Preferences) => void): Promise<Preferences> {
    if (!this.file) { update(this.memory); return this.memory; }
    await fs.mkdir(path.dirname(this.file), { recursive: true });
    const lock = this.file + '.lock';
    const deadline = Date.now() + 5000;
    while (true) {
      try { await fs.mkdir(lock); break; }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
        if (Date.now() >= deadline) throw new Error('共享项目配置正在写入，请稍后重试。锁目录：' + lock);
        await delay(25);
      }
    }
    const temp = this.file + '.' + randomUUID() + '.tmp';
    try {
      // Re-read inside the cross-process lock so simultaneous additions survive.
      const prefs = await this.readFile(this.file);
      update(prefs);
      await fs.writeFile(temp, JSON.stringify(prefs, null, 2) + '\n', { flag: 'wx', mode: 0o600 });
      await fs.rename(temp, this.file);
      return prefs;
    } finally {
      await fs.rm(temp, { force: true }).catch(() => {});
      await fs.rmdir(lock);
    }
  }
}

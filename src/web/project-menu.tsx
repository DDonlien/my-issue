import { useRef } from 'react';
import { Check, ChevronDown, Columns3, Folder, Loader2, Plus } from 'lucide-react';
import type { Project } from '../preferences.js';
import { Button } from './components/ui/button.js';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './components/ui/dropdown-menu.js';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './components/ui/dialog.js';
import { Input } from './components/ui/input.js';
import { Label } from './components/ui/label.js';

export function ProjectMenu({ projects, root, name, busy, loading, onOpenChange, onSelect, onAdd }: {
  projects: Project[]; root?: string; name?: string; busy: boolean; loading: boolean;
  onOpenChange: (open: boolean) => void; onSelect: (root: string) => void; onAdd: () => void;
}) {
  return <DropdownMenu onOpenChange={onOpenChange}>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" className="project-trigger h-10 text-lg font-semibold" aria-label="项目菜单" disabled={busy}>
        <Columns3 className="size-5" /><span>{name ?? 'myIssue'}</span><ChevronDown className="size-4 text-muted-foreground" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="start" className="project-menu">
      <DropdownMenuLabel>项目{loading && <Loader2 className="size-3.5 animate-spin" aria-label="正在读取项目" />}</DropdownMenuLabel>
      <div className="project-menu-list">{projects.map(project => <DropdownMenuItem key={project.root} disabled={busy} onSelect={() => onSelect(project.root)} textValue={project.name}>
        <Folder className="size-4 text-muted-foreground" /><span className="project-menu-name"><strong>{project.name}</strong><small title={project.root}>{project.root}</small></span>
        {project.root === root && <Check className="size-4" />}
      </DropdownMenuItem>)}</div>
      {!projects.length && <p className="menu-empty">添加项目后，可在这里切换。</p>}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onAdd}><Plus className="size-4" />添加项目…</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>;
}

export function ProjectDialog({ open, busy, connected, draft, error, onOpenChange, onDraftChange, onBrowse, onSubmit }: {
  open: boolean; busy: boolean; connected: boolean; draft: string; error: string;
  onOpenChange: (open: boolean) => void; onDraftChange: (value: string) => void; onBrowse: () => void; onSubmit: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="project-dialog rounded-2xl" showCloseButton={false} onOpenAutoFocus={event => { event.preventDefault(); input.current?.focus(); }} onCloseAutoFocus={event => { event.preventDefault(); document.querySelector<HTMLButtonElement>('[aria-label="项目菜单"]')?.focus(); }}>
      <DialogHeader><DialogTitle>添加项目</DialogTitle><DialogDescription>选择项目文件夹。添加后，其他 myIssue 面板也能使用。</DialogDescription></DialogHeader>
      <form onSubmit={event => { event.preventDefault(); onSubmit(); }} className="dialog-form">
        <div className="field"><Label htmlFor="project-root">项目文件夹</Label><div className="folder-field"><Folder className="size-4" /><Input id="project-root" className="pl-10" ref={input} required placeholder="/Users/你/Projects/项目" value={draft} onChange={event => onDraftChange(event.target.value)} /></div></div>
        <Button type="button" variant="outline" className="browse-button" disabled={!connected || busy} onClick={onBrowse}><Folder />浏览文件夹{busy && <Loader2 className="animate-spin" />}</Button>
        {error && <p className="dialog-error" role="alert">{error}</p>}
        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">取消</Button></DialogClose><Button disabled={!connected || busy || !draft.trim()}>{busy && <Loader2 className="animate-spin" />}添加并打开</Button></DialogFooter>
      </form>
    </DialogContent>
  </Dialog>;
}

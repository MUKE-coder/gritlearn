// Breadcrumbs — VSCode-style path strip above the editor showing
// workspace > folder > … > file. Each segment is clickable: workspace
// reveals the file tree, folder segments could navigate (deferred —
// our file tree doesn't have a focus API yet), file segment reveals
// the active file in Explorer.

import { ChevronRight, FolderOpen } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
import { FileIcon } from "./file-icon";

export function Breadcrumbs({ onRevealFiles }: { onRevealFiles?: () => void }) {
  const { activeTab, rootPath } = useWorkspace();
  if (!activeTab?.path) return null;

  const segments = (() => {
    const abs = activeTab.path;
    if (!rootPath || !abs.startsWith(rootPath)) {
      // File lives outside the workspace — just show the basename.
      return [{ name: activeTab.name, kind: "file" as const }];
    }
    const rel = abs.slice(rootPath.length).replace(/^[/\\]+/, "");
    const parts = rel.split(/[/\\]/);
    const items: { name: string; kind: "folder" | "file" }[] = [];
    for (let i = 0; i < parts.length; i++) {
      items.push({ name: parts[i], kind: i === parts.length - 1 ? "file" : "folder" });
    }
    return items;
  })();

  const workspaceName = rootPath ? rootPath.split(/[\\/]/).pop() || rootPath : "Workspace";

  return (
    <div className="flex h-7 shrink-0 items-center gap-1 overflow-x-auto border-b border-border-subtle bg-surface-1 px-3 text-[11.5px] text-foreground-muted">
      <button
        onClick={onRevealFiles}
        title="Reveal in file tree"
        className="flex items-center gap-1 rounded px-1.5 py-0.5 hover:bg-surface-2 hover:text-foreground"
      >
        <FolderOpen className="h-3 w-3" />
        <span className="font-mono">{workspaceName}</span>
      </button>
      {segments.map((seg, i) => (
        <div key={i} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3 shrink-0" />
          <div className="flex items-center gap-1 rounded px-1.5 py-0.5">
            {seg.kind === "file" && <FileIcon name={seg.name} isDir={false} />}
            <span className={`font-mono ${seg.kind === "file" ? "text-foreground" : ""}`}>{seg.name}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

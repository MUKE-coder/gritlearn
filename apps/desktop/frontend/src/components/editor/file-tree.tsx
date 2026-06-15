// Recursive file tree backed by the Wails ListDirectory binding.
// Each folder lazy-loads its children the first time it's expanded, so
// opening a large workspace doesn't stall on a full recursive walk.
//
// Selecting a file calls workspace.openFile(path), which either focuses
// an existing tab or opens a new one.

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, FolderPlus } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
}

function TreeNode({ node, depth }: TreeNodeProps) {
  const { openFile, activeTab } = useWorkspace();
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(async () => {
    if (!node.is_dir) {
      void openFile(node.path);
      return;
    }
    if (!expanded && children === null) {
      setLoading(true);
      try {
        const kids = (await App.ListDirectory(node.path)) as FileNode[];
        setChildren(kids);
      } catch (err) {
        console.error("ListDirectory failed", err);
        setChildren([]);
      } finally {
        setLoading(false);
      }
    }
    setExpanded((v) => !v);
  }, [node, expanded, children, openFile]);

  const isActive = !node.is_dir && activeTab?.path === node.path;

  return (
    <>
      <button
        onClick={toggle}
        title={node.path}
        className={`flex w-full items-center gap-1 px-2 py-[3px] text-left text-[13px] hover:bg-surface-2 ${
          isActive ? "bg-accent/15 text-foreground" : "text-foreground-secondary"
        }`}
        style={{ paddingLeft: 8 + depth * 12 }}
      >
        {node.is_dir ? (
          expanded ? (
            <ChevronDown className="h-3 w-3 shrink-0 text-foreground-muted" />
          ) : (
            <ChevronRight className="h-3 w-3 shrink-0 text-foreground-muted" />
          )
        ) : (
          <span className="w-3" />
        )}
        {node.is_dir ? (
          expanded ? (
            <FolderOpen className="h-3.5 w-3.5 shrink-0 text-accent" />
          ) : (
            <Folder className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
          )
        ) : (
          <File className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
        )}
        <span className="truncate font-mono">{node.name}</span>
      </button>
      {expanded && (
        <>
          {loading && (
            <div className="px-2 py-1 text-[11px] text-foreground-muted" style={{ paddingLeft: 20 + depth * 12 }}>
              Loading…
            </div>
          )}
          {children?.map((c) => (
            <TreeNode key={c.path} node={c} depth={depth + 1} />
          ))}
        </>
      )}
    </>
  );
}

export function FileTree() {
  const { rootPath, openFolder } = useWorkspace();
  const [rootChildren, setRootChildren] = useState<FileNode[] | null>(null);

  useEffect(() => {
    if (!rootPath) {
      setRootChildren(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const kids = (await App.ListDirectory(rootPath)) as FileNode[];
        if (!cancelled) setRootChildren(kids);
      } catch (err) {
        console.error("Root ListDirectory failed", err);
        if (!cancelled) setRootChildren([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [rootPath]);

  if (!rootPath) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
        <FolderPlus className="h-8 w-8 text-foreground-muted" />
        <p className="text-[13px] text-foreground-secondary">No folder open</p>
        <button
          onClick={() => void openFolder()}
          className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-accent-hover"
        >
          Open Folder
        </button>
        <p className="text-[11px] text-foreground-muted">⌘O / Ctrl+O</p>
      </div>
    );
  }

  const folderName = rootPath.split(/[\\/]/).pop() || rootPath;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <span
          className="truncate text-[11px] font-medium uppercase tracking-wider text-foreground-muted"
          title={rootPath}
        >
          {folderName}
        </span>
        <button
          onClick={() => void openFolder()}
          title="Open another folder"
          className="rounded p-1 text-foreground-muted hover:bg-surface-2 hover:text-foreground"
        >
          <FolderPlus className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rootChildren === null ? (
          <div className="px-3 py-2 text-[12px] text-foreground-muted">Loading…</div>
        ) : (
          rootChildren.map((n) => <TreeNode key={n.path} node={n} depth={0} />)
        )}
      </div>
    </div>
  );
}

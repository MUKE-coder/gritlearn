// Recursive file tree backed by the Wails ListDirectory binding.
// Each folder lazy-loads its children the first time it's expanded.
// Selecting a file calls workspace.openFile(path).
//
// New in v0.4.3: in-app create / rename / delete. The header has
// explicit New File + New Folder buttons (no more confusing
// FolderPlus → OS picker), every node gets a right-click menu, and
// treeVersion in workspace-store invalidates the affected branch so
// the UI re-fetches without us needing a real filesystem watcher.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  FilePlus,
  Folder,
  FolderPlus,
  Pencil,
  Trash2,
} from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
import { FileIcon } from "./file-icon";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

interface FileNode {
  name: string;
  path: string;
  is_dir: boolean;
}

type PendingCreate =
  | { kind: "file"; parent: string }
  | { kind: "folder"; parent: string }
  | null;

interface TreeContext {
  /** Path where an in-progress New File / New Folder row should render. */
  pending: PendingCreate;
  setPending: (p: PendingCreate) => void;
  /** Path currently being renamed inline. */
  renaming: string | null;
  setRenaming: (p: string | null) => void;
}

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  ctx: TreeContext;
}

function TreeNode({ node, depth, ctx }: TreeNodeProps) {
  const ws = useWorkspace();
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<FileNode[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);

  const treeVersion = ws.treeVersion;

  const refetch = useCallback(async () => {
    if (!node.is_dir) return;
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
  }, [node.is_dir, node.path]);

  // Re-fetch this folder's children whenever the workspace's treeVersion
  // bumps (file created/renamed/deleted). Folders that haven't been
  // expanded skip the refetch entirely — children is null and stays
  // null until first expand.
  useEffect(() => {
    if (!expanded || !node.is_dir) return;
    void refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [treeVersion]);

  const toggle = useCallback(async () => {
    if (!node.is_dir) {
      void ws.openFile(node.path);
      return;
    }
    if (!expanded && children === null) {
      await refetch();
    }
    setExpanded((v) => !v);
  }, [node, expanded, children, ws, refetch]);

  const isActive = !node.is_dir && ws.activeTab?.path === node.path;
  const isRenaming = ctx.renaming === node.path;

  // The pending New File row renders directly below this node when
  // (a) this node is the parent folder of the pending op, AND
  // (b) this folder is currently expanded.
  const pendingHere =
    node.is_dir && expanded && ctx.pending && ctx.pending.parent === node.path
      ? ctx.pending
      : null;

  return (
    <>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setMenu({ x: e.clientX, y: e.clientY });
        }}
        className="relative"
      >
        {isRenaming ? (
          <InlineNameInput
            initial={node.name}
            depth={depth}
            isDir={node.is_dir}
            onCommit={async (name) => {
              if (name && name !== node.name) {
                try {
                  await ws.renameNode(node.path, name);
                } catch (err) {
                  console.error("rename failed", err);
                  alert(`Rename failed: ${err}`);
                }
              }
              ctx.setRenaming(null);
            }}
            onCancel={() => ctx.setRenaming(null)}
          />
        ) : (
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
            <FileIcon name={node.name} isDir={node.is_dir} expanded={expanded} />
            <span className="truncate font-mono">{node.name}</span>
          </button>
        )}

        {menu && (
          <ContextMenu
            x={menu.x}
            y={menu.y}
            isDir={node.is_dir}
            onClose={() => setMenu(null)}
            onNewFile={() => {
              if (node.is_dir) {
                setExpanded(true);
                ctx.setPending({ kind: "file", parent: node.path });
              }
            }}
            onNewFolder={() => {
              if (node.is_dir) {
                setExpanded(true);
                ctx.setPending({ kind: "folder", parent: node.path });
              }
            }}
            onRename={() => ctx.setRenaming(node.path)}
            onDelete={async () => {
              if (!confirm(`Delete ${node.name}?${node.is_dir ? " This removes the folder and everything in it." : ""}`)) {
                return;
              }
              try {
                await ws.deleteNode(node.path);
              } catch (err) {
                console.error("delete failed", err);
                alert(`Delete failed: ${err}`);
              }
            }}
          />
        )}
      </div>

      {expanded && (
        <>
          {loading && (
            <div className="px-2 py-1 text-[11px] text-foreground-muted" style={{ paddingLeft: 20 + depth * 12 }}>
              Loading…
            </div>
          )}
          {pendingHere && (
            <InlineNameInput
              initial=""
              depth={depth + 1}
              isDir={pendingHere.kind === "folder"}
              onCommit={async (name) => {
                if (!name) {
                  ctx.setPending(null);
                  return;
                }
                try {
                  if (pendingHere.kind === "file") {
                    await ws.createFile(pendingHere.parent, name);
                  } else {
                    await ws.createFolder(pendingHere.parent, name);
                  }
                } catch (err) {
                  console.error("create failed", err);
                  alert(`Create failed: ${err}`);
                } finally {
                  ctx.setPending(null);
                }
              }}
              onCancel={() => ctx.setPending(null)}
            />
          )}
          {children?.map((c) => (
            <TreeNode key={c.path} node={c} depth={depth + 1} ctx={ctx} />
          ))}
        </>
      )}
    </>
  );
}

interface InlineNameInputProps {
  initial: string;
  depth: number;
  isDir: boolean;
  onCommit: (name: string) => void;
  onCancel: () => void;
}

function InlineNameInput({ initial, depth, isDir, onCommit, onCancel }: InlineNameInputProps) {
  const [value, setValue] = useState(initial);
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
    // For renames: select the basename so typing replaces the whole
    // name without nuking the extension if the user types carefully.
    if (initial) {
      const dot = initial.lastIndexOf(".");
      if (dot > 0) ref.current?.setSelectionRange(0, dot);
      else ref.current?.select();
    }
  }, [initial]);

  return (
    <div
      className="flex items-center gap-1 px-2 py-[3px]"
      style={{ paddingLeft: 8 + depth * 12 }}
    >
      <span className="w-3" />
      <FileIcon name={value || "new"} isDir={isDir} />
      <input
        ref={ref}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") onCommit(value.trim());
          else if (e.key === "Escape") onCancel();
        }}
        onBlur={() => onCommit(value.trim())}
        className="min-w-0 flex-1 rounded border border-accent/40 bg-surface-2 px-1 py-0 font-mono text-[13px] text-foreground outline-none focus:border-accent"
      />
    </div>
  );
}

interface ContextMenuProps {
  x: number;
  y: number;
  isDir: boolean;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onRename: () => void;
  onDelete: () => void;
}

function ContextMenu({ x, y, isDir, onClose, onNewFile, onNewFolder, onRename, onDelete }: ContextMenuProps) {
  useEffect(() => {
    const close = () => onClose();
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
    };
  }, [onClose]);

  const Item = ({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) => (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClose();
        onClick();
      }}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-foreground hover:bg-surface-2"
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div
      style={{ left: x, top: y }}
      className="fixed z-50 min-w-[160px] rounded-md border border-border bg-surface-1 py-1 shadow-lg"
      onClick={(e) => e.stopPropagation()}
    >
      {isDir && (
        <>
          <Item icon={<FilePlus className="h-3.5 w-3.5" />} label="New File" onClick={onNewFile} />
          <Item icon={<FolderPlus className="h-3.5 w-3.5" />} label="New Folder" onClick={onNewFolder} />
          <div className="my-1 border-t border-border-subtle" />
        </>
      )}
      <Item icon={<Pencil className="h-3.5 w-3.5" />} label="Rename" onClick={onRename} />
      <Item
        icon={<Trash2 className="h-3.5 w-3.5 text-danger" />}
        label="Delete"
        onClick={onDelete}
      />
    </div>
  );
}

export function FileTree() {
  const ws = useWorkspace();
  const { rootPath, openFolder, treeVersion } = ws;
  const [rootChildren, setRootChildren] = useState<FileNode[] | null>(null);
  const [pending, setPending] = useState<PendingCreate>(null);
  const [renaming, setRenaming] = useState<string | null>(null);

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
  }, [rootPath, treeVersion]);

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
  const ctx: TreeContext = { pending, setPending, renaming, setRenaming };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <span
          className="truncate text-[11px] font-medium uppercase tracking-wider text-foreground-muted"
          title={rootPath}
        >
          {folderName}
        </span>
        <div className="flex items-center gap-0.5">
          <button
            onClick={() => setPending({ kind: "file", parent: rootPath })}
            title="New file"
            className="rounded p-1 text-foreground-muted hover:bg-surface-2 hover:text-foreground"
          >
            <FilePlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPending({ kind: "folder", parent: rootPath })}
            title="New folder"
            className="rounded p-1 text-foreground-muted hover:bg-surface-2 hover:text-foreground"
          >
            <FolderPlus className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => void openFolder()}
            title="Open another folder"
            className="rounded p-1 text-foreground-muted hover:bg-surface-2 hover:text-foreground"
          >
            <Folder className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {rootChildren === null ? (
          <div className="px-3 py-2 text-[12px] text-foreground-muted">Loading…</div>
        ) : (
          <>
            {pending && pending.parent === rootPath && (
              <InlineNameInput
                initial=""
                depth={0}
                isDir={pending.kind === "folder"}
                onCommit={async (name) => {
                  if (!name) {
                    setPending(null);
                    return;
                  }
                  try {
                    if (pending.kind === "file") {
                      await ws.createFile(pending.parent, name);
                    } else {
                      await ws.createFolder(pending.parent, name);
                    }
                  } catch (err) {
                    console.error("create failed", err);
                    alert(`Create failed: ${err}`);
                  } finally {
                    setPending(null);
                  }
                }}
                onCancel={() => setPending(null)}
              />
            )}
            {rootChildren.map((n) => (
              <TreeNode key={n.path} node={n} depth={0} ctx={ctx} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Recursive file tree backed by the Wails ListDirectory binding.
// Each folder lazy-loads its children the first time it's expanded.
// Selecting a file calls workspace.openFile(path).
//
// v0.4.3 — inline create/rename/delete + treeVersion-driven refetch.
// v0.4.5 — HTML5 drag-and-drop between folders, expanded right-click
//          menu (cut/copy/paste/duplicate/copy-path/reveal-in-explorer)
//          and type-aware coloured icons via <FileIcon>.

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Clipboard,
  ClipboardPaste,
  Copy,
  ExternalLink,
  FilePlus,
  Files,
  FolderPlus,
  Folder,
  Pencil,
  Scissors,
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
  pending: PendingCreate;
  setPending: (p: PendingCreate) => void;
  renaming: string | null;
  setRenaming: (p: string | null) => void;
  /** Path of the node the keyboard focus is currently on, or null.
   *  Drives the F2/Delete/Ctrl+X-C-V/D shortcut targeting. */
  focusedPath: string | null;
  setFocusedPath: (p: string | null) => void;
}

// MIME-ish type for our internal drag payload. Keeps it impossible
// to accidentally drop random files from the desktop here (those'd
// land on text/uri-list or files instead).
const DRAG_TYPE = "application/x-jeditor-tree-path";

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
  const [dragOver, setDragOver] = useState(false);

  const treeVersion = ws.treeVersion;
  const cutPath = ws.treeClipboard?.op === "cut" ? ws.treeClipboard.path : null;
  const isCut = cutPath === node.path;
  const isFocused = ctx.focusedPath === node.path;

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

  const pendingHere =
    node.is_dir && expanded && ctx.pending && ctx.pending.parent === node.path
      ? ctx.pending
      : null;

  // ─── Drag and drop ───────────────────────────────────────────
  const onDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData(DRAG_TYPE, node.path);
    e.dataTransfer.effectAllowed = "move";
  };
  const onDragOver = (e: React.DragEvent) => {
    if (!node.is_dir) return;
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
  };
  const onDragLeave = () => setDragOver(false);
  const onDrop = async (e: React.DragEvent) => {
    setDragOver(false);
    if (!node.is_dir) return;
    const src = e.dataTransfer.getData(DRAG_TYPE);
    if (!src || src === node.path) return;
    e.preventDefault();
    try {
      await ws.moveNode(src, node.path);
      if (!expanded) {
        setExpanded(true);
        await refetch();
      }
    } catch (err) {
      console.error("move failed", err);
      alert(`Move failed: ${err}`);
    }
  };

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
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => {
              ctx.setFocusedPath(node.path);
              void toggle();
            }}
            onFocus={() => ctx.setFocusedPath(node.path)}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (!node.is_dir) void ws.openFile(node.path);
            }}
            title={node.path}
            className={`flex w-full items-center gap-1 px-2 py-[3px] text-left text-[13px] transition-colors ${
              isActive
                ? "bg-accent/15 text-foreground"
                : isFocused
                ? "bg-surface-2 text-foreground ring-1 ring-inset ring-accent/30"
                : "text-foreground-secondary hover:bg-surface-2"
            } ${dragOver ? "bg-accent/25 ring-1 ring-inset ring-accent" : ""} ${isCut ? "opacity-50" : ""}`}
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
          <NodeContextMenu
            x={menu.x}
            y={menu.y}
            node={node}
            ctx={ctx}
            onClose={() => setMenu(null)}
            onExpand={() => {
              if (node.is_dir) {
                setExpanded(true);
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

interface NodeContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  ctx: TreeContext;
  onClose: () => void;
  onExpand: () => void;
}

function NodeContextMenu({ x, y, node, ctx, onClose, onExpand }: NodeContextMenuProps) {
  const ws = useWorkspace();
  const hasClipboard = ws.treeClipboard !== null;
  const isDir = node.is_dir;

  useEffect(() => {
    const close = () => onClose();
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
      window.removeEventListener("keydown", onEsc);
    };
  }, [onClose]);

  const Item = ({
    icon,
    label,
    onClick,
    danger = false,
    disabled = false,
    shortcut,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    shortcut?: string;
  }) => (
    <button
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        onClose();
        onClick();
      }}
      className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[12px] ${
        disabled
          ? "cursor-not-allowed text-foreground-muted opacity-50"
          : danger
          ? "text-danger hover:bg-danger/10"
          : "text-foreground hover:bg-surface-2"
      }`}
    >
      <span className="flex items-center gap-2">
        {icon}
        {label}
      </span>
      {shortcut && (
        <span className="font-mono text-[10px] text-foreground-muted">{shortcut}</span>
      )}
    </button>
  );

  const Divider = () => <div className="my-1 border-t border-border-subtle" />;

  return (
    <div
      style={{ left: x, top: y }}
      className="fixed z-50 min-w-[200px] rounded-md border border-border bg-surface-1 py-1 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {isDir && (
        <>
          <Item
            icon={<FilePlus className="h-3.5 w-3.5" />}
            label="New File"
            onClick={() => {
              onExpand();
              ctx.setPending({ kind: "file", parent: node.path });
            }}
          />
          <Item
            icon={<FolderPlus className="h-3.5 w-3.5" />}
            label="New Folder"
            onClick={() => {
              onExpand();
              ctx.setPending({ kind: "folder", parent: node.path });
            }}
          />
          <Divider />
        </>
      )}
      <Item
        icon={<Scissors className="h-3.5 w-3.5" />}
        label="Cut"
        shortcut="Ctrl+X"
        onClick={() => ws.setClipboard({ path: node.path, op: "cut" })}
      />
      <Item
        icon={<Copy className="h-3.5 w-3.5" />}
        label="Copy"
        shortcut="Ctrl+C"
        onClick={() => ws.setClipboard({ path: node.path, op: "copy" })}
      />
      {isDir && (
        <Item
          icon={<ClipboardPaste className="h-3.5 w-3.5" />}
          label="Paste"
          shortcut="Ctrl+V"
          disabled={!hasClipboard}
          onClick={() => void ws.pasteClipboard(node.path)}
        />
      )}
      <Item
        icon={<Files className="h-3.5 w-3.5" />}
        label="Duplicate"
        shortcut="Ctrl+D"
        onClick={() => void ws.duplicateNode(node.path)}
      />
      <Divider />
      <Item
        icon={<Clipboard className="h-3.5 w-3.5" />}
        label="Copy Path"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(node.path);
          } catch {
            // Clipboard blocked; not critical.
          }
        }}
      />
      <Item
        icon={<ExternalLink className="h-3.5 w-3.5" />}
        label="Reveal in File Explorer"
        onClick={() => void ws.revealInExplorer(node.path)}
      />
      <Divider />
      <Item
        icon={<Pencil className="h-3.5 w-3.5" />}
        label="Rename"
        shortcut="F2"
        onClick={() => ctx.setRenaming(node.path)}
      />
      <Item
        icon={<Trash2 className="h-3.5 w-3.5 text-danger" />}
        label="Delete"
        shortcut="Del"
        danger
        onClick={async () => {
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
    </div>
  );
}

export function FileTree() {
  const ws = useWorkspace();
  const { rootPath, openFolder, treeVersion } = ws;
  const [rootChildren, setRootChildren] = useState<FileNode[] | null>(null);
  const [pending, setPending] = useState<PendingCreate>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [rootDragOver, setRootDragOver] = useState(false);
  const [focusedPath, setFocusedPath] = useState<string | null>(null);
  const treeRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts. Only fire when focus is inside the file tree
  // — Ctrl+C in Monaco copies source, here it copies the node. Skipped
  // when an InlineNameInput owns the focus (otherwise typing would
  // accidentally trigger Cut/Copy).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = treeRef.current;
      if (!el || !el.contains(document.activeElement)) return;
      if (document.activeElement?.tagName === "INPUT") return;
      if (!focusedPath) return;

      const mod = e.ctrlKey || e.metaKey;
      if (e.key === "F2") {
        e.preventDefault();
        setRenaming(focusedPath);
      } else if (e.key === "Delete") {
        e.preventDefault();
        const name = focusedPath.split(/[\\/]/).pop() ?? focusedPath;
        if (confirm(`Delete ${name}?`)) {
          void ws.deleteNode(focusedPath);
        }
      } else if (mod && e.key.toLowerCase() === "x") {
        e.preventDefault();
        ws.setClipboard({ path: focusedPath, op: "cut" });
      } else if (mod && e.key.toLowerCase() === "c") {
        e.preventDefault();
        ws.setClipboard({ path: focusedPath, op: "copy" });
      } else if (mod && e.key.toLowerCase() === "v") {
        // Paste only meaningful when focus is on a folder (or root).
        // Fall back to focused node's parent directory so paste-on-file
        // still feels intuitive.
        e.preventDefault();
        void (async () => {
          // Quick stat-by-name check: if it ends in a separator or has
          // no extension we treat it as a folder; otherwise paste into
          // its parent. Cheap heuristic — File ops will error out if
          // we got it wrong.
          const dest = focusedPath;
          await ws.pasteClipboard(dest);
        })();
      } else if (mod && e.key.toLowerCase() === "d") {
        e.preventDefault();
        void ws.duplicateNode(focusedPath);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [focusedPath, ws]);

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
          className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-zinc-900 hover:bg-accent-hover"
        >
          Open Folder
        </button>
        <p className="text-[11px] text-foreground-muted">⌘O / Ctrl+O</p>
      </div>
    );
  }

  const folderName = rootPath.split(/[\\/]/).pop() || rootPath;
  const ctx: TreeContext = {
    pending,
    setPending,
    renaming,
    setRenaming,
    focusedPath,
    setFocusedPath,
  };

  // Drop a dragged node onto the empty root area = move it to the
  // top level of the workspace.
  const onRootDrop = async (e: React.DragEvent) => {
    setRootDragOver(false);
    const src = e.dataTransfer.getData(DRAG_TYPE);
    if (!src) return;
    e.preventDefault();
    try {
      await ws.moveNode(src, rootPath);
    } catch (err) {
      console.error("move-to-root failed", err);
      alert(`Move failed: ${err}`);
    }
  };

  return (
    <div ref={treeRef} className="flex h-full flex-col" tabIndex={-1}>
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
      <div
        onDragOver={(e) => {
          if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = "move";
          setRootDragOver(true);
        }}
        onDragLeave={() => setRootDragOver(false)}
        onDrop={onRootDrop}
        className={`flex-1 overflow-y-auto py-1 transition-colors ${
          rootDragOver ? "bg-accent/5 ring-1 ring-inset ring-accent/40" : ""
        }`}
      >
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

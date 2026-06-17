import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Home,
  User,
  Settings,
  LogOut,
  ArrowRight,
  FolderOpen,
  Save,
  Eye,
  FileIcon,
  X,
  type LucideIcon,
} from "lucide-react";
import { useLogout } from "@/hooks/use-auth";
import { useWorkspace } from "@/lib/workspace-store";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface Command {
  id: string;
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  action: () => void;
  disabled?: boolean;
}

interface WorkspaceFile {
  path: string;
  rel: string;
}

type Mode = "command" | "file";

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();
  const workspace = useWorkspace();
  const [mode, setMode] = useState<Mode>("command");
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [files, setFiles] = useState<WorkspaceFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    onOpenChange(false);
    setQuery("");
    setMode("command");
  };

  const go = (to: string) => {
    navigate({ to });
    close();
  };

  // Lazy-load the file list the first time the user enters file mode
  // for the current rootPath. Re-fetched if the workspace root
  // changes — otherwise reused so opening Cmd+P over and over stays
  // instant.
  const fileCacheRef = useRef<{ root: string | null; files: WorkspaceFile[] }>({
    root: null,
    files: [],
  });
  useEffect(() => {
    if (!open || mode !== "file") return;
    if (!workspace.rootPath) {
      setFiles([]);
      return;
    }
    if (fileCacheRef.current.root === workspace.rootPath) {
      setFiles(fileCacheRef.current.files);
      return;
    }
    (async () => {
      try {
        const list = ((await App.WorkspaceFiles(workspace.rootPath!)) as WorkspaceFile[]) ?? [];
        fileCacheRef.current = { root: workspace.rootPath, files: list };
        setFiles(list);
      } catch (err) {
        console.error("[palette] file enumerate failed", err);
      }
    })();
  }, [open, mode, workspace.rootPath]);

  const commands = useMemo<Command[]>(() => {
    const activeTab = workspace.activeTab;
    const activeIndex = workspace.activeTabIndex;
    const isHtml = activeTab?.language === "html";

    return [
      {
        id: "quick-open",
        label: "Go to File…",
        shortcut: "⌘P",
        icon: FileIcon,
        action: () => {
          setMode("file");
          setQuery("");
          setSelectedIndex(0);
        },
      },
      {
        id: "open-folder",
        label: "Open Folder…",
        shortcut: "⌘O",
        icon: FolderOpen,
        action: () => {
          close();
          void workspace.openFolder();
        },
      },
      {
        id: "save",
        label: "Save File",
        shortcut: "⌘S",
        icon: Save,
        disabled: !activeTab,
        action: () => {
          close();
          void workspace.saveActiveTab();
        },
      },
      {
        id: "close-tab",
        label: "Close Tab",
        shortcut: "⌘W",
        icon: X,
        disabled: activeIndex < 0,
        action: () => {
          close();
          if (activeIndex >= 0) workspace.closeTab(activeIndex);
        },
      },
      {
        id: "close-others",
        label: "Close Other Tabs",
        icon: X,
        disabled: workspace.tabs.length < 2,
        action: () => {
          close();
          if (activeIndex >= 0) workspace.closeOthers(activeIndex);
        },
      },
      {
        id: "close-all",
        label: "Close All Tabs",
        icon: X,
        disabled: workspace.tabs.length === 0,
        action: () => {
          close();
          workspace.closeAll();
        },
      },
      {
        id: "toggle-preview",
        label: workspace.previewVisible ? "Hide Preview" : "Show Preview",
        icon: Eye,
        disabled: !isHtml,
        action: () => {
          close();
          workspace.togglePreview();
        },
      },

      // Recent folders
      ...workspace.getRecentFolders().slice(1, 6).map((dir) => ({
        id: `recent-${dir}`,
        label: `Open ${dir.split(/[\\/]/).pop() ?? dir}`,
        icon: FolderOpen,
        action: () => {
          close();
          workspace.setRoot(dir);
        },
      })),

      // Navigation
      { id: "dashboard", label: "Editor", icon: Home, action: () => go("/app") },
      { id: "profile", label: "Profile", icon: User, action: () => go("/app/profile") },
      { id: "settings", label: "Settings", shortcut: "⌘,", icon: Settings, action: () => go("/app/settings") },
      {
        id: "logout",
        label: "Log out",
        shortcut: "⌘L",
        icon: LogOut,
        action: () => {
          logout(undefined, { onSuccess: () => go("/auth/login") });
        },
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workspace, navigate, logout]);

  const filteredCommands = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()),
  );
  const filteredFiles = useMemo(() => {
    if (mode !== "file") return [];
    const q = query.trim().toLowerCase();
    if (!q) return files.slice(0, 80);
    const scored = files
      .map((f) => ({ f, score: scoreFuzzy(f.rel.toLowerCase(), q) }))
      .filter((s) => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 80);
    return scored.map((s) => s.f);
  }, [files, query, mode]);

  const visible = mode === "file" ? filteredFiles.length : filteredCommands.length;

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [mode, query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, visible - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (mode === "file") {
          const f = filteredFiles[selectedIndex];
          if (f) {
            void workspace.openFile(f.path);
            close();
          }
        } else {
          const cmd = filteredCommands[selectedIndex];
          if (cmd && !cmd.disabled) cmd.action();
        }
      } else if (e.key === "Escape" && mode === "file") {
        e.preventDefault();
        setMode("command");
        setQuery("");
      } else if (e.key === "Escape") {
        close();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, mode, filteredCommands, filteredFiles, selectedIndex, visible, workspace]);

  // Global shortcuts — wire these even when the palette is closed.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "p" && !e.shiftKey) {
        e.preventDefault();
        setMode("file");
        setQuery("");
        setSelectedIndex(0);
        onOpenChange(true);
      } else if (k === "o") {
        e.preventDefault();
        void workspace.openFolder();
      } else if (k === "w") {
        e.preventDefault();
        if (workspace.activeTabIndex >= 0) workspace.closeTab(workspace.activeTabIndex);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [workspace, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-[560px] overflow-hidden rounded-xl border border-border bg-surface-3 shadow-2xl"
      >
        <div className="flex h-12 items-center gap-3 border-b border-border-subtle px-4">
          <Search className="h-4 w-4 shrink-0 text-foreground-muted" />
          {mode === "file" && (
            <span className="rounded border border-border bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">
              file
            </span>
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={mode === "file" ? "Search files by name…" : "Type a command or search…"}
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground-muted focus:outline-none"
          />
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {mode === "file" ? (
            filteredFiles.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-foreground-muted">
                {workspace.rootPath
                  ? `No files match "${query}"`
                  : "Open a folder first (Cmd/Ctrl+O)."}
              </div>
            ) : (
              filteredFiles.map((f, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={f.path}
                    onClick={() => {
                      void workspace.openFile(f.path);
                      close();
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${
                      isSelected ? "bg-accent/10" : "hover:bg-surface-hover"
                    }`}
                  >
                    <FileIcon className={`h-3.5 w-3.5 shrink-0 ${isSelected ? "text-accent" : "text-foreground-muted"}`} />
                    <div className="min-w-0 flex-1 truncate">
                      <div className={`truncate font-mono text-[13px] ${isSelected ? "text-foreground" : "text-foreground-secondary"}`}>
                        {f.rel.split("/").pop()}
                      </div>
                      <div className="truncate font-mono text-[10.5px] text-foreground-muted">
                        {f.rel}
                      </div>
                    </div>
                  </button>
                );
              })
            )
          ) : filteredCommands.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-foreground-muted">
              No results for "{query}"
            </div>
          ) : (
            filteredCommands.map((cmd, i) => {
              const Icon = cmd.icon;
              const isSelected = i === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={cmd.disabled ? undefined : cmd.action}
                  onMouseEnter={() => setSelectedIndex(i)}
                  disabled={cmd.disabled}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                    cmd.disabled
                      ? "cursor-not-allowed opacity-40"
                      : isSelected
                        ? "bg-accent/10"
                        : "hover:bg-surface-hover"
                  }`}
                >
                  <Icon className={`h-4 w-4 shrink-0 ${isSelected ? "text-accent" : "text-foreground-secondary"}`} />
                  <span className={`flex-1 text-[14px] ${isSelected ? "text-foreground" : "text-foreground-secondary"}`}>
                    {cmd.label}
                  </span>
                  <div className="flex items-center gap-1">
                    {cmd.shortcut && (
                      <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px] text-foreground-muted">
                        {cmd.shortcut}
                      </kbd>
                    )}
                    {isSelected && !cmd.disabled && <ArrowRight className="h-3.5 w-3.5 text-accent" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
      <div className="fixed inset-0 -z-10" onClick={() => onOpenChange(false)} />
    </div>
  );
}

// Tiny fuzzy match: every char in `query` must appear in `s` in order;
// score rewards consecutive runs + matches near the basename.
function scoreFuzzy(s: string, query: string): number {
  let qi = 0;
  let score = 0;
  let consecutive = 0;
  // Bonus for matching in the basename (after the last slash).
  const baseStart = Math.max(0, s.lastIndexOf("/") + 1);
  for (let i = 0; i < s.length && qi < query.length; i++) {
    if (s[i] === query[qi]) {
      qi++;
      consecutive++;
      score += 1 + consecutive;
      if (i >= baseStart) score += 1;
    } else {
      consecutive = 0;
    }
  }
  return qi === query.length ? score : 0;
}

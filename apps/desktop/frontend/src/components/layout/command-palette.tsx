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
  X,
  type LucideIcon,
} from "lucide-react";
import { useLogout } from "@/hooks/use-auth";
import { useWorkspace } from "@/lib/workspace-store";

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

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { mutate: logout } = useLogout();
  const workspace = useWorkspace();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => {
    onOpenChange(false);
    setQuery("");
  };

  const go = (to: string) => {
    navigate({ to });
    close();
  };

  const commands = useMemo<Command[]>(() => {
    const activeTab = workspace.activeTab;
    const activeIndex = workspace.activeTabIndex;
    const isHtml = activeTab?.language === "html";

    return [
      // Workspace actions — top of the list because they're the most-used
      // commands once a student is in the editor.
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
        id: "toggle-preview",
        label: workspace.previewVisible ? "Hide Preview" : "Show Preview",
        shortcut: "⌘P",
        icon: Eye,
        disabled: !isHtml,
        action: () => {
          close();
          workspace.togglePreview();
        },
      },

      // Navigation
      { id: "dashboard", label: "Editor", shortcut: "G D", icon: Home, action: () => go("/app") },
      { id: "profile", label: "Profile", shortcut: "G P", icon: User, action: () => go("/app/profile") },
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
  }, [workspace, navigate, logout]);

  const filtered = commands.filter((c) => c.label.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
      setQuery("");
      setSelectedIndex(0);
    }
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        const cmd = filtered[selectedIndex];
        if (cmd && !cmd.disabled) cmd.action();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, filtered, selectedIndex]);

  // Cmd/Ctrl+O / +P shortcuts are wired here too so they work even when
  // the palette is closed. (Save is handled by MonacoPane.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === "o") {
        e.preventDefault();
        void workspace.openFolder();
      } else if (k === "p") {
        e.preventDefault();
        workspace.togglePreview();
      } else if (k === "w") {
        e.preventDefault();
        if (workspace.activeTabIndex >= 0) workspace.closeTab(workspace.activeTabIndex);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [workspace]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center bg-black/40 pt-[15vh] backdrop-blur-sm">
      <div
        onClick={(e) => e.stopPropagation()}
        className="mx-4 w-full max-w-[560px] overflow-hidden rounded-xl border border-border bg-surface-3 shadow-2xl"
      >
        <div className="flex h-12 items-center gap-3 border-b border-border-subtle px-4">
          <Search className="h-4 w-4 shrink-0 text-foreground-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command or search…"
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-foreground-muted focus:outline-none"
          />
          <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
            ESC
          </kbd>
        </div>

        <div className="max-h-[400px] overflow-y-auto p-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-[13px] text-foreground-muted">
              No results for "{query}"
            </div>
          ) : (
            filtered.map((cmd, i) => {
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

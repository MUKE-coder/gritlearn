// Status bar — pinned at the bottom of the lesson view, VSCode style.
// Shows: git branch (clickable → opens Git panel) · workspace name ·
// active file path/language · cursor line:col · encoding · indent.
//
// Updates cheaply: subscribes to a global "JEditor:cursor-position"
// event Monaco fires on every selection change; everything else
// reads from React context.

import { useEffect, useState } from "react";
import { Bell, FileText, GitBranch, MapPin } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
import { useEditorPrefs } from "@/lib/editor-prefs";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

interface CursorPos {
  line: number;
  col: number;
}

export function StatusBar({ onClickGit }: { onClickGit?: () => void }) {
  const { activeTab, rootPath, tabs } = useWorkspace();
  const { prefs } = useEditorPrefs();
  const [cursor, setCursor] = useState<CursorPos>({ line: 1, col: 1 });
  const [branch, setBranch] = useState<string>("");

  useEffect(() => {
    const onCursor = (e: Event) => {
      const detail = (e as CustomEvent).detail as CursorPos | undefined;
      if (detail) setCursor(detail);
    };
    window.addEventListener("JEditor:cursor-position", onCursor);
    return () => window.removeEventListener("JEditor:cursor-position", onCursor);
  }, []);

  // Reload branch when rootPath changes or every 8s (cheap enough,
  // and matches the GitPanel's refresh cadence so the displayed
  // branch never disagrees with the panel for long).
  useEffect(() => {
    let cancelled = false;
    const fetchBranch = async () => {
      if (!rootPath) {
        setBranch("");
        return;
      }
      try {
        const repo = (await App.IsGitRepo(rootPath)) as boolean;
        if (!repo) {
          if (!cancelled) setBranch("");
          return;
        }
        const info = (await App.GitBranch(rootPath)) as {
          branch: string;
          ahead: number;
          behind: number;
        };
        if (!cancelled) {
          const suffix = info.ahead > 0 || info.behind > 0 ? ` ${info.ahead}↑${info.behind}↓` : "";
          setBranch((info.branch || "") + suffix);
        }
      } catch {
        if (!cancelled) setBranch("");
      }
    };
    fetchBranch();
    const id = setInterval(fetchBranch, 8000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [rootPath]);

  const dirtyCount = tabs.filter((t) => t.content !== t.savedContent).length;
  const workspaceName = rootPath ? rootPath.split(/[\\/]/).pop() || rootPath : null;

  return (
    <div className="flex h-6 shrink-0 items-center justify-between border-t border-border bg-surface-1 px-2 text-[11px] text-foreground-secondary">
      <div className="flex items-center gap-3">
        {branch && (
          <button
            onClick={onClickGit}
            title="Open Git panel"
            className="flex items-center gap-1 hover:text-foreground"
          >
            <GitBranch className="h-3 w-3" />
            <span className="font-mono">{branch}</span>
          </button>
        )}
        {workspaceName && (
          <div className="flex items-center gap-1" title={rootPath ?? ""}>
            <MapPin className="h-3 w-3 text-foreground-muted" />
            <span className="font-mono truncate max-w-[200px]">{workspaceName}</span>
          </div>
        )}
        {dirtyCount > 0 && (
          <div className="flex items-center gap-1 text-warning" title={`${dirtyCount} unsaved file(s)`}>
            <Bell className="h-3 w-3" />
            <span>{dirtyCount} unsaved</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 font-mono text-foreground-muted">
        {activeTab && (
          <>
            <span>{cursor.line}:{cursor.col}</span>
            <span>{prefs.tabSize} sp</span>
            <span>UTF-8</span>
            <span className="text-foreground-secondary">
              {activeTab.language === "plaintext" ? "Plain Text" : activeTab.language}
            </span>
            <div className="flex items-center gap-1 text-foreground-secondary">
              <FileText className="h-3 w-3" />
              <span className="truncate max-w-[260px]">{activeTab.name}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

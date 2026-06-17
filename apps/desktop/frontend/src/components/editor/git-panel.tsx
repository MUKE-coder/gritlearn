// Git source-control panel — third tab of the BottomPanel. Lists the
// changed files under the open workspace, with status badges + a
// click-to-open. Polls every 4s so a save reflects without a manual
// refresh. Hides itself when the open folder isn't a git repo so we
// don't show "0 changes" forever in non-repo workspaces.

import { useCallback, useEffect, useState } from "react";
import { GitBranch, RefreshCw } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

interface GitStatusEntry {
  path: string;
  abs: string;
  status: string;
  staged: boolean;
}

const STATUS_TONE: Record<string, string> = {
  modified:  "text-amber-300 border-amber-300/30 bg-amber-300/10",
  added:     "text-emerald-300 border-emerald-300/30 bg-emerald-300/10",
  deleted:   "text-red-300 border-red-300/30 bg-red-300/10",
  renamed:   "text-sky-300 border-sky-300/30 bg-sky-300/10",
  untracked: "text-violet-300 border-violet-300/30 bg-violet-300/10",
  copied:    "text-sky-300 border-sky-300/30 bg-sky-300/10",
  unmerged:  "text-orange-300 border-orange-300/30 bg-orange-300/10",
  ignored:   "text-foreground-muted border-border bg-surface-2",
  "?":       "text-foreground-muted border-border bg-surface-2",
};

const STATUS_LABEL: Record<string, string> = {
  modified:  "M",
  added:     "A",
  deleted:   "D",
  renamed:   "R",
  untracked: "U",
  copied:    "C",
  unmerged:  "X",
  ignored:   "I",
  "?":       "?",
};

export function GitPanel() {
  const { rootPath, openFile } = useWorkspace();
  const [isRepo, setIsRepo] = useState<boolean | null>(null);
  const [entries, setEntries] = useState<GitStatusEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (!rootPath) return;
    setRefreshing(true);
    setError(null);
    try {
      const repo = (await App.IsGitRepo(rootPath)) as boolean;
      setIsRepo(repo);
      if (!repo) {
        setEntries([]);
        return;
      }
      const rows = (await App.GitStatus(rootPath)) as GitStatusEntry[];
      setEntries(rows);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }, [rootPath]);

  useEffect(() => {
    void refresh();
    if (!rootPath) return;
    // Poll every 4 seconds so saves + external git commands surface
    // without the student hitting refresh. Cheap — git status is
    // milliseconds even on a Linux kernel checkout.
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [rootPath, refresh]);

  if (!rootPath) {
    return (
      <div className="flex h-full items-center justify-center text-[12.5px] text-foreground-muted">
        Open a folder to see source-control changes.
      </div>
    );
  }
  if (isRepo === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-[12.5px] text-foreground-muted">
        <GitBranch className="h-5 w-5" />
        <div>Not a git repository.</div>
        <div className="text-foreground-muted">Run <code className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono">git init</code> in the terminal to start tracking changes.</div>
      </div>
    );
  }
  return (
    <div className="flex h-full flex-col bg-surface-1">
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <div className="flex items-center gap-2 text-[11px] uppercase tracking-wider text-foreground-muted">
          <GitBranch className="h-3.5 w-3.5" />
          Changes
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-foreground-secondary">
            {entries.length}
          </span>
        </div>
        <button
          onClick={() => void refresh()}
          title="Refresh"
          className="rounded p-1 text-foreground-muted hover:bg-surface-2 hover:text-foreground"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
        </button>
      </div>
      {error && (
        <div className="border-b border-danger/30 bg-danger/10 px-3 py-2 text-[11px] text-danger">
          {error}
        </div>
      )}
      <div className="flex-1 overflow-y-auto">
        {entries.length === 0 ? (
          <div className="px-3 py-4 text-[12.5px] text-foreground-muted">
            Working tree clean — no changes since the last commit.
          </div>
        ) : (
          entries.map((e) => (
            <button
              key={e.path}
              onClick={() => {
                if (e.status === "deleted") return;
                void openFile(e.abs);
              }}
              title={e.path}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-surface-2"
            >
              <span
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-[10px] font-bold ${
                  STATUS_TONE[e.status] ?? STATUS_TONE["?"]
                }`}
              >
                {STATUS_LABEL[e.status] ?? "?"}
              </span>
              <span className="truncate font-mono text-[12.5px] text-foreground">
                {e.path}
              </span>
              {e.staged && (
                <span className="ml-auto rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] text-accent">
                  staged
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

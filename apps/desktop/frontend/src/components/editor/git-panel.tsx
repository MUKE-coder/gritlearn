// Git source-control panel — bottom-panel tab with read + write ops.
// Lists changed files with status badges + a per-file stage / unstage
// button. Below the list: commit message + Commit, Push, Pull, branch
// indicator with ahead/behind counts.
//
// Polls every 4s for status changes so writes from the integrated
// terminal flow into the UI without a manual refresh.

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  GitBranch,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  RotateCcw,
} from "lucide-react";
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

interface BranchInfo {
  branch: string;
  upstream: string;
  ahead: number;
  behind: number;
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
  const [branch, setBranch] = useState<BranchInfo | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "stage" | "commit" | "push" | "pull">(null);
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
        setBranch(null);
        return;
      }
      const rows = (await App.GitStatus(rootPath)) as GitStatusEntry[];
      setEntries(rows);
      const br = (await App.GitBranch(rootPath)) as BranchInfo;
      setBranch(br);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setRefreshing(false);
    }
  }, [rootPath]);

  useEffect(() => {
    void refresh();
    if (!rootPath) return;
    const id = setInterval(() => void refresh(), 4000);
    return () => clearInterval(id);
  }, [rootPath, refresh]);

  const stagedCount = entries.filter((e) => e.staged).length;
  const unstagedCount = entries.length - stagedCount;

  const stage = async (paths: string[]) => {
    if (!rootPath) return;
    setBusy("stage");
    setError(null);
    try {
      await App.GitStage(rootPath, paths);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const unstage = async (paths: string[]) => {
    if (!rootPath) return;
    setBusy("stage");
    setError(null);
    try {
      await App.GitUnstage(rootPath, paths);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const discard = async (path: string) => {
    if (!rootPath) return;
    if (!confirm(`Discard local changes to ${path}? This can't be undone.`)) return;
    try {
      await App.GitDiscard(rootPath, [path]);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const commit = async () => {
    if (!rootPath || !message.trim()) return;
    setBusy("commit");
    setError(null);
    try {
      const sha = (await App.GitCommit(rootPath, message.trim())) as string;
      setMessage("");
      await refresh();
      if (sha) console.log("[git] committed", sha);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const push = async () => {
    if (!rootPath) return;
    setBusy("push");
    setError(null);
    try {
      await App.GitPush(rootPath);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const pull = async () => {
    if (!rootPath) return;
    setBusy("pull");
    setError(null);
    try {
      await App.GitPull(rootPath);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const init = async () => {
    if (!rootPath) return;
    try {
      await App.GitInit(rootPath);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  if (!rootPath) {
    return (
      <div className="flex h-full items-center justify-center text-[12.5px] text-foreground-muted">
        Open a folder to see source-control changes.
      </div>
    );
  }
  if (isRepo === false) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-[12.5px] text-foreground-muted">
        <GitBranch className="h-5 w-5" />
        <div>Not a git repository.</div>
        <button
          onClick={() => void init()}
          className="rounded-md bg-accent px-3 py-1 text-[12px] font-semibold text-zinc-900 hover:bg-accent-hover"
        >
          Initialise a git repo here
        </button>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface-1">
      {/* Branch + push/pull header */}
      <div className="flex items-center justify-between gap-2 border-b border-border-subtle px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <GitBranch className="h-3.5 w-3.5 text-accent" />
          <span className="truncate font-mono text-[12px] text-foreground">
            {branch?.branch ?? "—"}
          </span>
          {branch?.upstream && (
            <span className="font-mono text-[10px] text-foreground-muted">
              → {branch.upstream}
            </span>
          )}
          {branch && (branch.ahead > 0 || branch.behind > 0) && (
            <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
              {branch.ahead}↑ {branch.behind}↓
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => void pull()}
            disabled={busy !== null}
            title="Pull"
            className="rounded p-1 text-foreground-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
          >
            {busy === "pull" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowDownToLine className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => void push()}
            disabled={busy !== null}
            title={branch && branch.ahead > 0 ? `Push ${branch.ahead} commit(s)` : "Push"}
            className="rounded p-1 text-foreground-muted hover:bg-surface-2 hover:text-foreground disabled:opacity-40"
          >
            {busy === "push" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArrowUpFromLine className="h-3.5 w-3.5" />}
          </button>
          <button
            onClick={() => void refresh()}
            title="Refresh"
            className="rounded p-1 text-foreground-muted hover:bg-surface-2 hover:text-foreground"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="border-b border-danger/30 bg-danger/10 px-3 py-2 text-[11.5px] text-danger">
          {error}
        </div>
      )}

      {/* Commit composer */}
      <div className="border-b border-border-subtle bg-surface-2/40 px-3 py-2">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            stagedCount > 0
              ? `Commit message — ${stagedCount} file(s) staged`
              : "Stage files first (click the + next to a file)"
          }
          rows={2}
          onKeyDown={(e) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
              e.preventDefault();
              void commit();
            }
          }}
          className="w-full resize-none rounded border border-border bg-surface-1 px-2 py-1 font-mono text-[12px] text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none"
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-[10px] text-foreground-muted">Ctrl+Enter to commit</span>
          <button
            onClick={() => void commit()}
            disabled={busy !== null || !message.trim() || stagedCount === 0}
            className="flex h-7 items-center gap-1.5 rounded bg-accent px-2.5 text-[11.5px] font-semibold text-zinc-900 hover:bg-accent-hover disabled:opacity-40"
          >
            {busy === "commit" && <Loader2 className="h-3 w-3 animate-spin" />}
            Commit {stagedCount > 0 && `(${stagedCount})`}
          </button>
        </div>
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto">
        <FileSection
          label="Staged Changes"
          count={stagedCount}
          accent
          onStageAll={() => void unstage([])}
          onStageAllLabel="Unstage all"
          entries={entries.filter((e) => e.staged)}
          onAction={(e) => void unstage([e.path])}
          actionIcon={<Minus className="h-3 w-3" />}
          actionTitle="Unstage"
          onDiscard={(e) => void discard(e.path)}
          onOpen={(e) => void openFile(e.abs)}
        />
        <FileSection
          label="Changes"
          count={unstagedCount}
          onStageAll={() => void stage([])}
          onStageAllLabel="Stage all"
          entries={entries.filter((e) => !e.staged)}
          onAction={(e) => void stage([e.path])}
          actionIcon={<Plus className="h-3 w-3" />}
          actionTitle="Stage"
          onDiscard={(e) => void discard(e.path)}
          onOpen={(e) => void openFile(e.abs)}
        />
        {entries.length === 0 && (
          <div className="px-3 py-4 text-[12.5px] text-foreground-muted">
            Working tree clean — no changes since the last commit.
          </div>
        )}
      </div>
    </div>
  );
}

interface FileSectionProps {
  label: string;
  count: number;
  accent?: boolean;
  entries: GitStatusEntry[];
  onAction: (e: GitStatusEntry) => void;
  actionIcon: React.ReactNode;
  actionTitle: string;
  onStageAll: () => void;
  onStageAllLabel: string;
  onDiscard: (e: GitStatusEntry) => void;
  onOpen: (e: GitStatusEntry) => void;
}

function FileSection({
  label,
  count,
  accent,
  entries,
  onAction,
  actionIcon,
  actionTitle,
  onStageAll,
  onStageAllLabel,
  onDiscard,
  onOpen,
}: FileSectionProps) {
  if (count === 0) return null;
  return (
    <div className="border-b border-border-subtle">
      <div className="flex items-center justify-between gap-2 bg-surface-2/30 px-3 py-1.5">
        <span className={`text-[10px] font-medium uppercase tracking-wider ${accent ? "text-accent" : "text-foreground-muted"}`}>
          {label} <span className="text-foreground-muted">({count})</span>
        </span>
        <button
          onClick={onStageAll}
          className="text-[10px] text-foreground-muted hover:text-foreground"
        >
          {onStageAllLabel}
        </button>
      </div>
      {entries.map((e) => (
        <div
          key={e.path + e.status}
          className="group flex items-center gap-2 px-3 py-1 hover:bg-surface-2"
        >
          <span
            className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border font-mono text-[10px] font-bold ${
              STATUS_TONE[e.status] ?? STATUS_TONE["?"]
            }`}
          >
            {STATUS_LABEL[e.status] ?? "?"}
          </span>
          <button
            onClick={() => onOpen(e)}
            disabled={e.status === "deleted"}
            title={e.path}
            className="min-w-0 flex-1 truncate text-left font-mono text-[12px] text-foreground hover:underline disabled:text-foreground-muted disabled:no-underline"
          >
            {e.path}
          </button>
          <button
            onClick={() => onDiscard(e)}
            title="Discard changes"
            className="rounded p-1 text-foreground-muted opacity-0 hover:bg-surface-3 hover:text-foreground group-hover:opacity-100"
          >
            <RotateCcw className="h-3 w-3" />
          </button>
          <button
            onClick={() => onAction(e)}
            title={actionTitle}
            className="rounded p-1 text-foreground-muted hover:bg-surface-3 hover:text-foreground"
          >
            {actionIcon}
          </button>
        </div>
      ))}
    </div>
  );
}

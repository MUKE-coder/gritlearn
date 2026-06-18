// BottomPanel — collapsible pane below the editor with three tabs:
//
//   Terminal    — full PTY-backed shell via xterm.js (Ctrl+C signals,
//                 ncurses apps, real arrow-key history, vim, etc.)
//   Live Server — local HTTP server with auto-reload over SSE.
//   Git         — changed-files list driven by `git status --porcelain`.
//
// All three panes stay mounted under display:none flips so switching
// tabs doesn't tear down the shell session or kill the live server.

import { useEffect, useState } from "react";
import { ChevronDown, GitBranch, Globe, Play, Square, Terminal as TerminalIcon, X } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
import { GitPanel } from "./git-panel";
import { XtermTerminal } from "./xterm-terminal";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

type Tab = "terminal" | "live-server" | "git" | "problems";

interface BottomPanelProps {
  onClose: () => void;
  /** Forwarded to the Terminal for future per-phase customisation. */
  phaseId?: string;
  /** Optional controlled initial tab (defaults to terminal). */
  initialTab?: "terminal" | "live-server" | "problems";
  /** Fires when the user switches tabs so the parent can persist. */
  onTabChange?: (t: "terminal" | "live-server" | "problems") => void;
}

export function BottomPanel({ onClose, phaseId: _phaseId, initialTab, onTabChange }: BottomPanelProps) {
  const [tab, setTabState] = useState<Tab>(initialTab ?? "terminal");
  const setTab = (t: Tab) => {
    setTabState(t);
    if (t === "terminal" || t === "live-server" || t === "problems") {
      onTabChange?.(t);
    }
  };
  useEffect(() => {
    if (initialTab && initialTab !== tab) setTabState(initialTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  return (
    <div className="flex h-full flex-col border-t border-border bg-background">
      <div className="flex h-9 shrink-0 items-center justify-between border-b border-border-subtle bg-surface-1 pr-2">
        <div className="flex h-full items-center">
          <TabButton active={tab === "terminal"} onClick={() => setTab("terminal")}>
            <TerminalIcon className="h-3.5 w-3.5" />
            Terminal
          </TabButton>
          <TabButton active={tab === "live-server"} onClick={() => setTab("live-server")}>
            <Globe className="h-3.5 w-3.5" />
            Live Server
          </TabButton>
          <TabButton active={tab === "git"} onClick={() => setTab("git")}>
            <GitBranch className="h-3.5 w-3.5" />
            Git
          </TabButton>
          <TabButton active={tab === "problems"} onClick={() => setTab("problems")}>
            <span className="text-[12px] font-medium">⚠</span>
            Problems
          </TabButton>
        </div>
        <button
          onClick={onClose}
          title="Hide panel"
          className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-muted hover:bg-surface-hover hover:text-foreground"
        >
          <ChevronDown className="h-4 w-4" />
        </button>
      </div>
      <div className="min-h-0 flex-1">
        <div className={`h-full ${tab === "terminal" ? "" : "hidden"}`}>
          <XtermTerminal />
        </div>
        <div className={`h-full ${tab === "live-server" ? "" : "hidden"}`}>
          <LiveServerPane />
        </div>
        <div className={`h-full ${tab === "git" ? "" : "hidden"}`}>
          <GitPanel />
        </div>
        <div className={`h-full ${tab === "problems" ? "" : "hidden"}`}>
          <ProblemsPlaceholder />
        </div>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex h-full items-center gap-1.5 border-b-2 px-3 text-[12px] font-medium transition-colors ${
        active
          ? "border-accent text-foreground"
          : "border-transparent text-foreground-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Problems placeholder ────────────────────────────────────
//
// Real Problems pane (TypeScript diagnostics + ESLint) would aggregate
// from Monaco's markers across every model. For now this is a tasteful
// empty state so the menubar's "Problems" entry doesn't dead-end.
function ProblemsPlaceholder() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 bg-surface-1 text-center text-[12.5px] text-foreground-muted">
      <span>No problems detected.</span>
      <span className="text-[11px]">TypeScript + ESLint diagnostics will surface here.</span>
    </div>
  );
}

// ─── Live Server pane ────────────────────────────────────────

interface LiveStatus {
  running: boolean;
  url: string;
  root: string;
}

function LiveServerPane() {
  const { rootPath } = useWorkspace();
  const [status, setStatus] = useState<LiveStatus>({ running: false, url: "", root: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = (await App.GetLiveServerStatus()) as LiveStatus;
        if (!cancelled) setStatus(s);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const start = async () => {
    if (!rootPath) {
      setError("Open a folder first — Live Server needs something to serve.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const url = (await App.StartLiveServer(rootPath)) as string;
      setStatus({ running: true, url, root: rootPath });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const stop = async () => {
    setBusy(true);
    setError(null);
    try {
      await App.StopLiveServer();
      setStatus({ running: false, url: "", root: "" });
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  const open = () => {
    if (status.url) void App.OpenInBrowser(status.url);
  };

  return (
    <div className="flex h-full flex-col items-stretch gap-4 overflow-y-auto bg-surface-1 px-6 py-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-[14px] font-semibold text-foreground">Live Server</h3>
          <p className="mt-1 text-[12.5px] text-foreground-secondary">
            Serve the open folder over a local HTTP server with auto-reload. Edit an
            HTML / CSS / JS file → the browser refreshes instantly.
          </p>
        </div>
        {status.running ? (
          <button
            onClick={stop}
            disabled={busy}
            className="flex h-9 items-center gap-1.5 rounded-md bg-danger/15 px-3 text-[12px] font-medium text-danger hover:bg-danger/25 disabled:opacity-50"
          >
            <Square className="h-3.5 w-3.5" />
            Stop
          </button>
        ) : (
          <button
            onClick={start}
            disabled={busy || !rootPath}
            className="flex h-9 items-center gap-1.5 rounded-md bg-accent px-3 text-[12px] font-semibold text-zinc-900 hover:bg-accent-hover disabled:opacity-50"
          >
            <Play className="h-3.5 w-3.5" />
            Go Live
          </button>
        )}
      </div>

      {error && (
        <div className="rounded-md border border-danger/30 bg-danger/10 px-3 py-2 text-[12px] text-danger">
          {error}
          <button onClick={() => setError(null)} className="ml-2 rounded p-0.5 hover:bg-danger/20">
            <X className="h-3 w-3" />
          </button>
        </div>
      )}

      {status.running && (
        <div className="rounded-lg border border-accent/30 bg-accent/5 p-4">
          <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-wider text-accent">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" />
            Running
          </div>
          <div className="mt-2 font-mono text-[13px] text-foreground">{status.url}</div>
          <div className="mt-0.5 font-mono text-[11px] text-foreground-muted">serving {status.root}</div>
          <button
            onClick={open}
            className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2 px-2.5 py-1 text-[11.5px] font-medium text-foreground hover:bg-surface-hover"
          >
            <Globe className="h-3 w-3" />
            Open in browser
          </button>
        </div>
      )}

      {!status.running && (
        <div className="rounded-lg border border-border bg-surface-2 p-4 text-[12px] text-foreground-secondary">
          <p>
            When you click <span className="font-semibold text-foreground">Go Live</span>, JEditor
            spins up a HTTP server bound to <span className="font-mono">127.0.0.1</span> and a
            random free port. The first <span className="font-mono">index.html</span> in the open
            folder becomes the homepage.
          </p>
          <p className="mt-2">
            Every HTML file picks up a tiny script that reconnects via Server-Sent Events. Save a
            file and the page reloads in under a second.
          </p>
        </div>
      )}
    </div>
  );
}

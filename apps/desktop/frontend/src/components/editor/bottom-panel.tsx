// BottomPanel — collapsible panel below the editor with two tabs:
//
//   Terminal    — run shell commands via the Go-side runner, see output
//                 stream in. Common command quick-buttons per phase.
//   Live Server — serve the current workspace folder over a local HTTP
//                 server with auto-reload. Click the URL to open it.
//
// The host pane decides whether it's visible (BottomPanelHost in the
// lesson route). When mounted, both tabs lazy-init their hooks so
// flipping between them keeps state intact.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Globe, Play, Square, StopCircle, Terminal as TerminalIcon, X } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import { EventsOn } from "../../../wailsjs/runtime";

type Tab = "terminal" | "live-server";

interface BottomPanelProps {
  onClose: () => void;
  phaseId?: string;
}

export function BottomPanel({ onClose, phaseId }: BottomPanelProps) {
  const [tab, setTab] = useState<Tab>("terminal");

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
        {tab === "terminal" ? <TerminalPane phaseId={phaseId} /> : <LiveServerPane />}
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

// ─── Terminal pane ───────────────────────────────────────────

interface RunLine {
  id: string;
  stream: "stdout" | "stderr";
  text: string;
}

const RECENT_COMMANDS_KEY = "JEditor.recent-commands";

function TerminalPane({ phaseId }: { phaseId?: string }) {
  const { rootPath } = useWorkspace();
  const [lines, setLines] = useState<RunLine[]>([]);
  const [command, setCommand] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [history, setHistory] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem(RECENT_COMMANDS_KEY) ?? "[]") as string[];
    } catch {
      return [];
    }
  });
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Subscribe to streamed output from the Go runner.
  useEffect(() => {
    const offLine = EventsOn("runner:line", (e: RunLine) => {
      setLines((prev) => prev.concat(e));
    });
    const offExit = EventsOn(
      "runner:exit",
      (e: { id: string; code: number; error: string }) => {
        setActiveId((prev) => (prev === e.id ? null : prev));
        setExitCode(e.code);
        setLines((prev) =>
          prev.concat({
            id: e.id,
            stream: e.error ? "stderr" : "stdout",
            text: e.error
              ? `\n[process exited ${e.code}: ${e.error}]\n`
              : `\n[process exited ${e.code}]\n`,
          }),
        );
      },
    );
    return () => {
      offLine();
      offExit();
    };
  }, []);

  // Auto-scroll to the bottom on new output.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [lines]);

  const run = useCallback(
    async (cmd: string) => {
      const trimmed = cmd.trim();
      if (!trimmed) return;
      if (!rootPath) {
        setLines((prev) =>
          prev.concat({
            id: "no-root",
            stream: "stderr",
            text: "[no folder open — open one from the Files panel first]\n",
          }),
        );
        return;
      }
      setLines((prev) =>
        prev.concat({ id: "prompt", stream: "stdout", text: `$ ${trimmed}` }),
      );
      setExitCode(null);
      try {
        const id = await App.RunCommand(rootPath, trimmed);
        setActiveId(id);
      } catch (err) {
        setLines((prev) =>
          prev.concat({
            id: "err",
            stream: "stderr",
            text: `[start failed: ${err}]\n`,
          }),
        );
        return;
      }
      // Push onto history (dedup + cap 50).
      setHistory((prev) => {
        const next = [trimmed, ...prev.filter((h) => h !== trimmed)].slice(0, 50);
        try {
          localStorage.setItem(RECENT_COMMANDS_KEY, JSON.stringify(next));
        } catch {
          /* ignore quota */
        }
        return next;
      });
      setHistoryIndex(-1);
    },
    [rootPath],
  );

  const stop = useCallback(() => {
    if (activeId) void App.StopCommand(activeId);
  }, [activeId]);

  const quick = useMemo(() => quickCommandsFor(phaseId), [phaseId]);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0d] text-[12.5px]">
      {/* Quick command bar */}
      <div className="flex shrink-0 items-center gap-1.5 overflow-x-auto border-b border-border-subtle bg-[#111114] px-3 py-1.5">
        {quick.map((q) => (
          <button
            key={q.label}
            onClick={() => void run(q.cmd)}
            title={q.cmd}
            className="rounded border border-border bg-surface-2 px-2 py-0.5 font-mono text-[11px] text-foreground-secondary hover:border-accent/50 hover:text-foreground"
          >
            {q.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1.5">
          <button
            onClick={() => setLines([])}
            className="rounded px-2 py-0.5 text-[11px] text-foreground-muted hover:bg-surface-2 hover:text-foreground"
          >
            Clear
          </button>
          {activeId && (
            <button
              onClick={stop}
              title="Stop the running command"
              className="flex items-center gap-1 rounded bg-danger/15 px-2 py-0.5 text-[11px] text-danger hover:bg-danger/25"
            >
              <StopCircle className="h-3 w-3" />
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Output scrollback */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-3 font-mono leading-[1.55]"
      >
        {lines.map((l, i) => (
          <div
            key={i}
            className={`whitespace-pre-wrap break-words ${
              l.stream === "stderr" ? "text-red-300" : "text-[#e4e4ee]"
            }`}
          >
            {l.text}
          </div>
        ))}
        {lines.length === 0 && (
          <div className="text-foreground-muted">
            {rootPath
              ? "Type a command below, or pick a quick command above."
              : "Open a folder first — terminal commands run inside that folder."}
          </div>
        )}
      </div>

      {/* Input row */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (activeId) {
            // Don't fire a second command while one is running. The user
            // can hit Stop above first.
            return;
          }
          void run(command);
          setCommand("");
        }}
        className="flex shrink-0 items-center gap-2 border-t border-border-subtle bg-[#111114] px-3 py-2"
      >
        <span className="font-mono text-[12.5px] text-accent">$</span>
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "ArrowUp") {
              e.preventDefault();
              if (history.length === 0) return;
              const next = Math.min(history.length - 1, historyIndex + 1);
              setHistoryIndex(next);
              setCommand(history[next] ?? "");
            } else if (e.key === "ArrowDown") {
              e.preventDefault();
              const next = Math.max(-1, historyIndex - 1);
              setHistoryIndex(next);
              setCommand(next === -1 ? "" : history[next] ?? "");
            }
          }}
          placeholder={activeId ? "command running — press Stop to interrupt" : "pnpm install"}
          disabled={!!activeId}
          spellCheck={false}
          className="min-w-0 flex-1 bg-transparent font-mono text-[12.5px] text-foreground placeholder:text-foreground-muted focus:outline-none disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!!activeId || !command.trim()}
          className="flex items-center gap-1 rounded bg-accent px-2.5 py-1 text-[11px] font-semibold text-zinc-900 hover:bg-accent-hover disabled:opacity-40"
        >
          <Play className="h-3 w-3" />
          Run
        </button>
      </form>
      {exitCode != null && !activeId && (
        <div className="shrink-0 border-t border-border-subtle bg-[#111114] px-3 py-1 font-mono text-[10px] text-foreground-muted">
          last exit code: {exitCode}
        </div>
      )}
    </div>
  );
}

interface QuickCmd {
  label: string;
  cmd: string;
}

function quickCommandsFor(phaseId?: string): QuickCmd[] {
  if (!phaseId) return BASE_COMMANDS;
  if (phaseId === "phase-04") {
    return [
      { label: "pnpm install", cmd: "pnpm install" },
      { label: "pnpm dev",     cmd: "pnpm dev" },
      { label: "node index.js",cmd: "node index.js" },
      ...BASE_COMMANDS,
    ];
  }
  if (phaseId === "phase-02" || phaseId === "phase-03") {
    return [
      { label: "pnpm install", cmd: "pnpm install" },
      { label: "pnpm dev",     cmd: "pnpm dev" },
      { label: "pnpm build",   cmd: "pnpm build" },
      ...BASE_COMMANDS,
    ];
  }
  if (phaseId === "phase-01") {
    // Frontend only — npm scripts unlikely, just clear + ls.
    return [
      { label: "ls",  cmd: "ls" },
      { label: "dir", cmd: "dir" },
    ];
  }
  return BASE_COMMANDS;
}

const BASE_COMMANDS: QuickCmd[] = [
  { label: "ls",       cmd: "ls" },
  { label: "git status", cmd: "git status" },
];

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

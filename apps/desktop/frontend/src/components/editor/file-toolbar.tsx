// File toolbar — pinned just above Monaco. Shows actions that
// depend on the active file's type:
//   HTML files → "Go Live" (starts/uses Live Server, opens browser)
// Future hooks (run script for .js, format for .ts, etc.) belong
// here so students discover them without spelunking the menu bar.

import { useEffect, useState } from "react";
import { ExternalLink, Globe, Loader2, Play } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

interface LiveStatus {
  running: boolean;
  url: string;
  root: string;
}

export function FileToolbar() {
  const { activeTab, rootPath } = useWorkspace();
  const [status, setStatus] = useState<LiveStatus>({ running: false, url: "", root: "" });
  const [busy, setBusy] = useState(false);

  // Refresh live-server status whenever the active file changes — the
  // student may have started it from the bottom panel + we want the
  // button label to mirror that.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const s = (await App.GetLiveServerStatus()) as LiveStatus;
        if (!cancelled) setStatus(s);
      } catch {
        /* not running, that's fine */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [activeTab?.path]);

  if (!activeTab?.path) return null;

  const isHtml = activeTab.language === "html";
  const fileRel =
    rootPath && activeTab.path.startsWith(rootPath)
      ? activeTab.path.slice(rootPath.length).replace(/^[/\\]+/, "").replace(/\\/g, "/")
      : activeTab.name;

  const goLive = async () => {
    if (!rootPath) return;
    setBusy(true);
    try {
      let url = status.url;
      if (!status.running || status.root !== rootPath) {
        url = (await App.StartLiveServer(rootPath)) as string;
        setStatus({ running: true, url, root: rootPath });
      }
      // Append the file's path so the browser lands on it directly.
      const target = `${url}/${fileRel}`;
      await App.OpenInBrowser(target);
    } catch (err) {
      console.error("[goLive] failed", err);
      alert(`Go Live failed: ${err}`);
    } finally {
      setBusy(false);
    }
  };

  const openInBrowser = async () => {
    if (!status.running || !status.url) return;
    await App.OpenInBrowser(`${status.url}/${fileRel}`);
  };

  if (!isHtml && !status.running) return null;

  return (
    <div className="flex h-7 shrink-0 items-center gap-1.5 border-b border-border-subtle bg-surface-2/40 px-3 text-[11.5px]">
      {isHtml && (
        <button
          onClick={() => void goLive()}
          disabled={busy || !rootPath}
          title={status.running ? "Server already running — open this file in browser" : "Start the live server + open this file"}
          className="flex h-6 items-center gap-1.5 rounded bg-accent px-2 font-semibold text-zinc-900 hover:bg-accent-hover disabled:opacity-50"
        >
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
          Go Live
        </button>
      )}
      {status.running && (
        <button
          onClick={() => void openInBrowser()}
          title="Open in browser"
          className="flex h-6 items-center gap-1.5 rounded border border-border bg-surface-2 px-2 text-foreground-secondary hover:text-foreground"
        >
          <ExternalLink className="h-3 w-3" />
          Open in browser
        </button>
      )}
      {status.running && status.url && (
        <span className="ml-1 flex items-center gap-1 font-mono text-[10px] text-foreground-muted">
          <Globe className="h-3 w-3 text-accent" />
          {status.url.replace("http://", "")}
        </span>
      )}
    </div>
  );
}

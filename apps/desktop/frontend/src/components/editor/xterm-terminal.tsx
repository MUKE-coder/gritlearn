// Full PTY-backed terminal, replacing the line-based runner pane.
// Built on @xterm/xterm with the FitAddon (auto-resize the terminal
// to fit the pane on mount + on parent resize) and WebLinksAddon
// (clickable URLs in output — handy when pnpm dev prints a server
// URL).
//
// Wiring:
//   PtyOpen(cwd, cols, rows) → id ✸ Go fires `pty:data {id, data}`
//   xterm.write(data)                ✸ keystrokes → PtyWrite(id, data)
//   ResizeObserver → fit → PtyResize(id, cols, rows)
//   PtyClose(id) on unmount

import { useEffect, useRef } from "react";
import { Terminal as XTerm } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import "@xterm/xterm/css/xterm.css";
import { useWorkspace } from "@/lib/workspace-store";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import { EventsOn } from "../../../wailsjs/runtime";

// Match the editor's Monokai-ish vibe so xterm doesn't feel grafted on.
const XTERM_THEME = {
  background: "#0a0a0d",
  foreground: "#e4e4ee",
  cursor: "#5FE3B0",
  cursorAccent: "#0a0a0d",
  selectionBackground: "#5FE3B040",
  black: "#0a0a0d",
  red: "#ff6188",
  green: "#a9dc76",
  yellow: "#ffd866",
  blue: "#78dce8",
  magenta: "#ab9df2",
  cyan: "#78dce8",
  white: "#fcfcfa",
  brightBlack: "#727072",
  brightRed: "#ff6188",
  brightGreen: "#a9dc76",
  brightYellow: "#ffd866",
  brightBlue: "#78dce8",
  brightMagenta: "#ab9df2",
  brightCyan: "#78dce8",
  brightWhite: "#fcfcfa",
};

export function XtermTerminal() {
  const { rootPath } = useWorkspace();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);
  const sessionIdRef = useRef<string | null>(null);

  // Mount + tear-down. Re-mounts every time rootPath changes so the
  // shell starts in the new cwd.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const term = new XTerm({
      theme: XTERM_THEME,
      fontFamily: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
      fontSize: 13,
      lineHeight: 1.2,
      cursorBlink: true,
      cursorStyle: "block",
      scrollback: 5000,
      allowProposedApi: true,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.loadAddon(new WebLinksAddon());
    term.open(el);
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    let dataOff: (() => void) | undefined;
    let exitOff: (() => void) | undefined;
    let dataInputDisposable: { dispose: () => void } | undefined;

    let cancelled = false;

    (async () => {
      try {
        const id = (await App.PtyOpen(rootPath ?? "", term.cols, term.rows)) as string;
        if (cancelled) {
          App.PtyClose(id);
          return;
        }
        sessionIdRef.current = id;

        // PTY → xterm.
        dataOff = EventsOn("pty:data", (e: { id: string; data: string }) => {
          if (e.id !== id) return;
          term.write(e.data);
        });
        exitOff = EventsOn("pty:exit", (e: { id: string; error: string }) => {
          if (e.id !== id) return;
          term.writeln(
            "\r\n\x1b[2m[shell exited" +
              (e.error ? `: ${e.error}` : "") +
              "]\x1b[0m",
          );
        });

        // Keystrokes → PTY.
        dataInputDisposable = term.onData((data) => {
          void App.PtyWrite(id, data);
        });

        term.focus();
      } catch (err) {
        term.writeln(`\x1b[31m[pty open failed: ${err}]\x1b[0m`);
      }
    })();

    // Resize on container size change.
    const ro = new ResizeObserver(() => {
      try {
        fit.fit();
        const id = sessionIdRef.current;
        if (id) void App.PtyResize(id, term.cols, term.rows);
      } catch {
        // Element detached etc — ignore.
      }
    });
    ro.observe(el);

    return () => {
      cancelled = true;
      ro.disconnect();
      dataOff?.();
      exitOff?.();
      dataInputDisposable?.dispose();
      const id = sessionIdRef.current;
      if (id) void App.PtyClose(id);
      sessionIdRef.current = null;
      term.dispose();
      termRef.current = null;
      fitRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rootPath]);

  return (
    <div className="flex h-full flex-col bg-[#0a0a0d]">
      <div className="flex items-center justify-between border-b border-border-subtle bg-[#111114] px-3 py-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-foreground-muted">
          shell · {rootPath ? rootPath.split(/[\\/]/).pop() : "(no folder)"}
        </span>
      </div>
      <div ref={containerRef} className="min-h-0 flex-1 px-2 py-2" />
    </div>
  );
}

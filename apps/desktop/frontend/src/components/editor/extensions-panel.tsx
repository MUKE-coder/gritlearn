// Extensions panel — listed as an Activity Bar item. Surfaces both
// built-in capabilities (Live Server, PTY Terminal, TypeScript LSP,
// Snippet Library, Git source control) AND user-installed plugins
// from the plugin host. VSCode treats these as one tab; we mirror
// that for consistency.

import { useState } from "react";
import { ChevronRight, Globe, Loader2, Plug, ShieldCheck, Sparkles, Terminal } from "lucide-react";
import { usePluginHost, type PluginRecord } from "@/lib/plugin-host";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

interface Builtin {
  id: string;
  name: string;
  description: string;
  icon: typeof Globe;
  status: "always-on" | "manual";
}

const BUILTINS: Builtin[] = [
  {
    id:          "live-server",
    name:        "Live Server",
    description: "Serves the open folder over local HTTP with auto-reload on save.",
    icon:        Globe,
    status:      "manual",
  },
  {
    id:          "pty-terminal",
    name:        "Integrated Terminal",
    description: "Real PTY shell — Ctrl+C, vim, ncurses, the works.",
    icon:        Terminal,
    status:      "always-on",
  },
  {
    id:          "typescript-lsp",
    name:        "TypeScript Language Service",
    description: "Inline errors, hover docs, autocomplete for JS / TS / JSX / TSX.",
    icon:        ShieldCheck,
    status:      "always-on",
  },
  {
    id:          "snippets",
    name:        "Snippet Library",
    description: "Curated triggers for HTML / CSS / JS / TS / React / Go / Python.",
    icon:        Sparkles,
    status:      "always-on",
  },
];

export function ExtensionsPanel() {
  const { records, refresh } = usePluginHost();
  const [installUrl, setInstallUrl] = useState("");
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const install = async () => {
    if (!installUrl.trim()) return;
    setInstalling(true);
    setError(null);
    try {
      await App.InstallPlugin(installUrl.trim(), "");
      setInstallUrl("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setInstalling(false);
    }
  };

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
          Extensions
        </span>
        <span className="font-mono text-[10px] text-foreground-muted">
          {BUILTINS.length + records.length} total
        </span>
      </div>

      <div className="space-y-2 border-b border-border-subtle p-3">
        <input
          value={installUrl}
          onChange={(e) => setInstallUrl(e.target.value)}
          placeholder="Install from URL (https://…/plugin.js)"
          className="h-8 w-full rounded border border-border bg-surface-2 px-2 font-mono text-[11.5px] text-foreground placeholder:text-foreground-muted"
        />
        <button
          onClick={() => void install()}
          disabled={installing || !installUrl.trim()}
          className="flex h-7 w-full items-center justify-center gap-1.5 rounded bg-accent text-[11.5px] font-semibold text-zinc-900 hover:bg-accent-hover disabled:opacity-40"
        >
          {installing && <Loader2 className="h-3 w-3 animate-spin" />}
          {installing ? "Installing…" : "Install Plugin"}
        </button>
        {error && (
          <div className="rounded border border-danger/30 bg-danger/10 px-2 py-1 text-[11px] text-danger">{error}</div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        <Section title={`Built-in (${BUILTINS.length})`}>
          {BUILTINS.map((b) => (
            <BuiltinRow key={b.id} ext={b} />
          ))}
        </Section>

        <Section title={`Installed (${records.length})`}>
          {records.length === 0 ? (
            <div className="px-3 py-3 text-[11.5px] text-foreground-muted">
              No plugins yet. Install one with the URL field above.
            </div>
          ) : (
            records.map((rec) => <PluginRow key={rec.manifest.id} rec={rec} onRefresh={refresh} />)
          )}
        </Section>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-border-subtle">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1 bg-surface-2/40 px-3 py-1.5 text-left text-[10px] font-medium uppercase tracking-wider text-foreground-muted hover:text-foreground"
      >
        <ChevronRight className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`} />
        {title}
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function BuiltinRow({ ext }: { ext: Builtin }) {
  const Icon = ext.icon;
  return (
    <div className="flex items-start gap-2 px-3 py-2 hover:bg-surface-2">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[12.5px] font-medium text-foreground">{ext.name}</span>
          <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider text-foreground-muted">
            built-in
          </span>
        </div>
        <p className="mt-0.5 text-[11px] leading-snug text-foreground-secondary">{ext.description}</p>
      </div>
    </div>
  );
}

function PluginRow({ rec, onRefresh }: { rec: PluginRecord; onRefresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);

  const toggle = async (next: boolean) => {
    setBusy(true);
    try {
      await App.SetPluginEnabled(rec.manifest.id, next);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const uninstall = async () => {
    if (!confirm(`Uninstall "${rec.manifest.name || rec.manifest.id}"?`)) return;
    await App.UninstallPlugin(rec.manifest.id);
    await onRefresh();
  };

  return (
    <div className="flex items-start gap-2 px-3 py-2 hover:bg-surface-2">
      <Plug className="mt-0.5 h-4 w-4 shrink-0 text-foreground-muted" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[12.5px] font-medium text-foreground">
            {rec.manifest.name || rec.manifest.id}
          </span>
          <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[9px] text-foreground-muted">
            v{rec.manifest.version || "?"}
          </span>
        </div>
        {rec.manifest.description && (
          <p className="mt-0.5 truncate text-[11px] text-foreground-secondary">{rec.manifest.description}</p>
        )}
        <div className="mt-1 flex items-center gap-2">
          <button
            onClick={() => void toggle(!rec.enabled)}
            disabled={busy}
            className={`rounded px-2 py-0.5 text-[10.5px] font-medium ${
              rec.enabled
                ? "bg-accent/15 text-accent hover:bg-accent/25"
                : "bg-surface-3 text-foreground-muted hover:text-foreground"
            }`}
          >
            {rec.enabled ? "Disable" : "Enable"}
          </button>
          <button
            onClick={() => void uninstall()}
            className="rounded px-2 py-0.5 text-[10.5px] text-foreground-muted hover:bg-danger/15 hover:text-danger"
          >
            Uninstall
          </button>
        </div>
      </div>
    </div>
  );
}

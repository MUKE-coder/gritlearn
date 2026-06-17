import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { useTheme } from "@/lib/theme-provider";
import { useEditorPrefs } from "@/lib/editor-prefs";
import { MONACO_THEME_OPTIONS } from "@/lib/monaco-themes";
import { usePluginHost } from "@/lib/plugin-host";
import { AlertTriangle, Loader2, Moon, Plug, Sun, Trash2 } from "lucide-react";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { prefs, setPrefs, resetPrefs } = useEditorPrefs();

  return (
    <div className="h-full overflow-y-auto px-6 py-6">
      <PageHeader title="Settings" description="Tune the editor + UI to your taste" />

      <div className="mt-6 max-w-2xl space-y-4">
        {/* ─── Appearance ──────────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-[15px] font-semibold text-foreground">App theme</h3>
                <p className="mt-1 text-[13px] text-foreground-secondary">
                  Light or dark UI chrome (separate from the code editor theme).
                </p>
              </div>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 text-[13px] font-medium text-foreground transition-colors hover:bg-surface-hover"
              >
                {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {theme === "dark" ? "Light" : "Dark"}
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Editor theme ─────────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-3 p-6">
            <div>
              <h3 className="text-[15px] font-semibold text-foreground">Editor theme</h3>
              <p className="mt-1 text-[13px] text-foreground-secondary">
                Syntax-highlight palette inside the code pane. Default is Monokai Pro.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MONACO_THEME_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPrefs({ monacoTheme: opt.id })}
                  className={`flex flex-col items-start gap-1 rounded-lg border px-3 py-2 text-left transition-colors ${
                    prefs.monacoTheme === opt.id
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface-2 hover:border-accent/50"
                  }`}
                >
                  <span className="text-[12.5px] font-medium text-foreground">{opt.label}</span>
                  <span className="text-[10px] uppercase tracking-wider text-foreground-muted">{opt.tone}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* ─── Editor behaviour ─────────────────────────────────── */}
        <Card>
          <CardContent className="space-y-4 p-6">
            <h3 className="text-[15px] font-semibold text-foreground">Editor behaviour</h3>

            <Row label="Font size" hint="Code pane font, in pixels">
              <NumberInput
                value={prefs.fontSize}
                onChange={(v) => setPrefs({ fontSize: clamp(v, 10, 28) })}
                min={10}
                max={28}
              />
            </Row>

            <Row label="Tab size" hint="Spaces per indentation level">
              <NumberInput
                value={prefs.tabSize}
                onChange={(v) => setPrefs({ tabSize: clamp(v, 1, 8) })}
                min={1}
                max={8}
              />
            </Row>

            <Row label="Word wrap" hint="Wrap long lines at the pane edge">
              <Toggle
                value={prefs.wordWrap === "on"}
                onChange={(v) => setPrefs({ wordWrap: v ? "on" : "off" })}
              />
            </Row>

            <Row label="Minimap" hint="Right-side code map (off saves room on small screens)">
              <Toggle value={prefs.minimap} onChange={(v) => setPrefs({ minimap: v })} />
            </Row>

            <Row label="Auto-save" hint="Save automatically after you stop typing">
              <Toggle
                value={prefs.autoSave === "afterDelay"}
                onChange={(v) => setPrefs({ autoSave: v ? "afterDelay" : "off" })}
              />
            </Row>

            {prefs.autoSave === "afterDelay" && (
              <Row label="Auto-save delay" hint="Milliseconds of idle before saving">
                <NumberInput
                  value={prefs.autoSaveDelayMs}
                  onChange={(v) => setPrefs({ autoSaveDelayMs: clamp(v, 200, 5000) })}
                  min={200}
                  max={5000}
                  step={100}
                />
              </Row>
            )}

            <div className="pt-2">
              <button
                onClick={resetPrefs}
                className="rounded-md border border-border bg-surface-2 px-3 py-1.5 text-[12.5px] font-medium text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
              >
                Reset editor settings
              </button>
            </div>
          </CardContent>
        </Card>

        {/* ─── Plugins ───────────────────────────────────────────── */}
        <PluginsCard />

        {/* ─── Keyboard shortcuts ───────────────────────────────── */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-[15px] font-semibold text-foreground">Keyboard shortcuts</h3>
            <p className="mt-1 text-[13px] text-foreground-secondary">
              Global shortcuts available everywhere in the app.
            </p>
            <div className="mt-4 space-y-2 text-[13px]">
              <ShortcutRow label="Command palette" keys="⌘K" />
              <ShortcutRow label="Save active file" keys="⌘S" />
              <ShortcutRow label="Open folder" keys="⌘O" />
              <ShortcutRow label="Settings" keys="⌘," />
              <ShortcutRow label="Logout" keys="⌘L" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="text-[13px] font-medium text-foreground">{label}</div>
        {hint && <div className="mt-0.5 text-[12px] text-foreground-secondary">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  min,
  max,
  step = 1,
}: {
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      min={min}
      max={max}
      step={step}
      onChange={(e) => {
        const n = Number(e.target.value);
        if (Number.isFinite(n)) onChange(n);
      }}
      className="h-8 w-20 rounded border border-border bg-surface-2 px-2 text-right font-mono text-[13px] text-foreground"
    />
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!value)}
      aria-pressed={value}
      className={`relative h-5 w-9 rounded-full transition-colors ${
        value ? "bg-accent" : "bg-surface-3"
      }`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
          value ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function ShortcutRow({ label, keys }: { label: string; keys: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-foreground-secondary">{label}</span>
      <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[11px]">{keys}</kbd>
    </div>
  );
}

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function PluginsCard() {
  const { records, refresh } = usePluginHost();
  const [installUrl, setInstallUrl] = useState("");
  const [manifestUrl, setManifestUrl] = useState("");
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const install = async () => {
    if (!installUrl.trim()) return;
    setInstalling(true);
    setError(null);
    try {
      await App.InstallPlugin(installUrl.trim(), manifestUrl.trim() || "");
      setInstallUrl("");
      setManifestUrl("");
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setInstalling(false);
    }
  };

  const toggle = async (id: string, enabled: boolean) => {
    try {
      await App.SetPluginEnabled(id, enabled);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const uninstall = async (id: string, name: string) => {
    if (!confirm(`Uninstall "${name}"? Its files will be removed from disk.`)) return;
    try {
      await App.UninstallPlugin(id);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4 p-6">
        <div>
          <h3 className="flex items-center gap-2 text-[15px] font-semibold text-foreground">
            <Plug className="h-4 w-4 text-accent" />
            Plugins
          </h3>
          <p className="mt-1 text-[13px] text-foreground-secondary">
            Extend JEditor by installing community plugins. Each plugin gets the
            same access as the editor itself — only install from sources you trust.
          </p>
        </div>

        <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-[12px] text-warning">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              Plugins run with full access to your editor. There's no sandbox —
              treat them like any other code you'd run on your machine.
            </span>
          </div>
        </div>

        <div className="space-y-2 rounded-md border border-border bg-surface-2 p-3">
          <div className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
            Install from URL
          </div>
          <input
            value={installUrl}
            onChange={(e) => setInstallUrl(e.target.value)}
            placeholder="https://example.com/my-plugin.js"
            className="h-9 w-full rounded border border-border bg-surface-1 px-3 font-mono text-[12.5px] text-foreground placeholder:text-foreground-muted"
          />
          <input
            value={manifestUrl}
            onChange={(e) => setManifestUrl(e.target.value)}
            placeholder="https://example.com/manifest.json  (optional, falls back to inline)"
            className="h-9 w-full rounded border border-border bg-surface-1 px-3 font-mono text-[11.5px] text-foreground placeholder:text-foreground-muted"
          />
          <div className="flex items-center justify-end gap-2">
            {error && <span className="text-[12px] text-danger">{error}</span>}
            <button
              onClick={install}
              disabled={installing || !installUrl.trim()}
              className="flex h-8 items-center gap-1.5 rounded-md bg-accent px-3 text-[12px] font-semibold text-zinc-900 hover:bg-accent-hover disabled:opacity-50"
            >
              {installing && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {installing ? "Installing…" : "Install"}
            </button>
          </div>
        </div>

        <div className="space-y-1">
          {records.length === 0 ? (
            <p className="text-[12.5px] text-foreground-muted">
              No plugins installed yet.
            </p>
          ) : (
            records.map((rec) => (
              <div
                key={rec.manifest.id}
                className="flex items-center justify-between gap-3 rounded-md border border-border bg-surface-2 px-3 py-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-[13px] font-medium text-foreground">
                      {rec.manifest.name || rec.manifest.id}
                    </span>
                    <span className="rounded border border-border bg-surface-1 px-1.5 py-0.5 font-mono text-[10px] text-foreground-muted">
                      v{rec.manifest.version || "?"}
                    </span>
                  </div>
                  {rec.manifest.description && (
                    <div className="mt-0.5 truncate text-[11.5px] text-foreground-secondary">
                      {rec.manifest.description}
                    </div>
                  )}
                  <div className="mt-0.5 truncate font-mono text-[10px] text-foreground-muted">
                    {rec.manifest.id}
                  </div>
                </div>
                <Toggle
                  value={rec.enabled}
                  onChange={(v) => void toggle(rec.manifest.id, v)}
                />
                <button
                  onClick={() => void uninstall(rec.manifest.id, rec.manifest.name || rec.manifest.id)}
                  title="Uninstall"
                  className="rounded p-1.5 text-foreground-muted hover:bg-danger/15 hover:text-danger"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

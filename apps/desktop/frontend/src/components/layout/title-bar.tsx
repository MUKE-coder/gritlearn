import { CheckCircle2, Download, Loader2, Minus, Moon, RefreshCw, Square, Sun, Wifi, WifiOff, X, Zap } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  minimise,
  toggleMaximise,
  closeWindow,
  getPlatform,
} from "@/lib/wails-bridge";
import { setOnlineOverride, useOnlineStatus, type OnlineOverride } from "@/hooks/use-online-status";
import { useLatestVersion } from "@/hooks/use-latest-version";
import { useTheme } from "@/lib/theme-provider";
import { SyncButton } from "@/components/layout/sync-button";
import logoUrl from "@/assets/logo.png";

interface TitleBarProps {
  showSidebarControls?: boolean;
}

// Frameless title bar with drag region and OS-specific window controls.
// macOS: traffic lights on the left. Windows/Linux: min/max/close on the right.
export function TitleBar({ showSidebarControls: _ = true }: TitleBarProps) {
  const [platform, setPlatform] = useState<"darwin" | "windows" | "linux">("windows");

  useEffect(() => {
    getPlatform().then(setPlatform);
  }, []);

  const isMac = platform === "darwin";

  return (
    <div
      className="drag-region flex h-titlebar shrink-0 items-center justify-between border-b border-border-subtle bg-surface px-3 select-none"
    >
      {/* Left: macOS traffic lights OR spacer on Win/Linux */}
      <div className="flex items-center gap-2">
        {isMac ? (
          <div className="flex items-center gap-2">
            <MacTrafficLight color="close" onClick={closeWindow} />
            <MacTrafficLight color="minimise" onClick={minimise} />
            <MacTrafficLight color="maximise" onClick={toggleMaximise} />
          </div>
        ) : (
          <div className="flex items-center gap-2 pl-2">
            <img src={logoUrl} alt="" className="h-6 w-6 rounded-md" />
            <span className="text-[13px] font-medium text-foreground">JEditor</span>
          </div>
        )}
      </div>

      {/* Center: app name (macOS only, since controls are on left) */}
      {isMac && (
        <div className="text-[13px] font-medium text-foreground-secondary">JEditor</div>
      )}

      {/* Right: sync + connection + update + theme + (on Win/Linux) controls. */}
      <div className="no-drag flex items-center gap-1">
        <SyncButton />
        <UpdateButton />
        <ThemeToggle />
        <ConnectionIndicator />
        {!isMac && (
          <>
            <WinControl icon={<Minus className="h-3.5 w-3.5" />} onClick={minimise} />
            <WinControl icon={<Square className="h-3 w-3" />} onClick={toggleMaximise} />
            <WinControl icon={<X className="h-4 w-4" />} onClick={closeWindow} variant="close" />
          </>
        )}
      </div>
    </div>
  );
}

// UpdateButton — gives the student a manual handle on the auto-updater.
// The hook polls /api/desktop/latest in the background; this button
// forces a refresh-bypassing call and surfaces a small badge when a
// newer version is available so the existing UpdateBanner isn't the
// only signal.
function UpdateButton() {
  const { isUpdateAvailable, latestVersion, currentVersion, checkNow } = useLatestVersion();
  const [busy, setBusy] = useState(false);
  const [justChecked, setJustChecked] = useState<null | "current" | "available">(null);

  const onClick = async () => {
    if (busy) return;
    setBusy(true);
    setJustChecked(null);
    try {
      const payload = await checkNow();
      const newer = payload && payload.version !== currentVersion;
      setJustChecked(newer ? "available" : "current");
      setTimeout(() => setJustChecked(null), 2400);
    } catch {
      // No-op: a failed check just doesn't update the badge state.
    } finally {
      setBusy(false);
    }
  };

  const title =
    justChecked === "current"
      ? `You're on v${currentVersion} — latest available.`
      : isUpdateAvailable
      ? `Update available: v${latestVersion}`
      : "Check for updates";

  return (
    <button
      onClick={onClick}
      title={title}
      className="relative flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
    >
      {busy ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : justChecked === "current" ? (
        <CheckCircle2 className="h-3.5 w-3.5 text-success" />
      ) : (
        <Download className="h-3.5 w-3.5" />
      )}
      {isUpdateAvailable && !busy && (
        <span
          aria-hidden
          className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-accent ring-2 ring-surface"
        />
      )}
    </button>
  );
}

// ThemeToggle — small button to flip dark <-> light. Persists via the
// existing ThemeProvider's localStorage write.
function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const dark = theme === "dark";
  return (
    <button
      onClick={() => setTheme(dark ? "light" : "dark")}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="flex h-7 w-7 items-center justify-center rounded-md text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
    >
      {dark ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}

// ConnectionIndicator renders a colored dot + one-word state for the
// API heartbeat. Click opens a small menu with three modes:
//   Auto-detect    — heartbeats API every 15s
//   Force Online   — pretend the API is reachable (debug aid)
//   Force Offline  — disable network calls (work offline mode)
// Also has a "Re-check now" option.
function ConnectionIndicator() {
  const { isOnline, lastCheckedAt, override } = useOnlineStatus();
  const [open, setOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const label = isOnline ? "Online" : "Offline";
  const checked = lastCheckedAt ? lastCheckedAt.toLocaleTimeString() : "—";

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [open]);

  const recheck = () => {
    setRefreshing(true);
    window.dispatchEvent(new CustomEvent("JEditor:recheck-online"));
    setTimeout(() => setRefreshing(false), 800);
  };

  const pickMode = (m: OnlineOverride) => {
    setOnlineOverride(m);
    setOpen(false);
  };

  const modeBadge =
    override === "force-online" ? "FORCED" : override === "force-offline" ? "FORCED" : null;

  return (
    <div ref={wrapperRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        title={`${label} • last check ${checked} • click to change mode`}
        aria-label={label}
        className="flex h-titlebar items-center gap-1.5 rounded-md px-2 text-[11px] text-foreground-muted hover:bg-surface-hover"
      >
        {refreshing ? (
          <RefreshCw className="h-3 w-3 animate-spin text-accent" />
        ) : (
          <span
            className={`h-2 w-2 rounded-full transition-colors ${
              isOnline ? "bg-success" : "bg-warning animate-pulse"
            }`}
          />
        )}
        <span className={isOnline ? "text-foreground-secondary" : "text-warning"}>{label}</span>
        {modeBadge && (
          <span className="rounded border border-accent/40 bg-accent/10 px-1 font-mono text-[9px] uppercase tracking-wider text-accent">
            {modeBadge}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[240px] rounded-md border border-border bg-surface-1 py-1 shadow-2xl">
          <div className="px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider text-foreground-muted">
            Connection mode
          </div>
          <ModeRow
            label="Auto-detect"
            description="Heartbeat the API every 15s"
            icon={<Zap className="h-3.5 w-3.5" />}
            active={override === "auto"}
            onClick={() => pickMode("auto")}
          />
          <ModeRow
            label="Force Online"
            description="Pretend the API is reachable"
            icon={<Wifi className="h-3.5 w-3.5 text-success" />}
            active={override === "force-online"}
            onClick={() => pickMode("force-online")}
          />
          <ModeRow
            label="Work Offline"
            description="Stop hitting the network"
            icon={<WifiOff className="h-3.5 w-3.5 text-warning" />}
            active={override === "force-offline"}
            onClick={() => pickMode("force-offline")}
          />
          <div className="my-1 border-t border-border-subtle" />
          <button
            onClick={() => { setOpen(false); recheck(); }}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-foreground hover:bg-surface-2"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Re-check now
          </button>
          <div className="px-3 py-1 text-[10px] text-foreground-muted">
            Last check: <span className="font-mono">{checked}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function ModeRow({
  label,
  description,
  icon,
  active,
  onClick,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2 px-3 py-1.5 text-left ${
        active ? "bg-accent/10" : "hover:bg-surface-2"
      }`}
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className={`block text-[12px] ${active ? "font-semibold text-accent" : "text-foreground"}`}>
          {label}
        </span>
        <span className="block text-[10.5px] text-foreground-muted">{description}</span>
      </span>
      {active && <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />}
    </button>
  );
}

function MacTrafficLight({
  color,
  onClick,
}: {
  color: "close" | "minimise" | "maximise";
  onClick: () => void;
}) {
  const bg = {
    close: "bg-[#ff5f57] hover:bg-[#ff5f57]/80",
    minimise: "bg-[#febc2e] hover:bg-[#febc2e]/80",
    maximise: "bg-[#28c840] hover:bg-[#28c840]/80",
  }[color];

  return (
    <button
      onClick={onClick}
      className={`no-drag h-3 w-3 rounded-full transition-colors ${bg}`}
      aria-label={color}
    />
  );
}

function WinControl({
  icon,
  onClick,
  variant = "default",
}: {
  icon: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "close";
}) {
  const hoverClass =
    variant === "close"
      ? "hover:bg-danger hover:text-white"
      : "hover:bg-surface-hover";

  return (
    <button
      onClick={onClick}
      className={`flex h-titlebar w-12 items-center justify-center text-foreground-secondary transition-colors ${hoverClass}`}
    >
      {icon}
    </button>
  );
}

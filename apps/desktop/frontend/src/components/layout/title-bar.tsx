import { CheckCircle2, Download, Loader2, Minus, Moon, RefreshCw, Square, Sun, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  minimise,
  toggleMaximise,
  closeWindow,
  getPlatform,
} from "@/lib/wails-bridge";
import { useOnlineStatus } from "@/hooks/use-online-status";
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
// API heartbeat. Clicking forces an immediate re-check by reloading
// the hook (via React Query's query-key invalidation isn't trivial
// here — the hook owns its own setInterval — so we use a CustomEvent
// the hook listens for). Auto-detected; there's no manual "force
// offline" state since faking the network would also break sync.
function ConnectionIndicator() {
  const { isOnline, lastCheckedAt } = useOnlineStatus();
  const [refreshing, setRefreshing] = useState(false);
  const label = isOnline ? "Online" : "Offline";
  const checked = lastCheckedAt ? lastCheckedAt.toLocaleTimeString() : "—";

  const onClick = () => {
    if (refreshing) return;
    setRefreshing(true);
    // Hook re-runs its initial ping on this event — wired up in
    // use-online-status.ts.
    window.dispatchEvent(new CustomEvent("JEditor:recheck-online"));
    setTimeout(() => setRefreshing(false), 800);
  };

  return (
    <button
      onClick={onClick}
      title={`${label} • last check ${checked} • click to re-check`}
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

import { Minus, Square, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  minimise,
  toggleMaximise,
  closeWindow,
  getPlatform,
} from "@/lib/wails-bridge";
import { useOnlineStatus } from "@/hooks/use-online-status";
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

      {/* Right: sync button + connection indicator + (on Win/Linux) controls. */}
      <div className="no-drag flex items-center">
        <SyncButton />
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

// ConnectionIndicator renders a small colored dot AND a one-word state
// reflecting whether the API is reachable. The SessionStatusBanner gives
// the full prose; this indicator is the always-visible at-a-glance signal.
//   Online  = green dot, "Online"
//   Offline = amber pulsing dot, "Offline"
function ConnectionIndicator() {
  const { isOnline, lastCheckedAt } = useOnlineStatus();
  const label = isOnline ? "Online" : "Offline";
  const checked = lastCheckedAt ? lastCheckedAt.toLocaleTimeString() : "—";
  return (
    <div
      className="flex h-titlebar items-center gap-1.5 px-3 text-[11px] text-foreground-muted"
      title={`${label} • last check ${checked}`}
      aria-label={label}
    >
      <span
        className={`h-2 w-2 rounded-full transition-colors ${
          isOnline ? "bg-success animate-none" : "bg-warning animate-pulse"
        }`}
      />
      <span className={isOnline ? "text-foreground-secondary" : "text-warning"}>{label}</span>
    </div>
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

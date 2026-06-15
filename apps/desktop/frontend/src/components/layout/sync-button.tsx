// Manual Sync trigger that lives in the titlebar. Shows a dirty-count
// badge when local progress hasn't been pushed yet so the student knows
// the button has work to do, and spins while a sync is in flight.

import { useMemo } from "react";
import { RefreshCw } from "lucide-react";
import { useSync } from "@/lib/sync-provider";
import { useProgress } from "@/lib/progress-store";

export function SyncButton() {
  const { syncing, syncNow, lastResult } = useSync();
  const { rows } = useProgress();

  const dirtyCount = useMemo(() => Object.values(rows).filter((r) => r.dirty).length, [rows]);

  const title = (() => {
    if (syncing) return "Syncing…";
    if (dirtyCount > 0) return `${dirtyCount} change${dirtyCount === 1 ? "" : "s"} to sync`;
    if (lastResult?.pushed) return `Synced (${lastResult.pushed} pushed)`;
    return "Sync now";
  })();

  return (
    <button
      onClick={() => void syncNow()}
      disabled={syncing}
      title={title}
      className="no-drag flex h-titlebar items-center gap-1.5 px-2.5 text-[11px] text-foreground-secondary hover:bg-surface-hover hover:text-foreground disabled:opacity-60"
    >
      <RefreshCw className={`h-3.5 w-3.5 ${syncing ? "animate-spin" : ""}`} />
      <span>Sync</span>
      {dirtyCount > 0 && !syncing && (
        <span className="rounded-full bg-accent px-1.5 text-[10px] font-semibold text-white leading-[16px]">
          {dirtyCount}
        </span>
      )}
    </button>
  );
}

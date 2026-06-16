// SyncProvider coordinates the two desktop-sync flows:
//   1. Push local dirty progress rows up to the server.
//   2. Check the server's latest content-manifest version against the
//      bundled one and surface "update available" state.
//
// Both run automatically when the app comes online AND a token is in the
// keychain, and again on demand when the student clicks the Sync button.
// Failures are silent in the offline direction — the spec says sync
// MUST be best-effort and never block offline use.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useProgress } from "@/lib/progress-store";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../wailsjs/go/main/App";

interface SyncProgressResult {
  pushed: number;
  skipped: number;
  failed: number;
  errors: string[];
  had_auth: boolean;
}

export interface ContentUpdateInfo {
  local_version: number;
  latest_version: number;
  update_available: boolean;
  bundle_url: string;
  notes: string;
}

interface SyncContextValue {
  syncing: boolean;
  lastResult: SyncProgressResult | null;
  contentUpdate: ContentUpdateInfo | null;
  syncNow: () => Promise<void>;
  dismissContentUpdate: () => void;
}

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: { children: ReactNode }) {
  const { isOnline } = useOnlineStatus();
  const { rows: progressRows } = useProgress();

  const [syncing, setSyncing] = useState(false);
  const [lastResult, setLastResult] = useState<SyncProgressResult | null>(null);
  const [contentUpdate, setContentUpdate] = useState<ContentUpdateInfo | null>(null);
  // Tracks whether we've already auto-synced for *this* online session
  // so flipping briefly offline and back doesn't hammer the server.
  const autoSyncedThisSession = useRef(false);

  const syncNow = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      // Two parallel best-effort calls; either can fail without blocking
      // the other from succeeding.
      const [pushResult, updateInfo] = await Promise.all([
        App.SyncProgress() as Promise<SyncProgressResult>,
        App.CheckContentUpdate() as Promise<ContentUpdateInfo>,
      ]);
      setLastResult(pushResult);
      setContentUpdate(updateInfo);
    } catch (err) {
      console.error("[sync] failed", err);
    } finally {
      setSyncing(false);
    }
  }, [syncing]);

  // Auto-sync once per online session. We don't react to progressRows
  // changes (that would resync on every status change); the manual
  // Sync button + the next-launch sync covers writes made between
  // sessions.
  useEffect(() => {
    if (!isOnline) {
      autoSyncedThisSession.current = false;
      return;
    }
    if (autoSyncedThisSession.current) return;
    autoSyncedThisSession.current = true;
    void syncNow();
    // We intentionally don't depend on progressRows or syncNow's
    // identity — this fires once when isOnline flips to true.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const dismissContentUpdate = useCallback(() => {
    // Hide the banner for this session — refetched on next launch.
    setContentUpdate((curr) => (curr ? { ...curr, update_available: false } : null));
  }, []);

  // Re-export progressRows count so consumers can compute "dirty"
  // headlines without subscribing to the entire progress store. We
  // intentionally don't include this in the public API to keep the
  // sync context lean; the Sync button reads useProgress directly.
  void progressRows;

  const value = useMemo<SyncContextValue>(
    () => ({ syncing, lastResult, contentUpdate, syncNow, dismissContentUpdate }),
    [syncing, lastResult, contentUpdate, syncNow, dismissContentUpdate],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

// Tolerant no-op stub returned by useSync() when no provider is mounted.
// This is the canonical "no sync available" shape — same fields, all
// inert. Lets components like the TitleBar's SyncButton render inside
// the /auth layout (which deliberately mounts BEFORE the user signs in,
// so SyncProvider isn't on the tree yet) without exploding the whole
// React tree. The v0.3.0 / v0.3.1 / v0.3.3 black-screen-on-install bug
// was exactly this — first launch with no token sent the user to
// /auth/login, TitleBar rendered, SyncButton called useSync, the throw
// nuked the page → user saw nothing but the BackgroundColour.
const noopSyncContext: SyncContextValue = {
  syncing:            false,
  lastResult:         null,
  contentUpdate:      null,
  syncNow:            async () => {},
  dismissContentUpdate: () => {},
};

export function useSync(): SyncContextValue {
  const ctx = useContext(SyncContext);
  // No provider on this part of the tree (e.g. inside the /auth layout
  // before the user signs in). Return a stub instead of throwing —
  // consumers like SyncButton render as disabled / hidden and the page
  // still mounts.
  return ctx ?? noopSyncContext;
}

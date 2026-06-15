import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { APP_VERSION, isNewerVersion } from "@/lib/version";
import { isDesktop } from "@/lib/wails-bridge";

export interface LatestVersionPayload {
  version: string;
  // Auto-updater proxy URL — raw portable .exe used for the in-app
  // binary swap (no installer, no admin prompt).
  download_url: string;
  // Optional NSIS installer proxy URL — used by browser-fallback flows
  // that prefer the wizard + Start Menu entry over a portable .exe in
  // Downloads. Empty on older API instances.
  installer_url?: string;
  released_at: string;
  release_notes: string;
  min_supported_version: string;
}

const AUTO_UPDATE_PREF_KEY = "JEditor.auto_update_enabled";
const DISMISSED_VERSION_KEY = "JEditor.dismissed_update_version";

export function getAutoUpdateEnabled(): boolean {
  // Default ON. Absence of the key means "user hasn't disabled" so
  // freshly-installed clients pick up updates without anyone having
  // to flip a switch.
  const v = localStorage.getItem(AUTO_UPDATE_PREF_KEY);
  return v === null || v === "true";
}

export function setAutoUpdateEnabled(enabled: boolean) {
  localStorage.setItem(AUTO_UPDATE_PREF_KEY, enabled ? "true" : "false");
  // Notify same-tab listeners — `storage` only fires cross-tab.
  window.dispatchEvent(new CustomEvent("JEditor:auto-update-changed"));
}

export function useAutoUpdateEnabled(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(getAutoUpdateEnabled);
  useEffect(() => {
    const sync = () => setEnabled(getAutoUpdateEnabled());
    window.addEventListener("JEditor:auto-update-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("JEditor:auto-update-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return [enabled, (v) => { setAutoUpdateEnabled(v); setEnabled(v); }];
}

export function getDismissedVersion(): string | null {
  return localStorage.getItem(DISMISSED_VERSION_KEY);
}

export function dismissVersion(version: string) {
  localStorage.setItem(DISMISSED_VERSION_KEY, version);
  window.dispatchEvent(new CustomEvent("JEditor:dismissed-version-changed"));
}

// 6 hour poll interval. Long-running sessions across a release will
// notice the new version without the student reopening the app.
const POLL_INTERVAL_MS = 6 * 60 * 60 * 1000;

/**
 * useLatestVersion — polls /api/desktop/latest on boot + every 6h.
 * Returns the raw payload plus a derived `isUpdateAvailable` flag.
 * Safe to call before login; the endpoint is public so a stale auth
 * token won't block the check.
 *
 * checkNow() forces a cache-bypassing call (?refresh=1) for when the
 * student clicks "Check for updates" — the API's 10-minute cache was
 * hiding fresh-published versions otherwise.
 */
export function useLatestVersion() {
  const qc = useQueryClient();
  const q = useQuery<LatestVersionPayload, Error>({
    queryKey: ["desktop-latest-version"],
    queryFn: async () => {
      const { data } = await apiClient.get("/desktop/latest");
      return data.data as LatestVersionPayload;
    },
    refetchInterval: POLL_INTERVAL_MS,
    staleTime: POLL_INTERVAL_MS / 2,
    // An old API without this endpoint should fail one time and back
    // off — don't retry forever.
    retry: 1,
    // Browser/web build redeploys the SPA on every push, so there is
    // no in-app update surface. Skip the network chatter there.
    enabled: isDesktop,
  });

  async function checkNow() {
    const { data } = await apiClient.get("/desktop/latest?refresh=1");
    const payload = data.data as LatestVersionPayload;
    qc.setQueryData(["desktop-latest-version"], payload);
    return payload;
  }

  const latestVersion = q.data?.version ?? null;
  const isUpdateAvailable =
    isDesktop && !!latestVersion && isNewerVersion(APP_VERSION, latestVersion);

  return {
    ...q,
    checkNow,
    isUpdateAvailable,
    currentVersion: APP_VERSION,
    latestVersion,
  };
}

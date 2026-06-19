import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";

// useOnlineStatus tracks whether the desktop client can reach the API.
//
// "Online" here means two things together:
//   1) the OS reports a network connection (navigator.onLine), AND
//   2) the API has answered a heartbeat in the last HEARTBEAT_INTERVAL_MS
//
// We need both because navigator.onLine only reflects the OS-level network
// link — it returns true even when the API is down or the user is on a
// captive-portal Wi-Fi that hasn't been authenticated. The API heartbeat
// is the truth signal; navigator.onLine is just a cheap pre-check that
// stops us from making a doomed request when the laptop lid was just
// closed.
//
// The heartbeat hits GET /api/health which Grit's API exposes for free —
// no auth required, no DB hit, fast 200 OK.

const HEARTBEAT_INTERVAL_MS = 15_000;
const HEARTBEAT_TIMEOUT_MS = 5_000;
const OVERRIDE_KEY = "JEditor.online-override";

export type OnlineOverride = "auto" | "force-online" | "force-offline";

function readOverride(): OnlineOverride {
  if (typeof window === "undefined") return "auto";
  const v = localStorage.getItem(OVERRIDE_KEY);
  return v === "force-online" || v === "force-offline" ? v : "auto";
}

/** writeOverride is exported so the TitleBar can flip the mode
 *  without re-importing useState. Triggers a recheck via custom event
 *  so every useOnlineStatus instance picks up the new mode. */
export function setOnlineOverride(o: OnlineOverride) {
  if (typeof window === "undefined") return;
  localStorage.setItem(OVERRIDE_KEY, o);
  window.dispatchEvent(new CustomEvent("JEditor:online-override-changed"));
}

export function getOnlineOverride(): OnlineOverride {
  return readOverride();
}

export function useOnlineStatus() {
  const [override, setOverride] = useState<OnlineOverride>(readOverride);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    const ov = readOverride();
    if (ov === "force-online") return true;
    if (ov === "force-offline") return false;
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [lastCheckedAt, setLastCheckedAt] = useState<Date | null>(null);

  useEffect(() => {
    const sync = () => setOverride(readOverride());
    window.addEventListener("JEditor:online-override-changed", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("JEditor:online-override-changed", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const ping = async () => {
      // Manual override wins — no heartbeat, no auto-detect.
      const ov = readOverride();
      if (ov === "force-online") {
        if (!cancelled) {
          setIsOnline(true);
          setLastCheckedAt(new Date());
        }
        return;
      }
      if (ov === "force-offline") {
        if (!cancelled) {
          setIsOnline(false);
          setLastCheckedAt(new Date());
        }
        return;
      }
      // OS says no network → don't even try.
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!cancelled) {
          setIsOnline(false);
          setLastCheckedAt(new Date());
        }
        return;
      }
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), HEARTBEAT_TIMEOUT_MS);
        await apiClient.get("/health", { signal: controller.signal, timeout: HEARTBEAT_TIMEOUT_MS });
        clearTimeout(timeoutId);
        if (!cancelled) {
          setIsOnline(true);
          setLastCheckedAt(new Date());
        }
      } catch {
        if (!cancelled) {
          setIsOnline(false);
          setLastCheckedAt(new Date());
        }
      }
    };

    ping();
    timer = setInterval(ping, HEARTBEAT_INTERVAL_MS);

    const handleOnline = () => ping();
    const handleOffline = () => {
      if (!cancelled) {
        setIsOnline(false);
        setLastCheckedAt(new Date());
      }
    };

    // Manual re-check trigger — TitleBar's ConnectionIndicator
    // dispatches this so the student can force a fresh heartbeat
    // without waiting for the next 15s interval tick.
    const handleRecheck = () => void ping();
    // Re-ping immediately when the override mode flips so the user
    // sees state change instantly instead of waiting up to 15s.
    const handleOverride = () => void ping();
    window.addEventListener("JEditor:online-override-changed", handleOverride);

    if (typeof window !== "undefined") {
      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      window.addEventListener("JEditor:recheck-online", handleRecheck);
    }

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
        window.removeEventListener("JEditor:recheck-online", handleRecheck);
        window.removeEventListener("JEditor:online-override-changed", handleOverride);
      }
    };
  }, []);

  return { isOnline, lastCheckedAt, override };
}

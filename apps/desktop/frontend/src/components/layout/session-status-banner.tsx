// SessionStatusBanner renders a slim strip directly under the title bar
// when the student's session needs their attention. The states in
// priority order:
//
//   1. Session expired: refresh token died. Student needs to act.
//   2. Content update available: server has a newer curriculum bundle
//      than the binary ships with. Informational with an "update" CTA.
//   3. Offline: API unreachable. Progress persists locally, will sync.
//
// Two separate banners would clutter the chrome — we collapse to one
// strip and rank states so the highest-priority one wins.

import { useEffect, useState } from "react";
import { CloudOff, KeyRound, Download } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { useSync } from "@/lib/sync-provider";

export function SessionStatusBanner() {
  const { isOnline } = useOnlineStatus();
  const { contentUpdate, dismissContentUpdate } = useSync();
  const [authInvalidated, setAuthInvalidated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const onInvalidated = () => setAuthInvalidated(true);
    window.addEventListener("auth:invalidated", onInvalidated);
    return () => window.removeEventListener("auth:invalidated", onInvalidated);
  }, []);

  // Priority 1 — session expired.
  if (authInvalidated && isOnline) {
    return (
      <div className="flex items-center gap-3 border-b border-warning/30 bg-warning/10 px-4 py-2 text-[12px] text-warning">
        <KeyRound className="h-3.5 w-3.5 shrink-0" />
        <div className="flex-1">
          <span className="font-medium">Your session expired.</span>{" "}
          Sign in again to sync progress to your account. Local progress is safe.
        </div>
        <button
          onClick={() => {
            setAuthInvalidated(false);
            void navigate({ to: "/auth/login" });
          }}
          className="shrink-0 rounded-md bg-warning px-2.5 py-1 text-[11px] font-semibold text-background hover:bg-warning/90"
        >
          Sign in
        </button>
      </div>
    );
  }

  // Priority 2 — content update available.
  if (contentUpdate?.update_available && isOnline) {
    return (
      <div className="flex items-center gap-3 border-b border-accent/30 bg-accent/10 px-4 py-2 text-[12px] text-accent">
        <Download className="h-3.5 w-3.5 shrink-0" />
        <div className="flex-1 text-foreground-secondary">
          <span className="font-medium text-foreground">
            Curriculum update v{contentUpdate.latest_version}
          </span>
          {contentUpdate.notes ? <span> — {contentUpdate.notes}</span> : null}
          <span className="text-foreground-muted">
            {" "}
            (you have v{contentUpdate.local_version})
          </span>
        </div>
        <button
          onClick={dismissContentUpdate}
          className="shrink-0 rounded-md px-2.5 py-1 text-[11px] font-medium text-foreground-secondary hover:bg-surface-3"
        >
          Later
        </button>
        <button
          onClick={() => {
            // Apply lands in B12 — the spec only requires showing the
            // notice for the B8 verify, and downloading + swapping a
            // bundle deserves its own resumable-download iteration.
            window.alert(
              "Update download lands in B12. Bundle URL: " + contentUpdate.bundle_url,
            );
          }}
          className="shrink-0 rounded-md bg-accent px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-accent-hover"
        >
          Update
        </button>
      </div>
    );
  }

  // Priority 3 — offline.
  if (!isOnline) {
    return (
      <div className="flex items-center gap-3 border-b border-border-subtle bg-surface-2 px-4 py-1.5 text-[11px] text-foreground-secondary">
        <CloudOff className="h-3.5 w-3.5 shrink-0 text-warning" />
        <span>
          You&apos;re offline.{" "}
          <span className="text-foreground-muted">
            Curriculum and progress work locally — changes will sync when you reconnect.
          </span>
        </span>
      </div>
    );
  }

  return null;
}

import { useEffect, useRef, useState } from "react";
import { ArrowDownToLine, CheckCircle2, Loader2, RotateCw, X } from "lucide-react";
import {
  cancelUpdateDownload,
  getUpdateProgress,
  installAndRestart,
  isDesktop,
  startUpdateDownload,
  type UpdaterState,
} from "@/lib/wails-bridge";

// Polling cadence — twice a second feels smooth without burning CPU.
// Wails RPC is in-process so the round-trip is microseconds.
const POLL_INTERVAL_MS = 500;

/**
 * UpdateProgressModal — VLC / Photoshop-style update flow.
 *
 *  1. Opens. Kicks off the download once (StartDownload(url, version)).
 *  2. Polls GetProgress every 500ms — progress bar with MB done / total
 *     and percentage.
 *  3. When status flips to "downloaded", shows "Install & restart".
 *  4. Click → InstallAndRestart() — Go side swaps the binary and
 *     relaunches; the current window closes ~250ms later.
 *
 * If the Wails Updater binding isn't present (running in a plain
 * browser for development), open the installer URL in the system
 * browser so the student can install manually — we surface the
 * fallback explicitly instead of leaving them wondering.
 */
export function UpdateProgressModal({
  downloadURL,
  installerURL,
  version,
  releaseNotes,
  onClose,
}: {
  downloadURL: string;
  installerURL?: string;
  version: string;
  releaseNotes?: string;
  onClose: () => void;
}) {
  const [state, setState] = useState<UpdaterState>({
    status: "idle",
    version,
    bytesDownloaded: 0,
    bytesTotal: 0,
  });
  const startedRef = useRef(false);
  const fallbackMode = !isDesktop;

  // Kick off the download exactly once. Calling StartDownload twice
  // would 409 on the Go side (sane error, ugly UX).
  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (fallbackMode) {
      const browserURL = installerURL || downloadURL;
      window.open(browserURL, "_blank", "noopener,noreferrer");
      setState((s) => ({
        ...s,
        status: "error",
        error:
          "In-app updater is only available in the JEditor desktop build. The installer has opened in your browser — run it to update.",
      }));
      return;
    }

    startUpdateDownload(downloadURL, version).catch((e: Error) =>
      setState((s) => ({ ...s, status: "error", error: e?.message ?? "Failed to start download" })),
    );
  }, [downloadURL, installerURL, version, fallbackMode]);

  // Poll for progress. Stop once we hit a terminal status.
  useEffect(() => {
    if (fallbackMode) return;
    if (state.status === "downloaded" || state.status === "error" || state.status === "installing") {
      return;
    }
    const id = window.setInterval(async () => {
      try {
        const s = await getUpdateProgress();
        setState(s);
      } catch {
        // Polling glitches are non-fatal — keep retrying.
      }
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [state.status, fallbackMode]);

  function cancel() {
    if (state.status === "downloading" && !fallbackMode) {
      void cancelUpdateDownload();
    }
    onClose();
  }

  function doInstall() {
    if (fallbackMode) return;
    setState((s) => ({ ...s, status: "installing" }));
    installAndRestart().catch((e: Error) =>
      setState((s) => ({ ...s, status: "error", error: e?.message ?? "Install failed" })),
    );
  }

  const pct =
    state.bytesTotal > 0
      ? Math.min(100, Math.round((state.bytesDownloaded / state.bytesTotal) * 100))
      : 0;
  const mbDone = (state.bytesDownloaded / 1024 / 1024).toFixed(1);
  const mbTotal = state.bytesTotal > 0 ? (state.bytesTotal / 1024 / 1024).toFixed(1) : "?";

  const title =
    state.status === "downloading"
      ? `Downloading v${version}`
      : state.status === "downloaded"
        ? `Ready to install v${version}`
        : state.status === "installing"
          ? "Installing…"
          : state.status === "error"
            ? "Update failed"
            : `Preparing v${version}…`;

  const icon =
    state.status === "downloaded" ? (
      <CheckCircle2 className="h-5 w-5 text-accent" />
    ) : state.status === "error" ? (
      <X className="h-5 w-5 text-danger" />
    ) : state.status === "installing" || state.status === "downloading" ? (
      <Loader2 className="h-5 w-5 animate-spin text-accent" />
    ) : (
      <ArrowDownToLine className="h-5 w-5 text-accent" />
    );

  return (
    <div className="no-drag fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div
        className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-xl border border-border bg-surface p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {icon}
            <h2 className="text-[16px] font-bold text-foreground">{title}</h2>
          </div>
          {state.status !== "installing" && (
            <button
              type="button"
              onClick={cancel}
              className="rounded p-1 text-foreground-muted hover:bg-surface-hover hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {(state.status === "downloading" || state.status === "downloaded") && (
          <div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full bg-accent transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="mt-2 flex justify-between text-[12px] text-foreground-secondary tabular-nums">
              <span>
                {mbDone} / {mbTotal} MB
              </span>
              <span>{pct}%</span>
            </div>
          </div>
        )}

        {state.status === "installing" && (
          <div className="rounded-lg border border-border-subtle bg-surface-2 px-3 py-3 text-[12.5px] text-foreground-secondary">
            Closing JEditor and relaunching the new version. This window will
            disappear in a moment.
          </div>
        )}

        {state.status === "error" && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-[12.5px] text-danger">
            {state.error || "Unknown error"}
          </div>
        )}

        {releaseNotes && state.status !== "error" && state.status !== "installing" && (
          <ReleaseNotesBlock raw={releaseNotes} />
        )}

        <div className="mt-5 flex justify-end gap-2">
          {state.status === "downloading" && (
            <button
              type="button"
              onClick={cancel}
              className="rounded-lg border border-border px-3 py-1.5 text-[13px] text-foreground hover:bg-surface-hover"
            >
              Cancel
            </button>
          )}
          {state.status === "downloaded" && (
            <button
              type="button"
              onClick={doInstall}
              className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-1.5 text-[13px] font-semibold text-background hover:bg-accent-hover"
            >
              <RotateCw className="h-3.5 w-3.5" /> Install & restart
            </button>
          )}
          {state.status === "error" && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border px-3 py-1.5 text-[13px] text-foreground hover:bg-surface-hover"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ReleaseNotesBlock renders the parsed bullets inside a scroll-bounded
// box. Default view shows the first 3; "Show all" expands into a
// capped scroll container so the Install button is always visible no
// matter how long the release notes get.
function ReleaseNotesBlock({ raw }: { raw: string }) {
  const items = splitReleaseNotes(raw);
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED_COUNT = 3;
  const showToggle = items.length > COLLAPSED_COUNT;
  const visible = expanded || !showToggle ? items : items.slice(0, COLLAPSED_COUNT);
  return (
    <div className="mt-3 rounded-lg border border-border-subtle bg-surface-2 px-3 py-2 text-[11.5px] text-foreground-secondary">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="font-semibold text-foreground">What's new</span>
        {showToggle && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="rounded-md border border-border-subtle bg-surface px-2 py-0.5 text-[10.5px] font-medium text-foreground-muted hover:text-foreground"
          >
            {expanded ? `Show fewer` : `Show all (${items.length})`}
          </button>
        )}
      </div>
      <ul
        className="list-disc space-y-1 pl-4"
        style={expanded ? { maxHeight: 180, overflowY: "auto" } : undefined}
      >
        {visible.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

function splitReleaseNotes(text: string): string[] {
  const cleaned = text.replace(/\r\n/g, "\n").trim();
  if (!cleaned) return [];

  if (/[\n•]|(?:^|\s)[-*]\s/.test(cleaned)) {
    return cleaned
      .split(/(?:\n+)|(?:^|\s)[•\-*]\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  const parts = cleaned.split(/(?<=[.!?])\s+(?=[A-Z(])/);
  const trimmed = parts.map((s) => s.trim()).filter(Boolean);
  return trimmed.length > 0 ? trimmed : [cleaned];
}

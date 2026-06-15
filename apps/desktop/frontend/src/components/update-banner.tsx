import { useEffect, useState } from "react";
import { ArrowDownToLine, Sparkles, X } from "lucide-react";
import {
  dismissVersion,
  getDismissedVersion,
  useAutoUpdateEnabled,
  useLatestVersion,
} from "@/hooks/use-latest-version";
import { UpdateProgressModal } from "@/components/update-progress-modal";

/**
 * UpdateBanner — slim, dismissible bar that sits above the app shell
 * when a newer JEditor release is available. Hidden when:
 *   - The /api/desktop/latest endpoint is unreachable
 *   - The remote version isn't newer than the running binary
 *   - The student dismissed this exact version
 *   - The student turned auto-update off in Settings
 */
export function UpdateBanner() {
  const { data, isUpdateAvailable, latestVersion } = useLatestVersion();
  const [autoUpdateEnabled] = useAutoUpdateEnabled();
  const [dismissedVersion, setDismissedVersion] = useState<string | null>(
    getDismissedVersion(),
  );
  const [installerOpen, setInstallerOpen] = useState(false);

  useEffect(() => {
    const sync = () => setDismissedVersion(getDismissedVersion());
    window.addEventListener("JEditor:dismissed-version-changed", sync);
    return () => window.removeEventListener("JEditor:dismissed-version-changed", sync);
  }, []);

  if (!autoUpdateEnabled) return null;
  if (!isUpdateAvailable || !latestVersion || !data) return null;
  if (dismissedVersion === latestVersion) return null;

  return (
    <>
      <div className="no-drag flex items-center gap-3 border-b border-accent/30 bg-accent/10 px-4 py-2 text-[12.5px] text-foreground">
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-accent" />
        <div className="flex-1 truncate">
          <span className="font-medium">JEditor v{latestVersion} is available</span>
          {data.release_notes && (
            <span className="ml-2 text-foreground-muted">— {data.release_notes}</span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setInstallerOpen(true)}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-accent px-3 py-1 text-[12px] font-semibold text-background hover:bg-accent-hover"
        >
          <ArrowDownToLine className="h-3 w-3" /> Update
        </button>
        <button
          type="button"
          onClick={() => dismissVersion(latestVersion)}
          title="Dismiss until next release"
          className="rounded p-1 text-foreground-muted hover:bg-surface-hover hover:text-foreground"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      {installerOpen && (
        <UpdateProgressModal
          downloadURL={data.download_url}
          installerURL={data.installer_url}
          version={latestVersion}
          releaseNotes={data.release_notes}
          onClose={() => setInstallerOpen(false)}
        />
      )}
    </>
  );
}

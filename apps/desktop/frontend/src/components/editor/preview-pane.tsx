import { useMemo, useEffect, useState } from "react";
import { Eye, RefreshCcw, ExternalLink } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";

// PreviewPane renders the active HTML buffer in an iframe via srcDoc so
// the student sees changes instantly without needing a dev server. For
// HTML files with relative <link>/<script> references the iframe will hit
// 404s in dev (we'd need file:// path rewriting) — that's an explicit B12
// follow-up. For Phase 1 lessons that ship inline CSS/JS this is enough.

export function PreviewPane() {
  const { activeTab, previewVisible, setPreviewVisible } = useWorkspace();
  const [reloadKey, setReloadKey] = useState(0);

  // Auto-hide the pane when the active tab can't be previewed, so the
  // student isn't staring at a blank panel while editing Go or markdown.
  useEffect(() => {
    if (!activeTab) return;
    if (activeTab.language !== "html" && previewVisible) {
      setPreviewVisible(false);
    }
  }, [activeTab, previewVisible, setPreviewVisible]);

  const srcDoc = useMemo(() => {
    if (!activeTab || activeTab.language !== "html") return "";
    return activeTab.content;
  }, [activeTab]);

  if (!previewVisible || !activeTab || activeTab.language !== "html") return null;

  return (
    <div className="flex h-full w-[480px] shrink-0 flex-col border-l border-border bg-surface-2">
      <div className="flex h-9 items-center justify-between border-b border-border-subtle px-3">
        <div className="flex items-center gap-2 text-foreground-secondary">
          <Eye className="h-3.5 w-3.5" />
          <span className="text-[12px] font-medium">Preview</span>
          <span className="truncate font-mono text-[11px] text-foreground-muted">{activeTab.name}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setReloadKey((k) => k + 1)}
            title="Reload preview"
            className="rounded p-1 text-foreground-muted hover:bg-surface-3 hover:text-foreground"
          >
            <RefreshCcw className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={() => setPreviewVisible(false)}
            title="Hide preview"
            className="rounded p-1 text-foreground-muted hover:bg-surface-3 hover:text-foreground"
          >
            <ExternalLink className="h-3.5 w-3.5 rotate-180" />
          </button>
        </div>
      </div>
      <iframe
        // sandbox without allow-same-origin keeps the preview's JS from
        // touching the host webview's storage / cookies / keychain bridge.
        key={reloadKey}
        sandbox="allow-scripts allow-forms"
        srcDoc={srcDoc}
        className="h-full w-full flex-1 border-0 bg-white"
        title="HTML preview"
      />
    </div>
  );
}

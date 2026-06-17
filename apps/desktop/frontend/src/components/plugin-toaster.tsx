// PluginToaster — renders the toasts plugins emit via
// JEditor.ui.notify(text, level). Floats at the bottom-right of the
// editor canvas. Auto-dismisses after the host's timer fires; user
// can click X to dismiss early.

import { X } from "lucide-react";
import { usePluginHost } from "@/lib/plugin-host";

export function PluginToaster() {
  const { toasts, dismissToast } = usePluginHost();
  if (toasts.length === 0) return null;
  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-50 flex w-[320px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2 rounded-md border px-3 py-2 text-[12.5px] shadow-lg ${
            t.level === "error"
              ? "border-danger/40 bg-danger/15 text-danger"
              : "border-border bg-surface-1 text-foreground"
          }`}
        >
          <span className="flex-1 whitespace-pre-wrap break-words">{t.text}</span>
          <button
            onClick={() => dismissToast(t.id)}
            className="shrink-0 rounded p-0.5 text-foreground-muted hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

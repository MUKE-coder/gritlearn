// StreakToaster — listens for chapter-completion events and shows a
// celebratory toast at the bottom-right. Self-dismisses after 5
// seconds; clicking dismisses early.

import { useEffect, useState } from "react";
import { Trophy, X } from "lucide-react";

interface ToastEntry {
  id: string;
  message: string;
}

export function StreakToaster() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const message = (e as CustomEvent).detail as string;
      if (!message) return;
      const id = "s_" + Math.random().toString(36).slice(2);
      setToasts((prev) => [...prev, { id, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 5000);
    };
    window.addEventListener("JEditor:streak-toast", onToast);
    return () => window.removeEventListener("JEditor:streak-toast", onToast);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed bottom-12 right-4 z-50 flex w-[300px] flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-2.5 overflow-hidden rounded-lg border border-accent/40 bg-surface-1 p-3 shadow-2xl"
          style={{
            background:
              "linear-gradient(135deg, var(--accent-soft) 0%, var(--bg-secondary) 80%)",
          }}
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20">
            <Trophy className="h-4 w-4 text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] font-medium uppercase tracking-wider text-accent">
              Achievement unlocked
            </div>
            <div className="mt-0.5 text-[12.5px] font-semibold text-foreground">
              {t.message}
            </div>
          </div>
          <button
            onClick={() => setToasts((prev) => prev.filter((p) => p.id !== t.id))}
            className="shrink-0 rounded p-0.5 text-foreground-muted hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

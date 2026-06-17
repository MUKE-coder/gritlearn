// Resizable horizontal split. Drag the divider to grow/shrink the
// left pane; the right pane takes the remainder. We track the split
// in percent (not pixels) so window resizes preserve the user's
// chosen ratio.
//
// Why not react-resizable-panels: this is a single-divider case and
// the component is ~80 lines — pulling 30KB of gzipped dependency
// for that is overkill, especially when we want the styling to match
// the rest of the editor chrome exactly.

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

interface SplitterProps {
  left: ReactNode;
  right: ReactNode;
  /** Starting % width of the left pane (0–100). Defaults to 50. */
  defaultLeftPct?: number;
  /** Floor + ceiling for the left pane width (% of container). Prevents
   *  the user from dragging a pane to invisible. */
  minLeftPct?: number;
  maxLeftPct?: number;
  /** Persist the split ratio to localStorage under this key, so the
   *  layout sticks across reloads. Omit for ephemeral splits. */
  storageKey?: string;
  /** "horizontal" = left/right; "vertical" = top/bottom. */
  orientation?: "horizontal" | "vertical";
  className?: string;
}

export function Splitter({
  left,
  right,
  defaultLeftPct = 50,
  minLeftPct = 18,
  maxLeftPct = 82,
  storageKey,
  orientation = "horizontal",
  className = "",
}: SplitterProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const [leftPct, setLeftPct] = useState<number>(() => {
    if (storageKey && typeof window !== "undefined") {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) {
        const n = Number(raw);
        if (Number.isFinite(n) && n >= minLeftPct && n <= maxLeftPct) return n;
      }
    }
    return Math.min(maxLeftPct, Math.max(minLeftPct, defaultLeftPct));
  });

  // dragging flips on mousedown over the divider, off on mouseup
  // anywhere in the window. We attach the move + up listeners to
  // window so the drag keeps working even if the cursor slips off the
  // 6px-wide divider strip.
  const draggingRef = useRef(false);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      draggingRef.current = true;
      document.body.style.cursor = orientation === "vertical" ? "row-resize" : "col-resize";
      document.body.style.userSelect = "none";
    },
    [orientation],
  );

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const pct =
        orientation === "vertical"
          ? ((e.clientY - rect.top) / rect.height) * 100
          : ((e.clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(maxLeftPct, Math.max(minLeftPct, pct));
      setLeftPct(clamped);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      if (storageKey) {
        try {
          window.localStorage.setItem(storageKey, String(leftPct));
        } catch {
          // Quota errors etc — silent; the split still works for the
          // current session.
        }
      }
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [leftPct, maxLeftPct, minLeftPct, storageKey]);

  const vertical = orientation === "vertical";
  return (
    <div
      ref={containerRef}
      className={`flex min-h-0 min-w-0 ${vertical ? "flex-col" : "flex-row"} ${className}`}
    >
      <div
        className="flex min-h-0 min-w-0 flex-col overflow-hidden"
        style={vertical ? { height: `${leftPct}%` } : { width: `${leftPct}%` }}
      >
        {left}
      </div>
      <div
        role="separator"
        aria-orientation={vertical ? "horizontal" : "vertical"}
        onMouseDown={onMouseDown}
        onDoubleClick={() => setLeftPct(defaultLeftPct)}
        className={`group relative shrink-0 bg-border/40 transition-colors hover:bg-accent/60 ${
          vertical ? "h-1.5 cursor-row-resize" : "w-1.5 cursor-col-resize"
        }`}
        title="Drag to resize · Double-click to reset"
      >
        <span
          className={`absolute ${
            vertical ? "inset-x-0 -top-1 -bottom-1" : "inset-y-0 -left-1 -right-1"
          }`}
        />
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {right}
      </div>
    </div>
  );
}

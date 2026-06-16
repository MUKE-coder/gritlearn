// LessonBody is the renderer for a single concept's MDX. Sized by its
// parent (used inside the resizable left pane of /app/learn/$phase),
// no fixed width — unlike the old LessonPane which was a fixed-400px
// aside on the right edge.
//
// Owns: lazy-loading the MDX source for `slug`, the loading/error
// shell, and the "Mark complete" button at the top.

import { useEffect, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import { MdxRenderer } from "@/components/mdx/mdx-renderer";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

interface LessonBodyProps {
  slug: string;
  title: string;
  phaseTitle: string;
  /** Compact = drop the phase kicker + "Mark complete" button. Used
   *  when the top bar above already shows phase/chapter/lesson. */
  compact?: boolean;
}

export function LessonBody({ slug, title, phaseTitle, compact = false }: LessonBodyProps) {
  const { rows, recordViewed, markCompleted, markUncompleted } = useProgress();
  const [mdxSource, setMdxSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMdxSource(null);
    void recordViewed(slug);
    (async () => {
      try {
        const src = await App.GetConceptMDX(slug);
        if (!cancelled) setMdxSource(src);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug, recordViewed]);

  const status = rows[slug]?.status;
  const isCompleted = status === "completed";

  return (
    <div className="flex h-full min-h-0 flex-col bg-surface-2">
      {!compact && (
        <div className="border-b border-border-subtle px-6 py-3">
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-muted">
            {phaseTitle}
          </div>
          <div className="mt-1 flex items-center gap-3">
            <div className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground" title={slug}>
              {title}
            </div>
            <button
              onClick={() => void (isCompleted ? markUncompleted(slug) : markCompleted(slug))}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                isCompleted
                  ? "bg-success/15 text-success hover:bg-success/25"
                  : "bg-surface-3 text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
              }`}
              title={isCompleted ? "Mark as not complete" : "Mark this concept complete"}
            >
              {isCompleted ? <RotateCcw className="h-3 w-3" /> : <Check className="h-3 w-3" />}
              {isCompleted ? "Completed" : "Mark complete"}
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        {loading && (
          <div className="flex items-center gap-2 text-[13px] text-foreground-muted">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
            Loading lesson…
          </div>
        )}
        {error && (
          <div className="rounded-md border border-danger/30 bg-danger/10 p-3 text-[12px] text-danger">
            {error}
          </div>
        )}
        {mdxSource && !loading && !error && (
          <div className="prose-mdx">
            <MdxRenderer source={mdxSource} conceptSlug={slug} />
          </div>
        )}
      </div>
    </div>
  );
}

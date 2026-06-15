import { useEffect, useState } from "react";
import { GraduationCap, Check, RotateCcw } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum-store";
import { useProgress } from "@/lib/progress-store";
import { MdxRenderer } from "@/components/mdx/mdx-renderer";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

// Right-hand lesson panel. Shows the currently-selected concept's MDX
// rendered with the five custom teaching components. The Phase title is
// pinned at the top so the student always knows where in the path they are.

export function LessonPane() {
  const { manifest, selectedSlug } = useCurriculum();
  const { rows, recordViewed, markCompleted, markUncompleted } = useProgress();
  const [mdxSource, setMdxSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedSlug) {
      setMdxSource(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    // Fire-and-forget progress write — "viewed" never downgrades a
    // higher status thanks to the rank check in progress.SetStatus.
    void recordViewed(selectedSlug);
    (async () => {
      try {
        const src = await App.GetConceptMDX(selectedSlug);
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
  }, [selectedSlug, recordViewed]);

  const currentStatus = selectedSlug ? rows[selectedSlug]?.status : undefined;
  const isCompleted = currentStatus === "completed";

  // Find the concept + its parent phase so we can show breadcrumbs at top.
  const lookup = (() => {
    if (!manifest || !selectedSlug) return null;
    for (const phase of manifest.phases) {
      const concept = phase.concepts.find((c) => c.slug === selectedSlug);
      if (concept) return { phase, concept };
    }
    return null;
  })();

  return (
    <aside className="hidden h-full w-[400px] shrink-0 flex-col border-l border-border bg-surface-2 lg:flex">
      {!lookup ? (
        <EmptyState />
      ) : (
        <>
          <div className="border-b border-border-subtle px-5 py-3">
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-muted">
              {lookup.phase.title}
            </div>
            <div className="mt-1 flex items-center gap-3">
              <div className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground" title={lookup.concept.slug}>
                {lookup.concept.title}
              </div>
              <button
                onClick={() => void (isCompleted ? markUncompleted(selectedSlug!) : markCompleted(selectedSlug!))}
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
          <div className="flex-1 overflow-y-auto px-5 py-5">
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
                <MdxRenderer source={mdxSource} conceptSlug={selectedSlug!} />
              </div>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
      <GraduationCap className="h-8 w-8 text-foreground-muted" />
      <p className="text-[13px] text-foreground-secondary">Pick a concept</p>
      <p className="max-w-[260px] text-[11px] leading-relaxed text-foreground-muted">
        Choose any available concept from the Curriculum sidebar to start.
      </p>
    </div>
  );
}

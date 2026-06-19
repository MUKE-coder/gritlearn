// LessonBody is the renderer for a single concept's MDX. Beyond the
// MDX itself, it owns three interactions that are unique to the
// reading experience:
//
//   1. Floating "+ Note" button — opens an inline composer.
//   2. Selection toolbar — when the student highlights text, a small
//      "Save as note" pill appears anchored to the selection.
//   3. Anchor-jump — listens for JEditor:lesson-jump-to-anchor and
//      scrolls a highlighted phrase into view (fired by NotesPanel).

import { useEffect, useRef, useState } from "react";
import { Check, Highlighter, NotebookPen, Plus, RotateCcw, X } from "lucide-react";
import { useProgress } from "@/lib/progress-store";
import { useNotes } from "@/lib/notes-store";
import { useStreak } from "@/lib/streak-store";
import { chaptersForPhase, useCurriculum } from "@/lib/curriculum-store";
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
  const { addNote, notesForSlug } = useNotes();
  const { recordActivity, recordChapterCompleted } = useStreak();
  const { manifest } = useCurriculum();
  const [mdxSource, setMdxSource] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // Composer state.
  const [composerOpen, setComposerOpen] = useState(false);
  const [composerBody, setComposerBody] = useState("");
  const [composerAnchor, setComposerAnchor] = useState<string | null>(null);

  // Selection pill state.
  const [selection, setSelection] = useState<
    null | { text: string; rect: DOMRect; rootRect: DOMRect }
  >(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setMdxSource(null);
    void recordViewed(slug);
    // Bump the daily streak — first lesson view today ticks the
    // counter forward.
    recordActivity();
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
  }, [slug, recordViewed, recordActivity]);

  // Whenever the progress map changes, check if any chapter is now
  // fully completed — if so, fire the badge. The streak store
  // dedupes so a single chapter only celebrates once.
  useEffect(() => {
    if (!manifest) return;
    for (const phase of manifest.phases) {
      const chs = chaptersForPhase(phase);
      for (const ch of chs) {
        if (ch.concepts.length === 0) continue;
        const allDone = ch.concepts.every((c) => rows[c.slug]?.status === "completed");
        if (allDone) recordChapterCompleted(`${phase.id}/${ch.id}`, `${ch.title}`);
      }
    }
  }, [rows, manifest, recordChapterCompleted]);

  // Selection tracking: when the user releases the mouse after a drag
  // selection inside the prose container, show a floating "Save as
  // note" pill anchored to the selection rect.
  useEffect(() => {
    const root = scrollRef.current;
    const content = contentRef.current;
    if (!root || !content) return;
    const onUp = () => {
      const sel = window.getSelection();
      if (!sel || sel.isCollapsed) {
        setSelection(null);
        return;
      }
      const text = sel.toString().trim();
      if (!text || text.length < 3) {
        setSelection(null);
        return;
      }
      const range = sel.getRangeAt(0);
      // Reject if the selection's start node isn't inside the prose
      // content (so selecting in the composer + header doesn't count).
      if (!content.contains(range.startContainer)) {
        setSelection(null);
        return;
      }
      const rect = range.getBoundingClientRect();
      const rootRect = root.getBoundingClientRect();
      setSelection({ text, rect, rootRect });
    };
    content.addEventListener("mouseup", onUp);
    content.addEventListener("touchend", onUp);
    return () => {
      content.removeEventListener("mouseup", onUp);
      content.removeEventListener("touchend", onUp);
    };
  }, [mdxSource]);

  // Anchor-jump — scroll to the phrase the note remembers.
  useEffect(() => {
    const onJump = (e: Event) => {
      const detail = (e as CustomEvent).detail as { conceptSlug: string; anchor: string };
      if (!detail || detail.conceptSlug !== slug) return;
      // Wait a beat to give the renderer time to mount after a slug
      // switch.
      setTimeout(() => {
        const target = findTextInElement(contentRef.current, detail.anchor);
        if (!target) return;
        target.scrollIntoView({ behavior: "smooth", block: "center" });
        // Flash highlight for ~1.5s so the eye finds it instantly.
        target.classList.add("note-anchor-flash");
        setTimeout(() => target.classList.remove("note-anchor-flash"), 1600);
      }, 60);
    };
    window.addEventListener("JEditor:lesson-jump-to-anchor", onJump);
    return () => window.removeEventListener("JEditor:lesson-jump-to-anchor", onJump);
  }, [slug]);

  const status = rows[slug]?.status;
  const isCompleted = status === "completed";
  const noteCount = notesForSlug(slug).length;

  const startComposer = (anchor?: string) => {
    setComposerAnchor(anchor ?? null);
    setComposerBody("");
    setComposerOpen(true);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
  };

  const commitNote = () => {
    if (!composerBody.trim()) {
      setComposerOpen(false);
      return;
    }
    addNote({
      conceptSlug: slug,
      body: composerBody.trim(),
      kind: composerAnchor ? "anchored" : "free",
      anchorText: composerAnchor ?? undefined,
    });
    setComposerOpen(false);
    setComposerBody("");
    setComposerAnchor(null);
  };

  return (
    <div className="relative flex h-full min-h-0 flex-col bg-surface-2">
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
      <div ref={scrollRef} className="relative flex-1 overflow-y-auto px-6 py-5">
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
          <div ref={contentRef} className="prose-mdx">
            <MdxRenderer source={mdxSource} conceptSlug={slug} />
          </div>
        )}

        {/* Selection pill — floats above the highlighted text */}
        {selection && (
          <div
            className="absolute z-30 -translate-x-1/2 rounded-md border border-accent bg-surface-1 px-2 py-1 text-[11px] shadow-2xl"
            style={{
              left: selection.rect.left - selection.rootRect.left + selection.rect.width / 2,
              top: selection.rect.top - selection.rootRect.top - 32 + (scrollRef.current?.scrollTop ?? 0),
            }}
          >
            <button
              onClick={() => startComposer(selection.text)}
              className="flex items-center gap-1.5 font-medium text-accent hover:text-accent-hover"
            >
              <Highlighter className="h-3 w-3" />
              Save as note
            </button>
          </div>
        )}
      </div>

      {/* Floating + button */}
      <button
        onClick={() => startComposer()}
        title="Take a note on this lesson"
        className="absolute bottom-4 right-4 z-20 flex h-11 w-11 items-center justify-center rounded-full bg-accent text-zinc-900 shadow-[0_4px_18px_var(--accent-glow)] transition-all hover:scale-105 hover:bg-accent-hover"
      >
        <Plus className="h-5 w-5" />
        {noteCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full border-2 border-surface-2 bg-surface-1 px-1 font-mono text-[10px] text-accent">
            {noteCount}
          </span>
        )}
      </button>

      {/* Composer */}
      {composerOpen && (
        <div className="absolute bottom-20 right-4 z-30 w-[300px] rounded-lg border border-border bg-surface-1 p-3 shadow-2xl">
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground-muted">
              <NotebookPen className="h-3.5 w-3.5 text-accent" />
              New note
            </span>
            <button
              onClick={() => setComposerOpen(false)}
              className="rounded p-0.5 text-foreground-muted hover:bg-surface-2 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          {composerAnchor && (
            <div className="mb-2 rounded border-l-2 border-accent bg-accent/5 px-2 py-1 text-[10.5px] italic text-foreground-secondary">
              <span className="line-clamp-2">{`"${composerAnchor}"`}</span>
            </div>
          )}
          <textarea
            autoFocus
            value={composerBody}
            onChange={(e) => setComposerBody(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault();
                commitNote();
              } else if (e.key === "Escape") {
                setComposerOpen(false);
              }
            }}
            placeholder="What did you learn?"
            rows={4}
            className="w-full resize-none rounded border border-border bg-surface-2 px-2 py-1.5 text-[12.5px] text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="font-mono text-[10px] text-foreground-muted">Ctrl+Enter to save</span>
            <button
              onClick={commitNote}
              disabled={!composerBody.trim()}
              className="rounded bg-accent px-3 py-1 text-[11.5px] font-semibold text-zinc-900 hover:bg-accent-hover disabled:opacity-50"
            >
              Save note
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Walk text nodes inside `root` and find the first run that contains
 *  the literal `needle`. Returns the parent element so the caller can
 *  scrollIntoView + flash-highlight it.
 *
 *  Simple approach — works for the common case where the highlighted
 *  phrase still appears verbatim in the rendered MDX. Mismatches (the
 *  lesson got edited between the note + the visit) just no-op. */
function findTextInElement(root: HTMLElement | null, needle: string): HTMLElement | null {
  if (!root || !needle) return null;
  const trimmed = needle.trim();
  if (trimmed.length === 0) return null;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node: Node | null = walker.nextNode();
  while (node) {
    if ((node.textContent ?? "").includes(trimmed)) {
      const parent = node.parentElement;
      return parent;
    }
    node = walker.nextNode();
  }
  return null;
}

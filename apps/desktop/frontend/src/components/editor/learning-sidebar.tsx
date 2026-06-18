// Learning sidebar — Activity Bar's "Learning" picks this. Replaces
// the old phase top bar entirely: chapter outline at the top + the
// MDX lesson body below. Drag the divider between them to weight the
// outline vs the reader.
//
// State source: useCurriculum (manifest + selectedSlug). When a
// student clicks a lesson the curriculum store updates selectedSlug
// and the reader re-renders with the new MDX.

import { useMatch, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, ChevronRight, Layers } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  chaptersForPhase,
  useCurriculum,
  type Chapter,
  type PhaseListing,
} from "@/lib/curriculum-store";
import { useProgress } from "@/lib/progress-store";
import { Splitter } from "@/components/ui/splitter";
import { LessonBody } from "@/components/editor/lesson-body";

export function LearningSidebar() {
  const { manifest, selectedSlug, selectConcept } = useCurriculum();
  const { rows } = useProgress();
  const navigate = useNavigate();

  // Match the /app/learn/$phase route to pin the sidebar to the
  // currently-viewed phase. If we're not on that route, fall back to
  // the phase that owns the selected concept.
  const phaseMatch = useMatch({ from: "/app/learn/$phase", shouldThrow: false });
  const routePhaseId = phaseMatch?.params.phase;

  const fallbackPhase = useMemo(() => {
    if (!manifest || !selectedSlug) return null;
    for (const p of manifest.phases) {
      if (p.concepts.some((c) => c.slug === selectedSlug)) return p;
    }
    return null;
  }, [manifest, selectedSlug]);

  const phase: PhaseListing | undefined =
    manifest?.phases.find((p) => p.id === routePhaseId) ?? fallbackPhase ?? undefined;

  if (!manifest) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-foreground-muted">
        Loading curriculum…
      </div>
    );
  }

  if (!phase) {
    return (
      <div className="flex h-full flex-col gap-3 p-4 text-[12.5px] text-foreground-secondary">
        <div className="text-foreground">No phase selected.</div>
        <button
          onClick={() => navigate({ to: "/app" })}
          className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-zinc-900 hover:bg-accent-hover"
        >
          Pick a phase
        </button>
      </div>
    );
  }

  const chapters = chaptersForPhase(phase);
  const currentChapter = chapters.find((ch) => ch.concepts.some((c) => c.slug === selectedSlug));
  const flat = phase.concepts;
  const flatIndex = selectedSlug ? flat.findIndex((c) => c.slug === selectedSlug) : -1;
  const prev = flatIndex > 0 ? flat[flatIndex - 1] : null;
  const next = flatIndex >= 0 && flatIndex < flat.length - 1 ? flat[flatIndex + 1] : null;
  const currentConcept = selectedSlug ? flat.find((c) => c.slug === selectedSlug) : null;

  const goToPhase = (id: string) => {
    navigate({ to: "/app/learn/$phase", params: { phase: id } });
  };

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <Header
        phase={phase}
        phases={manifest.phases}
        onSwitchPhase={goToPhase}
        onPrev={prev ? () => selectConcept(prev.slug) : undefined}
        onNext={next ? () => selectConcept(next.slug) : undefined}
        progress={
          flat.length === 0
            ? 0
            : Math.round(
                (flat.filter((c) => rows[c.slug]?.status === "completed").length /
                  flat.length) *
                  100,
              )
        }
      />

      <div className="min-h-0 flex-1">
        <Splitter
          orientation="vertical"
          storageKey="learn:sidebar-split"
          defaultLeftPct={42}
          minLeftPct={20}
          maxLeftPct={80}
          className="h-full"
          left={
            <ChapterOutline
              chapters={chapters}
              currentChapterId={currentChapter?.id}
              currentSlug={selectedSlug}
              onSelect={(slug) => selectConcept(slug)}
            />
          }
          right={
            currentConcept ? (
              <LessonBody
                slug={currentConcept.slug}
                title={currentConcept.title}
                phaseTitle={phase.title}
                compact
              />
            ) : (
              <div className="flex h-full items-center justify-center text-[12px] text-foreground-muted">
                Pick a lesson above.
              </div>
            )
          }
        />
      </div>
    </div>
  );
}

function Header({
  phase,
  phases,
  onSwitchPhase,
  onPrev,
  onNext,
  progress,
}: {
  phase: PhaseListing;
  phases: PhaseListing[];
  onSwitchPhase: (id: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
  progress: number;
}) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="border-b border-border-subtle bg-surface-2/40 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="relative min-w-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setOpen((v) => !v);
            }}
            className="flex min-w-0 items-center gap-1.5 rounded px-1.5 py-1 text-left hover:bg-surface-2"
          >
            <Layers className="h-3.5 w-3.5 shrink-0 text-accent" />
            <div className="min-w-0">
              <div className="truncate text-[12.5px] font-semibold text-foreground">{phase.title}</div>
              {phase.subtitle && (
                <div className="truncate text-[10px] text-foreground-muted">{phase.subtitle}</div>
              )}
            </div>
            <ChevronDown className="h-3 w-3 shrink-0 text-foreground-muted" />
          </button>
          {open && (
            <div
              className="absolute left-0 top-full z-30 mt-1 w-[260px] rounded-md border border-border bg-surface-1 py-1 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {phases.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    onSwitchPhase(p.id);
                    setOpen(false);
                  }}
                  className={`block w-full truncate px-3 py-1.5 text-left text-[12px] ${
                    p.id === phase.id ? "bg-accent/15 text-accent" : "text-foreground hover:bg-surface-2"
                  }`}
                >
                  {p.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            title="Previous lesson"
            className="rounded p-1 text-foreground-muted hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            title="Next lesson"
            className="flex h-7 items-center gap-1 rounded bg-accent px-2 text-[11.5px] font-semibold text-zinc-900 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-2">
        <div className="h-1 flex-1 overflow-hidden rounded-full bg-border">
          <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
        </div>
        <span className="font-mono text-[10px] text-foreground-muted">{progress}%</span>
      </div>
    </div>
  );
}

function ChapterOutline({
  chapters,
  currentChapterId,
  currentSlug,
  onSelect,
}: {
  chapters: Chapter[];
  currentChapterId: string | undefined;
  currentSlug: string | null;
  onSelect: (slug: string) => void;
}) {
  const { rows } = useProgress();
  // Auto-open the current chapter; others collapse.
  const [openIds, setOpenIds] = useState<Record<string, boolean>>(() => {
    return Object.fromEntries(chapters.map((ch) => [ch.id, ch.id === currentChapterId]));
  });

  // Keep the active chapter expanded when the selection moves into a
  // collapsed one.
  useEffect(() => {
    if (currentChapterId) {
      setOpenIds((prev) => ({ ...prev, [currentChapterId]: true }));
    }
  }, [currentChapterId]);

  return (
    <div className="h-full overflow-y-auto py-1">
      {chapters.map((ch, ci) => {
        const open = openIds[ch.id];
        const done = ch.concepts.filter((c) => rows[c.slug]?.status === "completed").length;
        return (
          <div key={ch.id} className="border-b border-border-subtle/50 last:border-b-0">
            <button
              onClick={() => setOpenIds((p) => ({ ...p, [ch.id]: !p[ch.id] }))}
              className="flex w-full items-center gap-1.5 px-2 py-1 text-left hover:bg-surface-2"
            >
              {open ? (
                <ChevronDown className="h-3 w-3 text-foreground-muted" />
              ) : (
                <ChevronRight className="h-3 w-3 text-foreground-muted" />
              )}
              <span className="font-mono text-[10px] text-foreground-muted">
                {String(ci + 1).padStart(2, "0")}
              </span>
              <span className={`flex-1 truncate text-[12px] ${ch.id === currentChapterId ? "text-foreground" : "text-foreground-secondary"}`}>
                {ch.title}
              </span>
              <span className="font-mono text-[10px] text-foreground-muted">
                {done}/{ch.concepts.length}
              </span>
            </button>
            {open &&
              ch.concepts.map((c, ci2) => {
                const isActive = c.slug === currentSlug;
                const isDone = rows[c.slug]?.status === "completed";
                return (
                  <button
                    key={c.slug}
                    onClick={() => onSelect(c.slug)}
                    disabled={!c.available}
                    title={c.title}
                    className={`flex w-full items-center gap-2 py-0.5 pl-8 pr-2 text-left text-[12px] ${
                      isActive
                        ? "bg-accent/15 text-foreground"
                        : "text-foreground-secondary hover:bg-surface-2"
                    } ${!c.available ? "opacity-50" : ""}`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="h-3 w-3 shrink-0 text-accent" />
                    ) : isActive ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
                    ) : (
                      <span className="h-2 w-2 shrink-0 rounded-full border border-border" />
                    )}
                    <span className="truncate">{c.title}</span>
                    <span className="font-mono text-[9px] text-foreground-muted">
                      L{ci2 + 1}
                    </span>
                  </button>
                );
              })}
          </div>
        );
      })}
    </div>
  );
}

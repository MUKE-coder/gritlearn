// Learning sidebar — Activity Bar's "Learning" picks this.
//
// Layout (revised after user feedback):
//
//   ┌─ LEARNING ──────────────────────────────────┐
//   │ Web Frontend ▾  ─ 12/47 ─ 25% ─────────────│  Row 1: phase + progress
//   │ Ch 02 HTML ▾  ›  L4 HTML tables ▾  ◀ Next ▶│  Row 2: chapter + lesson dropdowns
//   ├─────────────────────────────────────────────┤
//   │                                              │
//   │  Lesson content (full sidebar)               │  Reader uses the whole panel
//   │                                              │
//   └──────────────────────────────────────────────┘
//
// The full-tree outline that used to occupy the top half is gone — the
// chapter + lesson dropdowns cover every navigation case with less
// visual weight, and the lesson reader doubles in height.

import { useMatch, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  chaptersForPhase,
  useCurriculum,
  type Chapter,
  type ConceptListing,
  type PhaseListing,
} from "@/lib/curriculum-store";
import { useProgress } from "@/lib/progress-store";
import { LessonBody } from "@/components/editor/lesson-body";

export function LearningSidebar() {
  const { manifest, selectedSlug, selectConcept } = useCurriculum();
  const { rows } = useProgress();
  const navigate = useNavigate();

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

  const completed = flat.filter((c) => rows[c.slug]?.status === "completed").length;
  const progress = flat.length === 0 ? 0 : Math.round((completed / flat.length) * 100);

  const goToPhase = (id: string) => {
    navigate({ to: "/app/learn/$phase", params: { phase: id } });
  };

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <Header
        phase={phase}
        phases={manifest.phases}
        chapters={chapters}
        currentChapter={currentChapter}
        currentConcept={currentConcept ?? null}
        completed={completed}
        total={flat.length}
        progress={progress}
        onSwitchPhase={goToPhase}
        onPickConcept={(slug) => selectConcept(slug)}
        onPrev={prev ? () => selectConcept(prev.slug) : undefined}
        onNext={next ? () => selectConcept(next.slug) : undefined}
      />

      <div className="min-h-0 flex-1">
        {currentConcept ? (
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
        )}
      </div>
    </div>
  );
}

// ─── Header (phase / chapter / lesson dropdowns) ─────────────

interface HeaderProps {
  phase: PhaseListing;
  phases: PhaseListing[];
  chapters: Chapter[];
  currentChapter: Chapter | undefined;
  currentConcept: ConceptListing | null;
  completed: number;
  total: number;
  progress: number;
  onSwitchPhase: (id: string) => void;
  onPickConcept: (slug: string) => void;
  onPrev?: () => void;
  onNext?: () => void;
}

function Header({
  phase,
  phases,
  chapters,
  currentChapter,
  currentConcept,
  completed,
  total,
  progress,
  onSwitchPhase,
  onPickConcept,
  onPrev,
  onNext,
}: HeaderProps) {
  return (
    <div className="border-b border-border-subtle bg-surface-2/40 px-2 py-2">
      {/* Row 1 — phase + progress */}
      <div className="flex items-center gap-2">
        <PhaseDropdown
          phase={phase}
          phases={phases}
          onPick={onSwitchPhase}
        />
        <div className="ml-auto flex items-center gap-1.5">
          <span className="font-mono text-[10px] text-foreground-muted">
            {completed}/{total}
          </span>
          <div className="h-1 w-16 overflow-hidden rounded-full bg-border">
            <div className="h-full rounded-full bg-accent" style={{ width: `${progress}%` }} />
          </div>
          <span className="font-mono text-[10px] text-foreground-muted">{progress}%</span>
        </div>
      </div>

      {/* Row 2 — chapter > lesson + prev/next */}
      <div className="mt-1.5 flex items-center gap-1">
        <ChapterDropdown
          chapters={chapters}
          current={currentChapter}
          onPick={(ch) => onPickConcept(ch.concepts[0]?.slug ?? "")}
        />
        <span className="text-foreground-muted">›</span>
        {currentChapter && (
          <LessonDropdown
            chapter={currentChapter}
            currentSlug={currentConcept?.slug ?? null}
            onPick={onPickConcept}
          />
        )}
        <div className="ml-auto flex items-center gap-0.5">
          <button
            onClick={onPrev}
            disabled={!onPrev}
            title="Previous lesson"
            className="flex h-6 w-6 items-center justify-center rounded text-foreground-muted hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ArrowLeft className="h-3 w-3" />
          </button>
          <button
            onClick={onNext}
            disabled={!onNext}
            title="Next lesson"
            className="flex h-6 items-center gap-0.5 rounded bg-accent px-2 text-[10.5px] font-semibold text-zinc-900 hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
            <ArrowRight className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Dropdown primitives ─────────────────────────────────────

function PhaseDropdown({
  phase,
  phases,
  onPick,
}: {
  phase: PhaseListing;
  phases: PhaseListing[];
  onPick: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  useDropdownClose(open, () => setOpen(false));
  return (
    <DropdownShell
      open={open}
      setOpen={setOpen}
      label={phase.title}
      sublabel={phase.subtitle}
      strong
      menuWidth={280}
    >
      {phases.map((p) => (
        <DropdownItem
          key={p.id}
          active={p.id === phase.id}
          onClick={() => {
            onPick(p.id);
            setOpen(false);
          }}
          primary={p.title}
          secondary={p.subtitle}
        />
      ))}
    </DropdownShell>
  );
}

function ChapterDropdown({
  chapters,
  current,
  onPick,
}: {
  chapters: Chapter[];
  current: Chapter | undefined;
  onPick: (ch: Chapter) => void;
}) {
  const [open, setOpen] = useState(false);
  useDropdownClose(open, () => setOpen(false));
  const idx = current ? chapters.findIndex((c) => c.id === current.id) : -1;
  const label = current ? `Ch ${String(idx + 1).padStart(2, "0")} · ${current.title}` : "Pick chapter";
  return (
    <DropdownShell
      open={open}
      setOpen={setOpen}
      label={label}
      menuWidth={300}
    >
      {chapters.map((ch, i) => (
        <DropdownItem
          key={ch.id}
          active={ch.id === current?.id}
          onClick={() => {
            onPick(ch);
            setOpen(false);
          }}
          primary={`${String(i + 1).padStart(2, "0")} · ${ch.title}`}
          secondary={`${ch.concepts.length} lessons`}
        />
      ))}
    </DropdownShell>
  );
}

function LessonDropdown({
  chapter,
  currentSlug,
  onPick,
}: {
  chapter: Chapter;
  currentSlug: string | null;
  onPick: (slug: string) => void;
}) {
  const { rows } = useProgress();
  const [open, setOpen] = useState(false);
  useDropdownClose(open, () => setOpen(false));
  const currentIdx = chapter.concepts.findIndex((c) => c.slug === currentSlug);
  const current = currentIdx >= 0 ? chapter.concepts[currentIdx] : null;
  const label = current ? `L${currentIdx + 1} · ${current.title}` : "Pick lesson";
  return (
    <DropdownShell
      open={open}
      setOpen={setOpen}
      label={label}
      menuWidth={320}
      grow
    >
      {chapter.concepts.map((c, i) => {
        const isActive = c.slug === currentSlug;
        const isDone = rows[c.slug]?.status === "completed";
        return (
          <button
            key={c.slug}
            disabled={!c.available}
            onClick={() => {
              onPick(c.slug);
              setOpen(false);
            }}
            className={`flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-[12px] ${
              isActive ? "bg-accent/15 text-accent" : "text-foreground hover:bg-surface-2"
            } ${!c.available ? "cursor-not-allowed opacity-40" : ""}`}
          >
            {isDone ? (
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-accent" />
            ) : (
              <span className="h-2 w-2 shrink-0 rounded-full border border-border" />
            )}
            <span className="truncate">
              <span className="font-mono text-[10.5px] text-foreground-muted">
                L{i + 1}
              </span>{" "}
              {c.title}
            </span>
          </button>
        );
      })}
    </DropdownShell>
  );
}

interface DropdownShellProps {
  open: boolean;
  setOpen: (v: boolean) => void;
  label: string;
  sublabel?: string;
  strong?: boolean;
  menuWidth: number;
  grow?: boolean;
  children: React.ReactNode;
}

function DropdownShell({ open, setOpen, label, sublabel, strong, menuWidth, grow, children }: DropdownShellProps) {
  return (
    <div className={`relative min-w-0 ${grow ? "flex-1" : ""}`}>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
        className={`flex w-full min-w-0 items-center gap-1 rounded px-1.5 py-1 text-left hover:bg-surface-2 ${
          strong ? "text-foreground" : "text-foreground-secondary"
        }`}
      >
        <div className="min-w-0">
          <div className={`truncate ${strong ? "text-[12px] font-semibold" : "text-[11.5px]"}`}>
            {label}
          </div>
          {sublabel && (
            <div className="truncate text-[10px] text-foreground-muted">{sublabel}</div>
          )}
        </div>
        <ChevronDown className="h-3 w-3 shrink-0 text-foreground-muted" />
      </button>
      {open && (
        <div
          style={{ width: menuWidth }}
          className="absolute left-0 top-full z-30 mt-1 max-h-[60vh] overflow-y-auto rounded-md border border-border bg-surface-1 py-1 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  active,
  onClick,
  primary,
  secondary,
}: {
  active: boolean;
  onClick: () => void;
  primary: string;
  secondary?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center justify-between gap-3 px-2.5 py-1.5 text-left ${
        active ? "bg-accent/15" : "hover:bg-surface-2"
      }`}
    >
      <div className="min-w-0">
        <div className={`truncate text-[12px] ${active ? "text-accent font-semibold" : "text-foreground"}`}>
          {primary}
        </div>
        {secondary && (
          <div className="truncate text-[10px] text-foreground-muted">{secondary}</div>
        )}
      </div>
    </button>
  );
}

function useDropdownClose(open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onClick = () => close();
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", onClick);
      window.removeEventListener("keydown", onEsc);
    };
  }, [open, close]);
}

// Boot.dev-inspired lesson view. The student picks a Phase on /app,
// lands here, and gets:
//
//   [ phase-back ] [ chapter ▾ ] [ lesson ▾ ] [ dot row ]   [ ←  → ]
//   ┌─────────────────────────────────────────────────────────────┐
//   │  Lesson content (MDX)        │  Editor + file tree + tabs   │  ← resizable
//   └─────────────────────────────────────────────────────────────┘
//
// No global sidebar — navigation is driven by the dropdowns + dot row +
// next/prev arrows. The student focuses on one lesson at a time.

import { useEffect, useMemo, useState } from "react";
import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, ChevronDown, Files, Grid3x3, Home } from "lucide-react";
import {
  chaptersForPhase,
  useCurriculum,
  type Chapter,
  type PhaseListing,
} from "@/lib/curriculum-store";
import { useProgress } from "@/lib/progress-store";
import { Splitter } from "@/components/ui/splitter";
import { LessonBody } from "@/components/editor/lesson-body";
import { MonacoPane } from "@/components/editor/monaco-pane";
import { EditorTabs } from "@/components/editor/editor-tabs";
import { FileTree } from "@/components/editor/file-tree";
import { PreviewPane } from "@/components/editor/preview-pane";

export const Route = createFileRoute("/app/learn/$phase")({
  beforeLoad: ({ params }) => {
    if (!/^phase-\d+$/.test(params.phase)) {
      throw redirect({ to: "/app" });
    }
  },
  component: LessonViewPage,
});

function LessonViewPage() {
  const { phase: phaseId } = Route.useParams();
  const { manifest, selectedSlug, selectConcept } = useCurriculum();
  const { rows } = useProgress();
  const navigate = useNavigate();
  const [filesVisible, setFilesVisible] = useState(false);

  const phase: PhaseListing | undefined = useMemo(
    () => manifest?.phases.find((p) => p.id === phaseId),
    [manifest, phaseId],
  );
  const chapters: Chapter[] = useMemo(() => (phase ? chaptersForPhase(phase) : []), [phase]);

  // Pick a starting concept on phase change: prefer the existing
  // selection if it's already inside this phase, otherwise the first
  // non-completed available concept, otherwise the first concept.
  useEffect(() => {
    if (!phase) return;
    const slugs = phase.concepts.map((c) => c.slug);
    if (selectedSlug && slugs.includes(selectedSlug)) return;
    const firstNotDone = phase.concepts.find(
      (c) => c.available && rows[c.slug]?.status !== "completed",
    );
    selectConcept((firstNotDone ?? phase.concepts[0])?.slug ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!manifest) {
    return <div className="flex h-full items-center justify-center text-foreground-secondary">Loading…</div>;
  }
  if (!phase) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
        <p className="text-foreground">No phase "{phaseId}" in the manifest.</p>
        <button
          onClick={() => navigate({ to: "/app" })}
          className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-accent-hover"
        >
          Back to phases
        </button>
      </div>
    );
  }

  const currentConcept = phase.concepts.find((c) => c.slug === selectedSlug);
  const currentChapter = chapters.find((ch) => ch.concepts.some((c) => c.slug === selectedSlug));
  const flatIndex = currentConcept ? phase.concepts.indexOf(currentConcept) : -1;
  const prevConcept = flatIndex > 0 ? phase.concepts[flatIndex - 1] : null;
  const nextConcept = flatIndex >= 0 && flatIndex < phase.concepts.length - 1
    ? phase.concepts[flatIndex + 1]
    : null;

  return (
    <div className="flex h-full w-full min-h-0 flex-col bg-background">
      <TopBar
        phase={phase}
        chapters={chapters}
        currentChapter={currentChapter}
        currentSlug={selectedSlug}
        onPickConcept={(slug) => selectConcept(slug)}
        onBackToPhases={() => navigate({ to: "/app" })}
        onPrev={prevConcept ? () => selectConcept(prevConcept.slug) : undefined}
        onNext={nextConcept ? () => selectConcept(nextConcept.slug) : undefined}
        filesVisible={filesVisible}
        onToggleFiles={() => setFilesVisible((v) => !v)}
      />

      {currentChapter && (
        <DotRow
          chapter={currentChapter}
          currentSlug={selectedSlug}
          onPick={(slug) => selectConcept(slug)}
        />
      )}

      <div className="flex min-h-0 flex-1">
        {currentConcept ? (
          <Splitter
            storageKey="learn:splitLeft"
            defaultLeftPct={48}
            minLeftPct={25}
            maxLeftPct={70}
            className="flex-1"
            left={
              <LessonBody
                slug={currentConcept.slug}
                title={currentConcept.title}
                phaseTitle={phase.title}
                compact
              />
            }
            right={<EditorPane filesVisible={filesVisible} />}
          />
        ) : (
          <div className="flex flex-1 items-center justify-center text-foreground-secondary">
            Pick a lesson above to begin.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Top bar ──────────────────────────────────────────────────

interface TopBarProps {
  phase: PhaseListing;
  chapters: Chapter[];
  currentChapter: Chapter | undefined;
  currentSlug: string | null;
  onPickConcept: (slug: string) => void;
  onBackToPhases: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  filesVisible: boolean;
  onToggleFiles: () => void;
}

function TopBar({
  phase,
  chapters,
  currentChapter,
  currentSlug,
  onPickConcept,
  onBackToPhases,
  onPrev,
  onNext,
  filesVisible,
  onToggleFiles,
}: TopBarProps) {
  return (
    <div className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-surface-1 px-3">
      <button
        onClick={onBackToPhases}
        title="Back to phases"
        className="flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium text-foreground-secondary hover:bg-surface-2 hover:text-foreground"
      >
        <Home className="h-3.5 w-3.5" />
        Phases
      </button>
      <span className="text-foreground-muted">/</span>
      <span className="truncate text-[12.5px] font-semibold text-foreground">{phase.title}</span>

      <div className="ml-3 flex flex-1 items-center gap-2">
        <Dropdown
          label={currentChapter ? currentChapter.title : "Chapter"}
          items={chapters.map((ch) => ({
            id: ch.id,
            label: ch.title,
            // Jump to the first concept in that chapter.
            onSelect: () => onPickConcept(ch.concepts[0]?.slug ?? ""),
            active: ch.id === currentChapter?.id,
          }))}
        />
        {currentChapter && (
          <Dropdown
            label={
              currentChapter.concepts.find((c) => c.slug === currentSlug)?.title ?? "Lesson"
            }
            items={currentChapter.concepts.map((c) => ({
              id: c.slug,
              label: c.title,
              onSelect: () => onPickConcept(c.slug),
              active: c.slug === currentSlug,
              disabled: !c.available,
            }))}
            wide
          />
        )}
      </div>

      <button
        onClick={onToggleFiles}
        title={filesVisible ? "Hide files panel" : "Show files panel"}
        className={`flex items-center gap-1.5 rounded-md px-2 py-1.5 text-[12px] font-medium transition-colors ${
          filesVisible ? "bg-accent/15 text-accent" : "text-foreground-secondary hover:bg-surface-2 hover:text-foreground"
        }`}
      >
        <Files className="h-3.5 w-3.5" />
        Files
      </button>

      <div className="ml-1 flex items-center gap-1">
        <button
          onClick={onPrev}
          disabled={!onPrev}
          title="Previous lesson"
          className="rounded-md p-1.5 text-foreground-secondary hover:bg-surface-2 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          onClick={onNext}
          disabled={!onNext}
          title="Next lesson"
          className="flex h-8 items-center gap-1 rounded-md bg-accent px-2.5 text-[12px] font-semibold text-background transition-colors hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-30"
        >
          Next
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}

// ─── Dropdown ─────────────────────────────────────────────────

interface DropdownItem {
  id: string;
  label: string;
  onSelect: () => void;
  active?: boolean;
  disabled?: boolean;
}

function Dropdown({ label, items, wide = false }: { label: string; items: DropdownItem[]; wide?: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, [open]);

  return (
    <div className="relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={`flex h-8 min-w-0 max-w-[280px] items-center justify-between gap-2 rounded-md border border-border bg-surface-2 px-2.5 text-[12.5px] font-medium text-foreground hover:border-accent/50 ${wide ? "min-w-[180px]" : ""}`}
      >
        <span className="truncate">{label}</span>
        <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
      </button>
      {open && (
        <div
          className="absolute left-0 top-full z-30 mt-1 max-h-[60vh] w-[320px] overflow-y-auto rounded-md border border-border bg-surface-1 py-1 shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.disabled) return;
                item.onSelect();
                setOpen(false);
              }}
              disabled={item.disabled}
              className={`block w-full truncate px-3 py-1.5 text-left text-[12.5px] ${
                item.active
                  ? "bg-accent/15 text-accent"
                  : "text-foreground hover:bg-surface-2"
              } ${item.disabled ? "cursor-not-allowed opacity-40" : ""}`}
            >
              {item.label}
              {item.disabled && (
                <span className="ml-2 text-[10px] uppercase tracking-wider text-foreground-muted">soon</span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Dot row ──────────────────────────────────────────────────

function DotRow({
  chapter,
  currentSlug,
  onPick,
}: {
  chapter: Chapter;
  currentSlug: string | null;
  onPick: (slug: string) => void;
}) {
  const { rows } = useProgress();
  return (
    <div className="flex h-9 shrink-0 items-center gap-1.5 border-b border-border-subtle bg-surface-1 px-4 overflow-x-auto">
      <Grid3x3 className="h-3 w-3 text-foreground-muted" />
      <span className="mr-2 text-[10px] font-medium uppercase tracking-[0.14em] text-foreground-muted">
        {chapter.title}
      </span>
      {chapter.concepts.map((c, i) => {
        const status = rows[c.slug]?.status;
        const isActive = c.slug === currentSlug;
        const isDone = status === "completed";
        return (
          <button
            key={c.slug}
            onClick={() => onPick(c.slug)}
            disabled={!c.available}
            title={`${i + 1}. ${c.title}`}
            className={`h-2.5 w-2.5 shrink-0 rounded-full border transition-colors ${
              isActive
                ? "border-accent bg-accent ring-2 ring-accent/30"
                : isDone
                ? "border-accent/70 bg-accent/70"
                : c.available
                ? "border-border bg-surface-3 hover:border-accent"
                : "border-border bg-surface-3 opacity-40"
            }`}
          />
        );
      })}
    </div>
  );
}

// ─── Right pane: tabs + Monaco + optional file tree drawer ─────

function EditorPane({ filesVisible }: { filesVisible: boolean }) {
  // Files panel slides in to the LEFT of the editor when toggled.
  // Keeps it cheap to hide/show without remounting the Monaco model.
  return (
    <div className="flex h-full min-h-0 w-full bg-background">
      {filesVisible && (
        <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-border bg-surface-1">
          <FileTree />
        </aside>
      )}
      <main className="flex min-h-0 min-w-0 flex-1 flex-col">
        <EditorTabs />
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <MonacoPane />
          </div>
          <PreviewPane />
        </div>
      </main>
    </div>
  );
}

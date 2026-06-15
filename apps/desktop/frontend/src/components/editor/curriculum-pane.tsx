import { useState } from "react";
import { BookOpen, ChevronDown, ChevronRight, Circle, CircleDot, CircleCheck } from "lucide-react";
import { useCurriculum, type PhaseListing, type ConceptListing } from "@/lib/curriculum-store";
import { useProgress, type ConceptStatus } from "@/lib/progress-store";

// Curriculum sidebar (left pane, Curriculum tab). Reads the embedded
// manifest, lists every Phase, expands to show its concepts. Each concept
// gets a progress dot — for B5 the dot is just a "started/unread"
// placeholder hooked to the currently-selected slug; B6 will rewire it to
// the local SQLite progress table.

export function CurriculumPane() {
  const { manifest, loading, error, selectedSlug, selectConcept } = useCurriculum();
  const { rows: progress } = useProgress();

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-foreground-muted">
        Loading curriculum…
      </div>
    );
  }
  if (error || !manifest) {
    return (
      <div className="m-3 rounded-md border border-danger/30 bg-danger/10 p-3 text-[12px] text-danger">
        Couldn't load curriculum: {error ?? "manifest missing"}
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
          Curriculum
        </span>
        <span className="text-[10px] text-foreground-muted">v{manifest.version}</span>
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {manifest.phases.map((phase, i) => (
          <Phase
            key={phase.id}
            phase={phase}
            defaultOpen={i === 0}
            selectedSlug={selectedSlug}
            onSelect={selectConcept}
            progress={progress}
          />
        ))}
      </div>
    </div>
  );
}

interface PhaseProps {
  phase: PhaseListing;
  defaultOpen: boolean;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
  progress: Record<string, { status: ConceptStatus }>;
}

function Phase({ phase, defaultOpen, selectedSlug, onSelect, progress }: PhaseProps) {
  const [open, setOpen] = useState(defaultOpen);
  // Show "completed / total available" in the phase header so a phase
  // the student has finished pops visually even when collapsed.
  const availableCount = phase.concepts.filter((c) => c.available).length;
  const completedCount = phase.concepts.filter(
    (c) => c.available && progress[c.slug]?.status === "completed",
  ).length;

  return (
    <div className="mb-1">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-2 py-1.5 text-left text-foreground-secondary hover:bg-surface-2"
      >
        {open ? (
          <ChevronDown className="h-3 w-3 shrink-0 text-foreground-muted" />
        ) : (
          <ChevronRight className="h-3 w-3 shrink-0 text-foreground-muted" />
        )}
        <BookOpen className="h-3.5 w-3.5 shrink-0 text-accent" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-[12px] font-semibold text-foreground">{phase.title}</div>
          {phase.subtitle && (
            <div className="truncate text-[10px] text-foreground-muted">{phase.subtitle}</div>
          )}
        </div>
        <span
          className={`shrink-0 text-[10px] ${
            completedCount > 0 ? "text-success" : "text-foreground-muted"
          }`}
        >
          {completedCount}/{availableCount}
        </span>
      </button>
      {open && (
        <div>
          {phase.concepts.map((c) => (
            <Concept
              key={c.slug}
              concept={c}
              selected={c.slug === selectedSlug}
              status={progress[c.slug]?.status}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface ConceptProps {
  concept: ConceptListing;
  selected: boolean;
  status: ConceptStatus | undefined;
  onSelect: (slug: string) => void;
}

function Concept({ concept, selected, status, onSelect }: ConceptProps) {
  const dot = (() => {
    if (status === "completed") {
      return <CircleCheck className="h-3 w-3 shrink-0 text-success" />;
    }
    if (status === "in_progress" || status === "started") {
      return <CircleDot className="h-3 w-3 shrink-0 text-accent" />;
    }
    if (selected) {
      return <CircleDot className="h-3 w-3 shrink-0 text-accent" />;
    }
    return (
      <Circle className={`h-3 w-3 shrink-0 ${concept.available ? "text-foreground-muted" : "opacity-30"}`} />
    );
  })();

  return (
    <button
      onClick={() => concept.available && onSelect(concept.slug)}
      disabled={!concept.available}
      title={concept.available ? concept.slug : `${concept.title} — coming soon`}
      className={`flex w-full items-center gap-2 py-[3px] pl-9 pr-2 text-left text-[12px] ${
        selected
          ? "bg-accent/15 text-foreground"
          : concept.available
            ? "text-foreground-secondary hover:bg-surface-2"
            : "cursor-not-allowed text-foreground-muted"
      }`}
    >
      {dot}
      <span className="truncate">{concept.title}</span>
    </button>
  );
}

import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, BookOpen, CheckCircle2, Layers } from "lucide-react";
import { useCurriculum } from "@/lib/curriculum-store";
import { useProgress } from "@/lib/progress-store";

// /app now lands on the Phase Picker — a grid of cards, one per phase.
// The student picks a phase (Web Frontend, Backend, ...) and we hand
// off to /app/learn/$phase for the focused lesson view.
//
// Replaces the v0.4.x "drop straight into a 3-pane editor + 47-deep
// curriculum sidebar" which the user called overwhelming.

export const Route = createFileRoute("/app/")({
  component: PhasePickerPage,
});

function PhasePickerPage() {
  const navigate = useNavigate();
  const { manifest, loading } = useCurriculum();
  const { rows } = useProgress();

  if (loading || !manifest) {
    return (
      <div className="flex h-full items-center justify-center text-foreground-secondary">
        Loading curriculum…
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-y-auto bg-background">
      <div className="mx-auto w-full max-w-6xl px-8 py-12">
        <div className="mb-10">
          <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-border bg-surface-1 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-foreground-secondary">
            <Layers className="h-3 w-3 text-accent" />
            Pick your path
          </div>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground">
            What do you want to learn next?
          </h1>
          <p className="mt-1.5 text-[14px] text-foreground-secondary">
            Each phase is a self-contained track. Jump in anywhere — you can switch later.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {manifest.phases.map((phase) => {
            const total = phase.concepts.length;
            const completed = phase.concepts.filter(
              (c) => rows[c.slug]?.status === "completed",
            ).length;
            const pct = total === 0 ? 0 : Math.round((completed / total) * 100);

            return (
              <button
                key={phase.id}
                onClick={() => navigate({ to: "/app/learn/$phase", params: { phase: phase.id } })}
                className="group flex flex-col items-start gap-4 rounded-xl border border-border bg-surface-1 p-5 text-left transition-all hover:border-accent/60 hover:bg-surface-2"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/15 text-accent">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="w-full">
                  <h2 className="text-[16px] font-semibold text-foreground">{phase.title}</h2>
                  {phase.subtitle && (
                    <p className="mt-0.5 text-[12.5px] text-foreground-secondary">{phase.subtitle}</p>
                  )}
                </div>
                <div className="w-full space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-foreground-muted">
                    <span>
                      {completed} / {total} lessons
                    </span>
                    <span className="flex items-center gap-1 text-accent">
                      {pct === 100 && <CheckCircle2 className="h-3 w-3" />}
                      {pct}%
                    </span>
                  </div>
                  <div className="h-1 w-full overflow-hidden rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <div className="mt-auto flex items-center gap-1 text-[12.5px] font-medium text-accent opacity-60 transition-opacity group-hover:opacity-100">
                  {completed === 0 ? "Start" : completed === total ? "Review" : "Continue"}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

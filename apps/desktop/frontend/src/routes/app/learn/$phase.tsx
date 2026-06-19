// /app/learn/$phase — the editor area for a phase. All of the
// curriculum navigation chrome (chapter dropdown, lesson dropdown,
// dot row, prev/next) has moved into the Activity Bar's "Learning"
// sidebar. The route's job here is:
//
//   1. validate the phase id from the URL
//   2. initialise the curriculum store's selected concept if none
//   3. soft-apply phase-aware editor defaults
//   4. render the editor area (tabs + breadcrumbs + Monaco)

import { useEffect, useMemo } from "react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  useCurriculum,
  type PhaseListing,
} from "@/lib/curriculum-store";
import { useProgress } from "@/lib/progress-store";
import { usePhaseAwareDefaults } from "@/lib/editor-prefs";
import { useShell } from "@/lib/ide-shell";
import { MonacoPane } from "@/components/editor/monaco-pane";
import { EditorTabs } from "@/components/editor/editor-tabs";
import { PreviewPane } from "@/components/editor/preview-pane";
import { Breadcrumbs } from "@/components/editor/breadcrumbs";
import { FileToolbar } from "@/components/editor/file-toolbar";

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
  const shell = useShell();

  const phase: PhaseListing | undefined = useMemo(
    () => manifest?.phases.find((p) => p.id === phaseId),
    [manifest, phaseId],
  );

  // Phase-aware editor defaults (e.g. tabSize=4 for backend).
  usePhaseAwareDefaults(phase?.id);

  // First time the route mounts for this phase, pick a starting concept.
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

  // Default the activity bar to Learning when we land here so the
  // chapter outline + lesson reader come up automatically — but only
  // if the student hasn't already moved off to a different activity.
  useEffect(() => {
    if (shell.activity === "none") {
      shell.setActivity("learning");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // <ExampleProject> in the MDX still fires this event; for the new
  // layout we promote it to switching the Activity Bar to Explorer
  // so the student can see the example tree.
  useEffect(() => {
    const onShow = () => shell.setActivity("explorer");
    window.addEventListener("JEditor:show-files", onShow);
    return () => window.removeEventListener("JEditor:show-files", onShow);
  }, [shell]);

  if (!phase) {
    return (
      <div className="flex h-full items-center justify-center text-foreground-secondary">
        Loading phase…
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <EditorTabs />
      <Breadcrumbs onRevealFiles={() => shell.setActivity("explorer")} />
      <FileToolbar />
      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <MonacoPane />
        </div>
        <PreviewPane />
      </div>
    </div>
  );
}

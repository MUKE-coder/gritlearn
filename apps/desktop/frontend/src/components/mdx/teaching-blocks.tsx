// The five custom MDX components every concept page uses. Styles follow
// design-style-guide.md exactly:
//   - <Analogy>  → bg-tertiary, 4px accent left bar, "Analogy" uppercase label
//   - <Illustration> → centered figure, thin border, lg radius, sm/text-muted caption
//   - <ExampleProject> → elevated card + monospace file hint + primary CTA
//   - <Exercise> → flat card, warning left bar, "Open starter" CTA + collapsible checklist
//   - <InterviewQuestion> → accordion row, difficulty pill colored by level

import { useState, type ReactNode, Children, isValidElement } from "react";
import { Lightbulb, FolderOpen, Pencil, ChevronDown, ChevronRight, Sparkles } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
import { useProgress } from "@/lib/progress-store";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../../wailsjs/go/main/App";

// ─── <Analogy> ────────────────────────────────────────────────────────────
export function Analogy({ children }: { children: ReactNode }) {
  return (
    <aside className="my-6 overflow-hidden rounded-md border border-accent/30 bg-surface-3">
      <div className="flex gap-3 border-l-4 border-accent px-5 py-4">
        <Lightbulb className="mt-1 h-4 w-4 shrink-0 text-accent" />
        <div className="flex-1">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-accent">
            Analogy
          </div>
          <div className="prose-mdx">{children}</div>
        </div>
      </div>
    </aside>
  );
}

// ─── <Illustration> ──────────────────────────────────────────────────────
interface IllustrationProps {
  alt?: string;
  caption?: string;
  src?: string;
  children?: ReactNode;
}

export function Illustration({ alt, caption, src, children }: IllustrationProps) {
  return (
    <figure className="my-6 rounded-lg border border-border bg-surface-2 p-4">
      <div className="flex items-center justify-center overflow-auto">
        {src ? (
          <img src={src} alt={alt ?? caption ?? "illustration"} className="max-w-full" />
        ) : (
          <div className="prose-mdx-figure w-full">{children}</div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-3 text-center text-[12px] text-foreground-muted">{caption}</figcaption>
      )}
    </figure>
  );
}

// ─── <ExampleProject> ─────────────────────────────────────────────────────
interface ExampleProjectProps {
  /** Folder under the current concept's examples/ (matches manifest). */
  src: string;
  title: string;
  description?: string;
  /** Set by the renderer at parse time — students don't write this. */
  conceptSlug?: string;
}

export function ExampleProject({ src, title, description, conceptSlug }: ExampleProjectProps) {
  const { setRoot, openFile } = useWorkspace();
  const { recordExampleOpened } = useProgress();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpen = async () => {
    if (!conceptSlug) {
      setError("Renderer didn't pass conceptSlug — open a concept from the sidebar first.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const dst = await App.OpenExampleProject(conceptSlug, src);
      // setRoot points the workspace at the freshly-copied folder so the
      // file tree shows the example immediately. The student can edit
      // freely — the source-of-truth copy in the binary stays untouched.
      setRoot(dst);
      // Also auto-open an interesting starter file so the user lands in
      // a buffer instead of an empty editor — the Files panel is
      // collapsed by default in the new lesson view and showing only
      // the file tree is easy to miss. Surface the example's
      // "index.html" first (or README.md, or first file we find).
      try {
        const entries = (await App.ListDirectory(dst)) as Array<{ name: string; path: string; is_dir: boolean }>;
        const PRIORITY = ["index.html", "index.tsx", "index.ts", "index.js", "main.go", "README.md", "app.tsx", "app.ts"];
        let pick = entries
          .filter((e) => !e.is_dir)
          .sort((a, b) => {
            const ai = PRIORITY.findIndex((p) => p.toLowerCase() === a.name.toLowerCase());
            const bi = PRIORITY.findIndex((p) => p.toLowerCase() === b.name.toLowerCase());
            return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
          })[0];
        // No top-level file? Open the first file from the first folder.
        if (!pick) {
          const firstDir = entries.find((e) => e.is_dir);
          if (firstDir) {
            const nested = (await App.ListDirectory(firstDir.path)) as Array<{ name: string; path: string; is_dir: boolean }>;
            const nestedFile = nested.find((e) => !e.is_dir);
            if (nestedFile) pick = nestedFile;
          }
        }
        if (pick) await openFile(pick.path);
      } catch {
        // Best-effort — if we can't auto-pick a file, the file tree
        // still has the freshly-copied example in it.
      }
      // Touching an example pushes the concept's status up to
      // "in_progress" so the sidebar dot reflects real engagement.
      void recordExampleOpened(conceptSlug, src);
      // Signal the lesson view to reveal the Files panel, so the
      // student can see the file tree of the example they just opened.
      window.dispatchEvent(new CustomEvent("JEditor:show-files"));
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="my-6 rounded-lg border border-border bg-surface-3 p-4 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[14px] font-semibold text-foreground">{title}</div>
          {description && (
            <p className="mt-1 text-[13px] leading-relaxed text-foreground-secondary">{description}</p>
          )}
          <div className="mt-2 font-mono text-[11px] text-foreground-muted">examples/{src}</div>
        </div>
        <button
          onClick={() => void handleOpen()}
          disabled={busy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[12px] font-semibold text-zinc-900 shadow-sm hover:bg-accent-hover disabled:opacity-60"
        >
          <FolderOpen className="h-3.5 w-3.5" />
          {busy ? "Opening…" : "Open in editor"}
        </button>
      </div>
      {error && <div className="mt-3 text-[12px] text-danger">{error}</div>}
    </div>
  );
}

// ─── <Exercise> ──────────────────────────────────────────────────────────
interface ExerciseProps {
  title?: string;
  /** Plain-text starter prompt shown above the checklist. */
  starter?: string;
  /** The checklist items live as <ul>/<li> children. */
  children?: ReactNode;
}

export function Exercise({ title = "Exercise", starter, children }: ExerciseProps) {
  const [open, setOpen] = useState(false);

  // Count `<li>` children so the closed checklist still hints at scope.
  let itemCount = 0;
  Children.forEach(children, (child) => {
    if (isValidElement(child) && (child.type === "ul" || child.type === "ol")) {
      const list = child as { props: { children?: ReactNode } };
      Children.forEach(list.props.children, (c) => {
        if (isValidElement(c) && c.type === "li") itemCount += 1;
      });
    }
  });

  return (
    <section className="my-6 rounded-md border border-warning/30 bg-surface-2">
      <div className="flex gap-3 border-l-4 border-warning px-5 py-4">
        <Pencil className="mt-1 h-4 w-4 shrink-0 text-warning" />
        <div className="flex-1">
          <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-warning">
            Exercise
          </div>
          <div className="text-[15px] font-semibold text-foreground">{title}</div>
          {starter && (
            <pre className="mt-3 overflow-x-auto rounded-md border border-border bg-background p-3 font-mono text-[12px] leading-relaxed text-foreground-secondary">
              {starter}
            </pre>
          )}
          <button
            onClick={() => setOpen((v) => !v)}
            className="mt-3 inline-flex items-center gap-1 text-[12px] font-medium text-accent hover:underline"
          >
            {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
            Solution checklist
            {itemCount > 0 && <span className="ml-1 text-foreground-muted">({itemCount})</span>}
          </button>
          {open && <div className="prose-mdx mt-2 text-[13px]">{children}</div>}
        </div>
      </div>
    </section>
  );
}

// ─── <InterviewQuestion> ─────────────────────────────────────────────────
type Difficulty = "Beginner" | "Intermediate" | "Advanced";

interface InterviewQuestionProps {
  difficulty?: Difficulty;
  children?: ReactNode;
}

const difficultyColor: Record<Difficulty, string> = {
  Beginner: "bg-success/15 text-success",
  Intermediate: "bg-warning/15 text-warning",
  Advanced: "bg-danger/15 text-danger",
};

export function InterviewQuestion({ difficulty = "Beginner", children }: InterviewQuestionProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-3 overflow-hidden rounded-md border border-border bg-surface-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-surface-3"
      >
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
        )}
        <Sparkles className="h-3.5 w-3.5 shrink-0 text-foreground-muted" />
        <span className="flex-1 text-[13px] font-medium text-foreground">Interview question</span>
        <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${difficultyColor[difficulty]}`}>
          {difficulty}
        </span>
      </button>
      {open && <div className="prose-mdx border-t border-border-subtle px-5 py-4 text-[13px]">{children}</div>}
    </div>
  );
}

// Map exported names to component instances so the MDX runtime can
// resolve <Analogy>, <Illustration>, etc. by name.
export const teachingComponents = {
  Analogy,
  Illustration,
  ExampleProject,
  Exercise,
  InterviewQuestion,
};

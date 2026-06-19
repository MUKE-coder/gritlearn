// Notes activity panel. Lists every note the student has taken,
// grouped by phase → chapter → lesson. Click a note to jump back to
// the lesson it belongs to (and, for anchored notes, scroll the
// reader to the highlighted phrase via a window event LessonBody
// listens for).

import { useMemo, useState } from "react";
import { ChevronDown, ChevronRight, FileText, Highlighter, Pencil, Trash2 } from "lucide-react";
import { chaptersForPhase, useCurriculum, type Chapter, type ConceptListing, type PhaseListing } from "@/lib/curriculum-store";
import { useNotes, type Note } from "@/lib/notes-store";

interface Bucket {
  phase: PhaseListing;
  chapter: Chapter;
  concept: ConceptListing;
  notes: Note[];
}

export function NotesPanel() {
  const { manifest, selectConcept } = useCurriculum();
  const { notes, updateNote, deleteNote } = useNotes();
  const [openId, setOpenId] = useState<string | null>(null);
  const [draftBody, setDraftBody] = useState("");

  // Bucket every note into its concept; concepts/chapters/phases with
  // zero notes never appear. Sorted: phase id, then chapter index,
  // then lesson index (matches the curriculum order).
  const buckets = useMemo<Bucket[]>(() => {
    if (!manifest) return [];
    const out: Bucket[] = [];
    for (const phase of manifest.phases) {
      const chs = chaptersForPhase(phase);
      for (const ch of chs) {
        for (const concept of ch.concepts) {
          const conceptNotes = notes
            .filter((n) => n.conceptSlug === concept.slug)
            .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
          if (conceptNotes.length > 0) {
            out.push({ phase, chapter: ch, concept, notes: conceptNotes });
          }
        }
      }
    }
    return out;
  }, [manifest, notes]);

  if (!manifest) {
    return (
      <div className="flex h-full items-center justify-center text-[12px] text-foreground-muted">
        Loading curriculum…
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col bg-surface-1">
      <div className="flex items-center justify-between border-b border-border-subtle px-3 py-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-foreground-muted">
          Notes
        </span>
        <span className="font-mono text-[10px] text-foreground-muted">{notes.length} total</span>
      </div>
      <div className="flex-1 overflow-y-auto">
        {buckets.length === 0 ? (
          <EmptyState />
        ) : (
          // Group by phase header → chapter sub-header → lesson items
          groupBuckets(buckets).map((group) => (
            <PhaseGroup key={group.phase.id} group={group}>
              {group.chapters.map((chGroup) => (
                <ChapterGroup key={chGroup.chapter.id} group={chGroup}>
                  {chGroup.concepts.map((b) => (
                    <ConceptBlock
                      key={b.concept.slug}
                      bucket={b}
                      openId={openId}
                      setOpenId={setOpenId}
                      onJump={(note) => {
                        selectConcept(note.conceptSlug);
                        // Fire a scroll-to-anchor event the LessonBody picks up.
                        if (note.anchorText) {
                          window.dispatchEvent(
                            new CustomEvent("JEditor:lesson-jump-to-anchor", {
                              detail: { conceptSlug: note.conceptSlug, anchor: note.anchorText },
                            }),
                          );
                        }
                      }}
                      onEdit={(note) => {
                        setOpenId(note.id);
                        setDraftBody(note.body);
                      }}
                      draftBody={draftBody}
                      setDraftBody={setDraftBody}
                      onCommitEdit={(note) => {
                        updateNote(note.id, draftBody);
                        setOpenId(null);
                      }}
                      onDelete={(note) => {
                        if (confirm("Delete this note?")) deleteNote(note.id);
                      }}
                    />
                  ))}
                </ChapterGroup>
              ))}
            </PhaseGroup>
          ))
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center text-[12.5px] text-foreground-muted">
      <Pencil className="h-5 w-5" />
      <div>No notes yet.</div>
      <div className="text-[11px]">
        Open a lesson and click the floating <span className="font-mono">+</span> button to write
        a note, or highlight a phrase in the lesson reader to anchor a note to it.
      </div>
    </div>
  );
}

// Sub-groups — small derived shape so the render code reads cleanly.
interface PhaseGrouping {
  phase: PhaseListing;
  chapters: ChapterGrouping[];
}
interface ChapterGrouping {
  chapter: Chapter;
  concepts: Bucket[];
}

function groupBuckets(buckets: Bucket[]): PhaseGrouping[] {
  const byPhase = new Map<string, PhaseGrouping>();
  for (const b of buckets) {
    let p = byPhase.get(b.phase.id);
    if (!p) {
      p = { phase: b.phase, chapters: [] };
      byPhase.set(b.phase.id, p);
    }
    let c = p.chapters.find((x) => x.chapter.id === b.chapter.id);
    if (!c) {
      c = { chapter: b.chapter, concepts: [] };
      p.chapters.push(c);
    }
    c.concepts.push(b);
  }
  return [...byPhase.values()];
}

function PhaseGroup({ group, children }: { group: PhaseGrouping; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const total = group.chapters.reduce(
    (n, ch) => n + ch.concepts.reduce((m, b) => m + b.notes.length, 0),
    0,
  );
  return (
    <div className="border-b border-border-subtle/50">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 bg-surface-2/40 px-3 py-1.5 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-muted hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {group.phase.title}
        <span className="ml-auto font-mono text-[10px]">{total}</span>
      </button>
      {open && children}
    </div>
  );
}

function ChapterGroup({ group, children }: { group: ChapterGrouping; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const total = group.concepts.reduce((n, b) => n + b.notes.length, 0);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-1.5 px-3 py-1 text-left text-[11px] text-foreground-secondary hover:text-foreground"
      >
        {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
        {group.chapter.title}
        <span className="ml-auto font-mono text-[10px] text-foreground-muted">{total}</span>
      </button>
      {open && children}
    </div>
  );
}

interface ConceptBlockProps {
  bucket: Bucket;
  openId: string | null;
  setOpenId: (id: string | null) => void;
  onJump: (note: Note) => void;
  onEdit: (note: Note) => void;
  draftBody: string;
  setDraftBody: (s: string) => void;
  onCommitEdit: (note: Note) => void;
  onDelete: (note: Note) => void;
}

function ConceptBlock({
  bucket,
  openId,
  setOpenId,
  onJump,
  onEdit,
  draftBody,
  setDraftBody,
  onCommitEdit,
  onDelete,
}: ConceptBlockProps) {
  return (
    <div className="border-l border-border-subtle/30 ml-6">
      <div className="flex items-center gap-1.5 px-3 py-0.5 text-[11.5px] text-foreground">
        <FileText className="h-3 w-3 text-accent" />
        <span className="truncate">{bucket.concept.title}</span>
      </div>
      <div className="space-y-1 px-3 pb-2 pt-1">
        {bucket.notes.map((note) => {
          const editing = openId === note.id;
          return (
            <div
              key={note.id}
              className="group rounded border border-border bg-surface-2/60 p-2 text-[11.5px]"
            >
              {note.anchorText && (
                <button
                  onClick={() => onJump(note)}
                  title="Jump to the highlighted phrase"
                  className="mb-1 flex w-full items-start gap-1.5 text-left text-[10.5px] text-accent hover:underline"
                >
                  <Highlighter className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="line-clamp-2 italic">{`"${note.anchorText}"`}</span>
                </button>
              )}
              {editing ? (
                <>
                  <textarea
                    value={draftBody}
                    onChange={(e) => setDraftBody(e.target.value)}
                    rows={3}
                    className="w-full resize-none rounded border border-border bg-surface-1 px-2 py-1 font-mono text-[11.5px] text-foreground"
                  />
                  <div className="mt-1 flex gap-1">
                    <button
                      onClick={() => onCommitEdit(note)}
                      className="rounded bg-accent px-2 py-0.5 text-[10.5px] font-semibold text-zinc-900 hover:bg-accent-hover"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setOpenId(null)}
                      className="rounded px-2 py-0.5 text-[10.5px] text-foreground-muted hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <button
                    onClick={() => onJump(note)}
                    className="block w-full text-left text-foreground hover:text-accent"
                  >
                    {note.body || <span className="italic text-foreground-muted">(empty)</span>}
                  </button>
                  <div className="mt-1 flex items-center justify-between gap-2 text-[10px] text-foreground-muted">
                    <span>{new Date(note.updatedAt).toLocaleString()}</span>
                    <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                      <button
                        onClick={() => onEdit(note)}
                        title="Edit"
                        className="rounded p-0.5 hover:bg-surface-3 hover:text-foreground"
                      >
                        <Pencil className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => onDelete(note)}
                        title="Delete"
                        className="rounded p-0.5 hover:bg-danger/15 hover:text-danger"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Notes store — per-lesson study notes the student takes while
// reading. Two kinds:
//
//   "free"     — typed from the floating + button. Free-form.
//   "anchored" — created by selecting text in the lesson; remembers
//                the original phrase so click-to-jump can scroll
//                the reader back to it.
//
// Stored in localStorage for now (no server round-trip), grouped by
// phase + chapter + lesson when surfaced in the Notes panel.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type NoteKind = "free" | "anchored";

export interface Note {
  id: string;
  conceptSlug: string;
  kind: NoteKind;
  body: string;
  /** Highlighted text the note was anchored to (kind === "anchored"). */
  anchorText?: string;
  createdAt: string;
  updatedAt: string;
}

interface NotesContextValue {
  notes: Note[];
  notesForSlug: (slug: string | null) => Note[];
  addNote: (input: { conceptSlug: string; body: string; kind?: NoteKind; anchorText?: string }) => Note;
  updateNote: (id: string, body: string) => void;
  deleteNote: (id: string) => void;
}

const NotesContext = createContext<NotesContextValue | null>(null);

const STORAGE_KEY = "JEditor.notes.v1";

function readNotes(): Note[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Note[];
  } catch {
    return [];
  }
}

function writeNotes(notes: Note[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch {
    /* quota — silent */
  }
}

function newId() {
  return "n_" + Math.random().toString(36).slice(2, 10);
}

export function NotesProvider({ children }: { children: ReactNode }) {
  const [notes, setNotes] = useState<Note[]>(() => readNotes());

  useEffect(() => {
    writeNotes(notes);
  }, [notes]);

  const addNote = useCallback<NotesContextValue["addNote"]>((input) => {
    const now = new Date().toISOString();
    const note: Note = {
      id: newId(),
      conceptSlug: input.conceptSlug,
      kind: input.kind ?? "free",
      body: input.body,
      anchorText: input.anchorText,
      createdAt: now,
      updatedAt: now,
    };
    setNotes((prev) => [note, ...prev]);
    return note;
  }, []);

  const updateNote = useCallback((id: string, body: string) => {
    setNotes((prev) =>
      prev.map((n) => (n.id === id ? { ...n, body, updatedAt: new Date().toISOString() } : n)),
    );
  }, []);

  const deleteNote = useCallback((id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const notesForSlug = useCallback(
    (slug: string | null) => (slug ? notes.filter((n) => n.conceptSlug === slug) : []),
    [notes],
  );

  const value = useMemo<NotesContextValue>(
    () => ({ notes, notesForSlug, addNote, updateNote, deleteNote }),
    [notes, notesForSlug, addNote, updateNote, deleteNote],
  );

  return <NotesContext.Provider value={value}>{children}</NotesContext.Provider>;
}

const noop: NotesContextValue = {
  notes: [],
  notesForSlug: () => [],
  addNote: () => ({} as Note),
  updateNote: () => {},
  deleteNote: () => {},
};

export function useNotes(): NotesContextValue {
  return useContext(NotesContext) ?? noop;
}

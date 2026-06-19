// EditorPrefs — persisted Monaco preferences (font size, word wrap,
// tab size, auto-save). The MonacoPane reads these via useEditorPrefs
// and the Settings page mutates them. Stored under JEditor.editor-prefs
// in localStorage so the choices survive restarts.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

import type { SnipThemeId } from "./snip-themes";

export interface EditorPrefs {
  fontSize: number;          // px — Monaco default 14
  tabSize: number;           // spaces per tab — default 2
  wordWrap: "on" | "off";    // default "on" so long lines don't disappear
  autoSave: "off" | "afterDelay"; // afterDelay = save 800ms after typing stops
  autoSaveDelayMs: number;   // default 800
  minimap: boolean;          // default false — minimap takes space on small screens
  monacoTheme: "vs-dark" | "monokai" | "dracula" | "one-dark" | "github-light";
  /** Frame style used by the Snip-as-image feature. */
  snipTheme: SnipThemeId;
}

const DEFAULTS: EditorPrefs = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: "on",
  autoSave: "afterDelay",
  autoSaveDelayMs: 800,
  minimap: false,
  monacoTheme: "monokai",
  snipTheme: "aurora",
};

const STORAGE_KEY = "JEditor.editor-prefs";

interface EditorPrefsContextValue {
  prefs: EditorPrefs;
  setPrefs: (patch: Partial<EditorPrefs>) => void;
  resetPrefs: () => void;
}

const EditorPrefsContext = createContext<EditorPrefsContextValue | null>(null);

export function EditorPrefsProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefsState] = useState<EditorPrefs>(() => {
    if (typeof window === "undefined") return DEFAULTS;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return DEFAULTS;
      const parsed = JSON.parse(raw) as Partial<EditorPrefs>;
      return { ...DEFAULTS, ...parsed };
    } catch {
      return DEFAULTS;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // Quota errors etc — silent.
    }
  }, [prefs]);

  const setPrefs = useCallback((patch: Partial<EditorPrefs>) => {
    setPrefsState((p) => ({ ...p, ...patch }));
  }, []);

  const resetPrefs = useCallback(() => {
    setPrefsState(DEFAULTS);
  }, []);

  const value = useMemo(() => ({ prefs, setPrefs, resetPrefs }), [prefs, setPrefs, resetPrefs]);

  return <EditorPrefsContext.Provider value={value}>{children}</EditorPrefsContext.Provider>;
}

const noopCtx: EditorPrefsContextValue = {
  prefs: DEFAULTS,
  setPrefs: () => {},
  resetPrefs: () => {},
};

export function useEditorPrefs(): EditorPrefsContextValue {
  const ctx = useContext(EditorPrefsContext);
  return ctx ?? noopCtx;
}

// Sensible per-phase overrides applied as soft defaults the first time
// the student enters a phase. Doesn't override their explicit choices —
// see usePhaseAwareDefaults below.
const PHASE_DEFAULTS: Record<string, Partial<EditorPrefs>> = {
  // Frontend lessons live in HTML/CSS/JSX where 2-space is canon.
  "phase-01": { tabSize: 2 },
  "phase-02": { tabSize: 2 },
  "phase-03": { tabSize: 2 },
  // Backend lessons include Go + Python in places — both prefer
  // wider tab stops by community convention.
  "phase-04": { tabSize: 4, fontSize: 14 },
};

const PHASE_SEEN_KEY = "JEditor.phase-defaults-seen";

// usePhaseAwareDefaults — call from the lesson view route with the
// current phaseId. The first time a phase is visited, soft-apply its
// PHASE_DEFAULTS so the editor matches the language's conventions.
// Tracked per-phase in localStorage so we never silently overwrite
// the student's later tweaks: once a phase is "seen", we never apply
// its defaults again.
export function usePhaseAwareDefaults(phaseId: string | undefined) {
  const { setPrefs } = useEditorPrefs();
  useEffect(() => {
    if (typeof window === "undefined" || !phaseId) return;
    const defaults = PHASE_DEFAULTS[phaseId];
    if (!defaults) return;
    let seen: string[] = [];
    try {
      seen = JSON.parse(localStorage.getItem(PHASE_SEEN_KEY) ?? "[]") as string[];
    } catch {
      // ignore corrupt key
    }
    if (seen.includes(phaseId)) return;
    setPrefs(defaults);
    try {
      localStorage.setItem(PHASE_SEEN_KEY, JSON.stringify([...seen, phaseId]));
    } catch {
      // quota — non-fatal, just means we'll re-apply on next visit
    }
  }, [phaseId, setPrefs]);
}

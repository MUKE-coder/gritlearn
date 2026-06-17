// EditorPrefs — persisted Monaco preferences (font size, word wrap,
// tab size, auto-save). The MonacoPane reads these via useEditorPrefs
// and the Settings page mutates them. Stored under JEditor.editor-prefs
// in localStorage so the choices survive restarts.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export interface EditorPrefs {
  fontSize: number;          // px — Monaco default 14
  tabSize: number;           // spaces per tab — default 2
  wordWrap: "on" | "off";    // default "on" so long lines don't disappear
  autoSave: "off" | "afterDelay"; // afterDelay = save 800ms after typing stops
  autoSaveDelayMs: number;   // default 800
  minimap: boolean;          // default false — minimap takes space on small screens
  monacoTheme: "vs-dark" | "monokai" | "dracula" | "one-dark" | "github-light";
}

const DEFAULTS: EditorPrefs = {
  fontSize: 14,
  tabSize: 2,
  wordWrap: "on",
  autoSave: "afterDelay",
  autoSaveDelayMs: 800,
  minimap: false,
  monacoTheme: "monokai",
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

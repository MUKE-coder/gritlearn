// IDE shell state — drives the new VSCode-style chrome.
//
// We hold one piece of cross-cutting state at this level so any
// component (menubar, activity bar, sidebar, lesson view) can flip
// activities or toggle the bottom panel without prop-drilling.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Activity =
  | "none"
  | "learning"
  | "explorer"
  | "search"
  | "git"
  | "extensions";

interface ShellState {
  activity: Activity;
  setActivity: (a: Activity) => void;
  /** Sidebar width in pixels — per-activity persisted. */
  sidebarWidth: number;
  setSidebarWidth: (px: number) => void;
  bottomVisible: boolean;
  setBottomVisible: (v: boolean) => void;
  toggleBottom: () => void;
  /** Drives the BottomPanel's active tab so menubar shortcuts like
   *  "Show Terminal" can both reveal the panel AND switch its tab. */
  bottomTab: "terminal" | "live-server" | "problems";
  setBottomTab: (t: "terminal" | "live-server" | "problems") => void;
}

const ShellContext = createContext<ShellState | null>(null);

const STORAGE_KEY = "JEditor.ide-shell.v1";
const SIDEBAR_KEY = "JEditor.sidebar-widths.v1";

interface Persisted {
  activity?: Activity;
  bottomVisible?: boolean;
}

function readPersisted(): Persisted {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

function readSidebarWidths(): Record<Activity, number> {
  const defaults: Record<Activity, number> = {
    none:       0,
    learning:   360,
    explorer:   280,
    search:     320,
    git:        320,
    extensions: 320,
  };
  if (typeof window === "undefined") return defaults;
  try {
    const stored = JSON.parse(localStorage.getItem(SIDEBAR_KEY) ?? "{}");
    return { ...defaults, ...stored };
  } catch {
    return defaults;
  }
}

export function IdeShellProvider({ children }: { children: ReactNode }) {
  const persisted = readPersisted();
  const widths = readSidebarWidths();
  const [activity, setActivityState] = useState<Activity>(persisted.activity ?? "learning");
  const [allWidths, setAllWidths] = useState<Record<Activity, number>>(widths);
  const [bottomVisible, setBottomVisibleState] = useState<boolean>(persisted.bottomVisible ?? false);
  const [bottomTab, setBottomTab] = useState<"terminal" | "live-server" | "problems">("terminal");

  const setActivity = useCallback((a: Activity) => {
    // Toggle behaviour: click the active icon = hide sidebar.
    setActivityState((prev) => (prev === a ? "none" : a));
  }, []);

  const setSidebarWidth = useCallback((px: number) => {
    setAllWidths((prev) => ({ ...prev, [activity]: px }));
  }, [activity]);

  const setBottomVisible = useCallback((v: boolean) => {
    setBottomVisibleState(v);
  }, []);

  const toggleBottom = useCallback(() => {
    setBottomVisibleState((v) => !v);
  }, []);

  // Persist shell state + widths.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ activity, bottomVisible }));
      localStorage.setItem(SIDEBAR_KEY, JSON.stringify(allWidths));
    } catch {
      // quota / privacy mode — silent
    }
  }, [activity, bottomVisible, allWidths]);

  const sidebarWidth = activity === "none" ? 0 : allWidths[activity];

  const value = useMemo<ShellState>(
    () => ({
      activity,
      setActivity,
      sidebarWidth,
      setSidebarWidth,
      bottomVisible,
      setBottomVisible,
      toggleBottom,
      bottomTab,
      setBottomTab,
    }),
    [activity, setActivity, sidebarWidth, setSidebarWidth, bottomVisible, setBottomVisible, toggleBottom, bottomTab],
  );

  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

const noop: ShellState = {
  activity:        "none",
  setActivity:     () => {},
  sidebarWidth:    0,
  setSidebarWidth: () => {},
  bottomVisible:   false,
  setBottomVisible:() => {},
  toggleBottom:    () => {},
  bottomTab:       "terminal",
  setBottomTab:    () => {},
};

export function useShell(): ShellState {
  return useContext(ShellContext) ?? noop;
}

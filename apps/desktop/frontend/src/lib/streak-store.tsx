// Streak + chapter-badge tracking. Powers a small daily-streak pill
// in the status bar (🔥 N-day streak) + chapter-completion toasts
// when the student finishes the last lesson in a chapter.
//
// Daily streak rules: marking any lesson "viewed" today bumps today
// onto the active days list. If the gap between today and the most
// recent active day is 1 day → continue; 0 days → same streak;
// >1 day → reset to 1.
//
// Storage: localStorage. Schema versioned for easy migrations.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

const STORAGE_KEY = "JEditor.streak.v1";

interface StreakState {
  /** ISO date (YYYY-MM-DD) of the most recent active day. */
  lastActiveDay: string | null;
  /** Current consecutive-day streak. */
  current: number;
  /** Longest streak the student has ever hit. */
  longest: number;
  /** Chapter ids the student has finished (one badge per id). */
  earnedChapters: string[];
}

const DEFAULTS: StreakState = {
  lastActiveDay:   null,
  current:         0,
  longest:         0,
  earnedChapters:  [],
};

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function daysBetween(a: string, b: string): number {
  const da = Date.parse(a + "T00:00:00Z");
  const db = Date.parse(b + "T00:00:00Z");
  return Math.round((db - da) / 86_400_000);
}

function read(): StreakState {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<StreakState>) };
  } catch {
    return DEFAULTS;
  }
}

function write(state: StreakState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* quota */
  }
}

interface StreakContextValue {
  state: StreakState;
  /** Called every time a lesson is recorded as viewed. */
  recordActivity: () => void;
  /** Called when a chapter is finished — fires a toast if it's a
   *  first-time finish + records the badge. */
  recordChapterCompleted: (chapterId: string, chapterTitle: string) => void;
}

const Ctx = createContext<StreakContextValue | null>(null);

export function StreakProvider({ children, onChapterEarned }: { children: ReactNode; onChapterEarned?: (msg: string) => void }) {
  const [state, setState] = useState<StreakState>(() => read());

  useEffect(() => {
    write(state);
  }, [state]);

  const recordActivity = useCallback(() => {
    setState((prev) => {
      const t = today();
      if (prev.lastActiveDay === t) return prev; // already counted today
      let nextCurrent: number;
      if (!prev.lastActiveDay) {
        nextCurrent = 1;
      } else {
        const gap = daysBetween(prev.lastActiveDay, t);
        nextCurrent = gap === 1 ? prev.current + 1 : 1;
      }
      return {
        ...prev,
        lastActiveDay: t,
        current: nextCurrent,
        longest: Math.max(prev.longest, nextCurrent),
      };
    });
  }, []);

  const recordChapterCompleted = useCallback((id: string, title: string) => {
    setState((prev) => {
      if (prev.earnedChapters.includes(id)) return prev;
      onChapterEarned?.(`Chapter complete: ${title}`);
      return { ...prev, earnedChapters: [...prev.earnedChapters, id] };
    });
  }, [onChapterEarned]);

  // Also re-validate the streak on mount — if today gap is > 1, the
  // streak is broken even without explicit activity.
  useEffect(() => {
    setState((prev) => {
      if (!prev.lastActiveDay) return prev;
      const t = today();
      const gap = daysBetween(prev.lastActiveDay, t);
      if (gap > 1) return { ...prev, current: 0 };
      return prev;
    });
  }, []);

  const value = useMemo<StreakContextValue>(
    () => ({ state, recordActivity, recordChapterCompleted }),
    [state, recordActivity, recordChapterCompleted],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

const noop: StreakContextValue = {
  state: DEFAULTS,
  recordActivity: () => {},
  recordChapterCompleted: () => {},
};

export function useStreak(): StreakContextValue {
  return useContext(Ctx) ?? noop;
}

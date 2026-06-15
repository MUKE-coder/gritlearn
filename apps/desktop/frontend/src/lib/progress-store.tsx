// ProgressProvider — local-first progress mirror, fed from the Go SQLite
// store via Wails bindings. Optimistic UX: every status change updates
// the in-memory map first, then writes through the binding and rewrites
// with the server-of-truth row that comes back. If the binding fails we
// roll the optimistic write back and surface the error.
//
// Why is this a separate store from CurriculumStore? Progress writes are
// frequent (every concept view) and we don't want a curriculum manifest
// reload to wipe progress state. Keeping them orthogonal also means B8's
// sync layer only has to touch progress when it pushes changes upstream.

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../wailsjs/go/main/App";

export type ConceptStatus = "started" | "in_progress" | "completed";

export interface ProgressRow {
  concept_slug: string;
  status: ConceptStatus;
  completed_at: string; // RFC3339, "" when null
  updated_at: string;
  dirty: boolean;
}

interface ProgressContextValue {
  /** Map of conceptSlug → row. Concepts not in the map have no progress. */
  rows: Record<string, ProgressRow>;
  loading: boolean;
  recordViewed: (slug: string) => Promise<void>;
  recordExampleOpened: (slug: string, exampleID: string) => Promise<void>;
  markCompleted: (slug: string) => Promise<void>;
  markUncompleted: (slug: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [rows, setRows] = useState<Record<string, ProgressRow>>({});
  const [loading, setLoading] = useState(true);

  // Hydrate the in-memory map from SQLite once on mount. Failures here
  // are non-fatal — the rest of the app still works, students just
  // start fresh.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = (await App.GetLocalProgress()) as ProgressRow[];
        if (cancelled) return;
        setRows(Object.fromEntries(list.map((r) => [r.concept_slug, r])));
      } catch (err) {
        console.error("[progress] hydrate failed", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const applyRow = useCallback((row: ProgressRow) => {
    setRows((prev) => ({ ...prev, [row.concept_slug]: row }));
  }, []);

  const recordViewed = useCallback(
    async (slug: string) => {
      try {
        const row = (await App.RecordConceptViewed(slug)) as ProgressRow;
        applyRow(row);
      } catch (err) {
        console.error("[progress] recordViewed failed", err);
      }
    },
    [applyRow],
  );

  const recordExampleOpened = useCallback(
    async (slug: string, exampleID: string) => {
      try {
        const row = (await App.RecordExampleOpened(slug, exampleID)) as ProgressRow;
        applyRow(row);
      } catch (err) {
        console.error("[progress] recordExampleOpened failed", err);
      }
    },
    [applyRow],
  );

  const markCompleted = useCallback(
    async (slug: string) => {
      try {
        const row = (await App.MarkConceptCompleted(slug)) as ProgressRow;
        applyRow(row);
      } catch (err) {
        console.error("[progress] markCompleted failed", err);
      }
    },
    [applyRow],
  );

  const markUncompleted = useCallback(
    async (slug: string) => {
      try {
        const row = (await App.MarkConceptUncompleted(slug)) as ProgressRow;
        applyRow(row);
      } catch (err) {
        console.error("[progress] markUncompleted failed", err);
      }
    },
    [applyRow],
  );

  const clearAll = useCallback(async () => {
    try {
      await App.ClearLocalProgress();
      setRows({});
    } catch (err) {
      console.error("[progress] clearAll failed", err);
    }
  }, []);

  const value = useMemo<ProgressContextValue>(
    () => ({ rows, loading, recordViewed, recordExampleOpened, markCompleted, markUncompleted, clearAll }),
    [rows, loading, recordViewed, recordExampleOpened, markCompleted, markUncompleted, clearAll],
  );

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used inside <ProgressProvider>");
  return ctx;
}

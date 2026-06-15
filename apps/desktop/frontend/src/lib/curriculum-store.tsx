// CurriculumStore holds the bundled-MDX layer's shared state: the parsed
// manifest, which concept is currently selected in the lesson pane, and a
// helper to update the selection. Kept tiny and orthogonal to the
// workspace store so curriculum bugs can't break the editor and vice
// versa.

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../wailsjs/go/main/App";

export interface ConceptListing {
  slug: string;
  title: string;
  available: boolean;
}

export interface PhaseListing {
  id: string;
  title: string;
  subtitle?: string;
  concepts: ConceptListing[];
}

export interface Manifest {
  version: number;
  phases: PhaseListing[];
}

interface CurriculumContextValue {
  manifest: Manifest | null;
  loading: boolean;
  error: string | null;
  selectedSlug: string | null;
  selectConcept: (slug: string | null) => void;
}

const CurriculumContext = createContext<CurriculumContextValue | null>(null);

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

  // Fetch the manifest once on mount. It's bundled in the binary so this
  // call is effectively a memory read — no network involved.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await App.GetManifest();
        const parsed = JSON.parse(raw) as Manifest;
        if (!cancelled) {
          setManifest(parsed);
          // Auto-select the first AVAILABLE concept so a fresh launch
          // doesn't dump the student on an empty lesson panel.
          const firstAvailable = parsed.phases
            .flatMap((p) => p.concepts)
            .find((c) => c.available);
          if (firstAvailable) setSelectedSlug(firstAvailable.slug);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const value = useMemo<CurriculumContextValue>(
    () => ({
      manifest,
      loading,
      error,
      selectedSlug,
      selectConcept: (slug) => setSelectedSlug(slug),
    }),
    [manifest, loading, error, selectedSlug],
  );

  return <CurriculumContext.Provider value={value}>{children}</CurriculumContext.Provider>;
}

export function useCurriculum(): CurriculumContextValue {
  const ctx = useContext(CurriculumContext);
  if (!ctx) throw new Error("useCurriculum must be used inside <CurriculumProvider>");
  return ctx;
}

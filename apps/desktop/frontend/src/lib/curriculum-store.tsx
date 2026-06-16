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

// A Chapter is a derived UI grouping over a phase's flat concept list.
// We bucket by a "family" prefix in the slug so a 47-lesson phase
// turns into ~5 chapters with ~10 lessons each — comfortable to
// surface in the top-bar dropdown without scrolling forever.
export interface Chapter {
  id: string;
  title: string;
  concepts: ConceptListing[];
}

// Per-phase chapter rules. Each rule has a slug-suffix matcher (after
// the "phase-NN/" prefix). The first matching rule wins, in array
// order. Concepts that don't match any rule fall into a trailing
// "More" chapter so nothing gets dropped on the floor.
const CHAPTER_RULES: Record<string, { id: string; title: string; match: RegExp }[]> = {
  "phase-01": [
    { id: "intro",    title: "Intro · How the web works", match: /^(how-the-web-works|what-is-html)$/ },
    { id: "html",     title: "HTML",                       match: /^(html-|semantic-html)/ },
    { id: "css",      title: "CSS",                        match: /^(what-is-css|css-|box-model|flexbox|css-grid|responsive-design|css-transitions)/ },
    { id: "tailwind", title: "Tailwind",                   match: /^tailwind-/ },
    { id: "js",       title: "JavaScript",                 match: /^(what-is-javascript|js-|the-dom|dom-events|async-javascript)/ },
    { id: "react",    title: "React",                      match: /^(what-is-react|jsx-|react-)/ },
  ],
  "phase-02": [
    { id: "ts",       title: "TypeScript",                 match: /^(what-is-typescript|ts-)/ },
    { id: "next",     title: "Next.js",                    match: /^(what-is-next|next-|app-router)/ },
    { id: "ship",     title: "Ship your first site",       match: /^(deploy|domains|vercel|netlify)/ },
  ],
  "phase-03": [
    { id: "prep",     title: "Prep — App Router refresher", match: /^(app-router|route-groups|layouts|server-vs-client)/ },
    { id: "data",     title: "Data fetching",              match: /^(server-actions|fetching|streaming|loading-states)/ },
    { id: "auth",     title: "Auth + sessions",            match: /^(auth|sessions|middleware|cookies)/ },
    { id: "polish",   title: "Polish + deploy",            match: /^(seo|images|caching|deploy)/ },
  ],
  "phase-04": [
    { id: "separate", title: "Why split frontend + backend", match: /^(why-split|what-is-nodejs|node-modules)/ },
    { id: "express",  title: "Express core",               match: /^(express-routing|request-response|middleware|rest-endpoints)/ },
    { id: "data",     title: "Data + env",                 match: /^(express-postgres|env-config)/ },
    { id: "auth",     title: "Auth + validation",          match: /^(jwt-sessions|authorization|input-validation|cors)/ },
    { id: "ship",     title: "Stand up the API",           match: /^(separate-frontend-backend|milestone-standalone-api)/ },
  ],
};

// chaptersForPhase groups a phase's concepts into chapters. A concept
// that doesn't match any rule for its phase ends up in a "More"
// chapter so nothing silently disappears.
export function chaptersForPhase(phase: PhaseListing): Chapter[] {
  const rules = CHAPTER_RULES[phase.id] ?? [];
  const buckets = new Map<string, Chapter>();
  rules.forEach((r) => buckets.set(r.id, { id: r.id, title: r.title, concepts: [] }));
  const fallback: Chapter = { id: "more", title: "More", concepts: [] };

  for (const c of phase.concepts) {
    // Strip the "phase-NN/" prefix to match against the rule regexes.
    const suffix = c.slug.replace(/^phase-\d+\//, "");
    const rule = rules.find((r) => r.match.test(suffix));
    if (rule) buckets.get(rule.id)!.concepts.push(c);
    else fallback.concepts.push(c);
  }

  const out: Chapter[] = [];
  for (const r of rules) {
    const b = buckets.get(r.id)!;
    if (b.concepts.length > 0) out.push(b);
  }
  if (fallback.concepts.length > 0) out.push(fallback);
  return out;
}

// findContext locates which phase + chapter + index a concept slug
// belongs to. Used by the lesson view to render the top-bar
// dropdowns + the prev/next arrows.
export interface ConceptContext {
  phase: PhaseListing;
  chapter: Chapter;
  chapters: Chapter[];
  concept: ConceptListing;
  conceptIndex: number; // 0-based within the phase (not the chapter)
  flatConcepts: ConceptListing[];
}

export function findConceptContext(
  manifest: Manifest,
  slug: string,
): ConceptContext | null {
  for (const phase of manifest.phases) {
    const idx = phase.concepts.findIndex((c) => c.slug === slug);
    if (idx === -1) continue;
    const chapters = chaptersForPhase(phase);
    const concept = phase.concepts[idx];
    const chapter = chapters.find((ch) => ch.concepts.some((c) => c.slug === slug));
    if (!chapter) return null;
    return {
      phase,
      chapter,
      chapters,
      concept,
      conceptIndex: idx,
      flatConcepts: phase.concepts,
    };
  }
  return null;
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
        if (!cancelled) setManifest(parsed);
        // No longer auto-selects a concept — the new shell lands on
        // the Phase Picker, which drives selection explicitly via
        // navigation into /app/learn/$phase.
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

// Inert no-op shape returned by useCurriculum when no provider is
// mounted. See sync-provider.tsx for the pattern + the v0.3.x
// post-mortem.
const noopCurriculumContext: CurriculumContextValue = {
  manifest:      null,
  loading:       false,
  error:         null,
  selectedSlug:  null,
  selectConcept: () => {},
};

export function useCurriculum(): CurriculumContextValue {
  const ctx = useContext(CurriculumContext);
  return ctx ?? noopCurriculumContext;
}

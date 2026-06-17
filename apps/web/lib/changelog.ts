// Changelog data — the single source of truth for what shipped when.
// Surfaced on /changelog and used to drive the navbar's "What's new"
// hint. Add new entries to the TOP of the array.

export type ChangeKind = "feature" | "fix" | "polish" | "breaking";

export interface ChangelogEntry {
  /** SemVer string without the leading v. */
  version: string;
  /** ISO date the release was tagged. */
  releasedAt: string;
  /** One-line headline that anchors the entry visually. */
  headline: string;
  /** Categorised bullets. Empty categories collapse out of the UI. */
  highlights: { kind: ChangeKind; body: string }[];
  /** Optional GitHub release URL — auto-derived if omitted. */
  releaseUrl?: string;
}

const REPO = "MUKE-coder/gritlearn";

export const changelog: ChangelogEntry[] = [
  {
    version: "0.4.5",
    releasedAt: "2026-06-17",
    headline: "VSCode-style file tree",
    highlights: [
      { kind: "feature", body: "Drag-and-drop files between folders." },
      { kind: "feature", body: "Right-click a node for Cut / Copy / Paste / Duplicate / Copy Path / Reveal in File Explorer / Rename / Delete." },
      { kind: "polish",  body: "Cut nodes dim to half-opacity until you paste them." },
      { kind: "fix",     body: "Paste falls back to a 'copy of …' name when the destination already has one, so it never silently overwrites." },
    ],
  },
  {
    version: "0.4.4",
    releasedAt: "2026-06-17",
    headline: "Editor polish — themes, code blocks, file icons",
    highlights: [
      { kind: "feature", body: "New editor themes — Monokai Pro (default), Dracula, One Dark, GitHub Light. Switch from Settings." },
      { kind: "feature", body: "Code snippets in lessons now have syntax highlighting + a Copy button." },
      { kind: "feature", body: "Type-aware coloured icons in the file tree (HTML / CSS / JS / TS / JSON / MD / Go / Python / Rust / shell / images)." },
      { kind: "feature", body: "Manual Check-for-Updates button + Light/Dark toggle + clickable Online indicator in the title bar." },
      { kind: "feature", body: "Settings page expanded — font size, tab size, word wrap, minimap, auto-save (debounced) + delay." },
      { kind: "fix",     body: "Dropdown background was transparent due to a missing Tailwind alias — fixed." },
      { kind: "fix",     body: "Open-in-Editor button now opens the starter file in a tab + reveals the Files panel + has readable contrast." },
    ],
  },
  {
    version: "0.4.3",
    releasedAt: "2026-06-16",
    headline: "Boot.dev-style learning shell",
    highlights: [
      { kind: "feature", body: "New Phase Picker landing screen with per-phase progress bars (Web Frontend, Backend, …)." },
      { kind: "feature", body: "Focused two-pane lesson view: lesson content on the left, editor on the right, with a draggable splitter." },
      { kind: "feature", body: "Top bar with Chapter + Lesson dropdowns, dot row for chapter progress, Next button." },
      { kind: "feature", body: "Files panel collapsed by default — slides in only when toggled." },
      { kind: "feature", body: "In-app New File / New Folder / Rename / Delete actually work now (the old folder-plus button used to open the OS folder picker)." },
      { kind: "breaking", body: "The legacy three-pane curriculum-sidebar layout has been removed." },
    ],
  },
  {
    version: "0.4.2",
    releasedAt: "2026-06-16",
    headline: "Login + forgot-password fixes",
    highlights: [
      { kind: "fix",     body: "Desktop login redirect bug fixed (the client was reading the wrong token shape from the API)." },
      { kind: "feature", body: "Forgot-password / reset-password flow added end-to-end with 6-digit OTP via Resend." },
      { kind: "fix",     body: "Sentinel WAF no longer false-positives on legitimate auth payloads (was 403'ing valid signups)." },
      { kind: "fix",     body: "CORS now allows the Idempotency-Key header so POSTs no longer dead-end at the preflight." },
      { kind: "feature", body: "Phase 4 (Backend) lessons batches 1–4 added." },
    ],
  },
  {
    version: "0.4.1",
    releasedAt: "2026-06-15",
    headline: "Auth route limits + first-launch hardening",
    highlights: [
      { kind: "fix",     body: "Bumped auth-route rate limits from 5/3 to 30/20 requests per 15 minutes." },
      { kind: "fix",     body: "useSync / useProgress / useCurriculum / useWorkspace now noop-stub when their providers aren't mounted (no more black screen on first install)." },
    ],
  },
  {
    version: "0.4.0",
    releasedAt: "2026-06-14",
    headline: "Split-screen auth + OTP verification",
    highlights: [
      { kind: "feature", body: "Auth screens redesigned as split-screen with an editor mockup on the left." },
      { kind: "feature", body: "6-digit OTP email verification on signup via Resend." },
      { kind: "feature", body: "Full Phase 3 curriculum (21 lessons across 7 batches)." },
    ],
  },
];

/** Resolve the GitHub release URL for an entry. */
export function releaseUrl(entry: ChangelogEntry): string {
  return entry.releaseUrl ?? `https://github.com/${REPO}/releases/tag/v${entry.version}`;
}

/** Compact label used by category pills. */
export const KIND_LABEL: Record<ChangeKind, string> = {
  feature:  "New",
  fix:      "Fix",
  polish:   "Polish",
  breaking: "Breaking",
};

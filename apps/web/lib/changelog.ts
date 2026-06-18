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
    version: "0.4.11",
    releasedAt: "2026-06-18",
    headline: "VSCode-style chrome with Learning as a first-class activity",
    highlights: [
      { kind: "feature", body: "New Activity Bar on the left: Learning · Explorer · Search · Source Control · Extensions — plus Profile and Settings at the bottom." },
      { kind: "feature", body: "Menu Bar on top: File / Edit / Selection / View / Go / Terminal / Help, every entry wired to a real action." },
      { kind: "feature", body: "Resizable Sidebar per activity, widths persisted per-activity in localStorage." },
      { kind: "feature", body: "Learning sidebar — replaces the old phase top bar: phase chooser, prev/Next buttons, chapter outline tree, and the MDX lesson reader, with a draggable divider between outline and reader." },
      { kind: "feature", body: "Extensions panel: lists built-ins (Live Server, PTY Terminal, TypeScript LSP, Snippet Library) alongside installed plugins — install / enable / disable / uninstall." },
      { kind: "feature", body: "New keyboard shortcuts: Ctrl+1 Learning, Ctrl+Shift+E/F/G/X for Explorer/Search/Git/Extensions, Ctrl+J toggle bottom panel, Ctrl+` open terminal, Ctrl+, Settings." },
      { kind: "breaking", body: "Old phase top bar (Chapter / Lesson dropdowns + dot row + Files/Search/Terminal toggles) removed — its functions are now spread across the Activity Bar, Menu Bar, and Learning sidebar." },
    ],
  },
  {
    version: "0.4.10",
    releasedAt: "2026-06-17",
    headline: "Pro polish — status bar, Cmd+P, workspace persistence",
    highlights: [
      { kind: "feature", body: "Status bar at the bottom: git branch with ahead/behind counts, workspace name, cursor line:col, language, file, unsaved-file count." },
      { kind: "feature", body: "Cmd+P quick-open: fuzzy-search every file in the workspace and jump straight to it. Type 'app.tsx' to find apps/web/app.tsx, etc." },
      { kind: "feature", body: "Workspace persistence: launching the app re-opens your last folder and every open tab in its previous order. Pinned tabs survive 'Close Others' and 'Close All'." },
      { kind: "feature", body: "Open-at-line: clicking a search result scrolls the editor straight to the matching line." },
      { kind: "feature", body: "Tab right-click menu: close / close others / close to the right / close all / pin / unpin / copy path / reveal in explorer. Middle-click any tab to close it." },
      { kind: "feature", body: "Breadcrumbs above the editor showing workspace > folder > file. Click the workspace name to reveal the file tree." },
      { kind: "feature", body: "Recent folders in the command palette — switch workspaces without re-using the folder picker every time." },
    ],
  },
  {
    version: "0.4.9",
    releasedAt: "2026-06-17",
    headline: "Workspace search + Git source control",
    highlights: [
      { kind: "feature", body: "Workspace-wide search across the open folder — regex, case-sensitive, whole-word toggles, include/exclude globs, results grouped by file." },
      { kind: "feature", body: "Replace All — runs per-file via atomic temp-write so a mid-pass failure can't corrupt the workspace." },
      { kind: "feature", body: "Git panel writes: stage / unstage / discard per file, commit composer (Ctrl+Enter to commit), Push, Pull, branch indicator with ahead/behind counts." },
      { kind: "feature", body: "Non-repo folders show an 'Initialise a git repo here' button — no need to drop into the terminal for git init." },
      { kind: "polish",  body: "Side panel is now exclusive — Files and Search are mutually exclusive (they live in the same 260px column)." },
    ],
  },
  {
    version: "0.4.8",
    releasedAt: "2026-06-17",
    headline: "Full PTY terminal + plugin scaffolding",
    highlights: [
      { kind: "feature", body: "Real terminal — the Terminal tab is now xterm.js wired to a PTY (ConPTY on Windows, openpty on Unix). Ctrl+C signals, ncurses apps (vim, top), arrow-key history, the works." },
      { kind: "feature", body: "Plugin system — install single-file JS plugins from a URL via Settings. The JEditor global exposes commands, events (fileOpen / fileSaved), workspace.openFile, and UI toasts." },
      { kind: "feature", body: "Plugin manager in Settings: install, enable / disable, uninstall, see id + version + description." },
      { kind: "polish",  body: "Plugins are deliberately unsandboxed — the Settings page is explicit: 'treat them like any other code you'd run on your machine'." },
      { kind: "breaking", body: "Old line-based Terminal pane removed (the new PTY terminal replaces it)." },
    ],
  },
  {
    version: "0.4.7",
    releasedAt: "2026-06-17",
    headline: "Language services, snippets, and Git",
    highlights: [
      { kind: "feature", body: "Inline TypeScript / JavaScript diagnostics, hover docs, and autocomplete — Monaco's bundled TS worker is now wired up with JSX support and sensible defaults for student code." },
      { kind: "feature", body: "Curated snippet library for HTML / CSS / JS / TS / React / Go / Python. Type 'html5' + Tab for the boilerplate, 'flex' for a centered flex row, 'useState' for the React hook pair, 'errcheck' for the Go pattern." },
      { kind: "feature", body: "Git tab in the bottom panel: lists modified / added / deleted / untracked files with status badges, click to open, polls every 4 seconds." },
      { kind: "feature", body: "Monaco diff gutter — colored line strips for added (green), modified (amber), and deleted (red) lines, just like VSCode." },
      { kind: "polish",  body: "Silenced 'cannot find module' errors for student code so red squiggles only mean something the student actually wrote wrong." },
    ],
  },
  {
    version: "0.4.6",
    releasedAt: "2026-06-17",
    headline: "Integrated terminal + Live Server",
    highlights: [
      { kind: "feature", body: "Terminal button in the top bar opens a bottom panel — type any shell command (pnpm install, go run ., git status), see streamed output, hit Stop to cancel." },
      { kind: "feature", body: "Live Server tab in the same panel: click Go Live and the open folder is served from a local 127.0.0.1 port with auto-reload on every save (HTML / CSS / JS)." },
      { kind: "feature", body: "Quick-command buttons in the terminal adapt to the current phase (pnpm dev shows for Backend, ls for Frontend)." },
      { kind: "feature", body: "File tree keyboard shortcuts: F2 to rename, Delete to remove, Ctrl+X/C/V/D for cut/copy/paste/duplicate." },
      { kind: "feature", body: "Phase-aware editor defaults — the first time you visit Backend phase, tab size soft-switches to 4." },
    ],
  },
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

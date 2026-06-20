// Snip-specific code highlighter — Monaco's colorize uses stylesheet
// rules html-to-image can't resolve, so the snip image came out
// monochrome. Shiki's pre-bundled web entry produces self-contained
// HTML with `style="color:#…"` on every token span, which the
// rasteriser inlines cleanly.
//
// We import from "shiki/bundle/web" (NOT plain "shiki") so the wasm
// + grammars are bundled into the JS chunk by Vite at build time
// instead of fetched at runtime — Wails serves over a non-http
// scheme and runtime fetch() of grammars 404s.

import type { BundledLanguage, BundledTheme, HighlighterGeneric } from "shiki/bundle/full";

let highlighterPromise: Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> | null = null;

// Each Monaco editor theme maps to a matching Shiki theme so the
// snip's vibe lines up with the editor the student was just reading.
const MONACO_TO_SHIKI: Record<string, BundledTheme> = {
  monokai:        "monokai",
  dracula:        "dracula",
  "one-dark":     "one-dark-pro",
  "github-light": "github-light",
  "vs-dark":      "dark-plus",
};

// Pre-load every language a curriculum lesson or workspace file is
// likely to use. Anything outside falls back to "text" which renders
// in monochrome but at least lays out correctly.
const SUPPORTED_LANGS: BundledLanguage[] = [
  "javascript", "typescript", "jsx", "tsx",
  "html", "css", "scss", "less",
  "json", "yaml",
  "markdown", "mdx",
  "go", "rust", "python", "ruby", "java",
  "shellscript", "bash",
  "sql", "xml", "swift",
];

async function getHighlighter() {
  if (!highlighterPromise) {
    highlighterPromise = (async () => {
      // The /bundle/full entry inlines every grammar so we never
      // fetch at runtime — Wails serves over a non-http scheme and
      // Shiki's default grammar fetcher 404s there. Bundle is ~1MB
      // but only pulled the first time the user snips.
      const { createHighlighter } = await import("shiki/bundle/full");
      const hl = await createHighlighter({
        themes: ["monokai", "dracula", "one-dark-pro", "github-light", "dark-plus"],
        langs: SUPPORTED_LANGS,
      });
      return hl as HighlighterGeneric<BundledLanguage, BundledTheme>;
    })();
  }
  return highlighterPromise;
}

// Monaco language ids that Shiki names differently.
function normaliseLang(lang: string): BundledLanguage | null {
  const m: Record<string, BundledLanguage> = {
    shell: "shellscript",
    sh:    "shellscript",
    zsh:   "shellscript",
    js:    "javascript",
    ts:    "typescript",
    py:    "python",
    rb:    "ruby",
    rs:    "rust",
    yml:   "yaml",
    md:    "markdown",
  };
  const candidate = (m[lang] ?? lang) as BundledLanguage;
  return SUPPORTED_LANGS.includes(candidate) ? candidate : null;
}

/** highlightForSnip returns inline-coloured HTML for the supplied
 *  code. The caller wraps this in their snip frame.
 *
 *  Returns the raw `<pre class="shiki"…><code>…</code></pre>` Shiki
 *  produces so token colours, the background, AND the font-style
 *  italics on comments all transfer to the rasterised PNG. */
export async function highlightForSnip(
  code: string,
  lang: string,
  monacoTheme: string,
): Promise<string> {
  const shikiLang = normaliseLang(lang);
  if (!shikiLang) {
    return `<pre style="margin:0;color:#e4e4ee;font-family:'JetBrains Mono',ui-monospace,monospace;">${escapeHtml(code)}</pre>`;
  }
  const shikiTheme: BundledTheme = MONACO_TO_SHIKI[monacoTheme] ?? "monokai";
  try {
    const hl = await getHighlighter();
    return hl.codeToHtml(code, {
      lang: shikiLang,
      theme: shikiTheme,
    });
  } catch (err) {
    // Loud — without this the user gets a blank-white snip + no clue
    // why. Logged to console + bubbled visually in the caller.
    console.error("[snip-highlight] shiki failed", err);
    throw err;
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Snip themes — frame presets the Snip-as-image surface uses to
// wrap a code block before rasterising it. Each theme is a pure
// "what does the frame around the code look like" preset; the
// syntax colours inside the code come from the user's Monaco editor
// theme (so a snip always matches what they were just reading).
//
// Picked once in Settings and persisted via editor-prefs.

export type SnipThemeId =
  | "aurora"
  | "carbon"
  | "minimal"
  | "noir"
  | "classic";

export interface SnipTheme {
  id: SnipThemeId;
  label: string;
  description: string;
  /** Width in px the off-screen rasteriser renders the card at. */
  width: number;
  /** Outer container — the padded backdrop the card sits on. */
  wrapper: SnipStyle;
  /** Inner card — null = no card chrome, code sits directly on the wrapper. */
  card: SnipStyle | null;
  /** Header chrome — "mac" = traffic-light dots, "tab" = file-name tab,
   *  "none" = no header. */
  header: "mac" | "tab" | "none";
  /** Whether to render the JEDITOR watermark in the footer. */
  watermark: boolean;
  /** Body padding override (otherwise the default 20px is used). */
  bodyPadding?: string;
}

export interface SnipStyle {
  /** Inline CSS — applied verbatim. Plain object so we can clone it. */
  style: Record<string, string | number>;
}

/** Ray.so-style — dark navy gradient with grid, mac window, glowing footer. */
const aurora: SnipTheme = {
  id: "aurora",
  label: "Aurora",
  description: "Navy gradient with grid + mac window + bottom glow",
  width: 880,
  wrapper: {
    style: {
      padding: "56px 56px 72px",
      background:
        "radial-gradient(ellipse at top, #1e2454 0%, #0a0a18 55%, #050510 100%), " +
        "linear-gradient(135deg, #1a1f3a 0%, #0a0a18 60%, #1a0a2a 100%)",
      backgroundBlendMode: "screen, normal",
      backgroundImage:
        "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), " +
        "linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
      backgroundSize: "48px 48px, 48px 48px",
      backgroundColor: "#0a0a18",
      width: 880,
    },
  },
  card: {
    style: {
      borderRadius: 14,
      overflow: "hidden",
      background: "rgba(15, 18, 36, 0.78)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(120, 140, 200, 0.18)",
      boxShadow:
        "0 28px 60px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04), 0 0 80px rgba(95, 227, 176, 0.08)",
    },
  },
  header: "mac",
  watermark: true,
};

/** Carbon-style — file tab on a dark grid, classic carbon.now.sh feel. */
const carbon: SnipTheme = {
  id: "carbon",
  label: "Carbon",
  description: "File-tab header on a dark grid",
  width: 880,
  wrapper: {
    style: {
      padding: 56,
      background:
        "linear-gradient(rgba(95, 227, 176, 0.06) 1px, transparent 1px), " +
        "linear-gradient(90deg, rgba(95, 227, 176, 0.06) 1px, transparent 1px), #050510",
      backgroundSize: "44px 44px, 44px 44px, auto",
      width: 880,
    },
  },
  card: {
    style: {
      borderRadius: 14,
      overflow: "hidden",
      background: "#0a0a0d",
      border: "1px solid rgba(255,255,255,0.06)",
      boxShadow: "0 24px 60px rgba(0,0,0,0.55)",
    },
  },
  header: "tab",
  watermark: true,
};

/** Minimal — rounded card on a flat backdrop, no chrome. */
const minimal: SnipTheme = {
  id: "minimal",
  label: "Minimal",
  description: "Clean rounded card, no header chrome",
  width: 880,
  wrapper: {
    style: {
      padding: 64,
      background: "#0e0e12",
      width: 880,
    },
  },
  card: {
    style: {
      borderRadius: 18,
      overflow: "hidden",
      background: "#0a0a0d",
      border: "1px solid rgba(255,255,255,0.05)",
      boxShadow: "0 30px 80px rgba(0,0,0,0.6)",
    },
  },
  header: "none",
  watermark: true,
  bodyPadding: "32px 36px",
};

/** Noir — code floats on a black grid backdrop with no card. */
const noir: SnipTheme = {
  id: "noir",
  label: "Noir",
  description: "Code on a black grid, no card",
  width: 880,
  wrapper: {
    style: {
      padding: "80px 96px",
      background:
        "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), " +
        "linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px), #000",
      backgroundSize: "44px 44px, 44px 44px, auto",
      width: 880,
    },
  },
  card: null,
  header: "none",
  watermark: true,
  bodyPadding: "0",
};

/** Classic — the first-iteration mac-window vibe, kept for nostalgia. */
const classic: SnipTheme = {
  id: "classic",
  label: "Classic",
  description: "Mac window over a gradient — the original snip frame",
  width: 760,
  wrapper: {
    style: {
      padding: 40,
      background:
        "linear-gradient(135deg, #1a1a2a 0%, #0a0a0d 60%, #2a1535 100%)",
      width: 760,
    },
  },
  card: {
    style: {
      borderRadius: 16,
      overflow: "hidden",
      background: "#0a0a0d",
      border: "1px solid #25252e",
      boxShadow: "0 30px 80px rgba(0,0,0,0.55)",
    },
  },
  header: "mac",
  watermark: true,
};

export const SNIP_THEMES: SnipTheme[] = [aurora, carbon, minimal, noir, classic];

export const DEFAULT_SNIP_THEME: SnipThemeId = "aurora";

export function snipThemeById(id: SnipThemeId | undefined | null): SnipTheme {
  return SNIP_THEMES.find((t) => t.id === id) ?? aurora;
}

/** Build the HTML for a snip frame around the supplied highlighted code.
 *  `colorizedHtml` is the output of monaco.editor.colorize — already
 *  marked up with the per-token spans. */
export function renderSnipFrame(
  theme: SnipTheme,
  lang: string,
  colorizedHtml: string,
): string {
  const wrapperStyle = styleToString(theme.wrapper.style);
  const cardStyle = theme.card ? styleToString(theme.card.style) : "";
  const bodyPadding = theme.bodyPadding ?? "24px 28px";

  let headerHtml = "";
  if (theme.header === "mac") {
    headerHtml = `
      <div style="
        padding: 12px 18px;
        background: rgba(0,0,0,0.25);
        border-bottom: 1px solid rgba(255,255,255,0.05);
        display: flex;
        align-items: center;
        justify-content: space-between;
      ">
        <div style="display: flex; gap: 8px;">
          <span style="width: 13px; height: 13px; border-radius: 7px; background: #ff5f57; display: inline-block;"></span>
          <span style="width: 13px; height: 13px; border-radius: 7px; background: #febc2e; display: inline-block;"></span>
          <span style="width: 13px; height: 13px; border-radius: 7px; background: #28c840; display: inline-block;"></span>
        </div>
        <span style="
          font-size: 11px;
          color: rgba(255,255,255,0.45);
          letter-spacing: 1.6px;
          text-transform: uppercase;
          font-family: ui-monospace, monospace;
        ">${escapeHtml(lang || "text")}</span>
      </div>
    `;
  } else if (theme.header === "tab") {
    headerHtml = `
      <div style="
        padding: 18px 24px 0;
        background: transparent;
        border-bottom: 0;
      ">
        <span style="
          display: inline-block;
          padding: 8px 14px;
          border-bottom: 2px solid #5FE3B0;
          color: #5FE3B0;
          font-size: 12.5px;
          font-family: ui-monospace, monospace;
        ">${escapeHtml(filenameFor(lang))}</span>
      </div>
    `;
  }

  const watermarkHtml = theme.watermark
    ? `
      <div style="
        padding: 12px 18px;
        border-top: 1px solid rgba(255,255,255,0.04);
        font-size: 10.5px;
        color: #5FE3B0;
        font-family: ui-monospace, monospace;
        letter-spacing: 1.5px;
        text-transform: uppercase;
      ">jeditor · jbeditor.com</div>
    `
    : "";

  // `colorizedHtml` is Shiki's `<pre class="shiki" style="…"><code>…`
  // wrapper — it already carries the background-colour + per-token
  // inline colours we want. Drop it into a sized container that
  // applies padding without clobbering the colours.
  const bodyHtml = `
    <div style="
      padding: ${bodyPadding};
      font-family: 'JetBrains Mono', ui-monospace, monospace;
      font-size: 14px;
      line-height: 1.65;
      overflow: hidden;
    " class="jeditor-snip-body">${colorizedHtml}</div>
    <style>
      .jeditor-snip-body pre.shiki { background: transparent !important; margin: 0; padding: 0; overflow: visible; }
      .jeditor-snip-body pre.shiki code { background: transparent !important; padding: 0; font-family: 'JetBrains Mono', ui-monospace, monospace; }
      .jeditor-snip-body .line { display: block; }
    </style>
  `;

  if (theme.card) {
    return `
      <div style="${wrapperStyle} font-family: 'JetBrains Mono', ui-monospace, monospace;">
        <div style="${cardStyle}">
          ${headerHtml}
          ${bodyHtml}
          ${watermarkHtml}
        </div>
      </div>
    `;
  }
  // Naked frames (no card) — body sits directly on the wrapper.
  return `
    <div style="${wrapperStyle} font-family: 'JetBrains Mono', ui-monospace, monospace;">
      ${headerHtml}
      ${bodyHtml}
      ${watermarkHtml}
    </div>
  `;
}

function styleToString(style: Record<string, string | number>): string {
  return Object.entries(style)
    .map(([k, v]) => `${camelToKebab(k)}: ${v};`)
    .join(" ");
}

/** inlineMonacoTokenColors walks every span Monaco's colorize() produced
 *  inside `root` and copies the computed text colour to an inline style.
 *  Required for html-to-image to capture token colours — Monaco's theme
 *  rules use .monaco-editor descendant selectors that the rasteriser
 *  walks past but the inline-style pass guarantees the colour is there
 *  on the span itself.
 *
 *  Must be called AFTER the wrapper is inserted into the live DOM —
 *  getComputedStyle requires a layouted element. */
export function inlineMonacoTokenColors(root: HTMLElement) {
  const spans = root.querySelectorAll<HTMLElement>("span[class*='mtk']");
  spans.forEach((span) => {
    const cs = window.getComputedStyle(span);
    const color = cs.color;
    if (color) span.style.color = color;
    // Italic comments / bold keywords carry their styling on the class
    // too — pin those at the same time.
    const fs = cs.fontStyle;
    if (fs && fs !== "normal") span.style.fontStyle = fs;
    const fw = cs.fontWeight;
    if (fw && fw !== "400" && fw !== "normal") span.style.fontWeight = fw;
  });
}

function camelToKebab(s: string): string {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function filenameFor(lang: string): string {
  const m: Record<string, string> = {
    html:       "index.html",
    css:        "styles.css",
    javascript: "main.js",
    typescript: "main.ts",
    tsx:        "App.tsx",
    jsx:        "App.jsx",
    go:         "main.go",
    python:     "main.py",
    rust:       "main.rs",
    ruby:       "main.rb",
    shell:      "run.sh",
    json:       "data.json",
    yaml:       "config.yaml",
    markdown:   "README.md",
    swift:      "App.swift",
  };
  return m[lang] ?? "Untitled";
}

// CodeBlock — syntax-highlighted fenced code blocks for MDX lessons.
//
// MDX emits ```js\n...```  as <pre><code class="language-js">…</code></pre>
// In the renderer we map `pre` → this component, then we:
//   1. Pull the raw source + language name out of the children prop
//   2. Hand the text to Monaco's colorize() — gives us back coloured HTML
//      that mirrors the editor's own theme exactly (no Prism/Shiki dep)
//   3. Render a "Copy" button overlay so students can grab the snippet
//      without selecting + dragging the cursor across wrapped lines

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, Check, Copy, Loader2 } from "lucide-react";
import * as monaco from "monaco-editor";
import { renderSnipFrame, snipThemeById } from "@/lib/snip-themes";
import { highlightForSnip } from "@/lib/snip-highlight";
import { useEditorPrefs } from "@/lib/editor-prefs";
import "@/lib/monaco-setup";

// Crawl down the children tree to find the actual code element + its
// class (which carries the fence language). MDX wraps the fenced block
// like <pre><code className="language-js">…</code></pre> — we accept
// either shape (with-code-child, or bare text inside <pre>).
function extractCode(children: ReactNode): { code: string; lang: string } {
  let lang = "plaintext";
  let code = "";

  const walk = (node: unknown): void => {
    if (node == null) return;
    if (typeof node === "string") {
      code += node;
      return;
    }
    if (Array.isArray(node)) {
      node.forEach(walk);
      return;
    }
    if (typeof node === "object" && node !== null && "props" in node) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const el = node as { props?: any };
      const className: string = el.props?.className ?? "";
      const match = className.match(/language-(\w+)/);
      if (match) lang = normalizeLang(match[1]);
      walk(el.props?.children);
    }
  };

  walk(children);
  return { code: code.replace(/\n$/, ""), lang };
}

// Map fence aliases to Monaco language ids. Monaco recognises some
// directly but a few common ones (sh, jsx, etc.) need normalising.
function normalizeLang(raw: string): string {
  const m: Record<string, string> = {
    sh: "shell",
    bash: "shell",
    zsh: "shell",
    js: "javascript",
    jsx: "javascript",
    ts: "typescript",
    tsx: "typescript",
    md: "markdown",
    yml: "yaml",
    py: "python",
    rb: "ruby",
    rs: "rust",
  };
  return m[raw] ?? raw;
}

// Languages we deliberately DON'T run through Monaco's colorize:
// the output ends up as dark-on-dark, almost invisible, because
// Monaco's plaintext theme renders the foreground in the editor's
// muted "comment" colour. For ASCII diagrams (the <Illustration>
// content most commonly hit this) we want bright readable text.
const SKIP_COLORIZE = new Set([
  "plaintext",
  "text",
  "txt",
  "ascii",
  "diagram",
  "console",
  "output",
  "",
]);

interface CodeBlockProps {
  children?: ReactNode;
}

export function CodeBlock({ children }: CodeBlockProps) {
  const { code, lang } = extractCode(children);
  const { prefs } = useEditorPrefs();
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [snipping, setSnipping] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Skip Monaco for plaintext / unknown — Monaco's plaintext theme
    // renders dim grey on dark, which is unreadable for the ASCII
    // diagrams the curriculum uses heavily.
    if (SKIP_COLORIZE.has(lang)) {
      setHtml(null); // render escapeHtml(code) below
      return;
    }
    monaco.editor
      .colorize(code, lang, { tabSize: 2 })
      .then((rendered) => {
        if (!cancelled) setHtml(rendered);
      })
      .catch(() => {
        if (!cancelled) setHtml(null);
      });
    return () => {
      cancelled = true;
    };
  }, [code, lang]);

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      // Clipboard blocked (Wails should allow it). Surface visually anyway.
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  };

  // Snip — render the block into the user's chosen frame theme,
  // raster it, download. Uses html-to-image lazy-loaded so a
  // student who never snips doesn't pay the bundle cost.
  const onSnip = async () => {
    setSnipping(true);
    try {
      // Shiki produces inline-styled token spans the rasteriser can
      // capture without any external stylesheet — the Monaco
      // colorize output we use for the on-page block fell through
      // to monochrome inside the snip frame.
      let colored: string;
      try {
        colored = await highlightForSnip(code, lang, prefs.monacoTheme);
      } catch (err) {
        alert(`Snip highlighter failed to load: ${err}\n\nThe snip will render without syntax colours — check the devtools console.`);
        colored = `<pre style="margin:0;color:#e4e4ee;font-family:'JetBrains Mono',ui-monospace,monospace;">${code.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
      }
      const theme = snipThemeById(prefs.snipTheme);
      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position: fixed; left: -10000px; top: 0; z-index: -1;";
      wrapper.innerHTML = renderSnipFrame(theme, lang, colored);
      document.body.appendChild(wrapper);
      try {
        const target = wrapper.firstElementChild as HTMLElement | null;
        if (!target) throw new Error("snip frame missing");
        const { toPng } = await import("html-to-image");
        const dataUrl = await toPng(target, {
          pixelRatio: 2,
          cacheBust: true,
          backgroundColor: "transparent",
        });
        const link = document.createElement("a");
        link.download = `jeditor-snip-${theme.id}-${lang}-${Date.now()}.png`;
        link.href = dataUrl;
        link.click();
      } finally {
        document.body.removeChild(wrapper);
      }
    } catch (err) {
      console.error("[snip] failed", err);
      alert(`Snip failed: ${err}`);
    } finally {
      setSnipping(false);
    }
  };

  return (
    <div className="group relative my-4 overflow-hidden rounded-md border border-border bg-[#0a0a0d]">
      <div className="flex items-center justify-between border-b border-border-subtle bg-[#15151a] px-3 py-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-foreground-muted">
          {lang === "plaintext" ? "text" : lang}
        </span>
        <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
          <button
            onClick={() => void onSnip()}
            aria-label="Snip as image"
            title="Save as shareable PNG"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-foreground-muted hover:bg-surface-2 hover:text-foreground"
          >
            {snipping ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
            Snip
          </button>
          <button
            onClick={onCopy}
            aria-label="Copy code"
            className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-foreground-muted hover:bg-surface-2 hover:text-foreground"
          >
            {copied ? (
              <>
                <Check className="h-3 w-3 text-success" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3" />
                Copy
              </>
            )}
          </button>
        </div>
      </div>
      <div
        ref={ref}
        // Inline style forces the foreground colour to win over any
        // Monaco span that doesn't carry an explicit colour (the
        // plaintext theme is the worst offender — it omits a colour
        // and the ambient one was a near-black "comment" tone).
        style={{ color: "#e4e4ee" }}
        className="overflow-x-auto whitespace-pre px-4 py-3 font-mono text-[12.5px] leading-[1.55]"
        // colorize returns trusted HTML produced by Monaco — its
        // tokenisers strip nothing dangerous. dangerouslySetInnerHTML
        // is the right primitive here.
        dangerouslySetInnerHTML={
          html != null
            ? { __html: html }
            : { __html: escapeHtml(code) }
        }
      />
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

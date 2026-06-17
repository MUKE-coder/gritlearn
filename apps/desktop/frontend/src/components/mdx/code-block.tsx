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
import { Check, Copy } from "lucide-react";
import * as monaco from "monaco-editor";
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

interface CodeBlockProps {
  children?: ReactNode;
}

export function CodeBlock({ children }: CodeBlockProps) {
  const { code, lang } = extractCode(children);
  const [html, setHtml] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    // Monaco's colorize returns a Promise<string> of <span>-marked HTML.
    // It uses the current theme — so if the user is in dark mode, the
    // colors match the editor. Falls back to plain pre on error.
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

  return (
    <div className="group relative my-4 overflow-hidden rounded-md border border-border bg-[#0a0a0d]">
      <div className="flex items-center justify-between border-b border-border-subtle bg-[#15151a] px-3 py-1">
        <span className="font-mono text-[10px] uppercase tracking-wider text-foreground-muted">
          {lang === "plaintext" ? "text" : lang}
        </span>
        <button
          onClick={onCopy}
          aria-label="Copy code"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] text-foreground-muted opacity-0 transition-opacity hover:bg-surface-2 hover:text-foreground group-hover:opacity-100 focus:opacity-100"
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
      <div
        ref={ref}
        className="overflow-x-auto px-4 py-3 font-mono text-[12.5px] leading-[1.55] text-[#e4e4ee]"
        // colorize returns trusted HTML produced by Monaco — its
        // tokenisers strip nothing dangerous (they're consuming the
        // pre-tokenized stream, not arbitrary HTML from MDX). dangerouslySetInnerHTML
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

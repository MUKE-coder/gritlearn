"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import {
  ChevronRight,
  Circle,
  FileCode2,
  FolderOpen,
  Layers,
  Minus,
  Play,
  Square as SquareIcon,
  X,
} from "lucide-react";

// HeroEditor: a screenshot-fidelity mockup of the actual JEditor desktop
// app — the same shell visitors will see after they install. Three panes:
//
//   [ sidebar — curriculum tree ]  [ editor — Monaco-style ]  [ lesson — analogy text ]
//
// The "Run" button blinks; the editor's caret blinks; one curriculum
// row pulses as if it's the currently-being-worked-on concept. Two
// small GSAP timelines drive both — see useEffect at the bottom.

const lessonAccent = "var(--accent)";

const curriculum = [
  { phase: "phase-01 · web foundations", children: [
    { name: "how-the-web-works.mdx", done: true },
    { name: "what-is-html.mdx", done: true },
    { name: "html-document-structure.mdx", done: true },
    { name: "css-selectors.mdx", current: true },
    { name: "flexbox.mdx" },
    { name: "what-is-react.mdx" },
  ]},
  { phase: "phase-02 · programming foundations" },
  { phase: "phase-03 · next.js full-stack" },
];

const editorLines: Array<{ no: number; tokens: Array<{ t: string; cls?: string }>; }> = [
  { no:  1, tokens: [{ t: "// CSS selectors — the address system" }] },
  { no:  2, tokens: [] },
  { no:  3, tokens: [
    { t: ".card", cls: "tok-sel" },
    { t: " {" },
  ]},
  { no:  4, tokens: [
    { t: "  padding", cls: "tok-prop" },
    { t: ": " },
    { t: "1.5rem", cls: "tok-val" },
    { t: ";" },
  ]},
  { no:  5, tokens: [
    { t: "  border", cls: "tok-prop" },
    { t: ": " },
    { t: "1px solid", cls: "tok-val" },
    { t: " " },
    { t: "var(--border)", cls: "tok-fn" },
    { t: ";" },
  ]},
  { no:  6, tokens: [
    { t: "  border-radius", cls: "tok-prop" },
    { t: ": " },
    { t: "8px", cls: "tok-val" },
    { t: ";" },
  ]},
  { no:  7, tokens: [{ t: "}" }] },
  { no:  8, tokens: [] },
  { no:  9, tokens: [
    { t: ".card:hover", cls: "tok-sel" },
    { t: " {" },
  ]},
  { no: 10, tokens: [
    { t: "  transform", cls: "tok-prop" },
    { t: ": " },
    { t: "translateY(-2px)", cls: "tok-fn" },
    { t: ";" },
  ]},
  { no: 11, tokens: [{ t: "}" }] },
];

export function HeroEditor() {
  const caretRef = useRef<HTMLSpanElement>(null);
  const runRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const tweens: gsap.core.Tween[] = [];
    if (caretRef.current) {
      tweens.push(gsap.to(caretRef.current, {
        opacity: 0,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      }));
    }
    if (runRef.current) {
      tweens.push(gsap.to(runRef.current, {
        boxShadow: "0 0 0 6px rgba(95,227,176,0.18)",
        duration: 1.4,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      }));
    }
    if (dotRef.current) {
      tweens.push(gsap.to(dotRef.current, {
        scale: 1.6,
        opacity: 0.6,
        duration: 1.2,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      }));
    }
    return () => tweens.forEach((t) => t.kill());
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Soft glow behind the window */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-10 -z-10 rounded-[36px]"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--accent-soft), transparent 70%)",
        }}
      />

      <div className="rounded-xl border border-border bg-bg-secondary shadow-2xl shadow-black/40 overflow-hidden text-left">
        {/* ── Title bar ─────────────────────────────────────────────── */}
        <div className="flex items-center justify-between border-b border-border bg-bg-tertiary px-3 h-9">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-sm border border-accent/30 bg-accent/10">
              <span className="text-accent font-mono font-bold text-[10px]">J</span>
            </div>
            <span className="text-[11px] font-mono text-text-muted tracking-wider">
              JEditor — phase-01 / css-selectors.mdx
            </span>
          </div>
          <div className="flex items-center gap-2 text-text-muted">
            <Minus className="h-3 w-3" />
            <SquareIcon className="h-2.5 w-2.5" />
            <X className="h-3 w-3" />
          </div>
        </div>

        {/* ── Three-pane shell ──────────────────────────────────────── */}
        <div className="grid grid-cols-[210px_1fr_280px]">

          {/* Sidebar — curriculum tree */}
          <aside className="border-r border-border bg-bg-tertiary py-2.5 px-2 text-[12px]">
            <div className="flex items-center gap-1.5 px-1.5 mb-1.5 text-text-muted font-mono text-[10px] uppercase tracking-wider">
              <Layers className="h-3 w-3" />
              <span>curriculum</span>
            </div>
            {curriculum.map((phase) => (
              <div key={phase.phase} className="mb-1">
                <div className="flex items-center gap-1 px-1.5 py-0.5 text-text-secondary font-mono text-[10px]">
                  <ChevronRight className={`h-2.5 w-2.5 ${phase.children ? "rotate-90 text-accent" : ""}`} />
                  <FolderOpen className="h-3 w-3 text-text-muted" />
                  <span className="truncate">{phase.phase}</span>
                </div>
                {phase.children?.map((concept) => (
                  <div
                    key={concept.name}
                    className={`group flex items-center gap-1.5 rounded-sm pl-7 pr-1.5 py-0.5 font-mono text-[11px] ${
                      concept.current
                        ? "bg-accent/10 text-accent"
                        : concept.done
                        ? "text-text-secondary"
                        : "text-text-muted"
                    }`}
                  >
                    {concept.current && (
                      <span ref={dotRef} className="inline-block h-1.5 w-1.5 rounded-full bg-accent" />
                    )}
                    {!concept.current && concept.done && (
                      <Circle className="h-2 w-2 fill-success text-success" />
                    )}
                    {!concept.current && !concept.done && (
                      <Circle className="h-2 w-2 text-text-muted/50" />
                    )}
                    <FileCode2 className="h-3 w-3 shrink-0" />
                    <span className="truncate">{concept.name}</span>
                  </div>
                ))}
              </div>
            ))}
          </aside>

          {/* Editor pane — Monaco-style */}
          <div className="border-r border-border bg-bg-secondary">
            {/* Tab strip */}
            <div className="flex items-center border-b border-border bg-bg-tertiary px-2 h-7">
              <div className="flex items-center gap-1.5 rounded-t-sm border-b-2 border-accent bg-bg-secondary px-2.5 py-1 font-mono text-[10px] text-foreground">
                <FileCode2 className="h-2.5 w-2.5" />
                <span>style.css</span>
                <X className="h-2.5 w-2.5 text-text-muted" />
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 font-mono text-[10px] text-text-muted">
                <FileCode2 className="h-2.5 w-2.5" />
                <span>index.html</span>
              </div>
              <div className="ml-auto flex items-center gap-1">
                <div
                  ref={runRef}
                  className="flex items-center gap-1 rounded-sm border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent"
                >
                  <Play className="h-2.5 w-2.5" />
                  <span>Run</span>
                </div>
              </div>
            </div>

            {/* Code */}
            <div className="font-mono text-[12px] leading-[1.7] py-2">
              {editorLines.map((line, i) => (
                <div key={line.no} className="flex items-start group">
                  <span className="w-9 shrink-0 text-right pr-3 text-text-muted/60 select-none">
                    {line.no}
                  </span>
                  <span className="flex-1 text-text-secondary">
                    {line.tokens.length === 0 ? <>&nbsp;</> : (
                      <>
                        {line.tokens.map((t, j) => (
                          <span key={j} className={tokenClass(t.cls)}>{t.t}</span>
                        ))}
                        {i === 5 && (
                          <span ref={caretRef} className="inline-block w-px h-3.5 ml-px bg-accent align-middle" />
                        )}
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Lesson pane — analogy + run-style */}
          <aside className="bg-bg-tertiary px-3 py-3 text-[12px] leading-relaxed">
            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-accent mb-1">
              [analogy]
            </div>
            <p className="text-foreground/90 mb-3">
              A CSS selector is an <strong>address</strong>. The browser uses
              it to find which elements your rules apply to.
            </p>

            <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-info mb-1">
              [try it]
            </div>
            <p className="text-text-secondary mb-3">
              Open <span className="font-mono text-[11px] text-foreground">style.css</span>, change <span className="font-mono text-[11px] text-accent">border-radius</span> to <span className="font-mono text-[11px] text-foreground">16px</span>. The preview reloads instantly.
            </p>

            <div className="rounded-sm border border-border bg-bg-secondary p-2 mt-2">
              <div className="font-mono text-[9px] uppercase tracking-wider text-text-muted mb-1">progress</div>
              <div className="flex items-center justify-between text-[10px] font-mono text-text-secondary">
                <span>phase-01</span>
                <span className="text-accent">42/47</span>
              </div>
              <div className="mt-1 h-1 overflow-hidden rounded-full bg-bg-elevated">
                <div
                  className="h-full rounded-full bg-accent shadow-[0_0_12px_var(--accent-glow)]"
                  style={{ width: "89%" }}
                />
              </div>
            </div>
          </aside>
        </div>

        {/* Status bar */}
        <div className="flex items-center justify-between border-t border-border bg-bg-tertiary px-3 h-6 font-mono text-[10px] text-text-muted">
          <div className="flex items-center gap-3">
            <span className="text-accent">● connected</span>
            <span>UTF-8</span>
            <span>CSS</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Ln 6, Col 19</span>
            <span>v0.2.0</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Token styling — small palette of inline colors so the mockup feels
// like a real Monaco theme without us shipping Monaco. Mapped to the
// site's --accent / --info / --warning tokens so light/dark theme
// switching keeps the colors coherent.
function tokenClass(kind?: string): string {
  switch (kind) {
    case "tok-sel":  return "text-accent";
    case "tok-prop": return "text-info";
    case "tok-val":  return "text-warning";
    case "tok-fn":   return "text-accent/80";
    default:         return "text-text-secondary";
  }
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { Code, Sparkles, Terminal } from "lucide-react";

// Shared split-screen shell for /login, /register, /verify-email,
// /forgot-password. Left half is a JEditor mockup with a feature
// kicker; right half is the form (whatever the page passes via
// children). On narrow viewports the mockup collapses and only the
// right column shows so the form is still usable on phones.
export function AuthSplitLayout({
  children,
  kicker,
}: {
  children: React.ReactNode;
  // Small line of copy floating over the editor mockup. Page-specific
  // ("Sign in to your account", "Create your free account", etc).
  kicker?: string;
}) {
  return (
    <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-2">
      {/* ─── Left: editor mockup ──────────────────────────────────── */}
      <aside
        aria-hidden
        className="relative hidden overflow-hidden lg:flex lg:flex-col lg:items-center lg:justify-center lg:gap-6 lg:p-12"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 20%, var(--accent-soft), transparent 70%), linear-gradient(180deg, #0a0a0d 0%, #111114 100%)",
        }}
      >
        {/* Tech grid backdrop */}
        <div
          className="absolute inset-0 bg-tech-grid opacity-[0.4]"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 90%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 70% at 50% 50%, black 40%, transparent 90%)",
          }}
        />

        {/* Brand mark above the mockup */}
        <Link
          href="/"
          className="relative z-10 inline-flex items-center gap-2 text-foreground"
        >
          <Image
            src="/appicon.png"
            alt="JEditor"
            width={44}
            height={44}
            className="h-11 w-11 rounded-lg"
            priority
          />
          <span className="text-xl font-semibold tracking-tight">JEditor</span>
        </Link>

        {kicker && (
          <p className="relative z-10 max-w-md text-center text-[14px] text-text-secondary">
            {kicker}
          </p>
        )}

        {/* The mockup */}
        <EditorMockup />

        {/* Three little capability chips under the mockup */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 text-[11px] text-text-muted">
          <Chip icon={<Terminal className="h-3 w-3" />}>Runs offline</Chip>
          <Chip icon={<Code className="h-3 w-3" />}>21 Phase-3 lessons</Chip>
          <Chip icon={<Sparkles className="h-3 w-3" />}>Analogy-first</Chip>
        </div>
      </aside>

      {/* ─── Right: form ──────────────────────────────────────────── */}
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

function Chip({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-bg-secondary px-2.5 py-1 font-mono">
      {icon}
      {children}
    </span>
  );
}

// EditorMockup — small in-page rendering of what JEditor looks like on
// the desktop. Pure CSS / divs; no Monaco import here since this page
// has to feel instant. The mock evokes the three-pane editor shell
// (sidebar, code, lesson) so a visitor on the auth screen sees what
// they're signing up for.
function EditorMockup() {
  return (
    <div
      className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-xl border border-border bg-bg-secondary shadow-2xl shadow-black/40"
      style={{ boxShadow: "0 30px 80px -20px rgba(95,227,176,0.18)" }}
    >
      {/* Title bar */}
      <div className="flex items-center justify-between border-b border-border bg-bg-tertiary px-3 py-2">
        <div className="flex items-center gap-2">
          <Image
            src="/appicon.png"
            alt=""
            width={18}
            height={18}
            className="h-[18px] w-[18px] rounded-sm"
          />
          <span className="font-mono text-[10.5px] tracking-wider text-text-muted">
            JEditor — phase-03 / route-handlers / concept.mdx
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-text-muted">
          <span className="h-2 w-2 rounded-full bg-warning/60" />
          <span className="h-2 w-2 rounded-full bg-success/60" />
          <span className="h-2 w-2 rounded-full bg-danger/60" />
        </div>
      </div>

      {/* Three-pane body */}
      <div className="grid grid-cols-[100px_1fr_140px] font-mono text-[10.5px]">
        {/* Sidebar */}
        <div className="border-r border-border bg-bg-secondary/60 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wider text-text-muted">
            Phase 03
          </div>
          <ul className="mt-1.5 space-y-0.5 text-text-muted">
            <li>app-router</li>
            <li>server-vs-…</li>
            <li>data-fetch…</li>
            <li className="rounded-sm bg-accent/10 px-1 text-accent">
              route-handlers
            </li>
            <li>server-actions</li>
            <li>prisma</li>
            <li>auth.js</li>
          </ul>
        </div>

        {/* Code pane */}
        <div className="px-3 py-2.5">
          <span className="text-text-muted">{"// "}</span>
          <span className="text-text-muted">app/api/notes/route.ts</span>
          <br />
          <span style={{ color: "#38bdf8" }}>export async function</span>{" "}
          <span style={{ color: "#fbbf24" }}>GET</span>
          {`() {`}
          <br />
          {`  `}
          <span style={{ color: "#38bdf8" }}>const</span>{" "}
          notes = <span style={{ color: "#38bdf8" }}>await</span> db.note
          <span style={{ color: "#a1a1aa" }}>.findMany</span>();
          <br />
          {`  `}
          <span style={{ color: "#38bdf8" }}>return</span>{" "}
          <span style={{ color: "#fbbf24" }}>Response</span>.json(notes);
          <br />
          {`}`}
          <br />
          <span className="inline-block h-[10px] w-[2px] translate-y-[2px] bg-accent" />
        </div>

        {/* Lesson pane */}
        <div className="border-l border-border bg-bg-tertiary/50 px-2 py-2 text-[9.5px] leading-snug">
          <span className="inline-block rounded-sm bg-accent/15 px-1 text-accent">
            ANALOGY
          </span>
          <p className="mt-1 text-text-secondary">
            A route handler is one counter at the post office that knows one
            job.
          </p>
        </div>
      </div>

      {/* Status bar */}
      <div className="flex items-center justify-between border-t border-border bg-bg-tertiary px-3 py-1 font-mono text-[9.5px] text-text-muted">
        <span>
          <span className="text-accent">●</span> ready
        </span>
        <span>3 of 21 read · phase 03</span>
      </div>
    </div>
  );
}

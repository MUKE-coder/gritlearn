import { Code, Sparkles, Terminal } from "lucide-react";
import logoUrl from "@/assets/logo.png";

// Shared split-screen shell for the desktop /auth/login,
// /auth/register, /auth/verify-email pages. Left half: a JEditor
// editor mockup with feature chips. Right half: the page form.
// Mirrors apps/web/components/auth-split-layout so the marketing
// site and the desktop app feel like the same product.
export function AuthSplitLayout({
  children,
  kicker,
}: {
  children: React.ReactNode;
  kicker?: string;
}) {
  return (
    <div className="grid h-full w-full grid-cols-1 overflow-hidden lg:grid-cols-2">
      {/* ─── Left: editor mockup ──────────────────────────────────── */}
      <aside
        aria-hidden
        className="relative hidden flex-col items-center justify-center gap-5 p-10 lg:flex"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 30% 20%, var(--accent-soft), transparent 70%), linear-gradient(180deg, #0a0a0d 0%, #111114 100%)",
        }}
      >
        <div className="relative z-10 inline-flex items-center gap-2">
          <img src={logoUrl} alt="" className="h-10 w-10 rounded-lg" />
          <span className="text-xl font-semibold tracking-tight text-foreground">JEditor</span>
        </div>

        {kicker && (
          <p className="relative z-10 max-w-md text-center text-[13.5px] text-foreground-secondary">
            {kicker}
          </p>
        )}

        <EditorMockup />

        <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 text-[11px] text-foreground-muted">
          <Chip icon={<Terminal className="h-3 w-3" />}>Runs offline</Chip>
          <Chip icon={<Code className="h-3 w-3" />}>21 Phase-3 lessons</Chip>
          <Chip icon={<Sparkles className="h-3 w-3" />}>Analogy-first</Chip>
        </div>
      </aside>

      {/* ─── Right: form column ───────────────────────────────────── */}
      <main className="flex h-full items-center justify-center overflow-auto bg-background px-4 py-12">
        <div className="w-full max-w-md">{children}</div>
      </main>
    </div>
  );
}

function Chip({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-2.5 py-1 font-mono">
      {icon}
      {children}
    </span>
  );
}

function EditorMockup() {
  return (
    <div
      className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl"
      style={{ boxShadow: "0 30px 80px -20px rgba(95,227,176,0.18)" }}
    >
      <div className="flex items-center justify-between border-b border-border bg-surface-2 px-3 py-2">
        <div className="flex items-center gap-2">
          <img src={logoUrl} alt="" className="h-[18px] w-[18px] rounded-sm" />
          <span className="font-mono text-[10.5px] tracking-wider text-foreground-muted">
            JEditor — phase-03 / route-handlers / concept.mdx
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-foreground-muted">
          <span className="h-2 w-2 rounded-full bg-warning/60" />
          <span className="h-2 w-2 rounded-full bg-success/60" />
          <span className="h-2 w-2 rounded-full bg-danger/60" />
        </div>
      </div>

      <div className="grid grid-cols-[100px_1fr_130px] font-mono text-[10.5px]">
        <div className="border-r border-border bg-surface/60 px-2 py-2">
          <div className="text-[9px] uppercase tracking-wider text-foreground-muted">Phase 03</div>
          <ul className="mt-1.5 space-y-0.5 text-foreground-muted">
            <li>app-router</li>
            <li>server-vs-…</li>
            <li>data-fetch…</li>
            <li className="rounded-sm bg-accent/10 px-1 text-accent">route-handlers</li>
            <li>server-actions</li>
            <li>prisma</li>
            <li>auth.js</li>
          </ul>
        </div>

        <div className="px-3 py-2.5 text-foreground">
          <span className="text-foreground-muted">// app/api/notes/route.ts</span>
          <br />
          <span style={{ color: "#38bdf8" }}>export async function</span>{" "}
          <span style={{ color: "#fbbf24" }}>GET</span>
          {`() {`}
          <br />
          {`  `}
          <span style={{ color: "#38bdf8" }}>const</span>{" "}
          notes = <span style={{ color: "#38bdf8" }}>await</span> db.note.findMany();
          <br />
          {`  `}
          <span style={{ color: "#38bdf8" }}>return</span>{" "}
          <span style={{ color: "#fbbf24" }}>Response</span>.json(notes);
          <br />
          {`}`}
          <br />
          <span className="inline-block h-[10px] w-[2px] translate-y-[2px] bg-accent" />
        </div>

        <div className="border-l border-border bg-surface-2/60 px-2 py-2 text-[9.5px] leading-snug">
          <span className="inline-block rounded-sm bg-accent/15 px-1 text-accent">ANALOGY</span>
          <p className="mt-1 text-foreground-secondary">
            A route handler is one counter at the post office that knows one job.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-surface-2 px-3 py-1 font-mono text-[9.5px] text-foreground-muted">
        <span>
          <span className="text-accent">●</span> ready
        </span>
        <span>3 of 21 read · phase 03</span>
      </div>
    </div>
  );
}

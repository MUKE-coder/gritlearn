"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BookOpen,
  Cloud,
  Code2,
  Download,
  GitBranch,
  Layers,
  Lightbulb,
  Monitor,
  Sparkles,
  Terminal,
  WifiOff,
} from "lucide-react";

import {
  detectPlatform,
  fallbackRelease,
  getDownload,
  type Platform,
} from "@/lib/platform";
import { HeroEditor } from "@/components/hero-editor";
import {
  ScrollReveal,
  StaggerChildren,
  ScrollRevealItem,
} from "@/components/scroll-reveal";

export default function HomePage() {
  const [platform, setPlatform] = useState<Platform>("windows");
  useEffect(() => setPlatform(detectPlatform()), []);
  const primary =
    getDownload(fallbackRelease, platform) ?? fallbackRelease.downloads[0];

  return (
    <div className="flex flex-col bg-background">
      <Hero primaryLabel={primary.label} />
      <FeatureRow />
      <AnalogySection />
      <OfflineSection />
      <CurriculumPath />
      <LanguageCloud />
      <DownloadsTeaser />
      <FinalCTA />
    </div>
  );
}

// ─── Section heading utility ──────────────────────────────────────────
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-sm border border-accent/30 bg-accent/5 px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">
      <span className="h-1 w-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
      {children}
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────
function Hero({ primaryLabel }: { primaryLabel: string }) {
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      {/* Tech grid background with radial fade-out at edges */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 bg-tech-grid opacity-[0.55]"
          style={{
            maskImage:
              "radial-gradient(ellipse 75% 60% at 50% 35%, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 75% 60% at 50% 35%, black 30%, transparent 80%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 60% 50% at 50% 0%, var(--accent-soft), transparent 70%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-5xl px-6 pt-24 pb-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-sm border border-border bg-bg-secondary/80 px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary backdrop-blur"
        >
          <span className="h-1 w-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)] animate-pulse" />
          <span>preview · v0.1 · free during beta</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="text-balance text-[44px] font-bold leading-[1.04] tracking-tight sm:text-[64px]"
        >
          The code editor that{" "}
          <span className="bg-gradient-to-r from-accent to-info bg-clip-text text-transparent">
            teaches as you ship
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="mx-auto mt-7 max-w-2xl text-balance text-[17px] leading-relaxed text-text-secondary"
        >
          JEditor is a native desktop IDE with an analogy-first curriculum
          built in. Every concept opens with a real-world story, then a
          runnable example, then a project of your own. Works offline after
          one signup.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href="/register"
            className="group inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent px-6 py-3 text-sm font-semibold text-background shadow-[0_0_24px_var(--accent-glow)] hover:bg-accent-hover hover:shadow-[0_0_36px_var(--accent-glow)] transition-all"
          >
            Sign up free
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/download"
            className="group inline-flex items-center gap-2 rounded-md border border-border bg-bg-secondary/80 px-6 py-3 text-sm font-semibold text-foreground backdrop-blur hover:border-accent/40 hover:text-accent transition-all"
          >
            <Download className="h-4 w-4" />
            Download for {primaryLabel}
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.55 }}
          className="mt-3 font-mono text-[11px] text-text-muted"
        >
          $ one signup · works offline forever · no credit card · no AI generated content
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.55 }}
          className="mt-16"
        >
          <HeroEditor />
        </motion.div>
      </div>
    </section>
  );
}

// ─── Feature row ─────────────────────────────────────────────────────
function FeatureRow() {
  const items = [
    {
      icon: Lightbulb,
      title: "Analogies you already know",
      body: "Closures = a backpack. The DOM = a remote control. Every concept opens with something physical.",
    },
    {
      icon: Code2,
      title: "Runnable examples",
      body: "Two example projects per concept. Click → open → run. No copy-paste from blog posts.",
    },
    {
      icon: WifiOff,
      title: "Offline by design",
      body: "Whole curriculum bundled in the binary. Sign up once. Then a basement with no wifi works fine.",
    },
    {
      icon: BookOpen,
      title: "One sequenced path",
      body: "HTML → CSS → JS → React → Next → Go → Mobile → CS. Each concept ships with interview questions.",
    },
  ];
  return (
    <section className="border-b border-border/50 bg-bg-secondary/30">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <StaggerChildren className="grid gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
          {items.map((f, i) => (
            <ScrollRevealItem
              key={f.title}
              className="group relative bg-background p-6 transition-colors hover:bg-bg-secondary"
            >
              <span className="absolute left-3 top-3 font-mono text-[10px] text-text-muted">
                #{String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex h-9 w-9 items-center justify-center rounded-sm border border-accent/20 bg-accent/5 text-accent transition-all group-hover:border-accent/40 group-hover:shadow-[0_0_16px_var(--accent-glow)]">
                <f.icon className="h-4 w-4" />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-2 text-[13px] leading-relaxed text-text-secondary">
                {f.body}
              </p>
            </ScrollRevealItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

// ─── The analogy method ─────────────────────────────────────────────
function AnalogySection() {
  return (
    <section className="relative overflow-hidden border-b border-border/50">
      <div aria-hidden className="absolute inset-0 -z-10 bg-tech-dots opacity-[0.4]" />
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal>
            <Kicker>
              <Sparkles className="h-3 w-3" />
              the method
            </Kicker>
            <h2 className="mt-5 text-balance text-[34px] font-bold leading-[1.1] tracking-tight sm:text-[42px]">
              Most courses{" "}
              <span className="text-text-muted line-through decoration-2">tell</span>
              .
              <br />
              JEditor <span className="text-accent">shows</span>.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-secondary">
              Every concept opens with a real-world analogy. Then a runnable
              example you open in the editor. Then a project you build yourself.
              Same rhythm, every page.
            </p>
            <ul className="mt-7 space-y-3 text-[14px] text-foreground">
              <Bullet>Analogy first — a thing you&apos;ve already held.</Bullet>
              <Bullet>Illustration — diagram or short screen recording.</Bullet>
              <Bullet>Explanation — the why, before the syntax.</Bullet>
              <Bullet>Two example projects — open them, change them, break them.</Bullet>
              <Bullet>One exercise you ship to your own portfolio.</Bullet>
              <Bullet>Four interview questions you can actually answer.</Bullet>
            </ul>
          </ScrollReveal>

          <ScrollReveal delay={0.1}>
            <LessonPreview />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-2 font-mono text-[10px] text-accent">[+]</span>
      <span className="text-text-secondary">{children}</span>
    </li>
  );
}

function LessonPreview() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[28px]"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--accent-soft), transparent 70%)",
        }}
      />
      <div className="rounded-md border border-border bg-bg-secondary shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-2.5">
          <span className="font-mono text-[11px] text-text-muted">
            closures.mdx
          </span>
          <span className="font-mono text-[10px] text-accent">LIVE</span>
        </div>
        <div className="px-5 py-5 text-[14px] leading-relaxed space-y-3.5">
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
              [analogy]
            </span>
            <p className="mt-1.5 text-foreground">
              A <strong>closure</strong> is a backpack a function carries with it.
              When you hand the function off, the backpack goes too — even if you
              forget what you packed.
            </p>
          </div>
          <div className="rounded-sm border border-border/60 bg-bg-elevated p-3 font-mono text-[12px] text-text-secondary">
            <span className="text-info">function</span> makeCounter() {"{"}
            <br />
            &nbsp;&nbsp;<span className="text-info">let</span> count = 0{" "}
            <span className="text-text-muted">// in the backpack</span>
            <br />
            &nbsp;&nbsp;<span className="text-info">return</span> () =&gt; ++count
            <br />
            {"}"}
          </div>
          <div>
            <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-info">
              [try it]
            </span>
            <p className="mt-1.5 text-text-secondary">
              Open the example. Add a second counter. Notice they don&apos;t share
              their backpacks.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Offline section ─────────────────────────────────────────────────
function OfflineSection() {
  return (
    <section className="border-b border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <ScrollReveal>
            <OfflineCard />
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <Kicker>
              <WifiOff className="h-3 w-3" />
              offline by design
            </Kicker>
            <h2 className="mt-5 text-balance text-[34px] font-bold leading-[1.1] tracking-tight sm:text-[42px]">
              Built for{" "}
              <span className="text-accent">spotty internet</span>. On purpose.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-secondary">
              Browser-based platforms break the moment you lose connection.
              JEditor does the opposite: signup is the only step that touches
              the network. After that, the curriculum, the editor, and your
              progress all live on your laptop. We reconcile with the server
              whenever it next sees one — quietly, in the background.
            </p>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              <Pill icon={Download} title="One install" body="≈80 MB native binary" />
              <Pill icon={GitBranch} title="Local SQLite" body="Progress lives next to the lessons" />
              <Pill icon={Cloud} title="Background sync" body="Reconciles when wifi reappears" />
              <Pill icon={Terminal} title="Signed builds" body="Apple notarized, Windows signed" />
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

function Pill({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof WifiOff;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-sm border border-border bg-bg-secondary px-4 py-3 transition-colors hover:border-accent/30">
      <div className="flex items-center gap-2 text-[13px] font-semibold text-foreground">
        <Icon className="h-3.5 w-3.5 text-accent" />
        {title}
      </div>
      <p className="mt-1 text-[12px] text-text-muted">{body}</p>
    </div>
  );
}

function OfflineCard() {
  return (
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-6 -z-10 rounded-[28px]"
        style={{
          background:
            "radial-gradient(ellipse at center, var(--accent-soft), transparent 70%)",
        }}
      />
      <div className="rounded-md border border-border bg-bg-secondary p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-border/60 pb-3">
          <div className="flex items-center gap-2 font-mono text-[11px] text-text-secondary">
            <WifiOff className="h-3.5 w-3.5 text-text-muted" />
            <span>offline</span>
          </div>
          <span className="rounded-sm border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
            still learning
          </span>
        </div>
        <div className="mt-4 grid gap-3">
          <ProgressRow phase="phase-01 — web foundations" pct={100} />
          <ProgressRow phase="phase-02 — programming foundations" pct={12} />
          <ProgressRow phase="phase-03 — go services" pct={0} muted />
        </div>
        <div className="mt-5 flex items-center justify-between rounded-sm border border-border/60 bg-bg-elevated px-4 py-3 font-mono text-[11px]">
          <span className="text-text-secondary">47 concepts completed locally</span>
          <span className="text-accent">sync queued</span>
        </div>
      </div>
    </div>
  );
}

function ProgressRow({
  phase,
  pct,
  muted,
}: {
  phase: string;
  pct: number;
  muted?: boolean;
}) {
  return (
    <div>
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className={muted ? "text-text-muted" : "text-foreground"}>{phase}</span>
        <span className="text-text-secondary">{pct}%</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-bg-elevated">
        <div
          className={`h-full rounded-full ${
            muted
              ? "bg-text-muted/30"
              : "bg-accent shadow-[0_0_12px_var(--accent-glow)]"
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Curriculum path ────────────────────────────────────────────────
function CurriculumPath() {
  const phases = [
    { n: 1, name: "Web foundations", desc: "HTML, CSS, JavaScript, React, TypeScript", state: "live" as const, count: "47 concepts" },
    { n: 2, name: "Programming foundations", desc: "Scope, closures, modules, Git, debugging", state: "next" as const, count: "20 concepts" },
    { n: 3, name: "Backend with Go", desc: "Gin, GORM, REST, real DB", state: "queued" as const, count: "28 concepts" },
    { n: 4, name: "Mobile with Expo", desc: "Ship to iOS + Android", state: "queued" as const, count: "22 concepts" },
    { n: 5, name: "Desktop with Wails", desc: "Native apps from the same JS", state: "queued" as const, count: "15 concepts" },
    { n: 6, name: "CS foundations", desc: "Data structures, algorithms, interviews", state: "queued" as const, count: "30 concepts" },
  ];
  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-bg-secondary/30">
      <div aria-hidden className="absolute inset-0 -z-10 bg-tech-grid opacity-[0.3]" style={{
        maskImage: "radial-gradient(ellipse 80% 80% at 50% 50%, black 40%, transparent 90%)",
      }} />
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="text-center">
          <ScrollReveal>
            <Kicker>
              <Layers className="h-3 w-3" />
              the path
            </Kicker>
            <h2 className="mt-5 text-balance text-[34px] font-bold leading-[1.1] tracking-tight sm:text-[42px]">
              One sequenced path.
              <br />
              <span className="text-text-muted">Not 47 tabs.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-[15px] leading-relaxed text-text-secondary">
              The phases stack. Each one ends in a portfolio project that uses
              everything from the phases before it.
            </p>
          </ScrollReveal>
        </div>

        <StaggerChildren className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {phases.map((p) => (
            <ScrollRevealItem
              key={p.n}
              className={`relative rounded-md border bg-bg-secondary p-5 transition-all hover:-translate-y-1 ${
                p.state === "live"
                  ? "border-accent/50 shadow-[0_0_24px_var(--accent-glow)]"
                  : "border-border hover:border-accent/30"
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`font-mono text-[11px] ${
                    p.state === "live" ? "text-accent" : "text-text-muted"
                  }`}
                >
                  phase-{String(p.n).padStart(2, "0")}
                </span>
                {p.state === "live" && (
                  <span className="rounded-sm border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-accent">
                    LIVE
                  </span>
                )}
                {p.state === "next" && (
                  <span className="rounded-sm border border-warning/40 bg-warning/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-warning">
                    NEXT
                  </span>
                )}
              </div>
              <h3 className="mt-3 text-[16px] font-semibold text-foreground">
                {p.name}
              </h3>
              <p className="mt-1 text-[13px] text-text-secondary">{p.desc}</p>
              <p className="mt-4 font-mono text-[11px] text-text-muted">
                {p.count}
              </p>
            </ScrollRevealItem>
          ))}
        </StaggerChildren>
      </div>
    </section>
  );
}

// ─── Language cloud ─────────────────────────────────────────────────
function LanguageCloud() {
  const langs = [
    "HTML", "CSS", "JavaScript", "TypeScript", "React", "Next.js",
    "Tailwind", "Node.js", "Go", "SQL", "PostgreSQL", "Git",
    "Bash", "Docker", "Expo", "React Native", "Wails", "REST",
  ];
  return (
    <section className="border-b border-border/50">
      <div className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1.2fr]">
          <ScrollReveal>
            <Kicker>
              <Monitor className="h-3 w-3" />
              the stack
            </Kicker>
            <h2 className="mt-5 text-balance text-[34px] font-bold leading-[1.1] tracking-tight sm:text-[42px]">
              Every language you&apos;ll need to ship.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-text-secondary">
              No bouncing between courses. The path covers the entire stack a
              modern developer ships — from the markup that builds the page to
              the API that powers it to the mobile app that consumes it.
            </p>
          </ScrollReveal>
          <ScrollReveal delay={0.1}>
            <StaggerChildren stagger={0.04} className="flex flex-wrap gap-2">
              {langs.map((l) => (
                <ScrollRevealItem
                  key={l}
                  className="rounded-sm border border-border bg-bg-secondary px-3 py-1.5 font-mono text-[12px] text-text-secondary transition-all hover:border-accent/50 hover:text-accent hover:shadow-[0_0_12px_var(--accent-glow)]"
                >
                  {l}
                </ScrollRevealItem>
              ))}
            </StaggerChildren>
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}

// ─── Downloads teaser ────────────────────────────────────────────────
function DownloadsTeaser() {
  return (
    <section className="relative overflow-hidden border-b border-border/50 bg-bg-secondary/30">
      <div aria-hidden className="absolute inset-0 -z-10 bg-tech-dots opacity-[0.3]" />
      <div className="mx-auto max-w-4xl px-6 py-24 text-center">
        <ScrollReveal>
          <Kicker>
            <Download className="h-3 w-3" />
            get it
          </Kicker>
          <h2 className="mt-5 text-balance text-[34px] font-bold leading-[1.1] tracking-tight sm:text-[42px]">
            Native builds for Mac, Windows, and Linux.
          </h2>
          <p className="mt-5 text-[15px] leading-relaxed text-text-secondary">
            ≈80 MB. The whole curriculum ships inside. Signed and notarized.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/download"
              className="group inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent px-6 py-3 text-sm font-semibold text-background shadow-[0_0_24px_var(--accent-glow)] hover:bg-accent-hover hover:shadow-[0_0_36px_var(--accent-glow)] transition-all"
            >
              See all downloads
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-bg-secondary px-6 py-3 text-sm font-semibold text-foreground hover:border-accent/40 hover:text-accent transition-all"
            >
              Or start with the account
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

// ─── Final CTA ───────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10">
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 50% 50%, var(--accent-soft), transparent 60%)",
          }}
        />
      </div>
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <ScrollReveal>
          <h2 className="text-balance text-[36px] font-bold leading-[1.05] tracking-tight sm:text-[44px]">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-[15px] text-text-secondary">
            Sign up takes about thirty seconds. Then the editor opens, the
            curriculum sidebar lists every phase, and you pick your first
            concept.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent px-6 py-3 text-sm font-semibold text-background shadow-[0_0_24px_var(--accent-glow)] hover:bg-accent-hover hover:shadow-[0_0_36px_var(--accent-glow)] transition-all"
            >
              Sign up free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/download"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-bg-secondary px-6 py-3 text-sm font-semibold text-foreground hover:border-accent/40 hover:text-accent transition-all"
            >
              <Download className="h-4 w-4" /> Download
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}

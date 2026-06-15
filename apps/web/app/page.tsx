"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  Code2,
  Lightbulb,
  Plug,
  WifiOff,
  Download,
  ShieldCheck,
} from "lucide-react";
import {
  detectPlatform,
  downloads,
  getDownload,
  type Platform,
} from "@/lib/platform";

export default function HomePage() {
  // Pick the most likely platform on mount so the hero CTA is useful by
  // default; the visitor can still click any of the four tiles below.
  const [platform, setPlatform] = useState<Platform>("windows");
  useEffect(() => setPlatform(detectPlatform()), []);
  const primary = getDownload(platform);

  return (
    <div className="flex flex-col">
      {/* ─── Hero ─────────────────────────────────────────────────── */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-3xl px-6 pt-24 pb-20 text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-border bg-bg-secondary px-3.5 py-1 text-[12px] text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span>v1.0 — free while in beta</span>
          </div>

          <h1 className="text-balance text-[44px] font-bold leading-[1.05] tracking-tight sm:text-[56px]">
            Code you can{" "}
            <span className="bg-gradient-to-r from-accent via-accent-hover to-info bg-clip-text text-transparent">
              finally see
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-[17px] leading-relaxed text-text-secondary">
            GritLearn is a native desktop code editor with an analogy-first
            curriculum baked in. Every concept opens with a real-world story,
            then a runnable example, then a project of your own. It works
            offline, so you can keep going on flaky internet — or none at all.
          </p>

          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Sign up free <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={primary.url}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-5 py-3 text-sm font-semibold text-foreground hover:bg-bg-hover transition-colors"
            >
              <Download className="h-4 w-4" />
              Download for {primary.label}
            </a>
          </div>
          <p className="mt-3 text-[12px] text-text-muted">
            One signup. Works offline after that. No credit card. No AI features
            (and no AI generated content — every page is hand-written).
          </p>

          {/* Editor screenshot stand-in — a code window mockup. Real screenshot
              slots in here at B12 polish. */}
          <div className="mx-auto mt-14 max-w-xl rounded-xl border border-border bg-bg-secondary shadow-2xl overflow-hidden text-left">
            <div className="flex items-center gap-2 border-b border-border px-3.5 py-2">
              <div className="h-2.5 w-2.5 rounded-full bg-danger/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
              <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
              <span className="ml-2 font-mono text-[11px] text-text-muted">
                how-the-web-works.mdx — gritlearn
              </span>
            </div>
            <div className="px-5 py-4 font-mono text-[13px] leading-relaxed space-y-1.5">
              <p className="text-foreground">
                <span className="text-info">## </span>How the web works
              </p>
              <p className="text-text-muted">
                Opening a web page is exactly like ordering food at a
                restaurant.
              </p>
              <p className="text-text-muted">
                <span className="text-success"># You </span>
                decide what you want.
              </p>
              <p className="text-text-muted">
                <span className="text-success"># The waiter </span>
                carries your order to the kitchen.
              </p>
              <p className="text-text-muted">
                <span className="text-success"># The kitchen </span>
                prepares it and sends a tray back.
              </p>
              <p className="text-text-muted">
                <span className="text-success"># The dish </span>
                lands on your table. You eat it.
              </p>
              <p className="pt-1 text-accent">
                ←{" "}
                <span className="text-text-muted">
                  this is one lesson. every concept opens this way.
                </span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─────────────────────────────────────────────── */}
      <section id="features" className="border-b border-border/40 bg-bg-secondary/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-[32px] font-bold tracking-tight">
              Most courses tell. GritLearn shows.
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              Four things every concept ships with — every time.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            <Feature
              icon={Lightbulb}
              title="An analogy you already know"
              body="Closures = a backpack a function carries. The DOM = a remote control for the page. Recursion = Russian nesting dolls. Every concept opens with something physical you've held before — so the code stops being abstract."
            />
            <Feature
              icon={Code2}
              title="A runnable example, not a screenshot"
              body="Each concept ships with at least two example projects you open in the built-in editor and run. No copy-pasting from a blog post. No environment setup. Click → open → run."
            />
            <Feature
              icon={WifiOff}
              title="Offline as a feature, not a fallback"
              body="The entire curriculum is bundled in the binary. Sign up once, then learn on the bus, in a basement, on a coffee-shop wifi that won't authenticate. Your progress is stored locally and syncs whenever you reconnect."
            />
            <Feature
              icon={BookOpen}
              title="One sequenced path. Not 47 tabs."
              body="HTML → CSS → JS → React → Next.js → Go → Mobile → Desktop → CS foundations → portfolio. Each concept has interview questions. The editor grows in capability as you advance."
            />
          </div>
        </div>
      </section>

      {/* ─── How it works ─────────────────────────────────────────── */}
      <section id="how-it-works" className="border-b border-border/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-[32px] font-bold tracking-tight">How it works</h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              Three steps. Then the network is optional forever.
            </p>
          </div>

          <ol className="mt-14 grid gap-6 md:grid-cols-3">
            <Step
              number={1}
              icon={Download}
              title="Download the app"
              body="Native binary for macOS, Windows, and Linux. Around 80MB. The whole curriculum ships inside it — no separate download."
            />
            <Step
              number={2}
              icon={Plug}
              title="Sign up once"
              body="The only step that needs the internet. We use it to count who's learning and to deliver curriculum updates."
            />
            <Step
              number={3}
              icon={WifiOff}
              title="Learn offline. Forever."
              body="Cached identity, bundled lessons, local SQLite progress. Pull the wifi cable mid-lesson — nothing breaks."
            />
          </ol>
        </div>
      </section>

      {/* ─── Offline callout ──────────────────────────────────────── */}
      <section className="border-b border-border/40 bg-bg-secondary/40">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-success/15 mb-5">
            <WifiOff className="h-5 w-5 text-success" />
          </div>
          <h2 className="text-[28px] font-bold tracking-tight">
            Built for spotty internet — by design.
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-text-secondary leading-relaxed">
            Browser-based learning platforms break the moment you lose
            connection. GritLearn does the opposite: signup is the only step
            that touches the network. After that, the curriculum, the editor,
            and your progress all live on your laptop. The app reconciles with
            our server whenever it next sees one — quietly, in the background.
          </p>
        </div>
      </section>

      {/* ─── Downloads ────────────────────────────────────────────── */}
      <section id="download" className="border-b border-border/40">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <div className="text-center">
            <h2 className="text-[32px] font-bold tracking-tight">
              Download GritLearn
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-text-secondary">
              v1.0 — free during beta. Pick the build for your machine.
            </p>
          </div>

          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {downloads.map((d) => (
              <a
                key={d.platform}
                href={d.url}
                className={`group flex items-start gap-4 rounded-xl border bg-bg-secondary p-5 transition-all ${
                  d.platform === platform
                    ? "border-accent/60 ring-1 ring-accent/40"
                    : "border-border hover:border-accent/30"
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                  <Download className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{d.label}</h3>
                    {d.platform === platform && (
                      <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">{d.detail}</p>
                  <p className="mt-2 font-mono text-[11px] text-text-muted">
                    {d.filename}
                  </p>
                </div>
              </a>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-center gap-2 text-[12px] text-text-muted">
            <ShieldCheck className="h-3.5 w-3.5 text-success" />
            <span>
              SHA-256 checksums + signed builds (Apple Notarized, Windows
              code-signed). Verified at install.
            </span>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-[32px] font-bold tracking-tight">
            Ready when you are.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">
            Sign up takes about thirty seconds. Then the editor opens, the
            curriculum sidebar lists every phase, and you can pick your first
            concept. Patient, precise, encouraging — and finally,{" "}
            <em>visible</em>.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Sign up free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/#download"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-5 py-3 text-sm font-semibold text-foreground hover:bg-bg-hover transition-colors"
            >
              <Download className="h-4 w-4" /> See downloads
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

interface FeatureProps {
  icon: typeof Lightbulb;
  title: string;
  body: string;
}

function Feature({ icon: Icon, title, body }: FeatureProps) {
  return (
    <div className="rounded-xl border border-border bg-bg-elevated p-6">
      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
    </div>
  );
}

interface StepProps {
  number: number;
  icon: typeof Download;
  title: string;
  body: string;
}

function Step({ number, icon: Icon, title, body }: StepProps) {
  return (
    <li className="relative rounded-xl border border-border bg-bg-elevated p-6">
      <span className="absolute -top-3 left-5 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-white">
        Step {number}
      </span>
      <div className="mt-2 flex h-9 w-9 items-center justify-center rounded-lg bg-accent/15 text-accent">
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">{body}</p>
    </li>
  );
}

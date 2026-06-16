"use client";

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Calendar,
  Download,
  ExternalLink,
  Github,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { type ReleaseInfo } from "@/lib/platform";

// Display-only client component. The server component (page.tsx) hits
// /api/desktop/latest once, server-side, and passes the typed
// ReleaseInfo down here.
//
// v0.3 update: we no longer surface a per-OS grid. The user clicks
// ONE big "Download for Windows" button → grabs the ~200 MB
// JEditor-Setup-vX.Y.Z.exe → the installer wizard handles everything
// from there. Subsequent versions roll out via the in-app auto-updater
// (the binary-swap-and-relaunch flow built in v0.3.0), so the marketing
// site never needs a "Update to v0.3.1" tile.
//
// macOS + Linux builds will appear under "Other platforms" once those
// release artefacts land on GitHub.
export function DownloadPageClient({ release }: { release: ReleaseInfo }) {
  const released = formatReleaseDate(release.releasedAt);
  const couldntReach = release.source === "fallback";

  // Size label uses installerSize (the ~200 MB Setup .exe) — NOT the
  // size of the entries in release.downloads which point at the 32 MB
  // portable .exe the auto-updater uses. The previous wiring showed
  // 32 MB next to the Setup download button.
  const sizeLabel =
    release.installerSize && release.installerSize > 0
      ? `${Math.round(release.installerSize / (1024 * 1024))} MB`
      : "~200 MB";

  return (
    <div className="relative flex flex-col">
      {/* Tech grid + accent halo behind the header */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[480px]">
        <div
          className="absolute inset-0 bg-tech-grid opacity-[0.45]"
          style={{
            maskImage:
              "radial-gradient(ellipse 70% 70% at 50% 30%, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 70% at 50% 30%, black 30%, transparent 80%)",
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

      {/* ─── Header ──────────────────────────────────────────────── */}
      <section className="border-b border-border/50">
        <div className="mx-auto max-w-4xl px-6 pt-24 pb-14 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-sm border border-accent/30 bg-accent/5 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-accent backdrop-blur">
            <span className="h-1 w-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)] animate-pulse" />
            <span>
              v{release.version}
              {released && <> · released {released}</>}
            </span>
          </div>

          <h1 className="text-balance text-[42px] font-bold leading-[1.04] tracking-tight sm:text-[56px]">
            Download{" "}
            <span className="bg-gradient-to-r from-accent to-info bg-clip-text text-transparent">
              JEditor
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-[16px] leading-relaxed text-text-secondary">
            One installer, then offline forever. Sign in once to register the
            machine — the editor, the curriculum, and every future update live
            on your laptop after that.
          </p>

          {couldntReach && (
            <p className="mx-auto mt-4 max-w-2xl text-[12px] text-text-muted">
              Showing the latest version we know about — the download below
              goes straight to GitHub.
            </p>
          )}
        </div>
      </section>

      {/* ─── The one Setup card ──────────────────────────────────── */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <a
            href={release.installerUrl}
            className="group relative block overflow-hidden rounded-2xl border border-accent/40 bg-bg-secondary p-8 shadow-[0_0_60px_var(--accent-glow)] transition-all hover:-translate-y-1 hover:border-accent/60 hover:shadow-[0_0_90px_var(--accent-glow)]"
          >
            {/* Subtle accent glow corner */}
            <div
              aria-hidden
              className="absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-40 blur-3xl"
              style={{ background: "var(--accent-soft)" }}
            />

            <div className="relative flex flex-col items-center gap-8 text-center sm:flex-row sm:text-left">
              <Image
                src="/appicon.png"
                alt=""
                width={96}
                height={96}
                className="h-24 w-24 rounded-xl shadow-lg"
              />
              <div className="flex-1">
                <div className="mb-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground">
                    JEditor for Windows
                  </h2>
                  <span className="rounded-sm border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
                    Recommended
                  </span>
                </div>
                <p className="text-sm text-text-secondary">
                  Windows 10 / 11, 64-bit. Full installer with everything
                  bundled — no extra downloads at install time.
                </p>
                <p className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 font-mono text-[11px] text-text-muted sm:justify-start">
                  <span>$ JEditor-Setup-v{release.version}.exe</span>
                  <span aria-hidden>·</span>
                  <span>{sizeLabel}</span>
                  <span aria-hidden>·</span>
                  <span>WebView2 included</span>
                </p>
              </div>
              <div className="inline-flex shrink-0 items-center gap-2 rounded-md border border-accent/30 bg-accent px-6 py-3 text-sm font-semibold text-background shadow-[0_0_24px_var(--accent-glow)] transition-all group-hover:translate-x-0.5 group-hover:bg-accent-hover">
                <Download className="h-4 w-4" />
                Download
              </div>
            </div>
          </a>

          {/* Auto-update reassurance */}
          <div className="mt-6 flex items-start gap-3 rounded-md border border-border/50 bg-bg-secondary/60 p-4 text-sm text-text-secondary">
            <RefreshCw className="h-4 w-4 shrink-0 text-accent" />
            <p>
              <span className="font-semibold text-foreground">
                You only install once.
              </span>{" "}
              Every future release ships through the in-app updater — JEditor
              quietly downloads the new build in the background and asks
              before restarting.
            </p>
          </div>

          {/* Trust line + GitHub link */}
          <div className="mt-10 flex flex-col items-center justify-center gap-3 text-[12px] text-text-muted sm:flex-row">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              <span>SHA-256 checksums on each release.</span>
            </div>
            <a
              href={release.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              View on GitHub
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Other platforms ─────────────────────────────────────── */}
      <section className="border-b border-border/40 bg-bg-secondary/30">
        <div className="mx-auto max-w-3xl px-6 py-14">
          <div className="mb-4 inline-flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-text-muted">
            <Sparkles className="h-3 w-3" />
            <span>Other platforms</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {["macOS (Apple Silicon)", "macOS (Intel)", "Linux"].map((label) => (
              <div
                key={label}
                className="rounded-md border border-border/60 bg-bg-secondary p-4 opacity-70"
              >
                <p className="text-sm font-medium text-foreground">{label}</p>
                <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.15em] text-text-muted">
                  Coming soon
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[12px] text-text-muted">
            macOS and Linux builds land as soon as the cross-platform release
            pipeline is finished. Subscribe on{" "}
            <a
              href={release.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="text-accent hover:text-accent-hover"
            >
              GitHub
            </a>{" "}
            to get notified.
          </p>
        </div>
      </section>

      {/* ─── Release notes ────────────────────────────────────────── */}
      {release.releaseNotes && (
        <section className="border-b border-border/40">
          <div className="mx-auto max-w-3xl px-6 py-16">
            <div className="mb-6 flex items-center gap-2 text-sm text-text-secondary">
              <Calendar className="h-4 w-4" />
              <span>
                What&apos;s in v{release.version}
                {released && <> — {released}</>}
              </span>
            </div>
            <ReleaseNotes notes={release.releaseNotes} />
          </div>
        </section>
      )}

      {/* ─── After-download CTA ───────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-25"
            style={{
              background:
                "radial-gradient(circle at 50% 50%, var(--accent-soft), transparent 55%)",
            }}
          />
        </div>
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h2 className="text-balance text-[32px] font-bold leading-[1.05] tracking-tight sm:text-[40px]">
            After you install
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-[15px] text-text-secondary">
            Sign up takes about thirty seconds. That&apos;s the only step that
            touches the internet — after that the editor and curriculum live
            on your laptop.
          </p>
          <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="group inline-flex items-center gap-2 rounded-md border border-accent/30 bg-accent px-6 py-3 text-sm font-semibold text-background shadow-[0_0_24px_var(--accent-glow)] hover:bg-accent-hover hover:shadow-[0_0_36px_var(--accent-glow)] transition-all"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-md border border-border bg-bg-secondary px-6 py-3 text-sm font-semibold text-foreground hover:border-accent/40 hover:text-accent transition-all"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function formatReleaseDate(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function ReleaseNotes({ notes }: { notes: string }) {
  const lines = notes.split(/\r?\n/);
  return (
    <div className="space-y-3 text-[15px] leading-relaxed text-text-secondary">
      {lines.map((raw, i) => {
        const line = raw.trim();
        if (!line) return null;
        if (line.startsWith("## ")) {
          return (
            <h3 key={i} className="text-lg font-semibold text-foreground pt-4">
              {line.slice(3)}
            </h3>
          );
        }
        if (line.startsWith("# ")) {
          return (
            <h2 key={i} className="text-xl font-bold text-foreground pt-4">
              {line.slice(2)}
            </h2>
          );
        }
        if (line.startsWith("- ") || line.startsWith("* ")) {
          return (
            <p key={i} className="pl-4 relative">
              <span className="absolute left-0 top-2 h-1.5 w-1.5 rounded-full bg-accent" />
              {line.slice(2)}
            </p>
          );
        }
        return <p key={i}>{line}</p>;
      })}
    </div>
  );
}

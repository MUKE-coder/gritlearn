"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  ExternalLink,
  Github,
  Loader2,
  ShieldCheck,
} from "lucide-react";
import {
  fallbackRelease,
  fetchRelease,
  type ReleaseInfo,
} from "@/lib/platform";
import { DownloadGrid } from "@/components/download-grid";

// Client component. We fetch from the browser, not the server, for one
// blunt reason: the production web container can't always reach
// https://api.jbeditor.com from inside Docker (hairpin NAT — the host's
// public domain routes back through Traefik, and the container's
// loopback often refuses it). The browser doesn't have that problem.
//
// Trade-off: there's a small skeleton on first paint while the fetch
// completes. We seed state with the static fallback so the layout
// renders immediately and just swaps in the real data when it arrives.
export function DownloadPageClient({ apiUrl }: { apiUrl: string }) {
  const [release, setRelease] = useState<ReleaseInfo>(fallbackRelease);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetchRelease(apiUrl).then((r) => {
      if (alive) {
        setRelease(r);
        setLoading(false);
      }
    });
    return () => {
      alive = false;
    };
  }, [apiUrl]);

  const released = formatReleaseDate(release.releasedAt);
  const couldntReach = !loading && release.source === "fallback";

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
            {loading ? (
              <>
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>resolving release…</span>
              </>
            ) : (
              <>
                <span className="h-1 w-1 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)] animate-pulse" />
                <span>
                  v{release.version}
                  {released && <> · released {released}</>}
                </span>
              </>
            )}
          </div>

          <h1 className="text-balance text-[42px] font-bold leading-[1.04] tracking-tight sm:text-[56px]">
            Download{" "}
            <span className="bg-gradient-to-r from-accent to-info bg-clip-text text-transparent">
              JEditor
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-[16px] leading-relaxed text-text-secondary">
            Pick the build for your machine. About 80 MB. The whole curriculum
            ships inside — sign up once online, then learn offline forever.
          </p>

          {couldntReach && (
            <p className="mx-auto mt-4 max-w-2xl text-[12px] text-text-muted">
              We couldn&apos;t reach the release server. Showing the latest
              version we know about — links go to GitHub Releases.
            </p>
          )}
        </div>
      </section>

      {/* ─── Per-OS tiles ─────────────────────────────────────────── */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-5xl px-6 py-16">
          {loading ? <DownloadGridSkeleton /> : <DownloadGrid release={release} />}

          <div className="mt-12 flex flex-col items-center justify-center gap-3 text-[12px] text-text-muted sm:flex-row">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-success" />
              <span>
                SHA-256 checksums + signed builds (Apple Notarized, Windows
                code-signed).
              </span>
            </div>
            <a
              href={release.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1.5 text-accent hover:text-accent-hover transition-colors"
            >
              <Github className="h-3.5 w-3.5" />
              View all releases
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Release notes ────────────────────────────────────────── */}
      {!loading && release.releaseNotes && (
        <section className="border-b border-border/40 bg-bg-secondary/30">
          <div className="mx-auto max-w-3xl px-6 py-20">
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
            touches the internet — after that the editor and curriculum live on
            your laptop.
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

function DownloadGridSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex items-start gap-4 rounded-md border border-border bg-bg-secondary p-5"
        >
          <div className="h-11 w-11 shrink-0 rounded-sm border border-border/60 bg-bg-elevated animate-pulse" />
          <div className="min-w-0 flex-1 space-y-2">
            <div className="h-4 w-32 rounded bg-bg-elevated animate-pulse" />
            <div className="h-3 w-48 rounded bg-bg-elevated animate-pulse" />
            <div className="h-3 w-40 rounded bg-bg-elevated animate-pulse" />
          </div>
        </div>
      ))}
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

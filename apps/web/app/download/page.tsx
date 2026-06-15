import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  Cpu,
  Download,
  ExternalLink,
  Github,
  ShieldCheck,
} from "lucide-react";
import { fetchRelease, formatSize, type ReleaseInfo } from "@/lib/platform";
import { DownloadGrid } from "@/components/download-grid";

export const metadata: Metadata = {
  title: "Download JEditor",
  description:
    "Native desktop builds of JEditor for Windows, macOS, and Linux. The whole curriculum ships inside — works offline after one signup.",
};

// Re-render every 10 minutes — matches the API's in-process cache TTL.
export const revalidate = 600;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default async function DownloadPage() {
  const release = await fetchRelease(API_URL);
  const released = formatReleaseDate(release.releasedAt);

  return (
    <div className="relative flex flex-col">
      {/* Subtle gradient backdrop matching the landing hero */}
      <div aria-hidden className="absolute inset-x-0 top-0 -z-10 h-[480px]">
        <div
          className="absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(59,130,246,0.16) 0%, transparent 45%), radial-gradient(circle at 70% 30%, rgba(168,85,247,0.12) 0%, transparent 45%)",
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
            maskImage:
              "radial-gradient(ellipse at top, black 50%, transparent 85%)",
          }}
        />
      </div>

      {/* ─── Header ──────────────────────────────────────────────── */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-6 pt-24 pb-14 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-secondary/80 px-3.5 py-1 text-[12px] text-text-secondary backdrop-blur">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span>
              v{release.version}
              {released && <> — released {released}</>}
            </span>
          </div>

          <h1 className="text-balance text-[42px] font-bold leading-[1.04] tracking-tight sm:text-[56px]">
            Download{" "}
            <span className="bg-gradient-to-r from-accent via-accent-hover to-info bg-clip-text text-transparent">
              JEditor
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-balance text-[16px] leading-relaxed text-text-secondary">
            Pick the build for your machine. About 80 MB. The whole curriculum
            ships inside — sign up once online, then learn offline forever.
          </p>

          {release.source === "fallback" && (
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
          <DownloadGrid release={release} />

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
      {release.releaseNotes && (
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
              backgroundImage:
                "radial-gradient(circle at 50% 50%, rgba(59,130,246,0.18) 0%, transparent 55%)",
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
              className="group inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-accent/20 hover:bg-accent-hover transition-all hover:-translate-y-0.5"
            >
              Create your account
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-6 py-3 text-sm font-semibold text-foreground hover:border-accent/40 hover:bg-bg-hover transition-all hover:-translate-y-0.5"
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

// ReleaseNotes renders the GitHub release body. GitHub returns
// Markdown; we render with a light touch (paragraph splitting, bullet
// detection) instead of pulling react-markdown for one page.
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

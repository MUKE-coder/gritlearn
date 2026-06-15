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

export const metadata: Metadata = {
  title: "Download JEditor",
  description:
    "Native desktop builds of JEditor for Windows, macOS, and Linux. The whole curriculum ships inside — works offline after one signup.",
};

// Re-render every 10 minutes — matches the API's in-process cache TTL.
// The fetch() call inside fetchRelease() uses revalidate: 600 already,
// but setting this at the route level lets Next.js skip the call
// entirely when the cached HTML is fresh.
export const revalidate = 600;

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default async function DownloadPage() {
  const release = await fetchRelease(API_URL);
  const released = formatReleaseDate(release.releasedAt);

  return (
    <div className="flex flex-col">
      {/* ─── Header ──────────────────────────────────────────────── */}
      <section className="border-b border-border/40">
        <div className="mx-auto max-w-4xl px-6 pt-20 pb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-secondary px-3.5 py-1 text-[12px] text-text-secondary">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" />
            <span>
              v{release.version}
              {released && <> — released {released}</>}
            </span>
          </div>

          <h1 className="text-balance text-[40px] font-bold leading-[1.05] tracking-tight sm:text-[52px]">
            Download JEditor
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-balance text-[16px] leading-relaxed text-text-secondary">
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
        <div className="mx-auto max-w-4xl px-6 py-16">
          <div className="grid gap-4 sm:grid-cols-2">
            {release.downloads.map((d) => {
              const href = d.available
                ? d.url
                : release.githubUrl || d.url;
              return (
                <a
                  key={d.platform}
                  href={href}
                  className={`group flex items-start gap-4 rounded-xl border bg-bg-secondary p-5 transition-all ${
                    d.available
                      ? "border-border hover:border-accent/60 hover:bg-bg-elevated"
                      : "border-border/60 opacity-75"
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent group-hover:bg-accent/20 transition-colors">
                    {d.available ? (
                      <Download className="h-4 w-4" />
                    ) : (
                      <Cpu className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">
                        {d.label}
                      </h3>
                      {!d.available && (
                        <span className="rounded-full bg-text-muted/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted">
                          Coming soon
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-text-secondary">
                      {d.detail}
                    </p>
                    <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-text-muted">
                      <span>{d.filename}</span>
                      {d.size > 0 && (
                        <>
                          <span>·</span>
                          <span>{formatSize(d.size)}</span>
                        </>
                      )}
                    </p>
                  </div>
                </a>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col items-center justify-center gap-3 text-[12px] text-text-muted sm:flex-row">
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
        <section className="border-b border-border/40 bg-bg-secondary/40">
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
      <section>
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <h2 className="text-[28px] font-bold tracking-tight">
            After you install
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-text-secondary">
            Sign up takes about thirty seconds. That&apos;s the only step that
            touches the internet — after that the editor and curriculum live on
            your laptop.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-3 text-sm font-semibold text-white hover:bg-accent-hover transition-colors"
            >
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-5 py-3 text-sm font-semibold text-foreground hover:bg-bg-hover transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

// formatReleaseDate accepts the API's ISO timestamp and turns it into
// "Jun 15, 2026" — readable, no time component (release time isn't
// useful to a marketing visitor). Returns "" on bad input so the
// surrounding template can drop the "released ..." prefix cleanly.
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
// Markdown; we render the lines with a light touch (paragraph
// splitting, bullet detection) instead of pulling in a Markdown
// parser — release notes are short and structured, and a hard
// dependency on react-markdown is overkill for one page.
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

import Link from "next/link";
import { ArrowUpRight, GitCommitHorizontal } from "lucide-react";
import { changelog, releaseUrl, KIND_LABEL, type ChangeKind } from "@/lib/changelog";

export const metadata = {
  title: "Changelog · JEditor",
  description: "Every JEditor release, what shipped, and when.",
};

const KIND_STYLES: Record<ChangeKind, string> = {
  feature:  "bg-success/15 text-success border-success/30",
  fix:      "bg-accent/15 text-accent border-accent/30",
  polish:   "bg-bg-elevated text-text-secondary border-border",
  breaking: "bg-warning/15 text-warning border-warning/30",
};

export default function ChangelogPage() {
  return (
    <main className="mx-auto max-w-3xl px-6 pt-24 pb-24">
      <header className="mb-10">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elevated px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-text-secondary">
          <GitCommitHorizontal className="h-3 w-3 text-accent" />
          Changelog
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-foreground">
          What's new in JEditor
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-text-secondary">
          Every release, in plain English. Auto-updating clients pick up new
          versions in the background — students never miss a fix.
        </p>
      </header>

      <ol className="space-y-12">
        {changelog.map((entry) => (
          <li key={entry.version} className="relative">
            <div className="mb-4 flex flex-wrap items-baseline gap-3">
              <span className="rounded-md border border-accent/30 bg-accent/10 px-2 py-0.5 font-mono text-[12px] font-semibold text-accent">
                v{entry.version}
              </span>
              <span className="font-mono text-[12px] text-text-muted">
                {new Date(entry.releasedAt).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </span>
              <Link
                href={releaseUrl(entry)}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-auto inline-flex items-center gap-1 text-[12px] text-text-secondary hover:text-accent"
              >
                GitHub release
                <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>

            <h2 className="mb-4 text-[20px] font-semibold tracking-tight text-foreground">
              {entry.headline}
            </h2>

            <ul className="space-y-2">
              {entry.highlights.map((h, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 inline-flex shrink-0 items-center rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wider ${KIND_STYLES[h.kind]}`}
                  >
                    {KIND_LABEL[h.kind]}
                  </span>
                  <span className="text-[14px] leading-relaxed text-text-secondary">{h.body}</span>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>

      <div className="mt-16 rounded-xl border border-border bg-bg-elevated p-6">
        <h3 className="text-[14px] font-semibold text-foreground">Want to be first?</h3>
        <p className="mt-1 text-[13px] text-text-secondary">
          Run the desktop app — it polls the update endpoint on launch and
          shows a banner the moment a newer version is available. Click
          install + restart and you're current.
        </p>
        <Link
          href="/download"
          className="mt-4 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-[13px] font-semibold text-zinc-900 hover:bg-accent-hover"
        >
          Download JEditor
          <ArrowUpRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    </main>
  );
}

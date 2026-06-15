"use client";

// Admin dashboard widget for JEditor-specific metrics. Reads from
// /api/admin/usage/summary (single round-trip, computed server-side) and
// renders the four headline numbers + a top-concepts list.

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { Users, Activity, Award, BookOpen, ExternalLink } from "lucide-react";
import { apiClient } from "@/lib/api-client";

interface UsageSummary {
  total_signups: number;
  signups_last_7d: number;
  active_7d: number;
  active_30d: number;
  concepts_completed: number;
  most_completed_concepts: { concept_slug: string; count: number }[];
}

export function JEditorMetrics() {
  const { data, isLoading, error } = useQuery<UsageSummary>({
    queryKey: ["admin", "usage", "summary"],
    queryFn: async () => {
      const { data } = await apiClient.get("/api/admin/usage/summary");
      return data.data;
    },
    refetchInterval: 60_000, // refresh every minute so the dashboard stays live
  });

  return (
    <section className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-foreground">JEditor usage</h2>
        <Link
          href="/resources/progresses"
          className="inline-flex items-center gap-1 text-xs text-text-muted hover:text-accent"
        >
          View all progress <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {error ? (
        <div className="rounded-lg border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
          Couldn&apos;t load usage summary: {(error as Error).message}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              icon={Users}
              label="Total signups"
              value={isLoading ? "—" : data!.total_signups.toLocaleString()}
              detail={
                isLoading
                  ? undefined
                  : `+${data!.signups_last_7d.toLocaleString()} this week`
              }
              tone="accent"
            />
            <MetricCard
              icon={Activity}
              label="Active (7 days)"
              value={isLoading ? "—" : data!.active_7d.toLocaleString()}
              detail="synced progress in 7d"
              tone="success"
            />
            <MetricCard
              icon={Activity}
              label="Active (30 days)"
              value={isLoading ? "—" : data!.active_30d.toLocaleString()}
              detail="synced progress in 30d"
              tone="info"
            />
            <MetricCard
              icon={Award}
              label="Concepts completed"
              value={isLoading ? "—" : data!.concepts_completed.toLocaleString()}
              detail="across all students"
              tone="warning"
            />
          </div>

          <div className="rounded-xl border border-border bg-bg-secondary p-6">
            <div className="mb-4 flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold text-foreground">
                Most-completed concepts
              </h3>
            </div>
            {isLoading ? (
              <div className="text-sm text-text-muted">Loading…</div>
            ) : data!.most_completed_concepts.length === 0 ? (
              <div className="text-sm text-text-muted">
                No completions yet. Once students start marking concepts complete,
                the leaderboard fills in here.
              </div>
            ) : (
              <ol className="space-y-2">
                {data!.most_completed_concepts.map((c, i) => (
                  <li
                    key={c.concept_slug}
                    className="flex items-center gap-3 rounded-md border border-border bg-bg-tertiary px-3 py-2"
                  >
                    <span className="w-5 text-xs font-semibold text-text-muted">
                      {i + 1}
                    </span>
                    <span className="flex-1 font-mono text-sm text-foreground">
                      {c.concept_slug}
                    </span>
                    <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                      {c.count}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </>
      )}
    </section>
  );
}

interface MetricCardProps {
  icon: typeof Users;
  label: string;
  value: string;
  detail?: string;
  tone: "accent" | "success" | "info" | "warning";
}

function MetricCard({ icon: Icon, label, value, detail, tone }: MetricCardProps) {
  const toneClasses = {
    accent: "bg-accent/10 text-accent",
    success: "bg-success/10 text-success",
    info: "bg-info/10 text-info",
    warning: "bg-warning/10 text-warning",
  }[tone];

  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-5">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wider text-text-muted">
          {label}
        </span>
        <div className={`flex h-7 w-7 items-center justify-center rounded-md ${toneClasses}`}>
          <Icon className="h-3.5 w-3.5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {detail && <div className="mt-1 text-xs text-text-muted">{detail}</div>}
    </div>
  );
}

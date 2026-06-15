"use client";

import { useEffect, useState } from "react";
import { Shield, ExternalLink, AlertTriangle, Zap, Activity, AlertCircle, Globe } from "@/lib/icons";
import { api } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

interface ScoreCard {
  score?: number
  grade?: string
  factors?: { name: string; score: number }[]
}

interface Summary {
  summary?: { threats_total?: number; threats_24h?: number; blocked?: number; actors?: number }
  score?: ScoreCard
  threats?: { data?: Array<{ id: string; type: string; severity: string; cvss?: number; source_ip?: string; route?: string; created_at?: string }> }
  auth_shield?: { enabled?: boolean; failures?: number; locked?: Array<{ ip: string; until: string }> }
  csp_top?: { data?: Array<{ violated_directive: string; blocked_uri: string; count: number }> }
  performance?: { p50_ms?: number; p95_ms?: number; p99_ms?: number; rps?: number; pipeline_drops?: number }
  trends?: unknown
  top_routes?: { data?: Array<{ route: string; count: number }> }
  _errors?: Record<string, string>
}

export default function SecurityPage() {
  const [data, setData] = useState<Summary | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const fetch = async () => {
      try {
        const res = await api.get("/api/admin/security/summary");
        if (alive) setData(res.data?.data || res.data);
        setErr(null);
      } catch (e: any) {
        if (alive) setErr(e?.response?.data?.error?.message || "Failed to load");
      } finally {
        if (alive) setLoading(false);
      }
    };
    fetch();
    const t = setInterval(fetch, 20_000); // refresh every 20s
    return () => { alive = false; clearInterval(t); };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2.5">
            <Shield className="h-6 w-6 text-accent" /> Security
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Live summary from Sentinel — score, threats, AuthShield, CSP, performance
          </p>
        </div>
        <a
          href={`${API_URL}/sentinel/ui`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-secondary px-4 py-2.5 text-sm font-medium text-foreground hover:bg-bg-hover transition-colors"
        >
          Open full dashboard <ExternalLink className="h-4 w-4" />
        </a>
      </div>

      {err && !loading && (
        <div className="rounded-xl border border-warning/30 bg-warning/5 p-4 text-sm text-warning flex items-start gap-2">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <div>
            <strong>Couldn&apos;t reach Sentinel.</strong> Make sure <code className="px-1 py-0.5 rounded bg-bg-secondary text-xs font-mono">SENTINEL_ENABLED=true</code> and the API is running.
            <div className="text-xs text-text-muted mt-1">{err}</div>
          </div>
        </div>
      )}

      {/* Top-line scorecard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Security score" value={data?.score?.score ?? "—"} sub={data?.score?.grade} tone="success" icon={Shield} />
        <KpiCard title="Threats (24h)" value={data?.summary?.threats_24h ?? "—"} sub={`${data?.summary?.threats_total ?? 0} total`} tone="warning" icon={AlertCircle} />
        <KpiCard title="Blocked" value={data?.summary?.blocked ?? "—"} sub="auto by WAF" tone="info" icon={Zap} />
        <KpiCard title="Actors" value={data?.summary?.actors ?? "—"} sub="unique sources" tone="default" icon={Globe} />
      </div>

      {/* Recent threats */}
      <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Recent threats</h2>
          <a href={`${API_URL}/sentinel/ui/threats`} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">View all</a>
        </div>
        <div className="divide-y divide-border">
          {(data?.threats?.data ?? []).slice(0, 8).map((t) => (
            <div key={t.id} className="flex items-center gap-3 px-4 py-2.5 text-sm">
              <SeverityChip severity={t.severity} cvss={t.cvss} />
              <span className="text-foreground font-mono text-xs truncate flex-1">{t.type}</span>
              <span className="text-text-muted text-xs hidden md:inline">{t.route}</span>
              <span className="text-text-muted text-xs font-mono">{t.source_ip}</span>
            </div>
          ))}
          {(!data?.threats?.data || data.threats.data.length === 0) && (
            <div className="px-4 py-6 text-center text-sm text-text-muted">No threats in window.</div>
          )}
        </div>
      </div>

      {/* AuthShield + CSP side-by-side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel title="AuthShield">
          {data?.auth_shield?.enabled === false ? (
            <p className="text-sm text-text-muted">AuthShield is disabled in this environment.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <Stat label="Failures (rolling)" value={data?.auth_shield?.failures ?? 0} />
                <Stat label="Locked IPs" value={data?.auth_shield?.locked?.length ?? 0} />
              </div>
              <ul className="space-y-1.5 text-xs font-mono">
                {(data?.auth_shield?.locked ?? []).slice(0, 5).map((l) => (
                  <li key={l.ip} className="flex justify-between gap-2 text-text-secondary">
                    <span>{l.ip}</span>
                    <span className="text-text-muted">until {l.until}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Panel>
        <Panel title="Top CSP violations">
          <ul className="space-y-1.5 text-xs font-mono">
            {(data?.csp_top?.data ?? []).slice(0, 5).map((v, i) => (
              <li key={i} className="flex justify-between gap-2">
                <span className="truncate text-text-secondary">{v.violated_directive}</span>
                <span className="text-text-muted shrink-0">{v.count}×</span>
              </li>
            ))}
            {(!data?.csp_top?.data || data.csp_top.data.length === 0) && (
              <li className="text-text-muted">No violations.</li>
            )}
          </ul>
        </Panel>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, tone, icon: Icon }: { title: string; value: any; sub?: any; tone: "default" | "success" | "warning" | "info" | "danger"; icon: any }) {
  const toneCls = { default: "text-foreground", success: "text-success", warning: "text-warning", info: "text-info", danger: "text-danger" }[tone];
  return (
    <div className="rounded-xl border border-border bg-bg-secondary p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-wider text-text-muted">{title}</span>
        <Icon className={`h-4 w-4 ${toneCls}`} />
      </div>
      <p className={`text-2xl font-semibold tabular-nums ${toneCls}`}>{value}</p>
      {sub && <p className="text-[11px] text-text-muted mt-0.5">{sub}</p>}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: any }) {
  return (
    <div className="rounded-xl border border-border bg-bg-secondary overflow-hidden">
      <div className="px-4 py-3 border-b border-border"><h2 className="text-sm font-semibold text-foreground">{title}</h2></div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-lg border border-border bg-bg-elevated px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-text-muted">{label}</p>
      <p className="text-lg font-semibold text-foreground tabular-nums">{value}</p>
    </div>
  );
}

function SeverityChip({ severity, cvss }: { severity?: string; cvss?: number }) {
  const tone =
    severity === "critical" ? "bg-danger/15 text-danger border-danger/30" :
    severity === "high"     ? "bg-warning/15 text-warning border-warning/30" :
    severity === "medium"   ? "bg-info/15 text-info border-info/30" :
                              "bg-bg-elevated text-text-muted border-border";
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-mono ${tone}`}>
      {severity ?? "info"}
      {cvss !== undefined && cvss > 0 && <span>· {cvss.toFixed(1)}</span>}
    </span>
  );
}

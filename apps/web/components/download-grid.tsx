"use client";

import { useEffect, useState } from "react";
import { Cpu, Download } from "lucide-react";
import { motion } from "framer-motion";
import {
  detectPlatform,
  formatSize,
  type Platform,
  type ReleaseInfo,
} from "@/lib/platform";

// DownloadGrid: the per-OS tile row on /download. Client component so
// the "Recommended" badge can highlight the visitor's OS without an
// SSR fork, and so the cards animate in with framer.

export function DownloadGrid({ release }: { release: ReleaseInfo }) {
  const [platform, setPlatform] = useState<Platform | null>(null);
  useEffect(() => setPlatform(detectPlatform()), []);

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {release.downloads.map((d, i) => {
        const href = d.available
          ? d.url
          : release.githubUrl || d.url;
        const recommended = d.platform === platform && d.available;
        return (
          <motion.a
            key={d.platform}
            href={href}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i, duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            whileHover={d.available ? { y: -3 } : undefined}
            className={`group relative flex items-start gap-4 rounded-md border bg-bg-secondary p-5 transition-all ${
              recommended
                ? "border-accent/50 shadow-[0_0_28px_var(--accent-glow)]"
                : d.available
                ? "border-border hover:border-accent/40 hover:shadow-[0_0_20px_var(--accent-glow)]"
                : "border-border/60 opacity-75"
            }`}
          >
            <div
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-sm border transition-all ${
                recommended
                  ? "border-accent/40 bg-accent/15 text-accent"
                  : "border-accent/20 bg-accent/5 text-accent group-hover:border-accent/40 group-hover:bg-accent/10"
              }`}
            >
              {d.available ? (
                <Download className="h-5 w-5" />
              ) : (
                <Cpu className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-semibold text-foreground">{d.label}</h3>
                {recommended && (
                  <span className="rounded-sm border border-accent/40 bg-accent/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-accent">
                    RECOMMENDED
                  </span>
                )}
                {!d.available && (
                  <span className="rounded-sm border border-text-muted/30 bg-text-muted/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-text-muted">
                    COMING SOON
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm text-text-secondary">{d.detail}</p>
              <p className="mt-2 flex items-center gap-2 font-mono text-[11px] text-text-muted">
                <span>$ {d.filename}</span>
                {d.size > 0 && (
                  <>
                    <span>·</span>
                    <span>{formatSize(d.size)}</span>
                  </>
                )}
              </p>
            </div>
          </motion.a>
        );
      })}
    </div>
  );
}

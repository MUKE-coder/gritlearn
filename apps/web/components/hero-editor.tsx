"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";

// HeroEditor: the centered "editor preview" card under the hero. The
// lesson lines fade in one by one using GSAP — picked over framer
// because GSAP's timeline API maps cleanly to "type one line, pause,
// type the next." On unmount we kill the timeline so a router push
// during animation doesn't leak.

const lines: Array<{ prefix?: string; prefixClass?: string; body: string; bodyClass: string }> = [
  { prefix: "## ", prefixClass: "text-accent", body: "How the web works", bodyClass: "text-foreground" },
  { body: "Opening a web page is exactly like ordering food at a restaurant.", bodyClass: "text-text-muted" },
  { prefix: "# You ", prefixClass: "text-success", body: "decide what you want.", bodyClass: "text-text-secondary" },
  { prefix: "# The waiter ", prefixClass: "text-success", body: "carries your order to the kitchen.", bodyClass: "text-text-secondary" },
  { prefix: "# The kitchen ", prefixClass: "text-success", body: "prepares it and sends a tray back.", bodyClass: "text-text-secondary" },
  { prefix: "# The dish ", prefixClass: "text-success", body: "lands on your table. You eat it.", bodyClass: "text-text-secondary" },
];

export function HeroEditor() {
  const containerRef = useRef<HTMLDivElement>(null);
  const caretRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const items = el.querySelectorAll<HTMLElement>("[data-line]");
    if (items.length === 0) return;

    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.set(items, { opacity: 0, y: 6 });
    items.forEach((node, i) => {
      tl.to(node, { opacity: 1, y: 0, duration: 0.35 }, 0.18 + i * 0.18);
    });

    if (caretRef.current) {
      gsap.to(caretRef.current, {
        opacity: 0,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "power1.inOut",
      });
    }

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <div className="relative mx-auto w-full max-w-2xl">
      {/* Soft gradient glow behind the card so the screenshot reads
          "premium" without the card itself having to do too much. */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[28px] bg-gradient-to-br from-accent/20 via-info/10 to-transparent blur-2xl"
      />
      <div className="rounded-xl border border-border bg-bg-secondary shadow-2xl shadow-black/40 overflow-hidden text-left">
        <div className="flex items-center gap-2 border-b border-border px-3.5 py-2">
          <div className="h-2.5 w-2.5 rounded-full bg-danger/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-warning/60" />
          <div className="h-2.5 w-2.5 rounded-full bg-success/60" />
          <span className="ml-2 font-mono text-[11px] text-text-muted">
            how-the-web-works.mdx — jeditor
          </span>
        </div>
        <div
          ref={containerRef}
          className="px-5 py-5 font-mono text-[13px] leading-relaxed space-y-1.5"
        >
          {lines.map((line, i) => (
            <p key={i} data-line className={line.bodyClass}>
              {line.prefix && (
                <span className={line.prefixClass}>{line.prefix}</span>
              )}
              {line.body}
            </p>
          ))}
          <p data-line className="pt-2 text-accent">
            <span ref={caretRef} className="inline-block">
              ▍
            </span>{" "}
            <span className="text-text-muted">
              this is one lesson. every concept opens this way.
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

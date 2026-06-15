"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check, Package } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface RegistryItem {
  name: string;
  type: string;
  title: string;
  description: string;
  category: string;
  registryUrl?: string;
}

interface Registry {
  name: string;
  items: RegistryItem[];
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="flex-shrink-0 rounded-md p-1.5 text-text-muted hover:text-foreground hover:bg-bg-hover transition-colors"
      title="Copy"
    >
      {copied ? <Check className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
    </button>
  );
}

const CATEGORIES = ["All", "marketing", "ecommerce", "layout"];

export default function ComponentsPage() {
  const [activeCategory, setActiveCategory] = useState("All");

  const { data: registry, isLoading } = useQuery<Registry>({
    queryKey: ["grit-ui-registry"],
    queryFn: async () => {
      const { data } = await api.get("/r.json");
      return data;
    },
  });

  const items = (registry?.items || []).filter(
    (item) => activeCategory === "All" || item.category === activeCategory
  );

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      {/* Hero */}
      <div className="mb-12 max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
          <Package className="h-3.5 w-3.5" />
          Grit UI Registry
        </div>
        <h1 className="text-4xl font-bold tracking-tight">
          Beautiful components for{" "}
          <span className="bg-gradient-to-r from-accent to-purple-400 bg-clip-text text-transparent">
            Grit apps
          </span>
        </h1>
        <p className="mt-3 text-lg text-text-secondary">
          Production-ready UI components. Install with a single command via the
          shadcn CLI.
        </p>
      </div>

      {/* Category pills */}
      <div className="mb-8 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={"rounded-full border px-4 py-1.5 text-sm font-medium capitalize transition-colors " +
              (activeCategory === cat
                ? "border-accent bg-accent text-white"
                : "border-border bg-bg-elevated text-text-secondary hover:border-accent/40 hover:text-foreground")}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-border bg-bg-elevated p-5 animate-pulse"
            >
              <div className="mb-3 h-4 w-20 rounded bg-bg-hover" />
              <div className="mb-2 h-5 w-3/4 rounded bg-bg-hover" />
              <div className="h-3 w-full rounded bg-bg-hover" />
              <div className="mt-4 h-8 w-full rounded bg-bg-hover" />
            </div>
          ))}
        </div>
      ) : items.length > 0 ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => {
            const installCmd = `npx shadcn@latest add ${apiUrl}/r/${item.name}.json`;
            return (
              <div
                key={item.name}
                className="group rounded-xl border border-border bg-bg-elevated p-5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300 flex flex-col"
              >
                <div className="mb-3 flex items-center gap-2">
                  <span className="rounded-md bg-bg-hover px-2 py-0.5 text-xs font-mono text-text-muted capitalize">
                    {item.category}
                  </span>
                </div>
                <Link
                  href={`/components/${item.name}`}
                  className="flex-1"
                >
                  <h3 className="font-semibold text-foreground group-hover:text-accent transition-colors">
                    {item.title || item.name}
                  </h3>
                  <p className="mt-1.5 text-sm text-text-secondary line-clamp-2">
                    {item.description}
                  </p>
                </Link>
                <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-bg-primary px-3 py-2">
                  <code className="flex-1 truncate text-xs font-mono text-text-secondary">
                    {installCmd}
                  </code>
                  <CopyButton text={installCmd} />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-bg-elevated border border-border">
            <Package className="h-7 w-7 text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold">No components yet</h3>
          <p className="mt-1 text-sm text-text-muted">
            Components will appear here once added via the admin panel.
          </p>
        </div>
      )}
    </div>
  );
}

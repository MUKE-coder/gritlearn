"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Copy, Check, Terminal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useState } from "react";

interface ComponentFile {
  path: string;
  content: string;
  type: string;
  target?: string;
}

interface ComponentDetail {
  name: string;
  type: string;
  title: string;
  description: string;
  category: string;
  files: ComponentFile[];
  dependencies: string[];
  registryDependencies: string[];
}

function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-bg-elevated px-3 py-1.5 text-sm text-text-secondary hover:text-foreground hover:bg-bg-hover transition-colors"
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-success" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {label ?? (copied ? "Copied!" : "Copy")}
    </button>
  );
}

export default function ComponentDetailPage() {
  const params = useParams();
  const name = typeof params.name === "string" ? params.name : "";
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const { data: component, isLoading, error } = useQuery<ComponentDetail>({
    queryKey: ["grit-ui-component", name],
    queryFn: async () => {
      const { data } = await api.get(`/r/${name}.json`);
      return data;
    },
    enabled: !!name,
  });

  const installCmd = `npx shadcn@latest add ${apiUrl}/r/${name}.json`;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 animate-pulse">
        <div className="h-4 w-24 rounded bg-bg-hover mb-8" />
        <div className="h-8 w-1/2 rounded bg-bg-hover mb-3" />
        <div className="h-4 w-2/3 rounded bg-bg-hover mb-10" />
        <div className="h-12 rounded-xl bg-bg-hover mb-10" />
        <div className="h-96 rounded-xl bg-bg-hover" />
      </div>
    );
  }

  if (error || !component) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-16 text-center">
        <p className="text-6xl font-bold text-text-muted mb-4">404</p>
        <h1 className="text-xl font-semibold mb-2">Component not found</h1>
        <p className="text-sm text-text-muted mb-6">
          The component &quot;{name}&quot; doesn&apos;t exist in the registry.
        </p>
        <Link
          href="/components"
          className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Components
        </Link>
      </div>
    );
  }

  const mainFile = component.files?.[0];

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* Back */}
      <Link
        href="/components"
        className="inline-flex items-center gap-1.5 text-sm text-text-secondary hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-4 w-4" />
        All Components
      </Link>

      {/* Header */}
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-3">
          <span className="rounded-md bg-bg-elevated border border-border px-2.5 py-0.5 text-xs font-mono text-text-muted capitalize">
            {component.category}
          </span>
        </div>
        <h1 className="text-3xl font-bold tracking-tight">
          {component.title || component.name}
        </h1>
        <p className="mt-2 text-text-secondary">{component.description}</p>
      </div>

      {/* Install command */}
      <div className="mb-8 rounded-xl border border-border bg-bg-elevated p-4">
        <div className="mb-2 flex items-center gap-2 text-xs font-medium text-text-muted uppercase tracking-wide">
          <Terminal className="h-3.5 w-3.5" />
          Install
        </div>
        <div className="flex items-center gap-3">
          <code className="flex-1 text-sm font-mono text-text-secondary truncate">
            {installCmd}
          </code>
          <CopyButton text={installCmd} label="Copy" />
        </div>
      </div>

      {/* Dependencies */}
      {component.dependencies && component.dependencies.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-2 text-sm font-medium text-text-secondary uppercase tracking-wide">
            Dependencies
          </h2>
          <div className="flex flex-wrap gap-2">
            {component.dependencies.map((dep) => (
              <span
                key={dep}
                className="rounded-md border border-border bg-bg-elevated px-2.5 py-1 text-xs font-mono text-text-secondary"
              >
                {dep}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source code */}
      {mainFile && (
        <div className="rounded-xl border border-border bg-bg-elevated overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <span className="text-xs font-mono text-text-muted">
              {mainFile.target || mainFile.path}
            </span>
            <CopyButton text={mainFile.content} label="Copy code" />
          </div>
          <div className="overflow-x-auto">
            <pre className="p-5 text-sm font-mono text-text-secondary leading-relaxed whitespace-pre">
              <code>{mainFile.content}</code>
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}

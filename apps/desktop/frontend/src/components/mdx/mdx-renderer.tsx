// Runtime MDX renderer. We don't precompile MDX at Vite build time because
// the content lives inside the Go binary and is loaded as a string via the
// GetConceptMDX Wails binding — by the time we have the source, vite is
// long done. evaluate() from @mdx-js/mdx takes that string + the React
// JSX runtime and gives us back a React component.
//
// Custom MDX components (<Analogy>, <ExampleProject>, etc.) are injected
// via the `components` option so authors don't need to import them in the
// MDX itself; they just use the tag name.

import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import { teachingComponents, ExampleProject } from "./teaching-blocks";
import { CodeBlock } from "./code-block";

interface MdxRendererProps {
  /** Raw MDX source as returned by GetConceptMDX. */
  source: string;
  /** Slug of the concept being rendered — forwarded to ExampleProject so
   * `<ExampleProject src="…">` can resolve into the right embedded folder
   * without authors needing to repeat the slug in every tag. */
  conceptSlug: string;
}

export function MdxRenderer({ source, conceptSlug }: MdxRendererProps) {
  const [Mod, setMod] = useState<{ default: ComponentType<{ components?: Record<string, ReactNode> }> } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pin the ExampleProject variant to the concept being rendered so the
  // MDX author can write `<ExampleProject src="restaurant-trace" />` and
  // the component knows which concept's examples/ folder to look in.
  const components = useMemo(() => {
    const ScopedExampleProject = (
      props: Omit<React.ComponentProps<typeof ExampleProject>, "conceptSlug">,
    ) => <ExampleProject {...props} conceptSlug={conceptSlug} />;
    // Override <pre> so fenced code blocks render through our
    // CodeBlock (Monaco-coloured + copy button). Inline `code` keeps
    // the default style from globals.css's .prose-mdx code rule.
    return {
      ...teachingComponents,
      ExampleProject: ScopedExampleProject,
      pre: CodeBlock,
    };
  }, [conceptSlug]);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setMod(null);
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const result = await evaluate(source, { ...(runtime as any), development: false });
        if (!cancelled) {
          setMod(result as unknown as typeof Mod extends infer T ? T : never);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [source]);

  if (error) {
    return (
      <div className="rounded-md border border-danger/30 bg-danger/10 p-4 text-[13px] text-danger">
        <div className="mb-1 font-semibold">Failed to render MDX</div>
        <pre className="overflow-x-auto whitespace-pre-wrap font-mono text-[12px]">{error}</pre>
      </div>
    );
  }

  if (!Mod) {
    return (
      <div className="flex items-center gap-2 text-[13px] text-foreground-muted">
        <div className="h-3 w-3 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        Loading lesson…
      </div>
    );
  }

  const Content = Mod.default;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return <Content components={components as any} />;
}

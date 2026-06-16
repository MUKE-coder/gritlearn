import { Link, useRouter } from "@tanstack/react-router";
import { AlertOctagon, ArrowLeft, ChevronDown, ChevronRight, Home, RotateCcw } from "lucide-react";
import { Component, useState, type ReactNode } from "react";

// ErrorBoundaryFallback — the screen the student sees when ANY React
// render throws somewhere in the tree. Brand-aligned so a crash looks
// like part of the app, not a developer dump. Three escape routes:
// retry, go back, or jump home. The technical stack lives behind a
// collapse so it doesn't terrify learners but is one click away when
// a screenshot needs to go in a bug report.
export function ErrorBoundaryFallback({
  error,
  reset,
}: {
  error: unknown;
  reset?: () => void;
}) {
  const router = useRouter();
  const [showDetails, setShowDetails] = useState(false);

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "Something unexpected went wrong.";
  const stack = error instanceof Error ? error.stack : null;

  return (
    <div className="flex min-h-[calc(100vh-3rem)] items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-xl">
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-surface-2">
            <AlertOctagon className="h-10 w-10 text-danger" />
          </div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">
            Something went wrong
          </h1>
          <p className="mt-2 max-w-md text-[13.5px] text-foreground-secondary">
            This screen ran into an error and stopped rendering. Your work
            elsewhere in the app is untouched — try again, head back, or
            jump home. If this keeps happening, the technical details below
            help us track it down.
          </p>

          <div className="mt-4 w-full rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-left text-[12.5px] text-danger">
            <div className="font-mono">{message}</div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
            {reset && (
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1.5 rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-background hover:bg-accent-hover"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Try again
              </button>
            )}
            <button
              type="button"
              onClick={() => router.history.back()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-hover"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Go back
            </button>
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-[13px] font-medium text-foreground hover:bg-surface-hover"
            >
              <Home className="h-3.5 w-3.5" /> Open home
            </Link>
          </div>
        </div>

        {stack && (
          <div className="mt-8 rounded-xl border border-border bg-surface">
            <button
              type="button"
              onClick={() => setShowDetails((s) => !s)}
              className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-foreground-muted hover:bg-surface-hover"
            >
              {showDetails ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )}
              Technical details
            </button>
            {showDetails && (
              <pre className="overflow-x-auto border-t border-border-subtle bg-surface-2/40 px-4 py-3 text-[11px] leading-relaxed text-foreground-muted">
                {stack}
              </pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Top-of-tree boundary. TanStack Router's errorComponent only catches
// errors inside the route subtree — anything thrown BEFORE the router
// mounts (provider boots, initial setup, lazy-import failures) bypasses
// it. This class component catches everything underneath createRoot()
// and renders the same fallback. The v0.3.0 / v0.3.x black-screen bug
// was effectively this gap — useSync threw during the auth route's
// initial mount, before the router's errorComponent could attach, so
// the user saw the BackgroundColour instead of the friendly fallback.
interface State {
  error: Error | null;
}

export class ReactErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    // Logging is best-effort. If we ever wire Sentry / a tenant audit
    // ingestion endpoint, call it here. The local console line is
    // enough for now — students reporting bugs can screenshot the
    // devtools console for us.
    // eslint-disable-next-line no-console
    console.error("[ReactErrorBoundary]", error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    if (this.state.error) {
      return <ErrorBoundaryFallback error={this.state.error} reset={this.reset} />;
    }
    return this.props.children;
  }
}

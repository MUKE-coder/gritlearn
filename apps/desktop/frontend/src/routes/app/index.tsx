import { createFileRoute } from "@tanstack/react-router";
import { EditorShell } from "@/components/editor/editor-shell";

// The /app index IS the editor — three panes, no overlay chrome.
// Profile / Settings still exist at /app/profile and /app/settings and
// are reachable via the command palette (⌘K).
export const Route = createFileRoute("/app/")({
  component: EditorShell,
});

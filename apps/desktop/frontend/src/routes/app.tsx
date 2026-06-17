import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TitleBar } from "@/components/layout/title-bar";
import { SessionStatusBanner } from "@/components/layout/session-status-banner";
import { CommandPalette } from "@/components/layout/command-palette";
import { UpdateBanner } from "@/components/update-banner";
import { WorkspaceProvider } from "@/lib/workspace-store";
import { CurriculumProvider } from "@/lib/curriculum-store";
import { ProgressProvider } from "@/lib/progress-store";
import { SyncProvider } from "@/lib/sync-provider";
import { EditorPrefsProvider } from "@/lib/editor-prefs";
import { useShortcuts } from "@/lib/use-shortcuts";

export const Route = createFileRoute("/app")({
  beforeLoad: async () => {
    const { getToken } = await import("@/lib/wails-bridge");
    const token = await getToken("access_token");
    if (!token) {
      throw redirect({ to: "/auth/login" });
    }
  },
  component: AppLayout,
});

function AppLayout() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Cmd/Ctrl+K opens the command palette. The editor's MonacoPane
  // explicitly re-dispatches Monaco's own Cmd+K handler to the window
  // so this still works while the editor has focus.
  useShortcuts({
    "mod+k": () => setPaletteOpen(true),
  });

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Provider wraps the full /app subtree so the editor, command palette,
  // and any future panels all read from the same workspace state.
  return (
    <EditorPrefsProvider>
    <ProgressProvider>
      <CurriculumProvider>
        <SyncProvider>
        <WorkspaceProvider>
          <div className="flex h-screen flex-col bg-background">
            <TitleBar />
            <UpdateBanner />
            <SessionStatusBanner />

            {/* No padding here — EditorShell fills the whole canvas. Sub-routes
                like /app/profile add their own padding via PageHeader. */}
            <div className="flex min-h-0 flex-1 overflow-hidden">
              <Outlet />
            </div>

            <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
          </div>
        </WorkspaceProvider>
        </SyncProvider>
      </CurriculumProvider>
    </ProgressProvider>
    </EditorPrefsProvider>
  );
}

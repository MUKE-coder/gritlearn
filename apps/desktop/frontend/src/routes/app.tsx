import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { TitleBar } from "@/components/layout/title-bar";
import { SessionStatusBanner } from "@/components/layout/session-status-banner";
import { CommandPalette } from "@/components/layout/command-palette";
import { UpdateBanner } from "@/components/update-banner";
import { PluginToaster } from "@/components/plugin-toaster";
import { StreakToaster } from "@/components/editor/streak-toaster";
import { MenuBar } from "@/components/layout/menu-bar";
import { ActivityBar } from "@/components/layout/activity-bar";
import { SidebarHost } from "@/components/layout/sidebar-host";
import { StatusBar } from "@/components/editor/status-bar";
import { BottomPanel } from "@/components/editor/bottom-panel";
import { Splitter } from "@/components/ui/splitter";
import { useWorkspace, WorkspaceProvider } from "@/lib/workspace-store";
import { CurriculumProvider } from "@/lib/curriculum-store";
import { ProgressProvider } from "@/lib/progress-store";
import { SyncProvider } from "@/lib/sync-provider";
import { EditorPrefsProvider } from "@/lib/editor-prefs";
import { PluginHostProvider } from "@/lib/plugin-host";
import { NotesProvider } from "@/lib/notes-store";
import { StreakProvider } from "@/lib/streak-store";
import { IdeShellProvider, useShell } from "@/lib/ide-shell";
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

  return (
    <EditorPrefsProvider>
    <ProgressProvider>
      <CurriculumProvider>
        <SyncProvider>
          <WorkspaceProvider>
            <NotesProvider>
            <StreakWrapper>
            <PluginHostWrapper>
              <IdeShellProvider>
                <Chrome>
                  <Outlet />
                </Chrome>
                <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
                <PluginToaster />
                <StreakToaster />
              </IdeShellProvider>
            </PluginHostWrapper>
            </StreakWrapper>
            </NotesProvider>
          </WorkspaceProvider>
        </SyncProvider>
      </CurriculumProvider>
    </ProgressProvider>
    </EditorPrefsProvider>
  );
}

// Chrome — the VSCode-style shell. Renders:
//
//   TitleBar  (window controls + theme/update buttons)
//   MenuBar   (File / Edit / Selection / View / Go / Terminal / Help)
//   ActivityBar | SidebarHost | <Outlet/>            ← horizontal flex
//   BottomPanel (vertical splitter when visible)
//   StatusBar
//
// Provider wrappers stay one level up so any child can reach shell +
// workspace state without prop-drilling.
function Chrome({ children }: { children: React.ReactNode }) {
  const { bottomVisible, setBottomVisible, bottomTab, setBottomTab } = useShell();

  // Global shortcuts wired here so they work whether the editor or
  // file tree has focus.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "j") {
        e.preventDefault();
        setBottomVisible(!bottomVisible);
      } else if (mod && e.key === "`") {
        e.preventDefault();
        setBottomTab("terminal");
        setBottomVisible(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [bottomVisible, setBottomVisible, setBottomTab]);

  const upperRow = (
    <div className="flex min-h-0 flex-1">
      <ActivityBar />
      <SidebarHost />
      <main className="flex min-w-0 flex-1 flex-col bg-background">
        {children}
      </main>
    </div>
  );

  return (
    <div className="flex h-screen flex-col bg-background">
      <TitleBar />
      <MenuBar />
      <UpdateBanner />
      <SessionStatusBanner />
      <div className="flex min-h-0 flex-1 flex-col">
        {bottomVisible ? (
          <Splitter
            orientation="vertical"
            storageKey="chrome:bottomSplit"
            defaultLeftPct={68}
            minLeftPct={25}
            maxLeftPct={92}
            className="h-full w-full"
            left={upperRow}
            right={
              <BottomPanel
                onClose={() => setBottomVisible(false)}
                initialTab={bottomTab}
                onTabChange={setBottomTab}
              />
            }
          />
        ) : (
          upperRow
        )}
      </div>
      <StatusBar
        onClickGit={() => {
          setBottomVisible(true);
        }}
      />
    </div>
  );
}

// PluginHostWrapper exists so we can read useWorkspace() (which
// requires WorkspaceProvider) and pass the workspace adapter to
// PluginHostProvider without a circular import.
function PluginHostWrapper({ children }: { children: React.ReactNode }) {
  const ws = useWorkspace();
  const adapter = {
    openFile: ws.openFile,
    getRoot: () => ws.rootPath,
  };
  return <PluginHostProvider workspace={adapter}>{children}</PluginHostProvider>;
}

// StreakWrapper bridges chapter completions into a window-level
// "JEditor:streak-toast" event the IDE chrome listens for, so we can
// show the celebration toast without coupling the streak store to the
// toast surface directly.
function StreakWrapper({ children }: { children: React.ReactNode }) {
  return (
    <StreakProvider
      onChapterEarned={(msg) => {
        window.dispatchEvent(new CustomEvent("JEditor:streak-toast", { detail: msg }));
      }}
    >
      {children}
    </StreakProvider>
  );
}

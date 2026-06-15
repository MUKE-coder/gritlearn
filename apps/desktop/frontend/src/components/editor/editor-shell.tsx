import { EditorSidebar } from "./editor-sidebar";
import { EditorTabs } from "./editor-tabs";
import { MonacoPane } from "./monaco-pane";
import { PreviewPane } from "./preview-pane";
import { LessonPane } from "./lesson-pane";

// The three-pane editor shell per design-style-guide.md:
//   [ sidebar 240 ][ editor (tabs + Monaco + optional preview) ][ lesson 400 ]
// The TitleBar lives one level up in the /app layout so the same chrome
// stays consistent across editor / profile / settings routes.

export function EditorShell() {
  return (
    <div className="flex h-full min-h-0 w-full overflow-hidden">
      <EditorSidebar />

      <main className="flex h-full min-w-0 flex-1 flex-col bg-background">
        <EditorTabs />
        <div className="flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col">
            <MonacoPane />
          </div>
          <PreviewPane />
        </div>
      </main>

      <LessonPane />
    </div>
  );
}

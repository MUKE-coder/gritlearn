// Sidebar host — picks the activity-bound panel and renders it inside
// a resizable column. Drag the right edge to grow/shrink; the width
// is persisted per-activity in localStorage via ide-shell.

import { useCallback, useEffect, useRef } from "react";
import { useShell } from "@/lib/ide-shell";
import { FileTree } from "@/components/editor/file-tree";
import { SearchPanel } from "@/components/editor/search-panel";
import { GitPanel } from "@/components/editor/git-panel";
import { ExtensionsPanel } from "@/components/editor/extensions-panel";
import { LearningSidebar } from "@/components/editor/learning-sidebar";

const MIN_WIDTH = 200;
const MAX_WIDTH = 720;

export function SidebarHost() {
  const { activity, sidebarWidth, setSidebarWidth } = useShell();
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    draggingRef.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const px = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX - rect.left));
      setSidebarWidth(px);
    };
    const onUp = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [setSidebarWidth]);

  if (activity === "none") return null;

  return (
    <div ref={containerRef} className="flex h-full shrink-0" style={{ width: `${sidebarWidth}px` }}>
      <div className="flex h-full flex-1 flex-col overflow-hidden border-r border-border bg-surface-1">
        <SidebarHeader activity={activity} />
        <div className="min-h-0 flex-1">
          {activity === "learning"   && <LearningSidebar />}
          {activity === "explorer"   && <FileTree />}
          {activity === "search"     && <SearchPanel />}
          {activity === "git"        && <GitPanel />}
          {activity === "extensions" && <ExtensionsPanel />}
        </div>
      </div>
      {/* Resize handle — 4px wide visible, ~10px hit area via -mr-2 */}
      <div
        onMouseDown={onMouseDown}
        title="Drag to resize"
        className="group relative -mr-1 w-1.5 shrink-0 cursor-col-resize bg-transparent transition-colors hover:bg-accent/50"
      >
        <span className="absolute inset-y-0 -left-1 -right-1" />
      </div>
    </div>
  );
}

function SidebarHeader({ activity }: { activity: string }) {
  const titles: Record<string, string> = {
    learning:   "Learning",
    explorer:   "Explorer",
    search:     "Search",
    git:        "Source Control",
    extensions: "Extensions",
  };
  return (
    <div className="hidden h-7 shrink-0 items-center border-b border-border-subtle bg-surface-2/40 px-3 text-[10px] font-medium uppercase tracking-wider text-foreground-muted lg:flex">
      {titles[activity] ?? activity}
    </div>
  );
}

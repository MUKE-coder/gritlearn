import { X } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";

// Editor tabs — VS Code style. The active tab gets a 2px accent underline;
// dirty tabs get a small dot before the close button so a glance tells you
// what still needs saving.

export function EditorTabs() {
  const { tabs, activeTabIndex, selectTab, closeTab } = useWorkspace();

  if (tabs.length === 0) return null;

  return (
    <div className="flex h-9 shrink-0 items-center overflow-x-auto border-b border-border bg-surface-2">
      {tabs.map((tab, i) => {
        const isActive = i === activeTabIndex;
        const isDirty = tab.content !== tab.savedContent;
        return (
          <div
            key={tab.path || `scratch-${i}`}
            onClick={() => selectTab(i)}
            className={`group flex h-full shrink-0 cursor-pointer items-center gap-2 border-r border-border-subtle px-3 text-[12px] ${
              isActive
                ? "border-b-2 border-b-accent bg-background text-foreground"
                : "text-foreground-secondary hover:bg-surface-3 hover:text-foreground"
            }`}
            title={tab.path}
          >
            <span className="font-mono">{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                closeTab(i);
              }}
              className="rounded p-0.5 text-foreground-muted opacity-60 hover:bg-surface-2 hover:opacity-100 group-hover:opacity-100"
              title="Close (⌘W)"
            >
              {isDirty ? (
                <span className="block h-2 w-2 rounded-full bg-accent" aria-label="Unsaved changes" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Pin, PinOff, X } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
import { FileIcon } from "./file-icon";

// Editor tabs — VS Code style with pinning, dirty markers, right-click
// menu (close / close-others / close-right / close-all / pin / reveal).
//
// Active tab has the 2px accent underline. Dirty tabs show a coloured
// dot in place of the X until you hover. Pinned tabs stick to the
// left, get a pin icon instead of an X, and survive close-others /
// close-all.

export function EditorTabs() {
  const ws = useWorkspace();
  const { tabs, activeTabIndex, selectTab, closeTab } = ws;
  const [menu, setMenu] = useState<{ x: number; y: number; index: number } | null>(null);

  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("click", close);
    window.addEventListener("contextmenu", close);
    window.addEventListener("keydown", onEsc);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("contextmenu", close);
      window.removeEventListener("keydown", onEsc);
    };
  }, [menu]);

  if (tabs.length === 0) return null;

  return (
    <div className="relative flex h-9 shrink-0 items-center overflow-x-auto border-b border-border bg-surface-2">
      {tabs.map((tab, i) => {
        const isActive = i === activeTabIndex;
        const isDirty = tab.content !== tab.savedContent;
        return (
          <div
            key={tab.path || `scratch-${i}`}
            onClick={() => selectTab(i)}
            onAuxClick={(e) => {
              // Middle-click closes the tab (VSCode + browser muscle memory).
              if (e.button === 1) {
                e.preventDefault();
                closeTab(i);
              }
            }}
            onContextMenu={(e) => {
              e.preventDefault();
              setMenu({ x: e.clientX, y: e.clientY, index: i });
            }}
            className={`group flex h-full shrink-0 cursor-pointer items-center gap-1.5 border-r border-border-subtle px-3 text-[12px] ${
              isActive
                ? "border-b-2 border-b-accent bg-background text-foreground"
                : "text-foreground-secondary hover:bg-surface-3 hover:text-foreground"
            }`}
            title={tab.path}
          >
            <FileIcon name={tab.name} isDir={false} />
            <span className={`font-mono ${tab.pinned ? "italic" : ""}`}>{tab.name}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (tab.pinned) {
                  // Pinned tabs need an explicit unpin → close two-step.
                  ws.togglePin(i);
                  return;
                }
                closeTab(i);
              }}
              className="rounded p-0.5 text-foreground-muted opacity-60 hover:bg-surface-2 hover:opacity-100 group-hover:opacity-100"
              title={tab.pinned ? "Unpin" : "Close (⌘W)"}
            >
              {tab.pinned ? (
                <Pin className="h-3 w-3 text-accent" />
              ) : isDirty ? (
                <span className="block h-2 w-2 rounded-full bg-accent" aria-label="Unsaved changes" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          </div>
        );
      })}

      {menu && <TabContextMenu menu={menu} onClose={() => setMenu(null)} />}
    </div>
  );
}

function TabContextMenu({
  menu,
  onClose,
}: {
  menu: { x: number; y: number; index: number };
  onClose: () => void;
}) {
  const ws = useWorkspace();
  const tab = ws.tabs[menu.index];
  if (!tab) return null;

  const Item = ({
    label,
    onClick,
    danger = false,
    disabled = false,
    icon,
    shortcut,
  }: {
    label: string;
    onClick: () => void;
    danger?: boolean;
    disabled?: boolean;
    icon?: React.ReactNode;
    shortcut?: string;
  }) => (
    <button
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (disabled) return;
        onClose();
        onClick();
      }}
      className={`flex w-full items-center justify-between gap-3 px-3 py-1.5 text-left text-[12px] ${
        disabled
          ? "cursor-not-allowed text-foreground-muted opacity-50"
          : danger
          ? "text-danger hover:bg-danger/10"
          : "text-foreground hover:bg-surface-2"
      }`}
    >
      <span className="flex items-center gap-2">{icon}{label}</span>
      {shortcut && <span className="font-mono text-[10px] text-foreground-muted">{shortcut}</span>}
    </button>
  );

  return (
    <div
      style={{ left: menu.x, top: menu.y }}
      className="fixed z-50 min-w-[200px] rounded-md border border-border bg-surface-1 py-1 shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      <Item
        label="Close"
        shortcut="⌘W"
        onClick={() => ws.closeTab(menu.index)}
      />
      <Item
        label="Close Others"
        disabled={ws.tabs.length < 2}
        onClick={() => ws.closeOthers(menu.index)}
      />
      <Item
        label="Close to the Right"
        disabled={menu.index >= ws.tabs.length - 1}
        onClick={() => ws.closeRight(menu.index)}
      />
      <Item
        label="Close All"
        onClick={() => ws.closeAll()}
      />
      <div className="my-1 border-t border-border-subtle" />
      <Item
        icon={tab.pinned ? <PinOff className="h-3.5 w-3.5" /> : <Pin className="h-3.5 w-3.5" />}
        label={tab.pinned ? "Unpin Tab" : "Pin Tab"}
        onClick={() => ws.togglePin(menu.index)}
      />
      {tab.path && (
        <>
          <div className="my-1 border-t border-border-subtle" />
          <Item
            label="Copy Path"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(tab.path);
              } catch {
                // ignore
              }
            }}
          />
          <Item
            label="Reveal in File Explorer"
            onClick={() => void ws.revealInExplorer(tab.path)}
          />
        </>
      )}
    </div>
  );
}

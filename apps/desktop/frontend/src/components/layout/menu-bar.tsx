// Menu bar — VSCode-style horizontal menu. Each menu is a click-to-
// open dropdown; subsequent menus open on hover (matches OS muscle
// memory once you've clicked one open).
//
// Actions route through useWorkspace + useShell + react-router so
// they reuse the existing command implementations rather than
// re-implementing every action twice.

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useWorkspace } from "@/lib/workspace-store";
import { useShell } from "@/lib/ide-shell";
import { useTheme } from "@/lib/theme-provider";

interface MenuItem {
  label: string;
  shortcut?: string;
  onSelect?: () => void;
  separator?: boolean;
  disabled?: boolean;
}

interface MenuDef {
  title: string;
  items: MenuItem[];
}

export function MenuBar() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const navigate = useNavigate();
  const ws = useWorkspace();
  const shell = useShell();
  const { theme, setTheme } = useTheme();
  const ref = useRef<HTMLDivElement>(null);

  // Click outside / Escape closes.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenIndex(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenIndex(null);
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, []);

  const close = () => setOpenIndex(null);
  const run = (fn: () => void) => {
    close();
    fn();
  };

  const menus: MenuDef[] = [
    {
      title: "File",
      items: [
        { label: "New File",   shortcut: "Ctrl+N", onSelect: () => {/* future: scratch buffer */} },
        { label: "Open Folder…", shortcut: "Ctrl+O", onSelect: () => void ws.openFolder() },
        { separator: true, label: "" },
        { label: "Save",     shortcut: "Ctrl+S", disabled: !ws.activeTab, onSelect: () => void ws.saveActiveTab() },
        { label: "Save All", shortcut: "Ctrl+Shift+S", disabled: ws.tabs.length === 0, onSelect: () => {
          ws.tabs.forEach((_t, i) => {
            ws.selectTab(i);
            void ws.saveActiveTab();
          });
        }},
        { separator: true, label: "" },
        { label: "Close Editor", shortcut: "Ctrl+W", disabled: ws.activeTabIndex < 0, onSelect: () => ws.closeTab(ws.activeTabIndex) },
        { label: "Close All",    onSelect: () => ws.closeAll() },
        { separator: true, label: "" },
        { label: "Preferences: Settings", shortcut: "Ctrl+,", onSelect: () => navigate({ to: "/app/settings" }) },
      ],
    },
    {
      title: "Edit",
      items: [
        { label: "Undo",  shortcut: "Ctrl+Z", onSelect: () => document.execCommand("undo") },
        { label: "Redo",  shortcut: "Ctrl+Y", onSelect: () => document.execCommand("redo") },
        { separator: true, label: "" },
        { label: "Cut",   shortcut: "Ctrl+X", onSelect: () => document.execCommand("cut") },
        { label: "Copy",  shortcut: "Ctrl+C", onSelect: () => document.execCommand("copy") },
        { label: "Paste", shortcut: "Ctrl+V", onSelect: () => document.execCommand("paste") },
        { separator: true, label: "" },
        { label: "Find in File",    shortcut: "Ctrl+F",      onSelect: () => triggerEditorCommand("actions.find") },
        { label: "Replace in File", shortcut: "Ctrl+H",      onSelect: () => triggerEditorCommand("editor.action.startFindReplaceAction") },
        { label: "Find in Files",   shortcut: "Ctrl+Shift+F", onSelect: () => shell.setActivity("search") },
      ],
    },
    {
      title: "Selection",
      items: [
        { label: "Select All",         shortcut: "Ctrl+A",        onSelect: () => triggerEditorCommand("editor.action.selectAll") },
        { label: "Expand Selection",   shortcut: "Shift+Alt+→",   onSelect: () => triggerEditorCommand("editor.action.smartSelect.expand") },
        { label: "Shrink Selection",   shortcut: "Shift+Alt+←",   onSelect: () => triggerEditorCommand("editor.action.smartSelect.shrink") },
        { separator: true, label: "" },
        { label: "Add Cursor Above",   shortcut: "Ctrl+Alt+↑",    onSelect: () => triggerEditorCommand("editor.action.insertCursorAbove") },
        { label: "Add Cursor Below",   shortcut: "Ctrl+Alt+↓",    onSelect: () => triggerEditorCommand("editor.action.insertCursorBelow") },
      ],
    },
    {
      title: "View",
      items: [
        { label: "Command Palette…", shortcut: "Ctrl+K",       onSelect: () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true, bubbles: true })) },
        { label: "Go to File…",      shortcut: "Ctrl+P",       onSelect: () => window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", ctrlKey: true, metaKey: true, bubbles: true })) },
        { separator: true, label: "" },
        { label: "Explorer",       shortcut: "Ctrl+Shift+E", onSelect: () => shell.setActivity("explorer") },
        { label: "Search",         shortcut: "Ctrl+Shift+F", onSelect: () => shell.setActivity("search") },
        { label: "Source Control", shortcut: "Ctrl+Shift+G", onSelect: () => shell.setActivity("git") },
        { label: "Extensions",     shortcut: "Ctrl+Shift+X", onSelect: () => shell.setActivity("extensions") },
        { label: "Learning",       shortcut: "Ctrl+1",       onSelect: () => shell.setActivity("learning") },
        { separator: true, label: "" },
        { label: shell.bottomVisible ? "Hide Bottom Panel" : "Show Bottom Panel", shortcut: "Ctrl+J", onSelect: () => shell.toggleBottom() },
        { separator: true, label: "" },
        { label: `Switch to ${theme === "dark" ? "Light" : "Dark"} Theme`, onSelect: () => setTheme(theme === "dark" ? "light" : "dark") },
      ],
    },
    {
      title: "Go",
      items: [
        { label: "Back to Phases",     onSelect: () => navigate({ to: "/app" }) },
        { label: "Profile",            onSelect: () => navigate({ to: "/app/profile" }) },
        { label: "Settings",           shortcut: "Ctrl+,", onSelect: () => navigate({ to: "/app/settings" }) },
      ],
    },
    {
      title: "Terminal",
      items: [
        { label: shell.bottomVisible && shell.bottomTab === "terminal" ? "Hide Terminal" : "New Terminal", shortcut: "Ctrl+`", onSelect: () => {
          shell.setBottomTab("terminal");
          shell.setBottomVisible(true);
        }},
        { label: "Live Server",       onSelect: () => { shell.setBottomTab("live-server"); shell.setBottomVisible(true); } },
      ],
    },
    {
      title: "Help",
      items: [
        { label: "What's New",         onSelect: () => window.open("https://jbeditor.com/changelog", "_blank") },
        { label: "Documentation",      onSelect: () => window.open("https://jbeditor.com", "_blank") },
        { label: "Report Issue",       onSelect: () => window.open("https://github.com/MUKE-coder/gritlearn/issues", "_blank") },
        { separator: true, label: "" },
        { label: "About JEditor",      onSelect: () => navigate({ to: "/app/settings" }) },
      ],
    },
  ];

  return (
    <div
      ref={ref}
      className="drag-region flex h-8 shrink-0 items-center border-b border-border-subtle bg-surface-2 text-[12px] text-foreground-secondary"
    >
      {menus.map((menu, i) => (
        <div key={menu.title} className="relative no-drag">
          <button
            onMouseEnter={() => openIndex !== null && setOpenIndex(i)}
            onClick={() => setOpenIndex((cur) => (cur === i ? null : i))}
            className={`flex h-8 items-center px-3 hover:bg-surface-3 hover:text-foreground ${
              openIndex === i ? "bg-surface-3 text-foreground" : ""
            }`}
          >
            {menu.title}
          </button>
          {openIndex === i && (
            <div className="absolute left-0 top-full z-50 min-w-[220px] rounded-md border border-border bg-surface-1 py-1 shadow-2xl">
              {menu.items.map((item, j) =>
                item.separator ? (
                  <div key={j} className="my-1 border-t border-border-subtle" />
                ) : (
                  <button
                    key={j}
                    disabled={item.disabled}
                    onClick={() => item.onSelect && run(item.onSelect)}
                    className={`flex w-full items-center justify-between gap-4 px-3 py-1.5 text-left text-[12px] ${
                      item.disabled
                        ? "cursor-not-allowed text-foreground-muted opacity-50"
                        : "text-foreground hover:bg-surface-2"
                    }`}
                  >
                    <span>{item.label}</span>
                    {item.shortcut && (
                      <span className="font-mono text-[10px] text-foreground-muted">{item.shortcut}</span>
                    )}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// triggerEditorCommand fires a Monaco command by id. Monaco's editor
// listens on a global signal we dispatch — see MonacoPane's
// onMount handler.
function triggerEditorCommand(id: string) {
  window.dispatchEvent(new CustomEvent("JEditor:run-editor-command", { detail: id }));
}

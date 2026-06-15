import { useEffect } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useWorkspace } from "@/lib/workspace-store";
import "@/lib/monaco-setup";

// Tell @monaco-editor/react to use the local monaco instance instead of
// loading from a CDN. Without this it tries to fetch loader scripts from
// cdn.jsdelivr.net at runtime — fatal the moment the student is offline.
loader.config({ monaco });

export function MonacoPane() {
  const { activeTab, activeTabIndex, updateActiveContent, saveActiveTab } = useWorkspace();

  // Bind Ctrl/Cmd+S → save active tab. Listening at the window level (not
  // on the editor) so the shortcut works while the file tree has focus too.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isSave = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s";
      if (!isSave) return;
      e.preventDefault();
      void saveActiveTab();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [saveActiveTab]);

  const handleMount: OnMount = (editor) => {
    // Default Monaco's Cmd/Ctrl+K binding fights our command palette;
    // disable it inside the editor so the global shortcut wins.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true });
      window.dispatchEvent(event);
    });
  };

  if (!activeTab) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-background text-center">
        <p className="text-[15px] text-foreground-secondary">No file open</p>
        <p className="text-[12px] text-foreground-muted">
          Open a folder in the sidebar, or press <kbd className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px]">⌘K</kbd>
        </p>
      </div>
    );
  }

  return (
    <Editor
      // Force a fresh editor instance per tab so Monaco's internal model
      // matches the file we're editing. Without `key`, switching tabs would
      // pile every file's content into one shared model.
      key={`${activeTabIndex}:${activeTab.path}`}
      height="100%"
      theme="vs-dark"
      language={activeTab.language}
      value={activeTab.content}
      onChange={(v) => updateActiveContent(v ?? "")}
      onMount={handleMount}
      options={{
        fontSize: 14,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        lineHeight: 1.6,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        renderLineHighlight: "all",
        automaticLayout: true,
        tabSize: 2,
        wordWrap: "on",
      }}
    />
  );
}

import { useCallback, useEffect, useRef } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useWorkspace } from "@/lib/workspace-store";
import { useEditorPrefs } from "@/lib/editor-prefs";
import { registerMonacoThemes, monacoThemeId } from "@/lib/monaco-themes";
import { applyGitGutter } from "@/lib/monaco-git-gutter";
import "@/lib/monaco-setup";

// Tell @monaco-editor/react to use the local monaco instance instead of
// loading from a CDN. Without this it tries to fetch loader scripts from
// cdn.jsdelivr.net at runtime — fatal the moment the student is offline.
loader.config({ monaco });

// Themes are registered once on module load — defining them inside the
// component would re-register on every mount and Monaco would log a
// warning each time.
registerMonacoThemes(monaco);

export function MonacoPane() {
  const { activeTab, activeTabIndex, updateActiveContent, saveActiveTab, rootPath } = useWorkspace();
  const { prefs } = useEditorPrefs();

  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const gutterColRef = useRef<monaco.editor.IEditorDecorationsCollection | null>(null);

  // Pull fresh git hunks + redraw the gutter strips. Called after
  // the editor mounts, after the active tab changes, and after a
  // save (since saving may produce a new diff against HEAD).
  const refreshGutter = useCallback(async () => {
    const ed = editorRef.current;
    if (!ed) return;
    gutterColRef.current?.clear();
    gutterColRef.current = null;
    if (!activeTab?.path || !rootPath) return;
    const col = await applyGitGutter(ed, monaco, rootPath, activeTab.path);
    gutterColRef.current = col;
  }, [activeTab?.path, rootPath]);

  useEffect(() => {
    void refreshGutter();
    // Re-run when the active tab's saved content changes (i.e. after
    // a save flushed dirty → clean).
  }, [refreshGutter, activeTab?.savedContent]);

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

  // Debounced auto-save. Whenever the active tab's content changes,
  // reset the timer; when it fires we flush a save. Skipped for
  // scratch buffers (no path) and when the user has switched the pref
  // off entirely.
  useEffect(() => {
    if (prefs.autoSave !== "afterDelay") return;
    if (!activeTab?.path) return;
    if (activeTab.content === activeTab.savedContent) return;
    if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    autoSaveTimerRef.current = setTimeout(() => {
      void saveActiveTab();
    }, prefs.autoSaveDelayMs);
    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [activeTab?.content, activeTab?.savedContent, activeTab?.path, prefs.autoSave, prefs.autoSaveDelayMs, saveActiveTab]);

  const handleMount: OnMount = (editor) => {
    editorRef.current = editor;
    // Default Monaco's Cmd/Ctrl+K binding fights our command palette;
    // disable it inside the editor so the global shortcut wins.
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK, () => {
      const event = new KeyboardEvent("keydown", { key: "k", metaKey: true, ctrlKey: true, bubbles: true });
      window.dispatchEvent(event);
    });
    // First paint of the git gutter.
    void refreshGutter();
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
      theme={monacoThemeId(prefs.monacoTheme)}
      language={activeTab.language}
      value={activeTab.content}
      onChange={(v) => updateActiveContent(v ?? "")}
      onMount={handleMount}
      options={{
        fontSize: prefs.fontSize,
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        lineHeight: 1.6,
        minimap: { enabled: prefs.minimap },
        scrollBeyondLastLine: false,
        smoothScrolling: true,
        cursorBlinking: "smooth",
        renderLineHighlight: "all",
        automaticLayout: true,
        tabSize: prefs.tabSize,
        wordWrap: prefs.wordWrap,
        bracketPairColorization: { enabled: true },
        guides: { bracketPairs: true, indentation: true },
      }}
    />
  );
}

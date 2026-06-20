import { useCallback, useEffect, useRef, useState } from "react";
import Editor, { loader, type OnMount } from "@monaco-editor/react";
import * as monaco from "monaco-editor";
import { useWorkspace } from "@/lib/workspace-store";
import { useEditorPrefs } from "@/lib/editor-prefs";
import { registerMonacoThemes, monacoThemeId } from "@/lib/monaco-themes";
import { applyGitGutter } from "@/lib/monaco-git-gutter";
import { registerSnipAction } from "@/lib/monaco-snipper";
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [selectionToolbar, setSelectionToolbar] = useState<null | {
    top: number;
    left: number;
  }>(null);

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
    // Listen for menubar-driven editor commands ("Find in File", etc).
    const onRun = (e: Event) => {
      const id = (e as CustomEvent).detail as string;
      if (id) editor.trigger("menubar", id, null);
    };
    window.addEventListener("JEditor:run-editor-command", onRun);

    // Register "Snip selection as image" — appears in the right-click
    // menu, the command palette, and Ctrl+K Ctrl+P. Snips the
    // selection (or the whole file if nothing's selected). getDeps
    // runs every click so the active prefs are always current.
    const snipDisposable = registerSnipAction(editor, monaco, () => ({
      snipTheme: prefs.snipTheme,
      editorTheme: prefs.monacoTheme,
    }));

    // Floating selection toolbar — appears above a multi-character
    // selection. Discoverable surface for the Snip action so the
    // student doesn't have to know it lives in the right-click menu.
    const onSelChange = editor.onDidChangeCursorSelection(() => {
      const sel = editor.getSelection();
      if (!sel || sel.isEmpty()) {
        setSelectionToolbar(null);
        return;
      }
      // Skip tiny accidental selections.
      const selText = editor.getModel()?.getValueInRange(sel) ?? "";
      if (selText.trim().length < 2) {
        setSelectionToolbar(null);
        return;
      }
      // Anchor the toolbar above the selection's start position.
      const pos = sel.getStartPosition();
      const coords = editor.getScrolledVisiblePosition(pos);
      const container = containerRef.current;
      if (!coords || !container) {
        setSelectionToolbar(null);
        return;
      }
      setSelectionToolbar({
        top: Math.max(2, coords.top - 30),
        left: Math.max(4, coords.left - 8),
      });
    });

    // Clean up via Monaco's dispose lifecycle when the editor is torn down.
    editor.onDidDispose(() => {
      window.removeEventListener("JEditor:run-editor-command", onRun);
      snipDisposable.dispose();
      onSelChange.dispose();
    });
    // Forward cursor position changes to the status bar (which
    // listens on a window-level event so it doesn't have to thread a
    // ref through the layout).
    editor.onDidChangeCursorPosition((e) => {
      window.dispatchEvent(
        new CustomEvent("JEditor:cursor-position", {
          detail: { line: e.position.lineNumber, col: e.position.column },
        }),
      );
    });
    // First paint of the git gutter.
    void refreshGutter();
    // If the tab was opened with a target line (search result, etc),
    // scroll to it after mount.
    if (activeTab?.revealLine && activeTab.revealLine > 0) {
      editor.revealLineInCenter(activeTab.revealLine);
      editor.setPosition({ lineNumber: activeTab.revealLine, column: 1 });
      editor.focus();
    }
  };

  // Watch revealVersion — bumped each time openFile(path, line) is
  // called for an already-open tab — so subsequent search-result
  // clicks re-scroll the same buffer.
  useEffect(() => {
    const ed = editorRef.current;
    if (!ed || !activeTab) return;
    if (activeTab.revealLine > 0) {
      ed.revealLineInCenter(activeTab.revealLine);
      ed.setPosition({ lineNumber: activeTab.revealLine, column: 1 });
      ed.focus();
    }
  }, [activeTab?.revealVersion, activeTab?.revealLine]);

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
    <div ref={containerRef} className="relative h-full">
    {selectionToolbar && (
      <div
        className="pointer-events-auto absolute z-30 flex items-center gap-1 rounded-md border border-border bg-surface-1 px-1.5 py-1 shadow-2xl"
        style={{ top: selectionToolbar.top, left: selectionToolbar.left }}
      >
        <button
          onClick={() => {
            const ed = editorRef.current;
            if (!ed) return;
            ed.trigger("toolbar", "jeditor.snip-selection", null);
          }}
          title="Snip selection as image"
          className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-medium text-foreground-secondary hover:bg-surface-2 hover:text-foreground"
        >
          📸 Snip
        </button>
      </div>
    )}
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
        // VSCode-like completion behaviour: trigger on type, on dot,
        // and on Tab; ghost-text previews next-word suggestions
        // inline; the suggest widget hovers on demand.
        suggest: {
          showSnippets: true,
          showWords: true,
          preview: true,
          previewMode: "subwordSmart",
        },
        quickSuggestions: { other: true, comments: false, strings: true },
        suggestOnTriggerCharacters: true,
        acceptSuggestionOnEnter: "on",
        tabCompletion: "on",
        inlineSuggest: { enabled: true, showToolbar: "onHover" },
        snippetSuggestions: "top",
        // Hover docs on symbols (TypeScript LSP fills this for ts/js).
        hover: { enabled: true, delay: 250, sticky: true },
      }}
    />
    </div>
  );
}

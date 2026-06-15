// WorkspaceStore is the shared state behind the editor shell — every
// component (file tree, tabs, Monaco pane, preview, command palette)
// reads + acts through this single context so we don't end up passing
// "open this file" callbacks through six layers of props.
//
// State is intentionally non-persistent for B4. Open tabs, dirty buffers,
// and tree expansion all live in memory; closing the app forgets them.
// Persisting "last folder" / "open tabs" lands in B7's offline polish.

import { createContext, useCallback, useContext, useMemo, useReducer } from "react";
import type { ReactNode } from "react";
import { languageForPath } from "./monaco-setup";

// Wails generates these into wailsjs/go at `wails dev` time.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time, not present in fresh checkouts
import * as App from "../../wailsjs/go/main/App";

export interface OpenTab {
  /** Absolute path on disk. Empty string for an unsaved scratch buffer. */
  path: string;
  /** Display name shown in the tab and command palette. */
  name: string;
  /** Last-known on-disk content (so we can compute dirty state cheaply). */
  savedContent: string;
  /** Current editor content. Equal to savedContent ⇒ clean. */
  content: string;
  /** Monaco language id (e.g. "html", "typescript"). */
  language: string;
}

interface WorkspaceState {
  /** Absolute path of the open workspace folder, or null. */
  rootPath: string | null;
  /** Open editor tabs in left-to-right order. */
  tabs: OpenTab[];
  /** Index of the active tab in `tabs`. -1 when no tabs are open. */
  activeTabIndex: number;
  /** Whether the right-hand preview pane is showing. */
  previewVisible: boolean;
}

const initialState: WorkspaceState = {
  rootPath: null,
  tabs: [],
  activeTabIndex: -1,
  previewVisible: false,
};

type Action =
  | { type: "set-root"; path: string | null }
  | { type: "open-tab"; tab: OpenTab }
  | { type: "close-tab"; index: number }
  | { type: "select-tab"; index: number }
  | { type: "update-content"; index: number; content: string }
  | { type: "mark-saved"; index: number; savedContent: string }
  | { type: "set-preview"; visible: boolean };

function reducer(state: WorkspaceState, action: Action): WorkspaceState {
  switch (action.type) {
    case "set-root":
      return { ...state, rootPath: action.path };

    case "open-tab": {
      // If the file is already open, just focus its existing tab.
      const existing = state.tabs.findIndex((t) => t.path === action.tab.path && t.path !== "");
      if (existing >= 0) {
        return { ...state, activeTabIndex: existing };
      }
      return {
        ...state,
        tabs: [...state.tabs, action.tab],
        activeTabIndex: state.tabs.length,
      };
    }

    case "close-tab": {
      const nextTabs = state.tabs.filter((_, i) => i !== action.index);
      let nextActive = state.activeTabIndex;
      if (nextTabs.length === 0) nextActive = -1;
      else if (action.index < state.activeTabIndex) nextActive = state.activeTabIndex - 1;
      else if (action.index === state.activeTabIndex) nextActive = Math.min(action.index, nextTabs.length - 1);
      return { ...state, tabs: nextTabs, activeTabIndex: nextActive };
    }

    case "select-tab":
      return { ...state, activeTabIndex: action.index };

    case "update-content":
      return {
        ...state,
        tabs: state.tabs.map((t, i) => (i === action.index ? { ...t, content: action.content } : t)),
      };

    case "mark-saved":
      return {
        ...state,
        tabs: state.tabs.map((t, i) =>
          i === action.index ? { ...t, savedContent: action.savedContent, content: action.savedContent } : t,
        ),
      };

    case "set-preview":
      return { ...state, previewVisible: action.visible };
  }
}

export interface WorkspaceContextValue extends WorkspaceState {
  activeTab: OpenTab | null;
  openFolder: () => Promise<void>;
  /** Set the workspace root programmatically — used by "Open example project". */
  setRoot: (path: string) => void;
  openFile: (path: string) => Promise<void>;
  closeTab: (index: number) => void;
  selectTab: (index: number) => void;
  updateActiveContent: (content: string) => void;
  saveActiveTab: () => Promise<void>;
  setPreviewVisible: (visible: boolean) => void;
  togglePreview: () => void;
}

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const openFolder = useCallback(async () => {
    const dir = await App.OpenDirectoryDialog("Open a folder");
    if (!dir) return; // User cancelled — leave the current workspace alone.
    dispatch({ type: "set-root", path: dir });
  }, []);

  const setRoot = useCallback((dir: string) => {
    dispatch({ type: "set-root", path: dir });
  }, []);

  const openFile = useCallback(async (path: string) => {
    const content = await App.ReadFile(path);
    const name = path.split(/[\\/]/).pop() ?? path;
    dispatch({
      type: "open-tab",
      tab: {
        path,
        name,
        savedContent: content,
        content,
        language: languageForPath(path),
      },
    });
  }, []);

  const closeTab = useCallback((index: number) => {
    dispatch({ type: "close-tab", index });
  }, []);

  const selectTab = useCallback((index: number) => {
    dispatch({ type: "select-tab", index });
  }, []);

  const updateActiveContent = useCallback(
    (content: string) => {
      if (state.activeTabIndex < 0) return;
      dispatch({ type: "update-content", index: state.activeTabIndex, content });
    },
    [state.activeTabIndex],
  );

  const saveActiveTab = useCallback(async () => {
    const idx = state.activeTabIndex;
    if (idx < 0) return;
    const tab = state.tabs[idx];
    if (!tab || !tab.path) return; // Scratch buffer — Save-As lives in B12.
    await App.WriteFile(tab.path, tab.content);
    dispatch({ type: "mark-saved", index: idx, savedContent: tab.content });
  }, [state.tabs, state.activeTabIndex]);

  const setPreviewVisible = useCallback((visible: boolean) => {
    dispatch({ type: "set-preview", visible });
  }, []);

  const togglePreview = useCallback(() => {
    dispatch({ type: "set-preview", visible: !state.previewVisible });
  }, [state.previewVisible]);

  const value = useMemo<WorkspaceContextValue>(
    () => ({
      ...state,
      activeTab: state.activeTabIndex >= 0 ? state.tabs[state.activeTabIndex] : null,
      openFolder,
      setRoot,
      openFile,
      closeTab,
      selectTab,
      updateActiveContent,
      saveActiveTab,
      setPreviewVisible,
      togglePreview,
    }),
    [
      state,
      openFolder,
      setRoot,
      openFile,
      closeTab,
      selectTab,
      updateActiveContent,
      saveActiveTab,
      setPreviewVisible,
      togglePreview,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  if (!ctx) throw new Error("useWorkspace must be used inside <WorkspaceProvider>");
  return ctx;
}

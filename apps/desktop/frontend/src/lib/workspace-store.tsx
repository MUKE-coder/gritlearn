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
  /** Bumped every time a file/folder is created, renamed, or deleted.
   *  The file tree subscribes to this and re-fetches affected branches
   *  so the UI stays in sync with disk without us needing a real
   *  filesystem watcher in Go. */
  treeVersion: number;
  /** In-app clipboard for the file tree's cut/copy/paste. Lives here
   *  (not on the OS clipboard) so Paste targets nodes inside the
   *  tree, not random text in other apps. */
  treeClipboard:
    | { path: string; op: "cut" | "copy" }
    | null;
}

const initialState: WorkspaceState = {
  rootPath: null,
  tabs: [],
  activeTabIndex: -1,
  previewVisible: false,
  treeVersion: 0,
  treeClipboard: null,
};

type Action =
  | { type: "set-root"; path: string | null }
  | { type: "open-tab"; tab: OpenTab }
  | { type: "close-tab"; index: number }
  | { type: "select-tab"; index: number }
  | { type: "update-content"; index: number; content: string }
  | { type: "mark-saved"; index: number; savedContent: string }
  | { type: "set-preview"; visible: boolean }
  | { type: "bump-tree" }
  | { type: "rename-tab"; oldPath: string; newPath: string }
  | { type: "set-clipboard"; clip: WorkspaceState["treeClipboard"] };

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

    case "bump-tree":
      return { ...state, treeVersion: state.treeVersion + 1 };

    case "rename-tab":
      return {
        ...state,
        tabs: state.tabs.map((t) => {
          if (t.path !== action.oldPath) return t;
          const name = action.newPath.split(/[\\/]/).pop() ?? action.newPath;
          return { ...t, path: action.newPath, name, language: languageForPath(action.newPath) };
        }),
      };

    case "set-clipboard":
      return { ...state, treeClipboard: action.clip };
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
  /** Create an empty file at parentDir/name. Bumps treeVersion + opens it.
   *  Throws if the name already exists in that folder. */
  createFile: (parentDir: string, name: string) => Promise<void>;
  /** Create a new folder at parentDir/name. Bumps treeVersion. */
  createFolder: (parentDir: string, name: string) => Promise<void>;
  /** Rename or move a file/folder. Bumps treeVersion + retitles any
   *  open tab for that path. */
  renameNode: (oldPath: string, newName: string) => Promise<void>;
  /** Move a node to a different parent directory (drag-and-drop). */
  moveNode: (srcPath: string, destDir: string) => Promise<void>;
  /** Delete a file or folder tree. Bumps treeVersion + closes any open
   *  tabs whose path lived underneath it. */
  deleteNode: (path: string) => Promise<void>;
  /** Duplicate a file/folder next to itself, picking a "copy of" name. */
  duplicateNode: (path: string) => Promise<void>;
  /** Stash a path on the tree clipboard for a later Paste. */
  setClipboard: (clip: WorkspaceState["treeClipboard"]) => void;
  /** Apply the stashed clipboard to a destination directory. */
  pasteClipboard: (destDir: string) => Promise<void>;
  /** Open the OS file manager focused on path. */
  revealInExplorer: (path: string) => Promise<void>;
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

  // joinPath glues a parent directory + child segment without us having
  // to import path on the client. Windows accepts forward slashes for
  // path APIs, but the file tree reads ListDirectory output (OS-native
  // separator) so we mirror whatever the parent already used.
  const joinPath = useCallback((parent: string, child: string) => {
    const sep = parent.includes("\\") ? "\\" : "/";
    const trimmed = parent.endsWith(sep) ? parent.slice(0, -1) : parent;
    return `${trimmed}${sep}${child}`;
  }, []);

  const dirOf = useCallback((path: string) => {
    const sep = path.includes("\\") ? "\\" : "/";
    const idx = path.lastIndexOf(sep);
    return idx === -1 ? path : path.slice(0, idx);
  }, []);

  const createFile = useCallback(
    async (parentDir: string, name: string) => {
      const full = joinPath(parentDir, name);
      await App.CreateFile(full);
      dispatch({ type: "bump-tree" });
      const content = await App.ReadFile(full);
      const tabName = name;
      dispatch({
        type: "open-tab",
        tab: {
          path: full,
          name: tabName,
          savedContent: content,
          content,
          language: languageForPath(full),
        },
      });
    },
    [joinPath],
  );

  const createFolder = useCallback(
    async (parentDir: string, name: string) => {
      const full = joinPath(parentDir, name);
      await App.CreateFolder(full);
      dispatch({ type: "bump-tree" });
    },
    [joinPath],
  );

  const renameNode = useCallback(
    async (oldPath: string, newName: string) => {
      const parent = dirOf(oldPath);
      const newPath = joinPath(parent, newName);
      await App.RenameFileNode(oldPath, newPath);
      dispatch({ type: "rename-tab", oldPath, newPath });
      dispatch({ type: "bump-tree" });
    },
    [dirOf, joinPath],
  );

  const deleteNode = useCallback(
    async (path: string) => {
      await App.DeleteFileNode(path);
      // Close tabs whose file lived under the deleted path. We iterate
      // back-to-front so the indices don't shift mid-loop.
      const isUnder = (tabPath: string) =>
        tabPath === path || tabPath.startsWith(path + "/") || tabPath.startsWith(path + "\\");
      const indicesToClose: number[] = [];
      state.tabs.forEach((t, i) => {
        if (t.path && isUnder(t.path)) indicesToClose.push(i);
      });
      for (let i = indicesToClose.length - 1; i >= 0; i--) {
        dispatch({ type: "close-tab", index: indicesToClose[i] });
      }
      dispatch({ type: "bump-tree" });
    },
    [state.tabs],
  );

  const baseName = useCallback((path: string) => {
    const sep = path.includes("\\") ? "\\" : "/";
    const idx = path.lastIndexOf(sep);
    return idx === -1 ? path : path.slice(idx + 1);
  }, []);

  const moveNode = useCallback(
    async (srcPath: string, destDir: string) => {
      if (srcPath === destDir) return;
      // Don't drop a node onto its current parent — that's a no-op.
      if (dirOf(srcPath) === destDir) return;
      const name = baseName(srcPath);
      const dest = joinPath(destDir, name);
      // Refuse to move a folder INTO itself (or a child of itself).
      if (dest.startsWith(srcPath + "/") || dest.startsWith(srcPath + "\\") || dest === srcPath) {
        throw new Error("Can't move a folder into itself");
      }
      await App.RenameFileNode(srcPath, dest);
      dispatch({ type: "rename-tab", oldPath: srcPath, newPath: dest });
      dispatch({ type: "bump-tree" });
    },
    [dirOf, joinPath, baseName],
  );

  const duplicateNode = useCallback(async (path: string) => {
    const dst = await App.UniqueCopyPath(path);
    await App.CopyFileNode(path, dst);
    dispatch({ type: "bump-tree" });
  }, []);

  const setClipboard = useCallback((clip: WorkspaceState["treeClipboard"]) => {
    dispatch({ type: "set-clipboard", clip });
  }, []);

  const pasteClipboard = useCallback(
    async (destDir: string) => {
      const clip = state.treeClipboard;
      if (!clip) return;
      const name = baseName(clip.path);
      let dest = joinPath(destDir, name);
      // If the target name already exists, fall back to a "copy of"
      // variant so paste never silently overwrites.
      if (await App.FileExists(dest)) {
        dest = await App.UniqueCopyPath(dest);
      }
      if (clip.op === "cut") {
        await App.RenameFileNode(clip.path, dest);
        dispatch({ type: "rename-tab", oldPath: clip.path, newPath: dest });
        dispatch({ type: "set-clipboard", clip: null });
      } else {
        await App.CopyFileNode(clip.path, dest);
        // Copy stays on the clipboard so the user can paste it
        // again into another folder.
      }
      dispatch({ type: "bump-tree" });
    },
    [state.treeClipboard, baseName, joinPath],
  );

  const revealInExplorer = useCallback(async (path: string) => {
    await App.RevealInExplorer(path);
  }, []);

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
      createFile,
      createFolder,
      renameNode,
      moveNode,
      deleteNode,
      duplicateNode,
      setClipboard,
      pasteClipboard,
      revealInExplorer,
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
      createFile,
      createFolder,
      renameNode,
      moveNode,
      deleteNode,
      duplicateNode,
      setClipboard,
      pasteClipboard,
      revealInExplorer,
    ],
  );

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

// Inert no-op shape returned by useWorkspace when no provider is
// mounted. See sync-provider.tsx for the pattern + the v0.3.x
// post-mortem.
const noopWorkspaceContext: WorkspaceContextValue = {
  ...initialState,
  activeTab:           null,
  openFolder:          async () => {},
  setRoot:             () => {},
  openFile:            async () => {},
  closeTab:            () => {},
  selectTab:           () => {},
  updateActiveContent: () => {},
  saveActiveTab:       async () => {},
  setPreviewVisible:   () => {},
  togglePreview:       () => {},
  createFile:          async () => {},
  createFolder:        async () => {},
  renameNode:          async () => {},
  moveNode:            async () => {},
  deleteNode:          async () => {},
  duplicateNode:       async () => {},
  setClipboard:        () => {},
  pasteClipboard:      async () => {},
  revealInExplorer:    async () => {},
};

export function useWorkspace(): WorkspaceContextValue {
  const ctx = useContext(WorkspaceContext);
  return ctx ?? noopWorkspaceContext;
}

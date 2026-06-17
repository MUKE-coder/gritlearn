// Monaco diff gutter — colors the line-number gutter with strips
// matching the git status of each line in the active file. Called
// from MonacoPane each time the active tab path changes + whenever
// the editor's content goes back to its saved state (so saving
// refreshes the gutter without us having to listen on disk events).
//
// We use Monaco's "linesDecorationsClassName" rather than the glyph
// margin so the marker sits flush against the line number column
// (closer to how VSCode renders it).

import type * as MonacoNS from "monaco-editor";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — generated at build time
import * as App from "../../wailsjs/go/main/App";

interface DiffHunk {
  new_start: number;
  new_lines: number;
  kind: "added" | "modified" | "deleted";
}

const CLASS_FOR_KIND: Record<DiffHunk["kind"], string> = {
  added:    "git-gutter-added",
  modified: "git-gutter-modified",
  deleted:  "git-gutter-deleted",
};

/**
 * applyGitGutter loads diff hunks for `absPath` and renders gutter
 * marks on the given Monaco editor. Returns a collection ID so the
 * caller can clear marks before reloading or unmounting.
 */
export async function applyGitGutter(
  editor: MonacoNS.editor.IStandaloneCodeEditor,
  monaco: typeof MonacoNS,
  workspaceRoot: string,
  absPath: string,
): Promise<MonacoNS.editor.IEditorDecorationsCollection | null> {
  if (!workspaceRoot || !absPath) return null;
  if (!absPath.startsWith(workspaceRoot)) return null;

  let isRepo = false;
  try {
    isRepo = (await App.IsGitRepo(workspaceRoot)) as boolean;
  } catch {
    return null;
  }
  if (!isRepo) return null;

  const relPath = absPath
    .slice(workspaceRoot.length)
    .replace(/^[/\\]+/, "")
    .replace(/\\/g, "/");

  let hunks: DiffHunk[] = [];
  try {
    hunks = ((await App.GitDiffHunks(workspaceRoot, relPath)) as DiffHunk[]) ?? [];
  } catch {
    // Path may not be tracked / repo may have errored — no gutter,
    // not an error to surface to the student.
    return null;
  }
  if (hunks.length === 0) return null;

  const decos: MonacoNS.editor.IModelDeltaDecoration[] = hunks.map((h) => ({
    range: new monaco.Range(h.new_start, 1, h.new_start + Math.max(0, h.new_lines - 1), 1),
    options: {
      isWholeLine: false,
      linesDecorationsClassName: CLASS_FOR_KIND[h.kind],
    },
  }));

  return editor.createDecorationsCollection(decos);
}

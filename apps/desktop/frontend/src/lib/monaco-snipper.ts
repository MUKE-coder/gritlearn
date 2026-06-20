// Monaco selection snipper — registers a "Snip selection as image"
// action that appears in the right-click menu when the user has
// highlighted code in the editor. Pipes through Shiki to inline
// every token's colour, then html-to-image rasterises into a PNG
// using the user's chosen frame theme.

import type * as MonacoNS from "monaco-editor";
import { renderSnipFrame, snipThemeById, type SnipThemeId } from "./snip-themes";
import { highlightForSnip } from "./snip-highlight";

interface Disposable {
  dispose(): void;
}

interface SnipDeps {
  /** SnipTheme id the frame uses. */
  snipTheme: SnipThemeId;
  /** Active Monaco editor theme — Shiki picks a matching syntax palette. */
  editorTheme: string;
}

async function renderSnipImage(code: string, lang: string, deps: SnipDeps) {
  let html: string;
  try {
    html = await highlightForSnip(code, lang, deps.editorTheme);
  } catch (err) {
    alert(
      `Snip syntax highlighter failed to load.\n\n${err}\n\nThe snip will still render but without syntax colours. Check the devtools console for details.`,
    );
    html = `<pre style="margin:0;color:#e4e4ee;font-family:'JetBrains Mono',ui-monospace,monospace;">${code.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</pre>`;
  }
  const theme = snipThemeById(deps.snipTheme);
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position: fixed; left: -10000px; top: 0; z-index: -1;`;
  wrapper.innerHTML = renderSnipFrame(theme, lang, html);
  document.body.appendChild(wrapper);

  try {
    const target = wrapper.firstElementChild as HTMLElement | null;
    if (!target) throw new Error("snip frame missing");
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(target, {
      pixelRatio: 2,
      cacheBust: true,
      backgroundColor: "transparent",
    });
    const link = document.createElement("a");
    link.download = `jeditor-snip-${theme.id}-${lang || "code"}-${Date.now()}.png`;
    link.href = dataUrl;
    link.click();
  } finally {
    document.body.removeChild(wrapper);
  }
}

/** registerSnipAction wires a "Snip selection as image" action into
 *  Monaco's right-click menu + a Cmd+K Cmd+P shortcut. `getDeps` is
 *  a callback so the action always picks up the user's current prefs,
 *  not a snapshot at register-time. */
export function registerSnipAction(
  editor: MonacoNS.editor.IStandaloneCodeEditor,
  monaco: typeof MonacoNS,
  getDeps: () => SnipDeps,
): Disposable {
  return editor.addAction({
    id: "jeditor.snip-selection",
    label: "📸 Snip selection as image",
    keybindings: [
      monaco.KeyMod.chord(
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyK,
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyP,
      ),
    ],
    contextMenuGroupId: "1_modification",
    contextMenuOrder: 1.5,
    run: async (ed) => {
      const sel = ed.getSelection();
      const model = ed.getModel();
      if (!sel || !model) return;
      const code = sel.isEmpty() ? model.getValue() : model.getValueInRange(sel);
      if (!code.trim()) return;
      const lang = model.getLanguageId();
      try {
        await renderSnipImage(code, lang, getDeps());
      } catch (err) {
        console.error("[snip] failed", err);
        alert(`Snip failed: ${err}`);
      }
    },
  });
}

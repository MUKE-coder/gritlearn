// Monaco selection snipper — registers a "Snip selection as image"
// action that appears in the right-click menu when the user has
// highlighted code in the editor. Picks the frame from the user's
// snipTheme preference (ray.so-grade presets in snip-themes.ts),
// html-to-image's it to PNG, downloads.

import type * as MonacoNS from "monaco-editor";
import { inlineMonacoTokenColors, renderSnipFrame, snipThemeById, type SnipThemeId } from "./snip-themes";

interface Disposable {
  dispose(): void;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

const SKIP_COLORIZE = new Set(["plaintext", "text", "txt", ""]);

async function renderSnipImage(
  code: string,
  lang: string,
  monaco: typeof MonacoNS,
  themeId: SnipThemeId,
) {
  // Colour via Monaco using whatever theme the editor is currently
  // on — that way the snip's syntax colours match the editor the
  // student was just reading.
  let html: string;
  if (SKIP_COLORIZE.has(lang)) {
    html = escapeHtml(code);
  } else {
    try {
      html = await monaco.editor.colorize(code, lang, { tabSize: 2 });
    } catch {
      html = escapeHtml(code);
    }
  }

  const theme = snipThemeById(themeId);
  const wrapper = document.createElement("div");
  wrapper.style.cssText = `position: fixed; left: -10000px; top: 0; z-index: -1;`;
  wrapper.innerHTML = renderSnipFrame(theme, lang, html);
  document.body.appendChild(wrapper);

  try {
    // The actual rasterisable element is the first wrapper child the
    // renderer produced (it carries the theme.wrapper background).
    const target = wrapper.firstElementChild as HTMLElement | null;
    if (!target) throw new Error("snip frame missing");
    // Force-inline token colours from Monaco's stylesheet so the
    // rasteriser captures syntax highlighting, not just monochrome
    // text.
    inlineMonacoTokenColors(target);
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
 *  Monaco's right-click menu + the command palette + a Cmd+K Cmd+P
 *  shortcut. `getSnipTheme` is a callback so the action always picks
 *  up the user's current preference, not the one at register-time. */
export function registerSnipAction(
  editor: MonacoNS.editor.IStandaloneCodeEditor,
  monaco: typeof MonacoNS,
  getSnipTheme: () => SnipThemeId,
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
        await renderSnipImage(code, lang, monaco, getSnipTheme());
      } catch (err) {
        console.error("[snip] failed", err);
        alert(`Snip failed: ${err}`);
      }
    },
  });
}

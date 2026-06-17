// Curated Monaco theme palette inspired by community favourites.
// Defined inline (not loaded from JSON over the network) so the editor
// switches themes instantly offline.
//
// The dropdown in Settings exposes:
//   monokai      — Monokai Pro vibes, dark, our default
//   dracula      — Dracula, dark
//   one-dark     — Atom's One Dark, dark
//   github-light — GitHub Light, light
//   vs-dark      — Monaco's built-in dark theme (fallback)
//
// monacoThemeId() maps our friendly id to the actual Monaco theme
// name; built-in themes (vs, vs-dark, hc-black) pass through.

import type * as MonacoNS from "monaco-editor";
import type { EditorPrefs } from "./editor-prefs";

interface ThemeDef {
  base: "vs" | "vs-dark";
  inherit: boolean;
  rules: Array<{ token: string; foreground?: string; background?: string; fontStyle?: string }>;
  colors: Record<string, string>;
}

const MONOKAI_PRO: ThemeDef = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "",            foreground: "FCFCFA" },
    { token: "comment",     foreground: "727072", fontStyle: "italic" },
    { token: "string",      foreground: "FFD866" },
    { token: "number",      foreground: "AB9DF2" },
    { token: "keyword",     foreground: "FF6188" },
    { token: "operator",    foreground: "FF6188" },
    { token: "delimiter",   foreground: "F8F8F2" },
    { token: "type",        foreground: "78DCE8" },
    { token: "type.identifier", foreground: "78DCE8" },
    { token: "function",    foreground: "A9DC76" },
    { token: "variable",    foreground: "FCFCFA" },
    { token: "tag",         foreground: "FF6188" },
    { token: "attribute.name", foreground: "A9DC76" },
    { token: "attribute.value", foreground: "FFD866" },
    { token: "regexp",      foreground: "FFD866" },
  ],
  colors: {
    "editor.background":            "#2D2A2E",
    "editor.foreground":            "#FCFCFA",
    "editorLineNumber.foreground":  "#525053",
    "editorLineNumber.activeForeground": "#FCFCFA",
    "editorCursor.foreground":      "#FFD866",
    "editor.selectionBackground":   "#5B595C80",
    "editor.lineHighlightBackground": "#3A373C",
    "editorIndentGuide.background": "#3A373C",
    "editorIndentGuide.activeBackground": "#727072",
    "editorBracketMatch.background": "#FFD86640",
    "editorWidget.background":      "#221F22",
    "editorSuggestWidget.background": "#221F22",
  },
};

const DRACULA: ThemeDef = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "",            foreground: "F8F8F2" },
    { token: "comment",     foreground: "6272A4", fontStyle: "italic" },
    { token: "string",      foreground: "F1FA8C" },
    { token: "number",      foreground: "BD93F9" },
    { token: "keyword",     foreground: "FF79C6" },
    { token: "type",        foreground: "8BE9FD" },
    { token: "function",    foreground: "50FA7B" },
    { token: "tag",         foreground: "FF79C6" },
    { token: "attribute.name", foreground: "50FA7B" },
    { token: "attribute.value", foreground: "F1FA8C" },
  ],
  colors: {
    "editor.background":            "#282A36",
    "editor.foreground":            "#F8F8F2",
    "editorLineNumber.foreground":  "#6272A4",
    "editorLineNumber.activeForeground": "#F8F8F2",
    "editorCursor.foreground":      "#F8F8F0",
    "editor.selectionBackground":   "#44475A",
    "editor.lineHighlightBackground": "#44475A40",
  },
};

const ONE_DARK: ThemeDef = {
  base: "vs-dark",
  inherit: true,
  rules: [
    { token: "",            foreground: "ABB2BF" },
    { token: "comment",     foreground: "5C6370", fontStyle: "italic" },
    { token: "string",      foreground: "98C379" },
    { token: "number",      foreground: "D19A66" },
    { token: "keyword",     foreground: "C678DD" },
    { token: "type",        foreground: "E5C07B" },
    { token: "function",    foreground: "61AFEF" },
    { token: "tag",         foreground: "E06C75" },
    { token: "attribute.name", foreground: "D19A66" },
    { token: "attribute.value", foreground: "98C379" },
  ],
  colors: {
    "editor.background":            "#282C34",
    "editor.foreground":            "#ABB2BF",
    "editorLineNumber.foreground":  "#5C6370",
    "editorCursor.foreground":      "#528BFF",
    "editor.selectionBackground":   "#3E4451",
    "editor.lineHighlightBackground": "#2C313C",
  },
};

const GITHUB_LIGHT: ThemeDef = {
  base: "vs",
  inherit: true,
  rules: [
    { token: "",            foreground: "24292E" },
    { token: "comment",     foreground: "6A737D", fontStyle: "italic" },
    { token: "string",      foreground: "032F62" },
    { token: "number",      foreground: "005CC5" },
    { token: "keyword",     foreground: "D73A49" },
    { token: "type",        foreground: "6F42C1" },
    { token: "function",    foreground: "6F42C1" },
    { token: "tag",         foreground: "22863A" },
    { token: "attribute.name", foreground: "6F42C1" },
    { token: "attribute.value", foreground: "032F62" },
  ],
  colors: {
    "editor.background":            "#FFFFFF",
    "editor.foreground":            "#24292E",
    "editorLineNumber.foreground":  "#959DA5",
    "editorCursor.foreground":      "#24292E",
    "editor.selectionBackground":   "#0366D625",
    "editor.lineHighlightBackground": "#F6F8FA",
  },
};

let registered = false;
export function registerMonacoThemes(monaco: typeof MonacoNS) {
  if (registered) return;
  registered = true;
  monaco.editor.defineTheme("monokai",      MONOKAI_PRO);
  monaco.editor.defineTheme("dracula",      DRACULA);
  monaco.editor.defineTheme("one-dark",     ONE_DARK);
  monaco.editor.defineTheme("github-light", GITHUB_LIGHT);
}

export function monacoThemeId(pref: EditorPrefs["monacoTheme"]): string {
  // Our prefs ids happen to match the Monaco theme names we registered
  // 1:1; vs-dark is built in. Kept as a helper so future re-mappings
  // (e.g. mapping pref "monokai" to a different theme name) don't
  // leak into MonacoPane.
  return pref;
}

export const MONACO_THEME_OPTIONS: { id: EditorPrefs["monacoTheme"]; label: string; tone: "dark" | "light" }[] = [
  { id: "monokai",      label: "Monokai Pro",  tone: "dark" },
  { id: "dracula",      label: "Dracula",      tone: "dark" },
  { id: "one-dark",     label: "One Dark",     tone: "dark" },
  { id: "github-light", label: "GitHub Light", tone: "light" },
  { id: "vs-dark",      label: "Monaco Dark",  tone: "dark" },
];

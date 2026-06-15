// Bundle Monaco's web workers locally so the editor works offline inside
// the Wails app. Without this, monaco-editor tries to fetch its workers
// from a CDN at runtime, which fails the moment the student is offline —
// the exact failure mode B5/B6/B7 are built to prevent.
//
// Vite resolves `new URL(..., import.meta.url)` at build time and emits
// the workers as separate chunks under /assets, which the embedded
// assetserver then serves to the webview.

import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import jsonWorker from "monaco-editor/esm/vs/language/json/json.worker?worker";
import cssWorker from "monaco-editor/esm/vs/language/css/css.worker?worker";
import htmlWorker from "monaco-editor/esm/vs/language/html/html.worker?worker";
import tsWorker from "monaco-editor/esm/vs/language/typescript/ts.worker?worker";

declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorker(workerId: string, label: string): Worker;
    };
  }
}

window.MonacoEnvironment = {
  getWorker(_workerId, label) {
    switch (label) {
      case "json":
        return new jsonWorker();
      case "css":
      case "scss":
      case "less":
        return new cssWorker();
      case "html":
      case "handlebars":
      case "razor":
        return new htmlWorker();
      case "typescript":
      case "javascript":
        return new tsWorker();
      default:
        return new editorWorker();
    }
  },
};

// Map common file extensions to Monaco language IDs. Anything not listed
// falls back to "plaintext" — the editor still loads, just without syntax
// highlighting, which is the right default for unknown files.
const extensionLanguage: Record<string, string> = {
  ts: "typescript",
  tsx: "typescript",
  js: "javascript",
  jsx: "javascript",
  mjs: "javascript",
  cjs: "javascript",
  json: "json",
  html: "html",
  htm: "html",
  css: "css",
  scss: "scss",
  less: "less",
  md: "markdown",
  mdx: "markdown",
  go: "go",
  py: "python",
  rs: "rust",
  java: "java",
  yml: "yaml",
  yaml: "yaml",
  toml: "ini",
  sh: "shell",
  bash: "shell",
  xml: "xml",
  svg: "xml",
};

export function languageForPath(path: string): string {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return extensionLanguage[ext] ?? "plaintext";
}

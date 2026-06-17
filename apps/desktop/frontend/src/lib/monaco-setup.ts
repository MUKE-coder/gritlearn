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
import * as monaco from "monaco-editor";
// The typescript language module isn't loaded automatically when you
// just import monaco-editor — pull it in explicitly so the worker has
// a language service to talk to and our setCompilerOptions calls
// resolve. The side-effect import is what wires it up.
import "monaco-editor/esm/vs/language/typescript/monaco.contribution";
import { registerSnippets } from "./monaco-snippets";

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

// ─── TypeScript / JS language service config ──────────────────
//
// Monaco's bundled typescript worker is what powers in-editor errors,
// hover docs, and autocomplete. The TS bindings for monaco.languages.typescript
// are typed as { deprecated: true } in the top-level package even
// though the runtime exports are live — we cast through `unknown` to
// reach them. Side-effect import above ensures the module is loaded.
type TsApi = {
  typescriptDefaults: {
    setCompilerOptions: (opts: Record<string, unknown>) => void;
    setDiagnosticsOptions: (opts: Record<string, unknown>) => void;
  };
  javascriptDefaults: {
    setCompilerOptions: (opts: Record<string, unknown>) => void;
    setDiagnosticsOptions: (opts: Record<string, unknown>) => void;
  };
  ScriptTarget: { ES2022: number };
  ModuleKind: { ESNext: number };
  ModuleResolutionKind: { NodeJs: number };
  JsxEmit: { React: number };
};
const ts = (monaco.languages as unknown as { typescript: TsApi }).typescript;

ts.typescriptDefaults.setCompilerOptions({
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.NodeJs,
  jsx: ts.JsxEmit.React,
  jsxFactory: "React.createElement",
  reactNamespace: "React",
  allowJs: true,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  isolatedModules: true,
  resolveJsonModule: true,
  strict: false,
  noImplicitAny: false,
  lib: ["dom", "dom.iterable", "esnext"],
});
ts.javascriptDefaults.setCompilerOptions({
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  allowJs: true,
  jsx: ts.JsxEmit.React,
  allowSyntheticDefaultImports: true,
  esModuleInterop: true,
  lib: ["dom", "dom.iterable", "esnext"],
});

// Silence "Cannot find module 'foo'" + "Cannot find name 'React'"
// for student-written code. The typescript-worker can't see
// node_modules from the Wails workspace, and lighting up every
// import as a red squiggle would train students to ignore the
// editor's warnings.
const SILENCED_TS_DIAGNOSTICS = [
  2307, // Cannot find module
  2304, // Cannot find name
  2305, // Module has no exported member
  2792, // Cannot find module — alternative
  6133, // Unused locals — student scratch code is full of these
  2580, // Cannot find name 'require'
  2451, // Cannot redeclare block-scoped variable
];
ts.typescriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false,
  noSyntaxValidation: false,
  noSuggestionDiagnostics: false,
  diagnosticCodesToIgnore: SILENCED_TS_DIAGNOSTICS,
});
ts.javascriptDefaults.setDiagnosticsOptions({
  noSemanticValidation: false,
  noSyntaxValidation: false,
  noSuggestionDiagnostics: false,
  diagnosticCodesToIgnore: SILENCED_TS_DIAGNOSTICS,
});

// Register the curated per-language snippet library.
registerSnippets(monaco);

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

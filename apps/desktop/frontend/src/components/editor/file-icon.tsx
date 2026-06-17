// FileIcon renders a colored icon for a filename, matching VSCode's
// material-icon-theme palette as close as we can with lucide. Folders
// get a plain folder icon (open/closed); files get an icon + color
// keyed off the extension or filename.
//
// Why not vscode-icons npm? The official pack ships hundreds of SVGs
// and bloats the bundle. For a curriculum IDE the dozen language
// families students will touch is enough — we can expand the table
// when a new file type starts showing up in lessons.

import {
  Braces,
  Coffee,
  File,
  FileCode,
  FileImage,
  FileJson,
  FileText,
  FileType2,
  Folder,
  FolderOpen,
  Hash,
  Settings,
  Terminal,
} from "lucide-react";

interface FileIconProps {
  name: string;
  isDir: boolean;
  expanded?: boolean;
  className?: string;
}

export function FileIcon({ name, isDir, expanded, className = "" }: FileIconProps) {
  if (isDir) {
    const Icon = expanded ? FolderOpen : Folder;
    // Folders pick up a soft amber tone so they stand out from files
    // in the tree without screaming for attention.
    return <Icon className={`h-3.5 w-3.5 shrink-0 text-amber-400 ${className}`} />;
  }

  const lower = name.toLowerCase();
  const ext = lower.includes(".") ? lower.slice(lower.lastIndexOf(".") + 1) : "";

  // Special-case well-known filenames first so package.json beats *.json.
  if (lower === "package.json" || lower === "package-lock.json" || lower === "pnpm-lock.yaml") {
    return <Braces className={`h-3.5 w-3.5 shrink-0 text-red-400 ${className}`} />;
  }
  if (lower === "readme.md" || lower === "readme") {
    return <FileText className={`h-3.5 w-3.5 shrink-0 text-sky-300 ${className}`} />;
  }
  if (lower.startsWith(".env") || lower === ".gitignore" || lower === ".dockerignore") {
    return <Settings className={`h-3.5 w-3.5 shrink-0 text-zinc-400 ${className}`} />;
  }
  if (lower === "dockerfile" || lower === "makefile" || lower === "go.mod" || lower === "go.sum") {
    return <Settings className={`h-3.5 w-3.5 shrink-0 text-zinc-400 ${className}`} />;
  }

  switch (ext) {
    case "html":
    case "htm":
      return <FileCode className={`h-3.5 w-3.5 shrink-0 text-orange-400 ${className}`} />;
    case "css":
    case "scss":
    case "sass":
    case "less":
      return <Hash className={`h-3.5 w-3.5 shrink-0 text-sky-400 ${className}`} />;
    case "js":
    case "mjs":
    case "cjs":
      return <FileCode className={`h-3.5 w-3.5 shrink-0 text-yellow-300 ${className}`} />;
    case "ts":
      return <FileCode className={`h-3.5 w-3.5 shrink-0 text-blue-400 ${className}`} />;
    case "jsx":
    case "tsx":
      return <FileCode className={`h-3.5 w-3.5 shrink-0 text-cyan-400 ${className}`} />;
    case "json":
    case "jsonc":
      return <FileJson className={`h-3.5 w-3.5 shrink-0 text-amber-300 ${className}`} />;
    case "md":
    case "mdx":
      return <FileText className={`h-3.5 w-3.5 shrink-0 text-sky-300 ${className}`} />;
    case "yaml":
    case "yml":
    case "toml":
      return <Settings className={`h-3.5 w-3.5 shrink-0 text-purple-300 ${className}`} />;
    case "go":
      return <FileType2 className={`h-3.5 w-3.5 shrink-0 text-cyan-300 ${className}`} />;
    case "py":
      return <FileCode className={`h-3.5 w-3.5 shrink-0 text-blue-300 ${className}`} />;
    case "rs":
      return <FileType2 className={`h-3.5 w-3.5 shrink-0 text-orange-300 ${className}`} />;
    case "java":
      return <Coffee className={`h-3.5 w-3.5 shrink-0 text-orange-400 ${className}`} />;
    case "sh":
    case "bash":
    case "zsh":
    case "ps1":
      return <Terminal className={`h-3.5 w-3.5 shrink-0 text-emerald-400 ${className}`} />;
    case "svg":
    case "png":
    case "jpg":
    case "jpeg":
    case "gif":
    case "webp":
    case "ico":
      return <FileImage className={`h-3.5 w-3.5 shrink-0 text-violet-400 ${className}`} />;
    default:
      return <File className={`h-3.5 w-3.5 shrink-0 text-foreground-muted ${className}`} />;
  }
}

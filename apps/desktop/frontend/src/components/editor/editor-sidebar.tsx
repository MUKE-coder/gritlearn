import { useState } from "react";
import { BookOpen, FolderTree } from "lucide-react";
import { CurriculumPane } from "./curriculum-pane";
import { FileTree } from "./file-tree";

// Left-hand sidebar (fixed 240px per design-style-guide.md). Two tabs:
// Curriculum (the analogy-first lessons, populated in B5) and Files (the
// workspace tree, populated as soon as the student opens a folder).

type Pane = "curriculum" | "files";

export function EditorSidebar() {
  // Default to Curriculum now that B5 has wired the real manifest reader —
  // the very first thing a student should see is the path of phases.
  const [pane, setPane] = useState<Pane>("curriculum");

  return (
    <aside className="flex h-full w-[240px] shrink-0 flex-col border-r border-border bg-surface-2">
      <div className="flex shrink-0 border-b border-border-subtle">
        <SidebarTab icon={BookOpen} label="Curriculum" active={pane === "curriculum"} onClick={() => setPane("curriculum")} />
        <SidebarTab icon={FolderTree} label="Files" active={pane === "files"} onClick={() => setPane("files")} />
      </div>
      <div className="flex-1 overflow-hidden">
        {pane === "curriculum" ? <CurriculumPane /> : <FileTree />}
      </div>
    </aside>
  );
}

interface TabProps {
  icon: typeof BookOpen;
  label: string;
  active: boolean;
  onClick: () => void;
}

function SidebarTab({ icon: Icon, label, active, onClick }: TabProps) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-[12px] font-medium transition-colors ${
        active
          ? "border-accent text-foreground"
          : "border-transparent text-foreground-muted hover:text-foreground-secondary"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
    </button>
  );
}

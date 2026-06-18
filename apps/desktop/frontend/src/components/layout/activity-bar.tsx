// Activity bar — the 48px vertical strip on the far left, lifted from
// VSCode. Top cluster picks the sidebar content (Learning / Explorer /
// Search / Source Control / Extensions). Bottom cluster has Account
// and Settings.
//
// Clicking the active icon hides the sidebar (matches VSCode muscle
// memory).

import { useNavigate } from "@tanstack/react-router";
import { BookOpen, Files, GitBranch, Puzzle, Search, Settings, User } from "lucide-react";
import { useShell, type Activity } from "@/lib/ide-shell";

interface Item {
  id: Activity;
  label: string;
  icon: typeof Files;
  shortcut?: string;
}

const ITEMS: Item[] = [
  { id: "learning",   label: "Learning",       icon: BookOpen, shortcut: "Ctrl+1" },
  { id: "explorer",   label: "Explorer",       icon: Files,    shortcut: "Ctrl+Shift+E" },
  { id: "search",     label: "Search",         icon: Search,   shortcut: "Ctrl+Shift+F" },
  { id: "git",        label: "Source Control", icon: GitBranch, shortcut: "Ctrl+Shift+G" },
  { id: "extensions", label: "Extensions",     icon: Puzzle,   shortcut: "Ctrl+Shift+X" },
];

export function ActivityBar() {
  const { activity, setActivity } = useShell();
  const navigate = useNavigate();

  return (
    <nav
      aria-label="Activity bar"
      className="flex w-12 shrink-0 flex-col items-center justify-between border-r border-border bg-surface-2 py-2"
    >
      <div className="flex flex-col items-center gap-1">
        {ITEMS.map((item) => (
          <ActivityButton
            key={item.id}
            item={item}
            active={activity === item.id}
            onClick={() => setActivity(item.id)}
          />
        ))}
      </div>
      <div className="flex flex-col items-center gap-1">
        <ActivityButton
          item={{ id: "none", label: "Account", icon: User }}
          active={false}
          onClick={() => navigate({ to: "/app/profile" })}
        />
        <ActivityButton
          item={{ id: "none", label: "Settings", icon: Settings, shortcut: "Ctrl+," }}
          active={false}
          onClick={() => navigate({ to: "/app/settings" })}
        />
      </div>
    </nav>
  );
}

function ActivityButton({
  item,
  active,
  onClick,
}: {
  item: Item;
  active: boolean;
  onClick: () => void;
}) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      title={`${item.label}${item.shortcut ? ` (${item.shortcut})` : ""}`}
      aria-label={item.label}
      aria-pressed={active}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-md text-foreground-muted transition-colors hover:text-foreground ${
        active ? "text-foreground" : ""
      }`}
    >
      <Icon className="h-5 w-5" />
      {/* Left accent rail when active, à la VSCode */}
      <span
        aria-hidden
        className={`absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full transition-colors ${
          active ? "bg-accent" : "bg-transparent group-hover:bg-border"
        }`}
      />
    </button>
  );
}

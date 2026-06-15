import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { NAV_SECTIONS } from "@/lib/nav-config";

// Fixed-width desktop sidebar. NOT collapsible — desktop windows are
// wide enough, and a fixed sidebar is more predictable for power users.
// Sections + items come from nav-config.ts so adding a route is one
// config edit, not a sidebar refactor.
export function Sidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <aside className="w-sidebar shrink-0 border-r border-border-subtle bg-surface flex flex-col">
      <div className="px-4 py-3 border-b border-border-subtle">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md bg-accent/10 flex items-center justify-center">
            <LayoutGrid className="h-3.5 w-3.5 text-accent" />
          </div>
          <span className="text-[13px] font-semibold text-foreground">Workspace</span>
        </div>
      </div>

      <nav className="flex-1 p-3 overflow-y-auto">
        {NAV_SECTIONS.map((section, idx) => (
          <div key={idx} className={cn(idx > 0 && "mt-4")}>
            {section.title && (
              <h3 className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-foreground-muted">
                {section.title}
              </h3>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  pathname === item.to ||
                  (item.to !== "/app" && pathname.startsWith(item.to));
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                      active
                        ? "bg-accent/10 text-accent"
                        : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground",
                    )}
                  >
                    <span className="flex items-center gap-3 min-w-0">
                      <Icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </span>
                    {item.badge && (
                      <span className="shrink-0 h-5 min-w-[20px] px-1.5 rounded-full bg-accent/15 text-accent text-[10px] font-semibold inline-flex items-center justify-center">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-4 py-3 border-t border-border-subtle text-[11px] text-foreground-muted">
        Built with Grit
      </div>
    </aside>
  );
}

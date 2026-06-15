import { useState } from "react";
import { Bell, Search, Sun, Moon, LogOut, Command } from "lucide-react";
import { useTheme } from "@/lib/theme-provider";
import { useMe, useLogout } from "@/hooks/use-auth";
import { useNavigate } from "@tanstack/react-router";

interface TopbarProps {
  onOpenPalette: () => void;
}

// Topbar for desktop app. Same structure as admin v3.8.0 but without the
// sidebar collapse toggle (desktop sidebar is fixed).
export function Topbar({ onOpenPalette }: TopbarProps) {
  const { theme, setTheme } = useTheme();
  const { data: user } = useMe();
  const { mutate: logout } = useLogout();
  const navigate = useNavigate();
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    setUserMenuOpen(false);
    logout(undefined, { onSuccess: () => navigate({ to: "/auth/login" }) });
  };

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border-subtle bg-background px-6">
      {/* Search trigger (opens command palette) */}
      <button
        onClick={onOpenPalette}
        className="flex items-center gap-2 rounded-lg border border-border bg-surface-2 px-3 h-9 w-80 text-[13px] text-foreground-muted hover:bg-surface-hover transition-colors"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search or jump to...</span>
        <div className="ml-auto flex items-center gap-1 text-[11px] font-mono">
          <kbd className="rounded bg-surface px-1 py-0.5">⌘K</kbd>
        </div>
      </button>

      {/* Right cluster */}
      <div className="flex items-center gap-1">
        <button className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-surface-hover text-foreground-secondary transition-colors" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </button>

        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center justify-center h-9 w-9 rounded-lg hover:bg-surface-hover text-foreground-secondary transition-colors"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg pl-1 pr-2 py-1 hover:bg-surface-hover transition-colors"
          >
            <div className="h-7 w-7 rounded-full bg-accent/20 flex items-center justify-center">
              <span className="text-[13px] font-medium text-accent">
                {user?.first_name?.charAt(0)?.toUpperCase() || "?"}
              </span>
            </div>
          </button>

          {userMenuOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-2 w-64 rounded-xl border border-border bg-surface-3 shadow-xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-border-subtle">
                  <p className="text-[13px] font-semibold text-foreground">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-[12px] text-foreground-muted truncate">{user?.email}</p>
                </div>
                <div className="p-1">
                  <button
                    onClick={() => { setUserMenuOpen(false); navigate({ to: "/app/profile" }); }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-foreground-secondary hover:bg-surface-hover hover:text-foreground transition-colors"
                  >
                    <Command className="h-4 w-4" />
                    Profile
                  </button>
                </div>
                <div className="p-1 border-t border-border-subtle">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-danger hover:bg-danger/10 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

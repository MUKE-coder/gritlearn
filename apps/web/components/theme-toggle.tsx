"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

// ThemeToggle: toggles `.light` on <html>, persists to localStorage.
// Defaults to dark (the brand aesthetic) — light is for daylight reading,
// not the headline. The boot script in layout.tsx applies the saved value
// before paint so there's no flash of the wrong theme.

type Theme = "dark" | "light";
const STORAGE_KEY = "jeditor-theme";

function readSaved(): Theme {
  if (typeof window === "undefined") return "dark";
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === "light" || saved === "dark") return saved;
  return "dark";
}

function apply(theme: Theme) {
  const root = document.documentElement;
  if (theme === "light") root.classList.add("light");
  else root.classList.remove("light");
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initial = readSaved();
    setTheme(initial);
    apply(initial);
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    apply(next);
    window.localStorage.setItem(STORAGE_KEY, next);
  }

  // Render an inert placeholder until mounted so SSR + hydration match.
  if (!mounted) {
    return (
      <button
        aria-hidden
        tabIndex={-1}
        className="h-8 w-8 rounded-md border border-border bg-bg-secondary"
      />
    );
  }

  const next = theme === "dark" ? "light" : "dark";
  return (
    <button
      onClick={toggle}
      title={`Switch to ${next} mode`}
      aria-label={`Switch to ${next} mode`}
      className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-bg-secondary text-text-secondary transition-all hover:border-accent/40 hover:text-accent"
    >
      {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
    </button>
  );
}

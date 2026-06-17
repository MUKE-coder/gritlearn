import type { Config } from "tailwindcss";

// GRIT_STYLE_GUIDE-aligned config, plus desktop-specific overrides
// (larger base padding, tighter focus rings, command palette tokens).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Onest", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "monospace"],
      },
      colors: {
        // Grit purple
        primary: {
          50: "#F3F0FE",
          100: "#E6DFFD",
          200: "#CCC0FB",
          400: "#9B8BF5",
          500: "#7C6CE9",
          600: "#6C5CE7",
          700: "#5B4BD6",
          800: "#4A3DB5",
          900: "#3B2F8F",
        },
        // CSS variable bindings for runtime theming
        background: "var(--bg-primary)",
        surface: "var(--bg-secondary)",
        // Alias: "surface-1" is the same layer as "surface" — useful
        // when a component wants the ladder spelled out (1/2/3) for
        // readability instead of mixing "surface" with "surface-2".
        "surface-1": "var(--bg-secondary)",
        "surface-2": "var(--bg-tertiary)",
        "surface-3": "var(--bg-elevated)",
        "surface-hover": "var(--bg-hover)",
        border: "var(--border)",
        "border-subtle": "var(--border-subtle)",
        foreground: "var(--text-foreground)",
        "foreground-secondary": "var(--text-secondary)",
        "foreground-muted": "var(--text-muted)",
        accent: "var(--accent)",
        "accent-hover": "var(--accent-hover)",
        success: "#059669",
        warning: "#D97706",
        danger: "#DC2626",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgba(0, 0, 0, 0.3)",
        "focus": "0 0 0 2px rgba(108, 92, 231, 0.25)",
      },
      borderRadius: {
        DEFAULT: "0.5rem",
      },
      spacing: {
        // Desktop uses larger padding than web — more breathing room
        "content": "2rem",     // 32px main content padding
        "sidebar": "15rem",    // 240px fixed sidebar
        "titlebar": "3rem",    // 48px custom title bar
        "listpane": "22rem",   // 352px list pane in TwoPane layout
      },
    },
  },
  plugins: [],
} satisfies Config;

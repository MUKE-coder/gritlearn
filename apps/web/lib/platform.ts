// Per-platform download metadata for the marketing site. URLs are
// placeholders until B12 deploys real binaries to File Storage; the
// shape is what matters — the marketing page reads from this single
// list so swapping in production URLs is a one-file change.

export type Platform = "macos-arm" | "macos-intel" | "windows" | "linux";

export interface DownloadOption {
  platform: Platform;
  label: string;
  detail: string;
  filename: string;
  url: string;
}

export const downloads: DownloadOption[] = [
  {
    platform: "macos-arm",
    label: "macOS (Apple Silicon)",
    detail: "M1, M2, M3 — universal native binary",
    filename: "jeditor-darwin-arm64.dmg",
    url: "https://downloads.jeditor.dev/latest/jeditor-darwin-arm64.dmg",
  },
  {
    platform: "macos-intel",
    label: "macOS (Intel)",
    detail: "x86_64 Macs running macOS 11+",
    filename: "jeditor-darwin-amd64.dmg",
    url: "https://downloads.jeditor.dev/latest/jeditor-darwin-amd64.dmg",
  },
  {
    platform: "windows",
    label: "Windows",
    detail: "Windows 10 / 11, 64-bit. NSIS installer.",
    filename: "jeditor-windows-amd64.exe",
    url: "https://downloads.jeditor.dev/latest/jeditor-windows-amd64.exe",
  },
  {
    platform: "linux",
    label: "Linux",
    detail: "AppImage — runs on most distros without install.",
    filename: "jeditor-linux-amd64.AppImage",
    url: "https://downloads.jeditor.dev/latest/jeditor-linux-amd64.AppImage",
  },
];

// detectPlatform guesses the visitor's OS from navigator.userAgent so
// the hero CTA can default to the most likely match. Browser is the
// only honest source — the OS-via-IP-geo or User-Agent-Client-Hints
// dance is overkill for a download page.
export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();
  const platformStr =
    typeof navigator.platform === "string" ? navigator.platform.toLowerCase() : "";

  if (ua.includes("mac")) {
    // Apple Silicon Macs report "MacIntel" in navigator.platform but
    // include "Apple" in the user agent client hints when present. We
    // can't reliably distinguish Intel vs ARM from JS alone, so we
    // default to ARM (the current sales mix) — the user can pick the
    // other tile if they're still on Intel.
    void platformStr;
    return "macos-arm";
  }
  if (ua.includes("linux") || ua.includes("x11")) return "linux";
  if (ua.includes("win")) return "windows";
  return "windows";
}

export function getDownload(p: Platform): DownloadOption {
  return downloads.find((d) => d.platform === p) ?? downloads[2];
}

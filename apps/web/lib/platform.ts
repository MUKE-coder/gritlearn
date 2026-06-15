// Per-platform download metadata for the marketing site.
//
// Source of truth at runtime: the Go API at /api/desktop/latest, which
// resolves the latest GitHub release and shapes a per-OS download list.
// See apps/api/internal/handlers/desktop_release_handler.go. This file
// just types the response, ships a static fallback so the page renders
// without an API round-trip, and exposes a small detectPlatform helper.

export type Platform = "windows" | "macos-arm" | "macos-intel" | "linux";

export interface DownloadOption {
  platform: Platform;
  label: string;
  detail: string;
  filename: string;
  url: string;
  available: boolean;
  size: number;
}

export interface ReleaseInfo {
  version: string;
  releasedAt: string;
  releaseNotes: string;
  githubUrl: string;
  downloads: DownloadOption[];
  source: "github" | "env" | "fallback";
}

// Static metadata used when the API is unreachable. The URL is the
// public GitHub releases page — fine as a fallback because a brand-new
// visitor at least lands on something they can click. The .url and
// .available fields get overwritten when the API succeeds.
const STATIC_OPTIONS: Omit<DownloadOption, "available" | "size">[] = [
  {
    platform: "windows",
    label: "Windows",
    detail: "Windows 10 / 11, 64-bit. NSIS installer.",
    filename: "jeditor-windows-amd64.exe",
    url: "https://github.com/MUKE-coder/gritlearn/releases/latest",
  },
  {
    platform: "macos-arm",
    label: "macOS (Apple Silicon)",
    detail: "M1, M2, M3 — universal native binary.",
    filename: "jeditor-darwin-arm64.dmg",
    url: "https://github.com/MUKE-coder/gritlearn/releases/latest",
  },
  {
    platform: "macos-intel",
    label: "macOS (Intel)",
    detail: "x86_64 Macs running macOS 11+.",
    filename: "jeditor-darwin-amd64.dmg",
    url: "https://github.com/MUKE-coder/gritlearn/releases/latest",
  },
  {
    platform: "linux",
    label: "Linux",
    detail: "AppImage — runs on most distros without install.",
    filename: "jeditor-linux-amd64.AppImage",
    url: "https://github.com/MUKE-coder/gritlearn/releases/latest",
  },
];

// Hard-coded fallback the page can render synchronously. Marked
// available:false so the UI can show "coming soon" instead of a button
// that 404s.
export const fallbackRelease: ReleaseInfo = {
  version: "0.1.0",
  releasedAt: "2026-06-15T12:00:00Z",
  releaseNotes:
    "JEditor desktop preview — Wails + Monaco with Phase 1 curriculum bundled offline.",
  githubUrl: "https://github.com/MUKE-coder/gritlearn/releases",
  downloads: STATIC_OPTIONS.map((o) => ({ ...o, available: false, size: 0 })),
  source: "fallback",
};

// Static export for places that still need the per-OS labels without a
// fetch (e.g. tile rendering before hydration completes).
export const downloads: DownloadOption[] = fallbackRelease.downloads;

// fetchRelease hits /api/desktop/latest and shapes the response into
// the typed ReleaseInfo above. Used by the /download page server-side
// (Next.js cache: 10 minutes, matching the API's in-process cache).
//
// On any error returns the static fallback so the page never crashes —
// the marketing site degrading to "fetch JEditor on GitHub" is still
// better than a 500.
export async function fetchRelease(apiUrl: string): Promise<ReleaseInfo> {
  try {
    const res = await fetch(`${apiUrl}/api/desktop/latest`, {
      next: { revalidate: 600 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`api ${res.status}`);
    const body = (await res.json()) as { data: ApiReleasePayload };
    return mapApiResponse(body.data);
  } catch {
    return fallbackRelease;
  }
}

interface ApiReleasePayload {
  version: string;
  released_at: string;
  release_notes: string;
  github_url: string;
  source: "github" | "env" | "fallback";
  downloads: Array<{
    platform: Platform;
    label: string;
    detail: string;
    asset_name: string;
    url: string;
    available: boolean;
    size: number;
  }>;
}

function mapApiResponse(p: ApiReleasePayload): ReleaseInfo {
  return {
    version: p.version,
    releasedAt: p.released_at,
    releaseNotes: p.release_notes,
    githubUrl: p.github_url,
    source: p.source,
    downloads: p.downloads.map((d) => ({
      platform: d.platform,
      label: d.label,
      detail: d.detail,
      filename: d.asset_name,
      url: d.url || fallbackRelease.githubUrl,
      available: d.available,
      size: d.size,
    })),
  };
}

// detectPlatform guesses the visitor's OS from navigator.userAgent so
// the hero CTA can default to the most likely match. Browser is the
// only honest source for this — IP-geo or UA-Client-Hints is overkill.
export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "windows";
  const ua = navigator.userAgent.toLowerCase();

  if (ua.includes("mac")) {
    // Apple Silicon Macs report "MacIntel" in navigator.platform. JS
    // alone can't reliably tell Intel vs ARM, so default to ARM (the
    // current sales mix) — the user can pick the other tile manually.
    return "macos-arm";
  }
  if (ua.includes("linux") || ua.includes("x11")) return "linux";
  if (ua.includes("win")) return "windows";
  return "windows";
}

export function getDownload(
  release: ReleaseInfo,
  p: Platform,
): DownloadOption | undefined {
  return release.downloads.find((d) => d.platform === p);
}

// Format bytes for display ("23.4 MB"). Returns "" for 0 / unknown.
export function formatSize(bytes: number): string {
  if (!bytes || bytes <= 0) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = bytes;
  let i = 0;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i += 1;
  }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
}

// Build-time version metadata for the JEditor Wails desktop app.
// Vite injects __APP_VERSION__ at build by reading wails.json's
// info.productVersion (see vite.config.ts). The fallback only kicks in
// during a partial checkout where wails.json isn't readable.
//
// The auto-updater compares APP_VERSION against the response from
// GET /api/desktop/latest to decide whether to surface a banner.

export const APP_VERSION: string =
  (typeof __APP_VERSION__ !== "undefined" && __APP_VERSION__) || "0.0.0";

// isNewerVersion — semver-light comparison. Both inputs are dotted
// numeric strings like "0.3.0"; suffixes after a dash ("-beta.1")
// are ignored. Returns true when `latest` is strictly newer than
// `current`.
export function isNewerVersion(current: string, latest: string): boolean {
  const parse = (v: string) =>
    v
      .split("-")[0]
      .split(".")
      .map((n) => parseInt(n, 10))
      .map((n) => (Number.isFinite(n) ? n : 0));
  const a = parse(current);
  const b = parse(latest);
  const len = Math.max(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i] ?? 0;
    const bi = b[i] ?? 0;
    if (bi > ai) return true;
    if (bi < ai) return false;
  }
  return false;
}

declare const __APP_VERSION__: string;

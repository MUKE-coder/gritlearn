// Wails bridge — wraps Wails runtime calls with safe fallbacks for dev mode.
//
// In production (Wails-built binary), window.go.main.App is injected.
// In dev mode (Vite running outside Wails), fall back to localStorage for
// token storage and no-op for window controls so the app still works when
// you run "pnpm dev" directly from the frontend folder.

const isWails = typeof window !== "undefined" && !!window.go?.main?.App;

// Re-exported for hooks/components that need to gate desktop-only flows
// (the auto-updater, OS keychain, window controls). Stays false in the
// browser dev preview so polls don't fire there.
export const isDesktop = isWails;

// ─── Token storage (OS keychain or localStorage fallback) ─────────

export async function setToken(key: string, value: string): Promise<void> {
  if (isWails) {
    return window.go!.main.App.SetToken(key, value);
  }
  localStorage.setItem(key, value);
}

export async function getToken(key: string): Promise<string> {
  if (isWails) {
    return window.go!.main.App.GetToken(key);
  }
  return localStorage.getItem(key) || "";
}

export async function deleteToken(key: string): Promise<void> {
  if (isWails) {
    return window.go!.main.App.DeleteToken(key);
  }
  localStorage.removeItem(key);
}

// ─── Window controls ──────────────────────────────────────────────

export async function minimise(): Promise<void> {
  if (isWails) return window.go!.main.App.MinimiseWindow();
}

export async function toggleMaximise(): Promise<void> {
  if (isWails) return window.go!.main.App.ToggleMaximise();
}

export async function closeWindow(): Promise<void> {
  if (isWails) return window.go!.main.App.CloseWindow();
}

// ─── System info ──────────────────────────────────────────────────

export async function getPlatform(): Promise<"darwin" | "windows" | "linux"> {
  if (isWails) return window.go!.main.App.GetPlatform();
  // In dev (browser), detect from user agent.
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("mac")) return "darwin";
  if (ua.includes("linux")) return "linux";
  return "windows";
}

export async function getAppVersion(): Promise<string> {
  if (isWails) return window.go!.main.App.GetAppVersion();
  return "0.1.0-dev";
}

// ─── File dialogs ─────────────────────────────────────────────────

export async function openFileDialog(title: string): Promise<string> {
  if (isWails) return window.go!.main.App.OpenFileDialog(title);
  throw new Error("openFileDialog requires Wails runtime");
}

export async function saveFileDialog(title: string, defaultFilename: string): Promise<string> {
  if (isWails) return window.go!.main.App.SaveFileDialog(title, defaultFilename);
  throw new Error("saveFileDialog requires Wails runtime");
}

// ─── Auto-updater (Updater struct in updater.go) ──────────────────────
// Drives the in-app upgrade flow. The full lifecycle:
//   1. useLatestVersion polls /api/desktop/latest, gets a download URL.
//   2. UpdateBanner shows when newer version available.
//   3. User clicks "Update" → UpdateProgressModal opens, calls
//      startUpdateDownload(url, version).
//   4. Modal polls getUpdateProgress() every 500ms for the progress bar.
//   5. When status flips to "downloaded", show "Install & restart".
//   6. Click → installAndRestart() — Go side swaps the binary and
//      relaunches; the current window closes ~250ms later.

export interface UpdaterState {
  status: "idle" | "downloading" | "downloaded" | "installing" | "error";
  version: string;
  bytesDownloaded: number;
  bytesTotal: number;
  error?: string;
}

const noopUpdater: UpdaterState = {
  status: "idle",
  version: "",
  bytesDownloaded: 0,
  bytesTotal: 0,
};

export async function startUpdateDownload(url: string, version: string): Promise<void> {
  if (isWails) return window.go!.main.Updater.StartDownload(url, version);
  console.warn("[updater] startDownload no-op outside Wails");
}

export async function getUpdateProgress(): Promise<UpdaterState> {
  if (isWails) return window.go!.main.Updater.GetProgress();
  return noopUpdater;
}

export async function cancelUpdateDownload(): Promise<void> {
  if (isWails) return window.go!.main.Updater.CancelDownload();
}

export async function installAndRestart(): Promise<void> {
  if (isWails) return window.go!.main.Updater.InstallAndRestart();
}

// Wails bridge — wraps Wails runtime calls with safe fallbacks for dev mode.
//
// In production (Wails-built binary), window.go.main.App is injected.
// In dev mode (Vite running outside Wails), fall back to localStorage for
// token storage and no-op for window controls so the app still works when
// you run "pnpm dev" directly from the frontend folder.

const isWails = typeof window !== "undefined" && !!window.go?.main?.App;

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

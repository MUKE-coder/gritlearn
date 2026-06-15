import axios, { type AxiosRequestConfig, type InternalAxiosRequestConfig } from "axios";
import { getToken, setToken, deleteToken } from "./wails-bridge";

// In Wails dev, "/api" is proxied to http://localhost:8080 via Vite.
// In Wails production, the frontend is served from file:// — we need the
// full API URL. Configure via VITE_API_URL or default to localhost:8080.
const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== "undefined" && !!window.go?.main?.App
    ? "http://localhost:8080/api"
    : "/api");

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach JWT from OS keychain (or localStorage in dev) and auto-generate an
// Idempotency-Key for unsafe methods so the server can dedupe retries (e.g.
// the 401 refresh path below re-issues the same request — without a stable
// key, a network blip mid-write could double-charge or double-create).
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const token = await getToken("access_token");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.headers) {
    const method = (config.method || "get").toUpperCase();
    const unsafe = method === "POST" || method === "PUT" || method === "PATCH" || method === "DELETE";
    if (unsafe && !config.headers["Idempotency-Key"]) {
      config.headers["Idempotency-Key"] = crypto.randomUUID();
    }
  }
  return config;
});

// Refresh on 401
let isRefreshing = false;
let refreshQueue: Array<(token: string) => void> = [];

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config as AxiosRequestConfig & { _retry?: boolean };

    // Don't try to refresh on the auth endpoints themselves — a wrong
    // password is a real 401 that should bubble up cleanly. Refreshing
    // here would 401 again, wipe tokens, and leave the user stuck in
    // a login loop.
    const url = original.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh");

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      original._retry = true;

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            if (original.headers) original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          });
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = await getToken("refresh_token");
        if (!refreshToken) throw new Error("No refresh token");

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refresh_token: refreshToken });

        await setToken("access_token", data.access_token);
        await setToken("refresh_token", data.refresh_token);

        refreshQueue.forEach((cb) => cb(data.access_token));
        refreshQueue = [];

        if (original.headers) original.headers.Authorization = `Bearer ${data.access_token}`;
        return apiClient(original);
      } catch (refreshErr) {
        await deleteToken("access_token");
        await deleteToken("refresh_token");
        // Fire a window event so the SessionStatusBanner can prompt the
        // student to sign in again. We deliberately don't navigate from
        // here — they should be able to keep browsing the curriculum
        // (which works offline) while deciding whether to sign in.
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:invalidated"));
        }
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

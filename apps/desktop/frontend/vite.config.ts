import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";
import fs from "node:fs";

// Bake the wails.json productVersion into the bundle so the updater can
// compare against the /api/desktop/latest payload. Falls back to "0.0.0"
// if the file is missing (shouldn't happen in CI, but keeps `vite dev`
// from crashing in a partial checkout).
function readWailsVersion(): string {
  try {
    const raw = fs.readFileSync(path.resolve(__dirname, "../wails.json"), "utf-8");
    return JSON.parse(raw).info?.productVersion ?? "0.0.0";
  } catch {
    return "0.0.0";
  }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(readWailsVersion()),
  },
  plugins: [
    TanStackRouterVite({ routesDirectory: "./src/routes", generatedRouteTree: "./src/routeTree.gen.ts" }),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@repo/shared": path.resolve(__dirname, "../../../packages/shared"),
    },
  },
  server: {
    port: 5174,
    strictPort: true,
    // In dev, proxy /api to the Go API server. Wails dev mode runs this Vite
    // server and wraps it in a native window.
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});

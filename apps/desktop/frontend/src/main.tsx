import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter, createHashHistory } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { queryClient } from "./lib/query-client";
import { AuthProvider } from "./lib/auth-provider";
import { ThemeProvider } from "./lib/theme-provider";
import { ReactErrorBoundary } from "./components/error-boundary";
import "./globals.css";

// Hash history works inside Wails' single-page webview context.
const router = createRouter({
  routeTree,
  history: createHashHistory(),
  context: { auth: undefined! }, // populated by AuthProvider
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ReactErrorBoundary wraps the entire tree so any render error — in a
// provider's boot, in a route's beforeLoad, in a lazy import that fails
// — renders a branded fallback instead of a black BackgroundColour
// window. The v0.3.0 / v0.3.x install reports were exactly this gap:
// the auth route's TitleBar called useSync, which threw, and without
// a top-of-tree boundary the user saw nothing but the window colour.
ReactDOM.createRoot(document.getElementById("app")!).render(
  <React.StrictMode>
    <ReactErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ReactErrorBoundary>
  </React.StrictMode>
);

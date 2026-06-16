import type { Metadata } from "next";
import { DownloadPageClient } from "@/components/download-page-client";
import { fallbackRelease, fetchRelease } from "@/lib/platform";

export const metadata: Metadata = {
  title: "Download JEditor",
  description:
    "Native desktop builds of JEditor for Windows, macOS, and Linux. The whole curriculum ships inside — works offline after one signup.",
};

// Revalidate every 10 minutes — matches the API's in-process cache so
// the page stays in step with the latest release without hammering
// GitHub. To force a refresh, redeploy or hit /api/desktop/latest?refresh=1
// on the API directly.
export const revalidate = 600;

// Server-side fetch. The previous version did this from the BROWSER
// using NEXT_PUBLIC_API_URL, which had two problems in prod:
//
//   1. NEXT_PUBLIC_* is baked into the client bundle at BUILD time.
//      If the build args weren't passed correctly, the browser ended
//      up trying http://localhost:8080 → silent fallback forever.
//
//   2. The browser fetch needed CORS to allow the prod web origin.
//      With the API's default CORS_ORIGINS only covering localhost,
//      the preflight was rejected → silent fallback forever.
//
// Fetching here on the server sidesteps both. The container hits the
// API via API_INTERNAL_URL (Docker service name like "http://api:8080"
// — no DNS, no hairpin, no CORS). The page hydrates with real data on
// first paint; no loading skeleton, no client-side network round trip.
export default async function DownloadPage() {
  const apiUrl =
    process.env.API_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8080";

  let release = fallbackRelease;
  try {
    release = await fetchRelease(apiUrl);
  } catch {
    // fetchRelease already swallows errors and returns fallback — this
    // is just belt-and-suspenders in case the typing changes.
  }

  return <DownloadPageClient release={release} />;
}

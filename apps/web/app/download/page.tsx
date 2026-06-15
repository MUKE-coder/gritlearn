import type { Metadata } from "next";
import { DownloadPageClient } from "@/components/download-page-client";

export const metadata: Metadata = {
  title: "Download JEditor",
  description:
    "Native desktop builds of JEditor for Windows, macOS, and Linux. The whole curriculum ships inside — works offline after one signup.",
};

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export default function DownloadPage() {
  return <DownloadPageClient apiUrl={API_URL} />;
}

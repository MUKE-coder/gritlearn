import type { Metadata, Viewport } from "next";
import { Onest, JetBrains_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import "./globals.css";

const onest = Onest({
  subsets: ["latin"],
  variable: "--font-onest",
  weight: ["400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "JEditor — Code you can finally see",
  description:
    "JBEditor (JEditor for short) — the IDE that teaches you to code by analogy while you build real projects. A native desktop editor with an analogy-first curriculum that works offline.",
  // Next picks up /icon, /apple-icon, /manifest from app/ by convention,
  // but we hand-wire here so the favicon variants in /public are served
  // directly with the right type/size hints.
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0a0d",
};

// noFlashScript: applies the saved theme to <html> before paint so the
// page doesn't flash dark when the user picked light (or vice versa).
// Runs synchronously in the <head>; tiny inline IIFE, no React boot needed.
const noFlashScript = `
(function() {
  try {
    var t = localStorage.getItem('jeditor-theme');
    if (t === 'light') document.documentElement.classList.add('light');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashScript }} />
      </head>
      <body className={`${onest.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        <Providers>
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}

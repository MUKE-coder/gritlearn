"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#download", label: "Download" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent/15 border border-accent/20">
            <span className="text-accent font-mono font-bold text-sm">G</span>
          </div>
          <span className="text-lg font-bold tracking-tight">gritlearn</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`text-sm transition-colors ${
                pathname === link.href
                  ? "text-foreground font-medium"
                  : "text-text-secondary hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="text-sm text-text-secondary hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Sign up free
          </Link>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2 text-text-secondary hover:text-foreground transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg">
          <div className="mx-auto max-w-5xl px-6 py-4 flex flex-col gap-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="text-sm py-2 text-text-secondary hover:text-foreground transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/login"
              className="text-sm py-2 text-text-secondary hover:text-foreground transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="mt-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white text-center hover:bg-accent-hover transition-colors"
            >
              Sign up free
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/download", label: "Download" },
  { href: "/blog", label: "Blog" },
];

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className={`sticky top-0 z-50 border-b transition-all duration-200 ${
        scrolled
          ? "border-border/60 bg-background/85 backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-accent/25 to-info/15 border border-accent/30 transition-transform group-hover:scale-105">
            <span className="text-accent font-mono font-bold text-sm">J</span>
          </div>
          <span className="text-lg font-bold tracking-tight">JEditor</span>
        </Link>

        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative px-3 py-1.5 text-sm transition-colors ${
                  active
                    ? "text-foreground"
                    : "text-text-secondary hover:text-foreground"
                }`}
              >
                {link.label}
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-x-2 -bottom-0.5 h-px bg-accent"
                  />
                )}
              </Link>
            );
          })}
          <div className="mx-2 h-5 w-px bg-border/60" />
          <Link
            href="/login"
            className="px-3 py-1.5 text-sm text-text-secondary hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white shadow-md shadow-accent/15 hover:bg-accent-hover hover:shadow-accent/30 transition-all hover:-translate-y-0.5"
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

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden border-t border-border/50 bg-background/95 backdrop-blur-lg overflow-hidden"
          >
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
                onClick={() => setMobileOpen(false)}
                className="mt-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white text-center hover:bg-accent-hover transition-colors"
              >
                Sign up free
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

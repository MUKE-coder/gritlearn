"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useMe } from "@/hooks/use-auth";
import { Sidebar } from "./sidebar";
import { Navbar } from "./navbar";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, isError } = useMe();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("grit-sidebar-collapsed");
    if (stored === "true") setSidebarCollapsed(true);
  }, []);

  useEffect(() => {
    if (isError) {
      router.push("/login");
    }
  }, [isError, router]);

  // Admin portal is ADMIN-only. Anyone else (STUDENT default, USER legacy,
  // EDITOR demo) gets bounced to the login page with a flash flag so the
  // login screen can show "this account is not an admin".
  useEffect(() => {
    if (user && user.role !== "ADMIN") {
      router.replace("/login?reason=not-admin");
    }
  }, [user, router]);

  const toggleSidebar = () => {
    const next = !sidebarCollapsed;
    setSidebarCollapsed(next);
    localStorage.setItem("grit-sidebar-collapsed", String(next));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (!user) return null;
  // Don't briefly paint the dashboard while we're redirecting non-admins.
  if (user.role !== "ADMIN") return null;

  return (
    <div className="flex min-h-screen">
      {/* Mobile overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <Sidebar
        user={user}
        collapsed={sidebarCollapsed}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      <div
        className={`flex flex-1 flex-col transition-all duration-300 ${
          sidebarCollapsed ? "lg:ml-16" : "lg:ml-64"
        }`}
      >
        <Navbar
          user={user}
          onMenuToggle={() => setMobileMenuOpen(true)}
          collapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
        />
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

const inputClass = "w-full rounded-lg border border-border bg-bg-elevated px-4 py-3 text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
      setSent(true);
    } catch {
      setSent(true); // Always show success for security
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">Reset password</h1>
          <p className="mt-2 text-text-secondary">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="rounded-lg bg-success/10 border border-success/20 px-4 py-4 text-center">
              <p className="text-sm text-success font-medium">Check your email</p>
              <p className="mt-1 text-xs text-text-secondary">
                If an account exists with that email, we&apos;ve sent a password reset link.
              </p>
            </div>
            <Link
              href="/login"
              className="block w-full rounded-lg border border-border py-3 text-center font-medium text-foreground hover:bg-bg-hover transition-colors"
            >
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-5">
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@example.com"
                required
                autoFocus
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-accent py-3 font-medium text-white hover:bg-accent-hover disabled:opacity-50 transition-colors"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-text-secondary">
          Remember your password?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

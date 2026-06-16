"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { AuthSplitLayout } from "@/components/auth-split-layout";

const inputClass = "w-full rounded-lg border border-border bg-bg-elevated px-4 py-3 text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/api/auth/forgot-password", { email });
    } catch {
      // Server returns 200 even when the email doesn't exist (security),
      // so we proceed to /reset-password either way and let the code
      // validation surface "invalid code" if there's nothing to reset.
    } finally {
      setLoading(false);
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    }
  };

  return (
    <AuthSplitLayout kicker="Lost your password? Reset it in 60 seconds.">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Forgot password</h1>
          <p className="mt-2 text-text-secondary">
            Enter the email on your account. We&apos;ll send a 6-digit reset code.
          </p>
        </div>

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
            {loading ? "Sending code..." : "Send reset code"}
          </button>
        </form>

        <p className="text-center text-sm text-text-secondary">
          Remembered it?{" "}
          <Link href="/login" className="text-accent hover:text-accent-hover font-medium transition-colors">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

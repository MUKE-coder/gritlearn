"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";
import { AuthSplitLayout } from "@/components/auth-split-layout";

const inputClass =
  "h-14 w-12 rounded-lg border border-border bg-bg-elevated text-center text-2xl font-semibold text-foreground caret-accent focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

const fieldClass =
  "w-full rounded-lg border border-border bg-bg-elevated px-4 py-3 text-foreground placeholder:text-text-muted focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  useEffect(() => {
    if (!email) router.push("/forgot-password");
  }, [email, router]);

  function setDigit(i: number, raw: string) {
    if (raw.length > 1) {
      const clean = raw.replace(/\D/g, "").slice(0, 6).padEnd(6, "").split("");
      setDigits(clean);
      const lastFilled = clean.findIndex((c) => c === "");
      const focusAt = lastFilled === -1 ? 5 : Math.max(0, lastFilled - 1);
      inputsRef.current[focusAt]?.focus();
      return;
    }
    const value = raw.replace(/\D/g, "").slice(0, 1);
    setDigits((d) => d.map((c, idx) => (idx === i ? value : c)));
    if (value && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter all six digits.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await api.post("/api/auth/reset-password", { email, code, password });
      router.push("/login");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || "That code didn't work. Check your inbox and try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthSplitLayout kicker="Almost there. Enter the code we just emailed you.">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Set a new password</h1>
          <p className="mt-2 text-text-secondary">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email || "your email"}</span>.
            Enter it and choose a new password.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-text-secondary">Verification code</label>
            <div className="flex items-center justify-between gap-2">
              {digits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  autoComplete={i === 0 ? "one-time-code" : "off"}
                  maxLength={6}
                  value={d}
                  onChange={(e) => setDigit(i, e.target.value)}
                  onKeyDown={(e) => onKeyDown(i, e)}
                  className={inputClass}
                  aria-label={`Digit ${i + 1}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="block text-sm font-medium text-text-secondary">
              New password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className={fieldClass}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background shadow-[0_0_24px_var(--accent-glow)] transition-all hover:bg-accent-hover hover:shadow-[0_0_36px_var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <div className="space-y-3 text-center text-sm">
          <p className="text-text-secondary">
            Didn&apos;t get a code?{" "}
            <Link href="/forgot-password" className="font-medium text-accent transition-colors hover:text-accent-hover">
              Request a new one
            </Link>
          </p>
          <p className="text-text-muted">
            <Link href="/login" className="text-foreground hover:text-accent transition-colors">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}

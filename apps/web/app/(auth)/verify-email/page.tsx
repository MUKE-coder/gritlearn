"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/lib/api";
import { AuthSplitLayout } from "@/components/auth-split-layout";

const inputClass =
  "h-14 w-12 rounded-lg border border-border bg-bg-elevated text-center text-2xl font-semibold text-foreground caret-accent focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent transition-colors";

function VerifyEmailInner() {
  const router = useRouter();
  const params = useSearchParams();
  const email = params.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // If the user lands here without ?email, the API won't know who to
  // verify against — send them back to register.
  useEffect(() => {
    if (!email) router.push("/register");
  }, [email, router]);

  // Resend cooldown — counts down to 0 after a successful resend so the
  // user can't spam the endpoint. Server also rate-limits.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  function setDigit(i: number, raw: string) {
    // Allow paste of the full code into the first cell.
    if (raw.length > 1) {
      const clean = raw.replace(/\D/g, "").slice(0, 6).padEnd(6, "").split("");
      const next = clean.map((c) => (c === "" ? "" : c));
      setDigits(next);
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
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
    }
    if (e.key === "ArrowLeft" && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter all six digits.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/verify-otp", { email, code });
      // API hands back tokens once the code matches.
      Cookies.set("access_token", data.data.tokens.access_token, { expires: 1 });
      Cookies.set("refresh_token", data.data.tokens.refresh_token, { expires: 7 });
      router.push("/");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setError(msg || "That code didn't work. Check your inbox and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    if (secondsLeft > 0 || resending) return;
    setResending(true);
    setError("");
    setSuccess("");
    try {
      await api.post("/api/auth/resend-otp", { email });
      setSuccess("A new code has been sent. Check your inbox.");
      setSecondsLeft(60);
    } catch {
      setError("Couldn't resend right now. Try again in a moment.");
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthSplitLayout kicker="Almost done. Confirm the code we just emailed you to start learning.">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Check your email</h1>
          <p className="mt-2 text-text-secondary">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email || "your address"}</span>.
            Enter it below to finish creating your account.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          {error && (
            <div className="rounded-lg border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-lg border border-success/30 bg-success/10 px-4 py-3 text-sm text-success">
              {success}
            </div>
          )}

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

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-accent px-4 py-3 text-sm font-semibold text-background shadow-[0_0_24px_var(--accent-glow)] transition-all hover:bg-accent-hover hover:shadow-[0_0_36px_var(--accent-glow)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Verifying…" : "Verify and continue"}
          </button>
        </form>

        <div className="space-y-3 text-center text-sm">
          <p className="text-text-secondary">
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              onClick={onResend}
              disabled={secondsLeft > 0 || resending}
              className="font-medium text-accent transition-colors hover:text-accent-hover disabled:cursor-not-allowed disabled:opacity-60"
            >
              {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : resending ? "Sending…" : "Resend"}
            </button>
          </p>
          <p className="text-text-muted">
            Wrong email?{" "}
            <Link href="/register" className="text-foreground hover:text-accent transition-colors">
              Start over
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}

export default function VerifyEmailPage() {
  // useSearchParams requires a Suspense boundary in App Router.
  return (
    <Suspense fallback={null}>
      <VerifyEmailInner />
    </Suspense>
  );
}

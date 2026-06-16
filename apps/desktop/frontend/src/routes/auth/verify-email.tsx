import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { z } from "zod";
import { useResendOTP, useVerifyOTP } from "@/hooks/use-auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthSplitLayout } from "@/components/auth-split-layout";

const SearchSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/auth/verify-email")({
  validateSearch: (search) => SearchSchema.parse(search),
  component: VerifyEmailPage,
});

function VerifyEmailPage() {
  const { email = "" } = Route.useSearch();
  const navigate = useNavigate();

  const { mutate: verifyOTP, isPending, error } = useVerifyOTP();
  const { mutate: resendOTP, isPending: resending } = useResendOTP();

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resentNote, setResentNote] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(0);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // No email in the URL → bounce back to register so the form can
  // collect one and re-issue an OTP.
  useEffect(() => {
    if (!email) navigate({ to: "/auth/register" });
  }, [email, navigate]);

  // Resend cooldown counter — stops the user from hammering the
  // resend button. Server is rate-limited too.
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  function setDigit(i: number, raw: string) {
    if (raw.length > 1) {
      const clean = raw.replace(/\D/g, "").slice(0, 6).padEnd(6, "").split("");
      setDigits(clean);
      const next = clean.findIndex((c) => c === "");
      const focusAt = next === -1 ? 5 : Math.max(0, next - 1);
      inputsRef.current[focusAt]?.focus();
      return;
    }
    const value = raw.replace(/\D/g, "").slice(0, 1);
    setDigits((d) => d.map((c, idx) => (idx === i ? value : c)));
    if (value && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowLeft"  && i > 0) inputsRef.current[i - 1]?.focus();
    if (e.key === "ArrowRight" && i < 5) inputsRef.current[i + 1]?.focus();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join("");
    if (code.length !== 6) return;
    verifyOTP({ email, code }, { onSuccess: () => navigate({ to: "/app" }) });
  }

  function onResend() {
    if (secondsLeft > 0 || resending) return;
    resendOTP(email, {
      onSuccess: () => {
        setResentNote("A new code has been sent.");
        setSecondsLeft(60);
      },
    });
  }

  return (
    <AuthSplitLayout kicker="Almost done. Confirm the code we just emailed you to start learning.">
      <div className="space-y-7">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">Check your email</h1>
          <p className="mt-1.5 text-[13.5px] text-foreground-secondary">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email || "your address"}</span>.
            Enter it below to finish creating your account.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              {authErrorMessage(error, "That code didn't work. Try again.")}
            </div>
          )}
          {resentNote && (
            <div className="rounded-lg border border-success/30 bg-success/10 px-3.5 py-2.5 text-[13px] text-success">
              {resentNote}
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
                aria-label={`Digit ${i + 1}`}
                className="h-14 w-12 rounded-lg border border-border bg-surface-2 text-center text-2xl font-semibold text-foreground caret-accent focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
            ))}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[14px] font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Verifying..." : "Verify and continue"}
          </button>
        </form>

        <div className="space-y-2 text-center text-[13px]">
          <p className="text-foreground-secondary">
            Didn&apos;t get a code?{" "}
            <button
              type="button"
              onClick={onResend}
              disabled={secondsLeft > 0 || resending}
              className="font-medium text-accent hover:underline disabled:cursor-not-allowed disabled:opacity-60"
            >
              {secondsLeft > 0 ? `Resend in ${secondsLeft}s` : resending ? "Sending…" : "Resend"}
            </button>
          </p>
          <p className="text-foreground-muted">
            Wrong email?{" "}
            <Link to="/auth/register" className="text-foreground hover:text-accent">
              Start over
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}

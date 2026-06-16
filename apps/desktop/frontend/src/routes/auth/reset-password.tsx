import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { z } from "zod";
import { useResetPassword } from "@/hooks/use-auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthSplitLayout } from "@/components/auth-split-layout";

const SearchSchema = z.object({
  email: z.string().email().optional(),
});

export const Route = createFileRoute("/auth/reset-password")({
  validateSearch: (search) => SearchSchema.parse(search),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const { email = "" } = Route.useSearch();
  const navigate = useNavigate();
  const { mutate: reset, isPending, error } = useResetPassword();

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  // No email in the URL → bounce back to /auth/forgot-password so the
  // user can request a fresh code.
  useEffect(() => {
    if (!email) navigate({ to: "/auth/forgot-password" });
  }, [email, navigate]);

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
    setFormError(null);
    const code = digits.join("");
    if (code.length !== 6) {
      setFormError("Enter all 6 digits of the code from your email.");
      return;
    }
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    reset(
      { email, code, password },
      {
        onSuccess: () => navigate({ to: "/auth/login" }),
      },
    );
  }

  return (
    <AuthSplitLayout kicker="Almost there. Enter the code we just emailed you.">
      <div className="space-y-7">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">Set a new password</h1>
          <p className="mt-1.5 text-[13.5px] text-foreground-secondary">
            We sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{email || "your email"}</span>.
            Enter the code and choose a new password.
          </p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {(error || formError) && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              {formError ?? authErrorMessage(error, "That code didn't work. Try again.")}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-[13px] font-medium text-foreground-secondary">
              Verification code
            </label>
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
          </div>

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-foreground-secondary">
              New password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3.5 pr-10 text-[14px] text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[14px] font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Resetting..." : "Reset password"}
          </button>
        </form>

        <div className="space-y-2 text-center text-[13px]">
          <p className="text-foreground-secondary">
            Didn&apos;t get a code?{" "}
            <Link to="/auth/forgot-password" className="font-medium text-accent hover:underline">
              Request a new one
            </Link>
          </p>
          <p className="text-foreground-muted">
            <Link to="/auth/login" className="text-foreground hover:text-accent">
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </AuthSplitLayout>
  );
}

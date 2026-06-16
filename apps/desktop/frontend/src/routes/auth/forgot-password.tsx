import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, MailCheck } from "lucide-react";
import { useState } from "react";
import { useForgotPassword } from "@/hooks/use-auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export const Route = createFileRoute("/auth/forgot-password")({
  component: ForgotPasswordPage,
});

const Schema = z.object({
  email: z.string().email("Invalid email"),
});
type Input = z.infer<typeof Schema>;

function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { mutate: forgot, isPending, error } = useForgotPassword();
  const [sent, setSent] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<Input>({
    resolver: zodResolver(Schema),
  });

  const onSubmit = (data: Input) => {
    forgot(data.email, {
      onSuccess: () => {
        setSubmittedEmail(data.email);
        setSent(true);
      },
    });
  };

  if (sent) {
    return (
      <AuthSplitLayout kicker="We just sent a 6-digit reset code.">
        <div className="space-y-7">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 text-accent">
            <MailCheck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-[26px] font-bold tracking-tight text-foreground">Check your email</h1>
            <p className="mt-1.5 text-[13.5px] text-foreground-secondary">
              If <span className="font-medium text-foreground">{submittedEmail}</span> belongs to an account,
              we just sent a 6-digit code. Enter it on the next screen to choose a new password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate({ to: "/auth/reset-password", search: { email: submittedEmail } })}
            className="flex h-11 w-full items-center justify-center rounded-lg bg-accent text-[14px] font-semibold text-background transition-colors hover:bg-accent-hover"
          >
            I have the code — continue
          </button>
          <p className="text-center text-[13px] text-foreground-secondary">
            <Link to="/auth/login" className="font-medium text-accent hover:underline">
              Back to sign in
            </Link>
          </p>
        </div>
      </AuthSplitLayout>
    );
  }

  return (
    <AuthSplitLayout kicker="Lost the password? Reset it in 60 seconds.">
      <div className="space-y-7">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">Forgot password</h1>
          <p className="mt-1.5 text-[13.5px] text-foreground-secondary">
            Enter the email on your account and we&apos;ll send you a 6-digit reset code.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              {authErrorMessage(error, "Could not send a reset code. Try again.")}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="email" className="block text-[13px] font-medium text-foreground-secondary">
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3.5 text-[14px] text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
              {...register("email")}
            />
            {errors.email && <p className="text-[12px] text-danger">{errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[14px] font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Sending code..." : "Send reset code"}
          </button>
        </form>

        <p className="text-center text-[13px] text-foreground-secondary">
          Remembered it?{" "}
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

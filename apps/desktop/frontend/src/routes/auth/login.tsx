import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/hooks/use-auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Minimum 6 characters"),
});

type LoginInput = z.infer<typeof LoginSchema>;

function LoginPage() {
  const navigate = useNavigate();
  const { mutate: login, isPending, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
  });

  const onSubmit = (data: LoginInput) => {
    login(data, {
      onSuccess: () => navigate({ to: "/app" }),
      onError: (err: unknown) => {
        // EMAIL_NOT_VERIFIED → bounce to the OTP screen with the email
        // prefilled so the student can finish their original signup.
        const code = (err as { response?: { data?: { error?: { code?: string; email?: string } } } })
          ?.response?.data?.error?.code;
        const emailFromErr =
          (err as { response?: { data?: { error?: { email?: string } } } })?.response?.data?.error?.email;
        if (code === "EMAIL_NOT_VERIFIED") {
          navigate({ to: "/auth/verify-email", search: { email: emailFromErr ?? data.email } });
        }
      },
    });
  };

  return (
    <AuthSplitLayout kicker="Sign in and your offline curriculum is one click away.">
      <div className="space-y-7">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">Welcome back</h1>
          <p className="mt-1.5 text-[13.5px] text-foreground-secondary">
            Sign in to your JEditor account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              {authErrorMessage(error, "Invalid email or password")}
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

          <div className="space-y-1.5">
            <label htmlFor="password" className="block text-[13px] font-medium text-foreground-secondary">
              Password
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Enter your password"
                className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3.5 pr-10 text-[14px] text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-[12px] text-danger">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-[14px] font-semibold text-background transition-colors hover:bg-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="text-center text-[13px] text-foreground-secondary">
          Don't have an account?{" "}
          <Link to="/auth/register" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

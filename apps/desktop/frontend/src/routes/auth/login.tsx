import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { useLogin } from "@/hooks/use-auth";
import { authErrorMessage } from "@/lib/auth-errors";

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
    login(data, { onSuccess: () => navigate({ to: "/app" }) });
  };

  return (
    <div className="relative w-full max-w-[420px] px-4">
      {/* Subtle radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-24 h-[400px] opacity-60"
        style={{
          background: "radial-gradient(600px at 50% 0%, rgba(108, 92, 231, 0.12), transparent 70%)",
        }}
      />

      <div className="relative rounded-2xl border border-border bg-surface p-10 shadow-sm">
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shadow-sm">
            <span className="text-[17px] font-bold text-white">G</span>
          </div>
        </div>

        <div className="mt-5 text-center">
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">
            Welcome back
          </h1>
          <p className="mt-1.5 text-[13px] text-foreground-secondary">
            Sign in to continue
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
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
              className="w-full h-11 rounded-lg border border-border bg-surface-2 px-3.5 text-[14px] text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
                className="w-full h-11 rounded-lg border border-border bg-surface-2 px-3.5 pr-10 text-[14px] text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
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
            className="w-full h-11 rounded-lg bg-accent text-[14px] font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <p className="mt-7 text-center text-[13px] text-foreground-secondary">
          Don't have an account?{" "}
          <Link to="/auth/register" className="font-medium text-accent hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}

import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useRegister } from "@/hooks/use-auth";
import { authErrorMessage } from "@/lib/auth-errors";
import { AuthSplitLayout } from "@/components/auth-split-layout";

export const Route = createFileRoute("/auth/register")({
  component: RegisterPage,
});

const RegisterSchema = z.object({
  first_name: z.string().min(1, "Required"),
  last_name: z.string().min(1, "Required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Minimum 8 characters"),
});

type RegisterInput = z.infer<typeof RegisterSchema>;

function RegisterPage() {
  const navigate = useNavigate();
  const { mutate: registerUser, isPending, error } = useRegister();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    // The API issues a 6-digit code to the email and creates the user
    // unverified. Once the student enters the code on /auth/verify-email
    // that route hands back real tokens.
    registerUser(data, {
      onSuccess: () => navigate({ to: "/auth/verify-email", search: { email: data.email } }),
    });
  };

  const input =
    "h-11 w-full rounded-lg border border-border bg-surface-2 px-3.5 text-[14px] text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <AuthSplitLayout kicker="Sign up once. Learn offline forever.">
      <div className="space-y-7">
        <div>
          <h1 className="text-[26px] font-bold tracking-tight text-foreground">Create your account</h1>
          <p className="mt-1.5 text-[13.5px] text-foreground-secondary">
            We&apos;ll email you a 6-digit code to confirm your address.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {error && (
            <div className="rounded-lg border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-[13px] text-danger">
              {authErrorMessage(error, "Registration failed")}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-foreground-secondary">
                First name
              </label>
              <input type="text" placeholder="Jane" className={input} {...register("first_name")} />
              {errors.first_name && <p className="text-[12px] text-danger">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <label className="block text-[13px] font-medium text-foreground-secondary">
                Last name
              </label>
              <input type="text" placeholder="Doe" className={input} {...register("last_name")} />
              {errors.last_name && <p className="text-[12px] text-danger">{errors.last_name.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground-secondary">Email</label>
            <input type="email" placeholder="you@example.com" className={input} {...register("email")} />
            {errors.email && <p className="text-[12px] text-danger">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="block text-[13px] font-medium text-foreground-secondary">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 characters"
                className={input + " pr-10"}
                autoComplete="new-password"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
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
            {isPending ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="text-center text-[13px] text-foreground-secondary">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthSplitLayout>
  );
}

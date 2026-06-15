import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { useRegister } from "@/hooks/use-auth";
import { authErrorMessage } from "@/lib/auth-errors";

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

  const { register, handleSubmit, formState: { errors } } = useForm<RegisterInput>({
    resolver: zodResolver(RegisterSchema),
  });

  const onSubmit = (data: RegisterInput) => {
    registerUser(data, { onSuccess: () => navigate({ to: "/app" }) });
  };

  const input = "w-full h-11 rounded-lg border border-border bg-surface-2 px-3.5 text-[14px] text-foreground placeholder:text-foreground-muted focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20";

  return (
    <div className="relative w-full max-w-[420px] px-4">
      <div className="relative rounded-2xl border border-border bg-surface p-10 shadow-sm">
        <div className="flex justify-center">
          <div className="h-10 w-10 rounded-xl bg-accent flex items-center justify-center shadow-sm">
            <span className="text-[17px] font-bold text-white">G</span>
          </div>
        </div>

        <div className="mt-5 text-center">
          <h1 className="text-[22px] font-semibold text-foreground tracking-tight">
            Create account
          </h1>
          <p className="mt-1.5 text-[13px] text-foreground-secondary">
            Get started in 30 seconds
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-5">
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
            <input type="password" placeholder="Min 8 characters" className={input} {...register("password")} />
            {errors.password && <p className="text-[12px] text-danger">{errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 rounded-lg bg-accent text-[14px] font-medium text-white hover:bg-accent-hover transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? "Creating..." : "Create account"}
          </button>
        </form>

        <p className="mt-7 text-center text-[13px] text-foreground-secondary">
          Already have an account?{" "}
          <Link to="/auth/login" className="font-medium text-accent hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { setToken, deleteToken } from "@/lib/wails-bridge";
import type { User } from "@/lib/auth-provider";

// We cache the logged-in user's identity in the OS keychain alongside
// the tokens. On a cold boot with no network, AuthProvider hydrates the
// "me" query from this so the app skips straight to the editor instead
// of bouncing the student to /login.
const IDENTITY_KEY = "user_identity";

interface LoginInput {
  email: string;
  password: string;
}

interface RegisterInput {
  first_name: string;
  last_name: string;
  email: string;
  password: string;
}

interface AuthResponse {
  user: User;
  tokens: {
    access_token: string;
    refresh_token: string;
  };
}

export function useMe() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const { data } = await apiClient.get("/auth/me");
      return data.data;
    },
    retry: false,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: LoginInput): Promise<AuthResponse> => {
      const { data } = await apiClient.post("/auth/login", input);
      return data.data;
    },
    onSuccess: async (data) => {
      await setToken("access_token", data.tokens.access_token);
      await setToken("refresh_token", data.tokens.refresh_token);
      await setToken(IDENTITY_KEY, JSON.stringify(data.user));
      qc.setQueryData(["me"], data.user);
    },
  });
}

// Register no longer returns tokens. The API creates the user with
// email_verified_at = null, emails a 6-digit OTP via Resend, and
// expects the client to call useVerifyOTP with the code. Once
// verification succeeds THAT mutation hands back the tokens and we
// stamp them into the keychain.
interface RegisterResponse {
  email: string;
  verification_sent: boolean;
}

export function useRegister() {
  return useMutation({
    mutationFn: async (input: RegisterInput): Promise<RegisterResponse> => {
      const { data } = await apiClient.post("/auth/register", input);
      return data.data;
    },
  });
}

// useVerifyOTP completes the signup loop. On success the API returns
// the same { user, tokens } shape useLogin uses, so we run the same
// keychain dance.
interface VerifyOTPInput {
  email: string;
  code: string;
}

export function useVerifyOTP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: VerifyOTPInput): Promise<AuthResponse> => {
      const { data } = await apiClient.post("/auth/verify-otp", input);
      return data.data;
    },
    onSuccess: async (data) => {
      await setToken("access_token", data.tokens.access_token);
      await setToken("refresh_token", data.tokens.refresh_token);
      await setToken(IDENTITY_KEY, JSON.stringify(data.user));
      qc.setQueryData(["me"], data.user);
    },
  });
}

// useResendOTP rotates the code server-side and re-sends the email.
// Server is rate-limited so spamming is harmless; UI cooldown
// (in the verify-email page) prevents users from triggering it.
export function useResendOTP() {
  return useMutation({
    mutationFn: async (email: string) => {
      await apiClient.post("/auth/resend-otp", { email });
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post("/auth/logout");
      } catch {
        // Best-effort — continue cleanup even if server call fails
      }
      await deleteToken("access_token");
      await deleteToken("refresh_token");
      await deleteToken(IDENTITY_KEY);
    },
    onSuccess: () => {
      qc.clear();
    },
  });
}

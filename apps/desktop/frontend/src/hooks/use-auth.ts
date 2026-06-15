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
  access_token: string;
  refresh_token: string;
  user: User;
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
      await setToken("access_token", data.access_token);
      await setToken("refresh_token", data.refresh_token);
      await setToken(IDENTITY_KEY, JSON.stringify(data.user));
      qc.setQueryData(["me"], data.user);
    },
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RegisterInput): Promise<AuthResponse> => {
      const { data } = await apiClient.post("/auth/register", input);
      return data.data;
    },
    onSuccess: async (data) => {
      await setToken("access_token", data.access_token);
      await setToken("refresh_token", data.refresh_token);
      await setToken(IDENTITY_KEY, JSON.stringify(data.user));
      qc.setQueryData(["me"], data.user);
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

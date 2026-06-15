import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/lib/api";

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  avatar: string;
  job_title: string;
  bio: string;
  active: boolean;
}

interface AuthResponse {
  data: {
    user: User;
    tokens: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    };
  };
}

function storeTokens(tokens: { access_token: string; refresh_token: string }) {
  Cookies.set("access_token", tokens.access_token, { expires: 1 });
  Cookies.set("refresh_token", tokens.refresh_token, { expires: 7 });
}

function clearTokens() {
  Cookies.remove("access_token");
  Cookies.remove("refresh_token");
}

export function getAccessToken(): string | undefined {
  return Cookies.get("access_token");
}

export function useMe() {
  return useQuery<User>({
    queryKey: ["me"],
    queryFn: async () => {
      const token = getAccessToken();
      const { data } = await api.get("/api/auth/me", {
        headers: token ? { Authorization: "Bearer " + token } : {},
      });
      return data.data;
    },
    retry: false,
    staleTime: 10 * 60 * 1000,
    enabled: !!getAccessToken(),
  });
}

export function useAuth() {
  const { data: user, isLoading, isError } = useMe();
  return {
    user: user ?? null,
    isAuthenticated: !!user,
    isLoading,
    isError,
  };
}

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const { data } = await api.post<AuthResponse>(
        "/api/auth/login",
        credentials
      );
      return data;
    },
    onSuccess: (data) => {
      storeTokens(data.data.tokens);
      queryClient.setQueryData(["me"], data.data.user);
      router.push("/");
    },
  });
}

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      first_name: string;
      last_name: string;
      email: string;
      password: string;
    }) => {
      const { data } = await api.post<AuthResponse>(
        "/api/auth/register",
        payload
      );
      return data;
    },
    onSuccess: (data) => {
      storeTokens(data.data.tokens);
      queryClient.setQueryData(["me"], data.data.user);
      router.push("/");
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const token = getAccessToken();
      try {
        await api.post("/api/auth/logout", null, {
          headers: token ? { Authorization: "Bearer " + token } : {},
        });
      } catch {
        // Ignore — always clear local state
      }
    },
    onSettled: () => {
      clearTokens();
      queryClient.clear();
      if (typeof window !== "undefined") {
        window.location.href = "/login";
      }
    },
  });
}

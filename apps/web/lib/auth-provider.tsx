"use client";

import { createContext, useContext } from "react";
import { useMe } from "@/hooks/use-auth";

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

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading } = useMe();

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
        isAuthenticated: !!user,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}

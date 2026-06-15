import { createContext, useContext, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { getToken } from "./wails-bridge";

export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  isHydrated: boolean;
}

const AuthContext = createContext<AuthContextValue>({ isHydrated: false });

export function useAuthContext() {
  return useContext(AuthContext);
}

const IDENTITY_KEY = "user_identity";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [isHydrated, setIsHydrated] = useState(false);

  // On boot, restore the cached user identity from the keychain so the
  // app can render the editor immediately — even with no network. The
  // background /api/auth/me request from useMe() will either confirm
  // (overwriting with fresh data) or fail (we leave the cache in place).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await getToken(IDENTITY_KEY);
        if (!cancelled && raw) {
          try {
            const user = JSON.parse(raw) as User;
            qc.setQueryData(["me"], user);
          } catch {
            // Stored identity is corrupt — ignore it; useMe will refetch.
          }
        }
      } finally {
        if (!cancelled) setIsHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [qc]);

  return <AuthContext.Provider value={{ isHydrated }}>{children}</AuthContext.Provider>;
}

"use client";

import { useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Cookies from "js-cookie";
import { api } from "@/lib/api";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const accessToken = searchParams.get("access_token");
    const refreshToken = searchParams.get("refresh_token");
    const error = searchParams.get("error");

    if (error) {
      router.push("/login?error=" + encodeURIComponent(error));
      return;
    }

    if (accessToken && refreshToken) {
      Cookies.set("access_token", accessToken, { expires: 1 });
      Cookies.set("refresh_token", refreshToken, { expires: 7 });

      // Fetch user to confirm auth then redirect
      api
        .get("/api/auth/me", {
          headers: { Authorization: "Bearer " + accessToken },
        })
        .then(() => {
          router.push("/");
        })
        .catch(() => {
          router.push("/");
        });
    } else {
      router.push("/login?error=Authentication+failed");
    }
  }, [searchParams, router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="inline-flex h-10 w-10 animate-spin items-center justify-center rounded-full border-2 border-accent border-t-transparent" />
        <p className="mt-4 text-sm text-text-secondary">Signing you in...</p>
      </div>
    </div>
  );
}

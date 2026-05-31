"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { exchangeOAuthCode, isApiConfigured, saveAuthTokens } from "@/lib/api";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const params = useParams<{ provider: string }>();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [message, setMessage] = useState("Completing sign-in…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      setError(errorParam);
      setMessage("");
      return;
    }

    if (!isApiConfigured) {
      setError("API URL is not configured. Set NEXT_PUBLIC_API_URL.");
      setMessage("");
      return;
    }

    const access = searchParams.get("access");
    const refreshToken = searchParams.get("refresh");
    if (access && refreshToken) {
      saveAuthTokens({ access, refresh: refreshToken });
      void refresh().then(() => {
        router.replace("/library");
      });
      return;
    }

    const code = searchParams.get("code");
    const provider = params.provider;
    if (!code || !provider) {
      setError("Missing authorization code. Open the sign-in page and try again.");
      setMessage("");
      return;
    }

    let cancelled = false;

    const run = async () => {
      try {
        await exchangeOAuthCode(provider, code);
        if (cancelled) {
          return;
        }
        await refresh();
        router.replace("/library");
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "OAuth sign-in failed.");
          setMessage("");
        }
      }
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [params.provider, refresh, router, searchParams]);

  return (
    <section className="mx-auto w-full max-w-md rounded border border-black/10 bg-white p-6 text-center">
      <h1 className="text-xl font-semibold">Finishing {params.provider} authentication</h1>
      {error ? (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      ) : (
        <p className="mt-2 text-sm text-gray-600">{message}</p>
      )}
      {error ? (
        <Link
          href="/login"
          className="mt-4 inline-block text-sm font-medium text-violet-600 underline"
        >
          Back to login
        </Link>
      ) : null}
    </section>
  );
}

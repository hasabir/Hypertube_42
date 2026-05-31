"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validation";
import { startOAuthRedirect, type OAuthProviderId } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { z } from "zod";

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProviderId | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      setSubmitting(true);
      setError(null);
      await login(values);
      router.push("/library");
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Login failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center bg-[#131313] p-6 text-[#e5e2e1] selection:bg-[#7c3aed]/40 selection:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute right-[-5%] top-[-10%] h-[40%] w-[40%] rounded-full bg-[#7c3aed]/20 blur-[120px]" />
        <div className="absolute bottom-[-5%] left-[-5%] h-[30%] w-[30%] rounded-full bg-[#4f2500]/10 blur-[100px]" />
      </div>

      <main className="relative z-10 flex w-full max-w-[1100px] flex-col overflow-hidden rounded-xl bg-[#0e0e0e] shadow-[0_40px_60px_-10px_rgba(0,0,0,0.6)] lg:flex-row">
        <div className="relative hidden w-full flex-col justify-between overflow-hidden bg-[#131313] p-12 lg:flex lg:w-1/2">
          <Image
            alt=""
            className="object-cover opacity-40 mix-blend-overlay"
            fill
            sizes="(min-width: 1024px) 50vw, 0px"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCXkFjdBzjikR-L1p8M9kk_g3u8bJ2nAFfkd7Y5kHQSp_Rk5ElVsgXXs0wJHtWhuKD6hxWmsK7S887s5wmKpofpsglQo5vzGkciPXVgsnDNo1dau7J0-oYsTffh6o7sNmKJ1Taha2YXuATfciag8BYcOv4laUuvVHnR3ZM0RTIX5RwEvn9ZUzcQo-aHH2D2sd_S771LoUt_GcNfNtOj6JCtaYPPeFS8io2cyegejOCL76OVRNC2HRlcs4OODGsDNvUui36JZJsyAnI"
            priority
          />
          <div className="relative z-10">
            <span className="text-2xl font-black tracking-tighter text-[#d2bbff]">HYPERTUBE</span>
            <p className="mt-2 text-sm font-medium text-[#ccc3d8] opacity-60">The Cinematic Void</p>
          </div>
          <div className="relative z-10">
            <h1 className="max-w-xs text-5xl font-black leading-[0.95] tracking-tight text-[#e5e2e1]">
              EMBRACE THE <span className="text-[#d2bbff]">DEPTH.</span>
            </h1>
            <p className="mt-6 max-w-sm text-lg leading-relaxed text-[#ccc3d8] opacity-80">
              High-performance streaming meets the infinite library. Access the world&apos;s media through a
              premium, peer-to-peer lens.
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col bg-[#1c1b1b] p-8 md:p-16 lg:w-1/2">
          <header className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-[#e5e2e1]">Login</h2>
            <p className="mt-2 text-sm text-[#ccc3d8]">Welcome back to the void.</p>
          </header>

          <div className="flex flex-1 flex-col space-y-6">
            <form
              className="space-y-6"
              method="post"
              noValidate
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block px-1 text-xs font-semibold uppercase tracking-widest text-[#ccc3d8]">
                    Username
                  </label>
                  <input
                    className="ht-dark-input w-full rounded-lg border-none bg-[#0e0e0e] px-5 py-4 text-[#e5e2e1] outline-none ring-0 transition-all placeholder:text-[#353534] focus:ring-2 focus:ring-[#d2bbff]/40"
                    placeholder="your_alias or email"
                    autoComplete="username"
                    inputMode="text"
                    {...register("usernameOrEmail")}
                  />
                  {errors.usernameOrEmail ? (
                    <p className="mt-1 px-1 text-xs text-[#ffb4ab]">{errors.usernameOrEmail.message}</p>
                  ) : null}
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between px-1">
                    <label className="block text-xs font-semibold uppercase tracking-widest text-[#ccc3d8]">
                      Password
                    </label>
                    <Link
                      href="/forgot-password"
                      className="text-xs font-medium text-[#d2bbff] transition-colors hover:text-[#d2bbff]/80"
                    >
                      Forgot Password?
                    </Link>
                  </div>
                  <input
                    className="ht-dark-input w-full rounded-lg border-none bg-[#0e0e0e] px-5 py-4 text-[#e5e2e1] outline-none transition-all placeholder:text-[#353534] focus:ring-2 focus:ring-[#d2bbff]/40"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    {...register("password")}
                  />
                  {errors.password ? (
                    <p className="mt-1 px-1 text-xs text-[#ffb4ab]">{errors.password.message}</p>
                  ) : null}
                </div>
              </div>

              {error ? <p className="text-sm text-[#ffb4ab]">{error}</p> : null}
              {oauthError ? <p className="text-sm text-[#ffb4ab]">{oauthError}</p> : null}

              <button
                disabled={submitting}
                type="submit"
                className="w-full rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] py-4 text-sm font-bold text-white shadow-lg shadow-[#7c3aed]/20 transition-all hover:scale-[1.02] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {submitting ? "Signing in..." : "Sign In"}
              </button>
            </form>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-[#4a4455]/10" />
              <span className="mx-4 flex-shrink text-xs font-semibold uppercase tracking-widest text-[#ccc3d8]">
                or
              </span>
              <div className="flex-grow border-t border-[#4a4455]/10" />
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                type="button"
                disabled={Boolean(oauthBusy)}
                onClick={async () => {
                  try {
                    setOauthError(null);
                    setOauthBusy("42");
                    await startOAuthRedirect("42");
                  } catch (e) {
                    setOauthError(e instanceof Error ? e.message : "Could not start 42 sign-in.");
                    setOauthBusy(null);
                  }
                }}
                className="group flex w-full items-center justify-center gap-3 rounded-lg bg-[#2a2a2a] py-3.5 font-medium text-[#e5e2e1] transition-all hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-lg opacity-60 group-hover:opacity-100">
                  rocket_launch
                </span>
                {oauthBusy === "42" ? "Opening 42…" : "Continue with 42"}
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={Boolean(oauthBusy)}
                  onClick={async () => {
                    try {
                      setOauthError(null);
                      setOauthBusy("google");
                      await startOAuthRedirect("google");
                    } catch (e) {
                      setOauthError(e instanceof Error ? e.message : "Could not start Google sign-in.");
                      setOauthBusy(null);
                    }
                  }}
                  className="flex w-full items-center justify-center rounded-lg bg-[#2a2a2a] py-3.5 text-sm font-medium text-[#e5e2e1] transition-all hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {oauthBusy === "google" ? "Opening…" : "Google"}
                </button>
                <button
                  type="button"
                  disabled={Boolean(oauthBusy)}
                  onClick={async () => {
                    try {
                      setOauthError(null);
                      setOauthBusy("github");
                      await startOAuthRedirect("github");
                    } catch (e) {
                      setOauthError(e instanceof Error ? e.message : "Could not start GitHub sign-in.");
                      setOauthBusy(null);
                    }
                  }}
                  className="group flex w-full items-center justify-center gap-3 rounded-lg bg-[#2a2a2a] py-3.5 text-sm font-medium text-[#e5e2e1] transition-all hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="material-symbols-outlined text-lg opacity-60 group-hover:opacity-100">
                    terminal
                  </span>
                  {oauthBusy === "github" ? "…" : "GitHub"}
                </button>
              </div>
            </div>
          </div>

          <footer className="mt-auto pt-10 text-center">
            <p className="text-sm text-[#ccc3d8]">
              New to the network?
              <Link
                href="/register"
                className="ml-1 font-bold text-[#d2bbff] underline decoration-2 underline-offset-4 hover:underline"
              >
                Register
              </Link>
            </p>
          </footer>
        </div>
      </main>

      <div className="fixed bottom-8 w-full px-6 text-center lg:hidden">
        <span className="text-xl font-black tracking-tighter text-[#d2bbff]/40">HYPERTUBE</span>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/lib/validation";
import { startOAuthRedirect, type OAuthProviderId } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import type { z } from "zod";

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [oauthError, setOauthError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [oauthBusy, setOauthBusy] = useState<OAuthProviderId | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (values: RegisterFormValues) => {
    try {
      setSubmitting(true);
      setError(null);
      await registerUser({
        email: values.email,
        username: values.username,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
      });
      router.push("/library");
    } catch (submissionError) {
      const message = submissionError instanceof Error ? submissionError.message : "Registration failed.";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1]">
      <header className="fixed inset-x-0 top-0 z-50 flex h-20 items-center justify-between bg-[#131313]/60 px-8 backdrop-blur-xl">
        <div className="text-2xl font-black tracking-tighter text-[#d2bbff]">HYPERTUBE</div>
        <div className="flex items-center gap-6">
          <Link href="/login" className="font-medium tracking-tight text-gray-400 transition-colors hover:text-white">
            Login
          </Link>
          <Link href="/register" className="rounded-lg bg-[#7c3aed] px-6 py-2 font-bold text-[#ede0ff]">
            Register
          </Link>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 items-center justify-center px-6 pb-12 pt-28">
        <div className="grid w-full items-center gap-12 lg:grid-cols-2">
          <section className="hidden flex-col space-y-8 pr-12 lg:flex">
            <div>
              <h1 className="mb-4 text-6xl font-black leading-none tracking-tighter text-[#d2bbff] xl:text-7xl">
                JOIN THE <br /> VOID.
              </h1>
              <p className="max-w-md text-xl leading-relaxed text-[#ccc3d8]">
                Experience cinema without boundaries. High-velocity streaming meets a minimalist,
                distraction-free environment.
              </p>
            </div>
            <div className="group relative aspect-video overflow-hidden rounded-xl bg-[#2a2a2a]">
              <div
                className="h-full w-full bg-cover bg-center opacity-60 transition-transform duration-700 group-hover:scale-105"
                style={{
                  backgroundImage:
                    "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCFZ--ViHNJH4cLgQStiMclCmu2YusGAeMOyaKhgCBqF0By6c2MzpGxhyVjSEk-vUmK8i7S4TRMqTPsSZpd8os7Bz_7QHBbHx5pO0sFs98sk1N4AjggRnBBMg33Mv71BC_vptF0nNdnrLp1aDEeTL4c-Jb3JqsCVfmvIhFUxYbGzWwl40rgpMoPlbLLovb6h_4HuuaYoOxhbcaY0dqxx1gFqhy2Jc1YRMnKabFfdM8xutYBm7uumZt3QQliPfReTTFg1O1US3r_fSI')",
                }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#131313] via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6">
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-[#d2bbff]">✦</span>
                  <span className="text-xs font-bold uppercase tracking-widest text-[#d2bbff]">Now Streaming</span>
                </div>
                <h2 className="text-2xl font-bold tracking-tight text-white">Hyperdrive Dark</h2>
              </div>
            </div>
          </section>

          <section className="mx-auto w-full max-w-md">
            <div className="rounded-xl bg-[#1c1b1b] p-10 shadow-[0_40px_60px_-10px_rgba(0,0,0,0.4)]">
              <div className="mb-8">
                <h2 className="mb-2 text-3xl font-bold tracking-tight text-white">Create Account</h2>
                <p className="text-sm text-[#ccc3d8]">Start your cinematic journey today.</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-medium text-[#ccc3d8]">First Name</label>
                    <input
                      className="ht-dark-input w-full rounded-lg border border-transparent bg-[#0e0e0e] px-4 py-3 text-[#e5e2e1] placeholder:text-[#4a4455] focus:border-[#7c3aed] focus:outline-none"
                      placeholder="John"
                      autoComplete="given-name"
                      {...register("firstName")}
                    />
                    {errors.firstName ? <p className="text-xs text-[#ffb4ab]">{errors.firstName.message}</p> : null}
                  </div>
                  <div className="space-y-1.5">
                    <label className="ml-1 text-xs font-medium text-[#ccc3d8]">Last Name</label>
                    <input
                      className="ht-dark-input w-full rounded-lg border border-transparent bg-[#0e0e0e] px-4 py-3 text-[#e5e2e1] placeholder:text-[#4a4455] focus:border-[#7c3aed] focus:outline-none"
                      placeholder="Doe"
                      autoComplete="family-name"
                      {...register("lastName")}
                    />
                    {errors.lastName ? <p className="text-xs text-[#ffb4ab]">{errors.lastName.message}</p> : null}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-[#ccc3d8]">Username</label>
                  <input
                    className="ht-dark-input w-full rounded-lg border border-transparent bg-[#0e0e0e] px-4 py-3 text-[#e5e2e1] placeholder:text-[#4a4455] focus:border-[#7c3aed] focus:outline-none"
                    placeholder="johndoe_void"
                    autoComplete="username"
                    inputMode="text"
                    autoCapitalize="none"
                    spellCheck={false}
                    {...register("username")}
                  />
                  {errors.username ? <p className="text-xs text-[#ffb4ab]">{errors.username.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-[#ccc3d8]">Email</label>
                  <input
                    className="ht-dark-input w-full rounded-lg border border-transparent bg-[#0e0e0e] px-4 py-3 text-[#e5e2e1] placeholder:text-[#4a4455] focus:border-[#7c3aed] focus:outline-none"
                    placeholder="john@example.com"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                  />
                  {errors.email ? <p className="text-xs text-[#ffb4ab]">{errors.email.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-[#ccc3d8]">Password</label>
                  <input
                    className="ht-dark-input w-full rounded-lg border border-transparent bg-[#0e0e0e] px-4 py-3 text-[#e5e2e1] placeholder:text-[#4a4455] focus:border-[#7c3aed] focus:outline-none"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="new-password"
                    {...register("password")}
                  />
                  {errors.password ? <p className="text-xs text-[#ffb4ab]">{errors.password.message}</p> : null}
                </div>

                <div className="space-y-1.5">
                  <label className="ml-1 text-xs font-medium text-[#ccc3d8]">Confirm Password</label>
                  <input
                    className="ht-dark-input w-full rounded-lg border border-transparent bg-[#0e0e0e] px-4 py-3 text-[#e5e2e1] placeholder:text-[#4a4455] focus:border-[#7c3aed] focus:outline-none"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="new-password"
                    {...register("confirmPassword")}
                  />
                  {errors.confirmPassword ? (
                    <p className="text-xs text-[#ffb4ab]">{errors.confirmPassword.message}</p>
                  ) : null}
                </div>

                {error ? <p className="text-sm text-[#ffb4ab]">{error}</p> : null}
                {oauthError ? <p className="text-sm text-[#ffb4ab]">{oauthError}</p> : null}

                <button
                  disabled={submitting}
                  className="mt-4 w-full rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#5a00c6] py-4 text-lg font-bold text-[#ede0ff] transition-all hover:shadow-[0_0_20px_rgba(124,58,237,0.3)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {submitting ? "Creating..." : "Register"}
                </button>
              </form>

              <div className="relative my-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-[#4a4455] opacity-20" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-[#1c1b1b] px-4 font-medium text-[#ccc3d8]">Or continue with</span>
                </div>
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
                  className="w-full rounded-lg border border-[#4a4455]/40 bg-[#2a2a2a] py-3 text-sm font-medium text-[#e5e2e1] transition-all hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
                >
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
                    className="w-full rounded-lg border border-[#4a4455]/40 bg-[#2a2a2a] py-3 text-sm font-medium text-[#e5e2e1] transition-all hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {oauthBusy === "google" ? "…" : "Google"}
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
                    className="w-full rounded-lg border border-[#4a4455]/40 bg-[#2a2a2a] py-3 text-sm font-medium text-[#e5e2e1] transition-all hover:bg-[#3a3939] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {oauthBusy === "github" ? "…" : "GitHub"}
                  </button>
                </div>
              </div>

              <p className="mt-8 text-center text-sm text-[#ccc3d8]">
                Already have an account?
                <Link href="/login" className="ml-1 font-bold text-[#d2bbff] hover:underline">
                  Login
                </Link>
              </p>
            </div>
          </section>
        </div>
      </main>

      <footer className="flex w-full flex-col items-center justify-between gap-4 border-t border-white/5 bg-[#0e0e0e] px-8 py-12 md:flex-row">
        <div className="text-xs text-gray-500">© 2026 Hypertube. All rights reserved.</div>
        <div className="flex gap-8">
          <a className="text-xs text-gray-600 transition-colors hover:text-white" href="#">
            Privacy Policy
          </a>
          <a className="text-xs text-gray-600 transition-colors hover:text-white" href="#">
            Terms of Service
          </a>
          <a className="text-xs text-gray-600 transition-colors hover:text-white" href="#">
            API
          </a>
          <a className="text-xs text-gray-600 transition-colors hover:text-white" href="#">
            Contact
          </a>
        </div>
      </footer>
    </div>
  );
}

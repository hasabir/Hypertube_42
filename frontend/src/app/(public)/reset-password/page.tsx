"use client";

import Image from "next/image";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { api, isApiConfigured, validatePasswordResetLink } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validation";
import type { z } from "zod";

type ResetFormValues = z.infer<typeof resetPasswordSchema>;

type StrengthLevel = "empty" | "weak" | "medium" | "strong";

function strengthForPassword(pw: string): { label: string; level: StrengthLevel } {
  if (!pw) {
    return { label: "—", level: "empty" };
  }
  let score = 0;
  if (pw.length >= 8) score += 1;
  if (pw.length >= 12) score += 1;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw) && /[0-9]/.test(pw)) score += 2;
  if (score <= 1) {
    return { label: "Weak", level: "weak" };
  }
  if (score <= 3) {
    return { label: "Medium", level: "medium" };
  }
  return { label: "Strong", level: "strong" };
}

function ResetPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const uid = searchParams.get("uid") ?? "";
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [linkStatus, setLinkStatus] = useState<"checking" | "valid" | "invalid">("checking");

  useEffect(() => {
    if (!token || !uid) {
      setLinkStatus("invalid");
      return;
    }
    if (!isApiConfigured) {
      setLinkStatus("valid");
      return;
    }
    let cancelled = false;
    void (async () => {
      const ok = await validatePasswordResetLink(uid, token);
      if (!cancelled) {
        setLinkStatus(ok ? "valid" : "invalid");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token, uid]);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetFormValues>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const password = useWatch({ control, name: "password", defaultValue: "" }) ?? "";
  const { label: strengthLabel, level: strengthLevel } = strengthForPassword(String(password));

  const strengthBarClass =
    strengthLevel === "empty"
      ? "h-full w-0 rounded-full bg-gradient-to-r from-[#d2bbff] to-[#7c3aed]"
      : strengthLevel === "weak"
        ? "h-full w-1/4 rounded-full bg-gradient-to-r from-red-500/80 to-red-400/60"
        : strengthLevel === "medium"
          ? "h-full w-1/3 rounded-full bg-gradient-to-r from-[#d2bbff] to-[#7c3aed]"
          : "h-full w-full rounded-full bg-gradient-to-r from-emerald-500/80 to-[#7c3aed]";

  const onSubmit = async (values: ResetFormValues) => {
    if (!token || !uid) {
      setError("This link is missing a valid reset uid/token. Open the link from your email again.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await api.resetPassword(values.password, token, uid);
      router.push("/login");
    } catch {
      setError("Could not reset the password. Check your reset token.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#131313] text-[#e5e2e1] selection:bg-[#7c3aed]/40 selection:text-[#ede0ff]">
      <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between border-none bg-[#131313]/60 px-8 shadow-[0_40px_60px_-10px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#d2bbff]">
          HYPERTUBE
        </Link>
        <div className="hidden items-center gap-8 md:flex">
          <Link href="/library" className="font-medium tracking-tight text-gray-400 transition-colors hover:text-white">
            Movies
          </Link>
        </div>
        <div className="flex items-center gap-6">
          <Link
            href="/login"
            className="text-gray-400 transition-colors hover:text-white active:scale-95"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-6 py-2 text-sm font-semibold text-[#ede0ff] transition-all active:scale-95"
          >
            Register
          </Link>
        </div>
      </nav>

      <div className="relative flex min-h-0 flex-1 flex-col">
        <main className="relative flex flex-grow items-center justify-center overflow-hidden px-6 pt-20">
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7c3aed]/10 blur-[120px]" />

          <div className="relative z-10 w-full max-w-md">
            <div className="mb-12 text-center md:text-left">
              <span className="mb-4 block text-xs font-bold uppercase tracking-[0.2em] text-[#d2bbff]">
                Security Protocol
              </span>
              <h1 className="mb-4 text-4xl font-extrabold tracking-tighter text-[#e5e2e1] sm:text-5xl">Reset Password</h1>
              <p className="font-light leading-relaxed text-[#ccc3d8]">
                Enter your new credentials to regain access to the cinematic void.
              </p>
            </div>

            {!token || !uid ? (
              <p className="mb-6 text-sm text-[#ffb4ab]">
                No reset uid/token in the link. Open this page from the “reset password” email, or use forgot password
                again.
              </p>
            ) : null}

            {token && uid && linkStatus === "checking" && isApiConfigured ? (
              <p className="mb-6 text-sm text-[#ccc3d8]">Verifying reset link…</p>
            ) : null}

            {token && uid && linkStatus === "invalid" ? (
              <p className="mb-6 text-sm text-[#ffb4ab]">
                This reset link is invalid or has expired. Request a new one from forgot password.
              </p>
            ) : null}

            <form
              className="space-y-8"
              method="post"
              noValidate
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="space-y-6">
                <div>
                  <label
                    className="mb-3 block px-1 text-xs font-medium uppercase tracking-widest text-[#ccc3d8]"
                    htmlFor="new-password"
                  >
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      id="new-password"
                      className="ht-dark-input w-full rounded-lg border-none bg-[#0e0e0e] py-4 pl-5 pr-12 text-[#e5e2e1] transition-all focus:ring-2 focus:ring-[#d2bbff]/30"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...register("password")}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#353534] transition-colors hover:text-[#d2bbff]"
                      type="button"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {showPassword ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {errors.password ? <p className="mt-1 text-xs text-[#ffb4ab]">{errors.password.message}</p> : null}
                </div>

                <div>
                  <label
                    className="mb-3 block px-1 text-xs font-medium uppercase tracking-widest text-[#ccc3d8]"
                    htmlFor="confirm-password"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirm-password"
                      className="ht-dark-input w-full rounded-lg border-none bg-[#0e0e0e] py-4 pl-5 pr-12 text-[#e5e2e1] transition-all focus:ring-2 focus:ring-[#d2bbff]/30"
                      type={showConfirm ? "text" : "password"}
                      placeholder="••••••••"
                      autoComplete="new-password"
                      {...register("confirmPassword")}
                    />
                    <button
                      className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer text-[#353534] transition-colors hover:text-[#d2bbff]"
                      type="button"
                      aria-label={showConfirm ? "Hide confirm password" : "Show confirm password"}
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {showConfirm ? "visibility_off" : "visibility"}
                      </span>
                    </button>
                  </div>
                  {errors.confirmPassword ? (
                    <p className="mt-1 text-xs text-[#ffb4ab]">{errors.confirmPassword.message}</p>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center gap-3 px-1">
                <div className="h-1 flex-grow overflow-hidden rounded-full bg-[#0e0e0e]">
                  <div className={`${strengthBarClass} min-w-0 transition-all duration-300`} />
                </div>
                <span className="text-[10px] font-bold uppercase tracking-tighter text-[#ccc3d8]">
                  Strength: {strengthLabel}
                </span>
              </div>

              {error ? <p className="text-sm text-[#ffb4ab]">{error}</p> : null}

              <button
                className="w-full rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#5a00c6] py-5 text-sm font-bold uppercase tracking-widest text-white shadow-[0_20px_40px_-10px_rgba(124,58,237,0.3)] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={submitting || !token || !uid || linkStatus !== "valid"}
                type="submit"
              >
                {submitting ? "Updating…" : "Update Password"}
              </button>
            </form>

            <div className="mt-8 text-center">
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 text-xs font-semibold tracking-tight text-[#d2bbff] transition-colors hover:text-[#ede0ff]"
              >
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Return to Login
              </Link>
            </div>
          </div>
        </main>

        <div className="pointer-events-none fixed bottom-0 right-0 top-0 z-0 hidden w-1/3 lg:block">
          <div className="relative h-full w-full">
            <div className="absolute inset-0 z-[1] bg-[#1c1b1b] opacity-40" />
            <Image
              alt=""
              className="object-cover grayscale mix-blend-luminosity"
              fill
              sizes="33vw"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuAnOIIYajqqtAaDpd1B5vdiF2F3_6Vz44fmWqxtejsTaL8I8eRDr2exnbm3A-rNDDn2vfpJhZnANTwiwP15jxXRT5KMx3OvZ2DH6AzL14ojiNXQUlWtT791OeEZ1Fd0I92GZlPPLLX--1w9XPJJeWy2p21M4PLo9znD5Trcd53Vq2z5xonNyox09UkZGo6eqpCRdenBP-QDZT1bYUiF3OcAUW7h5k8UTZ7JwSw11LgmxcTJIr0RjU5ZGOvupcJi1MYXAnJUlbZNQBE"
              priority
            />
            <div className="absolute inset-0 z-[2] bg-gradient-to-l from-[#131313] via-transparent to-transparent" />
          </div>
        </div>
      </div>

      <footer className="z-10 mt-12 flex w-full flex-col items-center justify-between gap-4 border-t border-white/5 bg-[#0e0e0e] px-8 py-12 md:flex-row">
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={<div className="flex min-h-screen items-center justify-center bg-[#131313] text-[#9ca3af]">Loading…</div>}
    >
      <ResetPasswordContent />
    </Suspense>
  );
}

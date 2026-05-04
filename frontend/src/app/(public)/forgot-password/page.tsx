"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/lib/validation";
import { api } from "@/lib/api";
import type { z } from "zod";

type ForgotFormValues = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordPage() {
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (values: ForgotFormValues) => {
    try {
      setSubmitting(true);
      setStatus(null);
      await api.forgotPassword(values.email);
      setStatus("If this email exists, a reset link has been sent.");
    } catch {
      setStatus("Unable to process this request right now.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#131313] text-[#e5e2e1] selection:bg-[#d2bbff]/30">
      <main className="relative z-10 flex min-h-screen flex-col items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute left-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-[#7c3aed]/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] h-[40%] w-[40%] rounded-full bg-[#d2bbff]/5 blur-[120px]" />
          <Image
            alt=""
            className="object-cover opacity-10 mix-blend-overlay"
            fill
            priority
            sizes="100vw"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDSs9rHsMIgNOJYEL7dN96HYxEIoxBbHqI19PNGYExGMEHjH6B7YfTqemqSQx8JrvLYcZG_NIhdbt5XAZpWq7IqNGl4rHPmpGUfyqe5s-UHhMofsTQSy0TCLon6mEtgqzqoLs7ap01loh-_-0BnFMcqJ9LGea2hkUSKlLpaBXwuUeQ_pTslhMO9jRCkaJlcsHdqN3kJ80uYOw9batLqRB7qa8hnAduSegzC5DtsC9hx6TddrIs8jp40pCdgVNKT5bPOYHGB3CexRgc"
          />
        </div>

        <section className="relative z-10 w-full max-w-md px-6">
          <div className="mb-10 text-center">
            <h1 className="mb-2 text-4xl font-black tracking-tighter text-[#d2bbff]">HYPERTUBE</h1>
            <p className="font-medium tracking-tight text-[#ccc3d8]">The Cinematic Void</p>
          </div>

          <div className="rounded-xl border border-white/5 bg-[#1c1b1b]/60 p-8 shadow-[0_40px_60px_-10px_rgba(0,0,0,0.6)] backdrop-blur-2xl">
            <header className="mb-8">
              <h2 className="mb-2 text-2xl font-bold tracking-tight text-[#e5e2e1]">Restore Access</h2>
              <p className="text-sm leading-relaxed text-[#ccc3d8]">
                Enter the email address associated with your account and we&apos;ll send you a recovery link.
              </p>
            </header>

            <form className="space-y-6" method="post" noValidate onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-2">
                <label
                  className="block text-xs font-bold uppercase tracking-widest text-[#ccc3d8]"
                  htmlFor="forgot-email"
                >
                  Email Address
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#ccc3d8] transition-colors group-focus-within:text-[#d2bbff]">
                    <span className="material-symbols-outlined text-xl">mail</span>
                  </div>
                  <input
                    id="forgot-email"
                    className="ht-dark-input block w-full rounded-lg border-0 bg-[#0e0e0e] py-4 pl-11 pr-4 font-medium text-[#e5e2e1] placeholder:text-[#ccc3d8]/40 focus:ring-2 focus:ring-[#7c3aed]/50"
                    placeholder="name@example.com"
                    type="email"
                    autoComplete="email"
                    {...register("email")}
                  />
                </div>
                {errors.email ? <p className="text-xs text-[#ffb4ab]">{errors.email.message}</p> : null}
              </div>

              {status ? (
                <p className="text-sm text-[#ccc3d8]" role="status">
                  {status}
                </p>
              ) : null}

              <button
                className="w-full rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] py-4 text-sm font-bold text-white shadow-lg shadow-[#7c3aed]/20 transition-all duration-300 hover:shadow-[#7c3aed]/40 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={submitting}
                type="submit"
              >
                {submitting ? "Sending…" : "Send Recovery Link"}
              </button>
            </form>

            <div className="mt-8 flex flex-col items-center gap-4 border-t border-white/5 pt-8">
              <Link
                href="/login"
                className="group flex items-center gap-2 text-sm font-medium text-[#ccc3d8] transition-colors hover:text-[#d2bbff]"
              >
                <span className="material-symbols-outlined text-lg transition-transform group-hover:-translate-x-1">
                  arrow_back
                </span>
                Back to Login
              </Link>
            </div>
          </div>

          <div className="mt-12 flex justify-center gap-6">
            <a
              className="text-xs font-medium text-gray-600 transition-colors hover:text-[#e5e2e1]"
              href="#"
            >
              Privacy Policy
            </a>
            <a
              className="text-xs font-medium text-gray-600 transition-colors hover:text-[#e5e2e1]"
              href="#"
            >
              Terms of Service
            </a>
            <a className="text-xs font-medium text-gray-600 transition-colors hover:text-[#e5e2e1]" href="#">
              Help
            </a>
          </div>
        </section>

        <footer className="absolute bottom-8 left-0 z-10 flex w-full items-center justify-between px-8">
          <p className="text-xs font-medium text-gray-600">© 2026 Hypertube. All rights reserved.</p>
          <div className="flex gap-4">
            <span
              className="material-symbols-outlined cursor-pointer text-gray-600 transition-colors hover:text-[#d2bbff]"
              aria-hidden
            >
              share
            </span>
            <span
              className="material-symbols-outlined cursor-pointer text-gray-600 transition-colors hover:text-[#d2bbff]"
              aria-hidden
            >
              language
            </span>
          </div>
        </footer>
      </main>
    </div>
  );
}

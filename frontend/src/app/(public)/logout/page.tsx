"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";

export default function LogoutPage() {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth();
  const [status, setStatus] = useState<"signing-out" | "done" | "error">("signing-out");
  const hasRunRef = useRef(false);

  useEffect(() => {
    if (hasRunRef.current) {
      return;
    }
    hasRunRef.current = true;

    const run = async () => {
      try {
        if (isAuthenticated) {
          await logout();
        }
        setStatus("done");
        router.replace("/login");
      } catch {
        setStatus("error");
      }
    };

    void run();
  }, [isAuthenticated, logout, router]);

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] selection:bg-[#7c3aed]/40 selection:text-[#ede0ff]">
      <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-[#131313]/60 px-8 shadow-[0_40px_60px_-10px_rgba(0,0,0,0.4)] backdrop-blur-xl">
        <Link href="/" className="text-2xl font-black tracking-tighter text-[#d2bbff]">
          HYPERTUBE
        </Link>
        <Link href="/login" className="text-sm font-semibold text-[#d2bbff] transition-colors hover:text-[#ede0ff]">
          Back to Login
        </Link>
      </nav>

      <main className="flex min-h-screen items-center justify-center px-6 pt-20">
        <div className="w-full max-w-md rounded-2xl bg-[#1c1b1b] p-8 ring-1 ring-white/5">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-[#d2bbff]">Session</p>
          <h1 className="mb-3 text-3xl font-extrabold tracking-tight text-white">Leaving the Void</h1>

          {status === "signing-out" ? (
            <div className="mt-6 flex items-center gap-3 text-sm text-[#ccc3d8]">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#d2bbff]/30 border-t-[#d2bbff]" />
              Signing you out...
            </div>
          ) : null}

          {status === "done" ? (
            <p className="mt-6 text-sm text-[#ccc3d8]">Signed out. Redirecting to login...</p>
          ) : null}

          {status === "error" ? (
            <div className="mt-6 space-y-4">
              <p className="text-sm text-[#ffb4ab]">Could not complete logout automatically.</p>
              <Link
                href="/login"
                className="inline-flex rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#5a00c6] px-4 py-2 text-sm font-semibold text-white"
              >
                Go to Login
              </Link>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

export function Navbar() {
  const pathname = usePathname();
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();

  if (pathname === "/") {
    return null;
  }

  const hiddenOn = ["/login", "/register", "/forgot-password", "/reset-password", "/logout", "/settings", "/library"];
  const shouldHide = hiddenOn.some((path) => pathname.startsWith(path));

  if (shouldHide) {
    return null;
  }

  return (
    <header className="border-b border-white/5 bg-[#131313]/90 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-4 py-3">
        <Link
          href={isAuthenticated && user ? `/profile/${user.username}` : "/"}
          className="text-lg font-black tracking-tighter text-[#d2bbff]"
        >
          {t("appName")}
        </Link>
        {isAuthenticated && user ? (
          <div className="flex items-center gap-4 text-sm">
            <Link href={`/profile/${user.username}`} className="text-[#ccc3d8] transition-colors hover:text-white">
              @{user.username}
            </Link>
            <Link href="/settings/profile" className="text-[#ccc3d8] transition-colors hover:text-white">
              Settings
            </Link>
            <Link
              href="/logout"
              className="rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-3 py-1.5 text-sm font-semibold text-white"
            >
              {t("logout")}
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-gray-400 transition-colors hover:text-white">
              Login
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-4 py-1.5 font-semibold text-[#ede0ff] transition-opacity hover:opacity-90"
            >
              Register
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

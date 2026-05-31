"use client";

import Link from "next/link";
import { NavUserToolbar } from "@/components/NavUserToolbar";
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

  const hiddenOn = ["/login", "/register", "/forgot-password", "/reset-password", "/logout", "/settings", "/library", "/watch"];
  const shouldHide = hiddenOn.some((path) => pathname.startsWith(path));

  if (shouldHide) {
    return null;
  }

  return (
    <header className="border-b border-white/5 bg-[#131313]/90 backdrop-blur-md">
      <div className="flex w-full items-center justify-between gap-4 px-8 py-3">
        <Link href="/" className="min-w-0 shrink-0 text-lg font-black tracking-tighter text-[#d2bbff]">
          {t("appName")}
        </Link>
        {isAuthenticated && user ? (
          <div className="flex shrink-0 items-center">
            <NavUserToolbar
              username={user.username}
              avatarUrl={user.avatarUrl}
              logoutLabel={t("logout")}
              settingsAriaLabel={t("settings")}
            />
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-4 text-sm">
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

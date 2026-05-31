import Link from "next/link";
import type { ReactNode } from "react";

/** Shared “Logout” pill: purple fill, white bold label, rounded — used across nav bars. */
export const logoutNavLinkClassName =
  "inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 active:scale-[0.98]";

type LogoutNavLinkProps = {
  children: ReactNode;
  className?: string;
};

export function LogoutNavLink({ children, className = "" }: LogoutNavLinkProps) {
  return (
    <Link href="/logout" className={[logoutNavLinkClassName, className].filter(Boolean).join(" ")}>
      {children}
    </Link>
  );
}

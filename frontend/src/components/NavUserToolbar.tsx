import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { LogoutNavLink } from "@/components/LogoutNavLink";
import { resolveAvatarSrc } from "@/lib/avatar";

export type NavUserToolbarProps = {
  username: string;
  avatarUrl?: string | null;
  logoutLabel?: ReactNode;
  settingsHref?: string;
  profileHref?: string;
  settingsAriaLabel?: string;
  className?: string;
  logoutClassName?: string;
};

/** Header cluster: gear → divider → username → avatar → logout (dark theme). */
export function NavUserToolbar({
  username,
  avatarUrl,
  logoutLabel = "Logout",
  settingsHref = "/settings/profile",
  profileHref,
  settingsAriaLabel = "Settings",
  className = "",
  logoutClassName = "",
}: NavUserToolbarProps) {
  const profile = profileHref ?? `/profile/${encodeURIComponent(username)}`;
  const resolvedSrc = resolveAvatarSrc(avatarUrl);
  const avatarUnoptimized = /^data:|^blob:/i.test(resolvedSrc);

  return (
    <div className={`flex shrink-0 items-center gap-2 sm:gap-3 ${className}`.trim()}>
      <Link
        href={settingsHref}
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 active:scale-95"
        aria-label={settingsAriaLabel}
        title={settingsAriaLabel}
      >
        <span className="material-symbols-outlined text-[22px] leading-none text-white" aria-hidden>
          settings
        </span>
      </Link>
      <div className="h-7 w-px shrink-0 bg-neutral-600" aria-hidden />
      <Link
        href={profile}
        className="min-w-0 max-w-[9rem] shrink truncate text-sm font-bold text-white transition-colors hover:text-[#ede0ff] sm:max-w-[12rem] md:max-w-[14rem]"
      >
        {username}
      </Link>
      <Link
        href={profile}
        className="relative shrink-0 overflow-hidden rounded-xl bg-[#ede8f7] ring-2 ring-[#c4b5fd]/50 transition-opacity hover:opacity-95 active:scale-[0.98]"
        aria-label={username}
      >
        <Image
          src={resolvedSrc}
          alt=""
          width={40}
          height={40}
          className="h-10 w-10 object-cover"
          unoptimized={avatarUnoptimized}
          sizes="40px"
        />
      </Link>
      <LogoutNavLink className={["ml-0.5 shrink-0", logoutClassName].filter(Boolean).join(" ")}>{logoutLabel}</LogoutNavLink>
    </div>
  );
}

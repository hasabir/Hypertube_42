import type { User } from "@/types/user";

/** Canonical default profile image (PNG in `/public`). */
export const DEFAULT_AVATAR_URL = "/default-avatar.png";

/**
 * Profiles stored legacy stock URLs (removed from the UI) — treat as default illustration.
 */
function shouldUseDefaultPlaceholder(avatarUrl: string): boolean {
  const u = avatarUrl.trim();
  if (!u) return true;
  if (/^https?:\/\/i\.pravatar\.cc\//i.test(u)) return true;
  return false;
}

export function resolveAvatarSrc(avatarUrl: string | undefined | null): string {
  const u = avatarUrl?.trim() ?? "";
  if (shouldUseDefaultPlaceholder(u)) return DEFAULT_AVATAR_URL;
  return u;
}

export function isDefaultAvatarRef(avatarUrl: string | undefined | null): boolean {
  const u = avatarUrl?.trim() ?? "";
  return shouldUseDefaultPlaceholder(u) || u === DEFAULT_AVATAR_URL;
}

/** Returns a new user with legacy avatars rewritten to default; callers may persist if changed. */
export function normalizeUserAvatar(user: User): User {
  const nextUrl = resolveAvatarSrc(user.avatarUrl);
  if (nextUrl === user.avatarUrl.trim()) return user;
  return { ...user, avatarUrl: nextUrl };
}

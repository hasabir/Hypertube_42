"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { ProtectedPage } from "@/components/ProtectedPage";
import type { PublicUser } from "@/types/user";
import { resolveAvatarSrc } from "@/lib/avatar";

export default function PublicProfilePage() {
  const params = useParams<{ username: string }>();
  const [user, setUser] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      setLoading(true);
      const foundUser = await api.getUserByUsername(params.username);
      setUser(foundUser);
      setLoading(false);
    };
    void loadUser();
  }, [params.username]);

  return (
    <ProtectedPage>
      <section className="mx-auto w-full max-w-2xl rounded border border-black/10 bg-white p-6">
        {loading ? <p>Loading profile...</p> : null}
        {!loading && !user ? <p>User not found.</p> : null}
        {user ? (
          <>
            <h1 className="text-2xl font-semibold">@{user.username}</h1>
            <Image
              src={resolveAvatarSrc(user.avatarUrl)}
              alt={`${user.username} avatar`}
              width={96}
              height={96}
              className="mt-4 h-24 w-24 rounded-full object-cover"
              unoptimized
            />
            <p className="mt-4">
              {user.firstName} {user.lastName}
            </p>
            <p className="text-gray-700">{user.bio || "No bio yet."}</p>
            <p className="mt-3 text-sm text-gray-500">
              Email is intentionally private and never shown on public profiles.
            </p>
          </>
        ) : null}
      </section>
    </ProtectedPage>
  );
}

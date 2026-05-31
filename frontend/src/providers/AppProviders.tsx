"use client";

import { AuthProvider } from "@/providers/AuthProvider";
import { LanguageProvider } from "@/providers/LanguageProvider";
import { Navbar } from "@/components/Navbar";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <AuthProvider>
        <Navbar />
        <main className="flex w-full min-h-0 flex-1 flex-col">{children}</main>
      </AuthProvider>
    </LanguageProvider>
  );
}

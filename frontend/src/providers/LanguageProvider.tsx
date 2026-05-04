"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { UserLanguage } from "@/types/user";

const LANGUAGE_KEY = "hypertube.language";

const messages = {
  en: {
    appName: "Hypertube",
    logout: "Logout",
  },
  fr: {
    appName: "Hypertube",
    logout: "Se deconnecter",
  },
} as const;

interface LanguageContextType {
  language: UserLanguage;
  setLanguage: (language: UserLanguage) => void;
  t: (key: keyof (typeof messages)["en"]) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<UserLanguage>(() => {
    if (typeof window === "undefined") {
      return "en";
    }
    const savedLanguage = localStorage.getItem(LANGUAGE_KEY);
    return savedLanguage === "fr" ? "fr" : "en";
  });

  const setLanguage = (nextLanguage: UserLanguage) => {
    setLanguageState(nextLanguage);
    localStorage.setItem(LANGUAGE_KEY, nextLanguage);
  };

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key: keyof (typeof messages)["en"]) => messages[language][key],
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
};

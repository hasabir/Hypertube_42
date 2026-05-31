export type UserLanguage = "en" | "fr";

export interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  avatarUrl: string;
  bio?: string;
  language: UserLanguage;
}

export type PublicUser = Omit<User, "email">;

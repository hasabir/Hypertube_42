import axios, { type AxiosError } from "axios";
import type { AuthResponse, LoginPayload, RegisterPayload } from "@/types/auth";
import type { PublicUser, User } from "@/types/user";
import { DEFAULT_AVATAR_URL, isDefaultAvatarRef, normalizeUserAvatar } from "@/lib/avatar";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const client = axios.create({
  baseURL: API_URL,
});

/** True when `NEXT_PUBLIC_API_URL` is set (browser or SSR build-time). */
export const isApiConfigured = Boolean(API_URL);

export const apiClient = client;

const STORAGE_KEYS = {
  token: "hypertube.token",
  refresh: "hypertube.refresh",
  user: "hypertube.user",
  users: "hypertube.users",
};

/** Embedded images must be sent as multipart file; Django ImageField cannot parse base64 inside application/json. */
function isEmbeddedImageAvatarUrl(url: string): boolean {
  return url.startsWith("data:image/") || url.startsWith("blob:");
}

function guessImageExtension(mime: string): string {
  if (mime.includes("jpeg")) return "jpg";
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

const hasApi = isApiConfigured;

interface BackendUser {
  id: string | number;
  email: string;
  username: string;
  first_name?: string;
  last_name?: string;
  profile_picture?: string | null;
  preferred_language?: "en" | "fr";
}

interface BackendTokenPair {
  access: string;
  refresh: string;
}

interface BackendRegisterResponse {
  user: BackendUser;
  tokens: BackendTokenPair;
}

const readAccessToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEYS.token);

const readRefreshToken = (): string | null =>
  typeof window === "undefined" ? null : localStorage.getItem(STORAGE_KEYS.refresh);

const clearSessionStorage = () => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.removeItem(STORAGE_KEYS.token);
  localStorage.removeItem(STORAGE_KEYS.refresh);
  localStorage.removeItem(STORAGE_KEYS.user);
};

const persistTokens = (tokens: BackendTokenPair) => {
  if (typeof window === "undefined") {
    return;
  }
  localStorage.setItem(STORAGE_KEYS.token, tokens.access);
  localStorage.setItem(STORAGE_KEYS.refresh, tokens.refresh);
};

const mapBackendUser = (user: BackendUser): User =>
  normalizeUserAvatar({
    id: String(user.id),
    email: user.email,
    username: user.username,
    firstName: user.first_name ?? "",
    lastName: user.last_name ?? "",
    avatarUrl: user.profile_picture ?? DEFAULT_AVATAR_URL,
    language: user.preferred_language ?? "en",
    bio: "",
  });

client.interceptors.request.use((config) => {
  const token = readAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as typeof error.config & { _retry?: boolean };
    const status = error.response?.status;
    const reqUrl = originalRequest?.url ?? "";

    if (status !== 401 || originalRequest?._retry || !API_URL) {
      return Promise.reject(error);
    }

    if (
      reqUrl.includes("/token/refresh/") ||
      reqUrl.includes("/login/") ||
      reqUrl.includes("/register/")
    ) {
      return Promise.reject(error);
    }

    const refresh = readRefreshToken();
    if (!refresh) {
      clearSessionStorage();
      return Promise.reject(error);
    }

    originalRequest._retry = true;
    try {
      const { data } = await axios.post<BackendTokenPair>(`${API_URL}/api/users/token/refresh/`, {
        refresh,
      });
      persistTokens(data);
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
      }
      return client(originalRequest);
    } catch {
      clearSessionStorage();
      return Promise.reject(error);
    }
  },
);

export function saveAuthTokens(tokens: BackendTokenPair): void {
  persistTokens(tokens);
}

export type OAuthProviderId = "42" | "google" | "github";

export async function getOAuthAuthUrl(provider: OAuthProviderId): Promise<string> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }
  const { data } = await axios.get<{ auth_url: string }>(
    `${API_URL}/api/users/auth/${provider}/`,
  );
  if (!data.auth_url) {
    throw new Error("OAuth provider did not return an authorization URL.");
  }
  return data.auth_url;
}

/** Fetches the provider authorization URL from the API, then navigates the browser to it. */
export async function startOAuthRedirect(provider: OAuthProviderId): Promise<void> {
  const url = await getOAuthAuthUrl(provider);
  window.location.href = url;
}

/** Call the backend OAuth callback with the `code` from the IdP redirect; persists JWT pair. */
export async function exchangeOAuthCode(provider: string, code: string): Promise<void> {
  if (!API_URL) {
    throw new Error("NEXT_PUBLIC_API_URL is not set.");
  }
  const { data } = await axios.get<BackendTokenPair>(
    `${API_URL}/api/users/auth/${encodeURIComponent(provider)}/callback/`,
    { params: { code } },
  );
  persistTokens(data);
}

export interface BackendMovieRow {
  id: number;
  title: string;
  year: number | null;
  imdb_rating: number | null;
  genre: string;
  director?: string;
  cast?: string;
  summary?: string;
  cover_image: string;
  runtime?: string;
  torrent_url?: string;
  source: string;
  view_count: number;
  is_watched?: boolean;
  is_favorited?: boolean;
}

type PaginatedMoviesList = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendMovieRow[];
};

/** Resolve a movie by numeric id by scanning paginated list results (no detail route on backend). */
export async function fetchMovieByIdFromApi(id: string): Promise<BackendMovieRow | null> {
  if (!hasApi || !/^\d+$/.test(id)) {
    return null;
  }
  const limit = 80;
  let offset = 0;
  for (let i = 0; i < 50; i++) {
    const { data } = await client.get<PaginatedMoviesList>("/api/movies/", {
      params: { limit, offset },
    });
    const hit = data.results.find((m) => String(m.id) === id);
    if (hit) {
      return hit;
    }
    if (!data.next || data.results.length === 0) {
      break;
    }
    offset += limit;
  }
  return null;
}

export async function validatePasswordResetLink(uidb64: string, token: string): Promise<boolean> {
  if (!API_URL) {
    return false;
  }
  try {
    await axios.get(`${API_URL}/api/users/password-reset/${uidb64}/${token}/`);
    return true;
  } catch {
    return false;
  }
}

const createMockUser = (payload: RegisterPayload): User => ({
  id: crypto.randomUUID(),
  email: payload.email,
  username: payload.username,
  firstName: payload.firstName,
  lastName: payload.lastName,
  avatarUrl: DEFAULT_AVATAR_URL,
  language: "en",
  bio: "",
});

const readUsers = (): User[] => {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = localStorage.getItem(STORAGE_KEYS.users);
  return raw ? (JSON.parse(raw) as User[]) : [];
};

const writeUsers = (users: User[]) => {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
};

/**
 * Update roster row when avatar was normalized away; refresh session blob only when it belongs to same user.
 */
function persistNormalizedUser(prev: User, next: User): void {
  if (prev.avatarUrl.trim() === next.avatarUrl.trim()) {
    return;
  }
  const roster = readUsers().map((u) => (u.id === next.id ? next : u));
  writeUsers(roster);
  const sessionRaw =
    typeof window !== "undefined" ? localStorage.getItem(STORAGE_KEYS.user) : null;
  if (sessionRaw) {
    try {
      const session = JSON.parse(sessionRaw) as User;
      if (session.id === next.id) {
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(next));
      }
    } catch {
      /* ignore */
    }
  }
}

export const api = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    if (hasApi) {
      const response = await client.post<BackendRegisterResponse>("/api/users/register/", {
        email: payload.email,
        username: payload.username,
        first_name: payload.firstName,
        last_name: payload.lastName,
        password: payload.password,
      });
      persistTokens(response.data.tokens);
      const user = mapBackendUser(response.data.user);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      return { token: response.data.tokens.access, user };
    }

    const users = readUsers();
    if (users.some((user) => user.email === payload.email || user.username === payload.username)) {
      throw new Error("User with this email or username already exists.");
    }
    const user = createMockUser(payload);
    const token = crypto.randomUUID();
    writeUsers([...users, user]);
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
    return { token, user };
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    if (hasApi) {
      const response = await client.post<BackendTokenPair>("/api/users/login/", {
        username: payload.usernameOrEmail,
        password: payload.password,
      });
      persistTokens(response.data);
      const user = await this.getMe();
      if (!user) {
        throw new Error("Authenticated, but failed to load profile.");
      }
      return { token: response.data.access, user };
    }

    const users = readUsers();
    const user = users.find(
      (entry) => entry.username === payload.usernameOrEmail || entry.email === payload.usernameOrEmail,
    );
    if (!user) {
      throw new Error("Invalid credentials.");
    }
    const token = crypto.randomUUID();
    const normalized = normalizeUserAvatar(user);
    persistNormalizedUser(user, normalized);
    localStorage.setItem(STORAGE_KEYS.token, token);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(normalized));
    return { token, user: normalized };
  },

  async getMe(): Promise<User | null> {
    if (hasApi) {
      const token = readAccessToken();
      if (!token) {
        return null;
      }
      const response = await client.get<BackendUser>("/api/users/me/");
      const user = mapBackendUser(response.data);
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(user));
      return user;
    }

    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as User;
    const normalized = normalizeUserAvatar(parsed);
    persistNormalizedUser(parsed, normalized);
    return normalized;
  },

  async logout(): Promise<void> {
    if (hasApi) {
      const refresh = readRefreshToken();
      if (refresh) {
        await client.post("/api/users/logout/", { refresh });
      }
      clearSessionStorage();
      return;
    }
    clearSessionStorage();
  },

  async forgotPassword(email: string): Promise<void> {
    if (hasApi) {
      await client.post("/api/users/request-password-reset/", { email });
      return;
    }
  },

  async resetPassword(password: string, token: string, uid?: string): Promise<void> {
    if (hasApi) {
      if (!uid) {
        throw new Error("Reset password requires uid and token.");
      }
      await client.post(`/api/users/password-reset/${uid}/${token}/`, { new_password: password });
      return;
    }
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (hasApi) {
      await client.patch("/api/users/change-password/", {
        old_password: currentPassword,
        new_password: newPassword,
      });
      return;
    }
    void currentPassword;
    void newPassword;
    throw new Error("Password change requires a connected API (set NEXT_PUBLIC_API_URL).");
  },

  async getUserByUsername(username: string): Promise<PublicUser | null> {
    if (hasApi) {
      const response = await client.get<BackendUser>(`/api/users/profile/${username}/`);
      const normalized = mapBackendUser(response.data);
      return {
        id: normalized.id,
        username: normalized.username,
        firstName: normalized.firstName,
        lastName: normalized.lastName,
        avatarUrl: normalized.avatarUrl,
        bio: normalized.bio,
        language: normalized.language,
      };
    }

    const user = readUsers().find((entry) => entry.username === username);
    if (!user) {
      return null;
    }
    const normalized = normalizeUserAvatar(user);
    persistNormalizedUser(user, normalized);
    const publicUser: PublicUser = {
      id: normalized.id,
      username: normalized.username,
      firstName: normalized.firstName,
      lastName: normalized.lastName,
      avatarUrl: normalized.avatarUrl,
      bio: normalized.bio,
      language: normalized.language,
    };
    return publicUser;
  },

  async updateMe(payload: Partial<User>): Promise<User> {
    if (hasApi) {
      const avatarRaw = payload.avatarUrl?.trim();
      const hasAvatarField = payload.avatarUrl !== undefined;

      if (hasAvatarField && avatarRaw && isEmbeddedImageAvatarUrl(avatarRaw)) {
        const form = new FormData();
        if (payload.email !== undefined) form.append("email", payload.email);
        if (payload.username !== undefined) form.append("username", payload.username);
        if (payload.firstName !== undefined) form.append("first_name", payload.firstName);
        if (payload.lastName !== undefined) form.append("last_name", payload.lastName);
        if (payload.language !== undefined) form.append("preferred_language", payload.language);

        const blob = await fetch(avatarRaw).then((r) => r.blob());
        const ext = guessImageExtension(blob.type || "image/jpeg");
        form.append("profile_picture", blob, `avatar.${ext}`);

        const response = await client.patch<BackendUser>("/api/users/me/", form);
        let updated = mapBackendUser(response.data);
        if (payload.bio !== undefined) {
          updated = { ...updated, bio: payload.bio };
        }
        localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updated));
        return updated;
      }

      const body: Record<string, string | null> = {};
      if (payload.email !== undefined) body.email = payload.email;
      if (payload.username !== undefined) body.username = payload.username;
      if (payload.firstName !== undefined) body.first_name = payload.firstName;
      if (payload.lastName !== undefined) body.last_name = payload.lastName;
      if (payload.language !== undefined) body.preferred_language = payload.language;
      if (hasAvatarField) {
        if (!avatarRaw || isDefaultAvatarRef(avatarRaw)) {
          body.profile_picture = null;
        } else {
          body.profile_picture = avatarRaw;
        }
      }

      const response = await client.patch<BackendUser>("/api/users/me/", body);
      let updated = mapBackendUser(response.data);
      if (payload.bio !== undefined) {
        updated = { ...updated, bio: payload.bio };
      }
      localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updated));
      return updated;
    }

    const raw = localStorage.getItem(STORAGE_KEYS.user);
    if (!raw) {
      throw new Error("Not authenticated.");
    }
    const currentUser = JSON.parse(raw) as User;
    const updatedUser = { ...currentUser, ...payload };
    const users = readUsers().map((user) => (user.id === updatedUser.id ? updatedUser : user));
    writeUsers(users);
    localStorage.setItem(STORAGE_KEYS.user, JSON.stringify(updatedUser));
    return updatedUser;
  },
};

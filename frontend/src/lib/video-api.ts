import { apiClient, isApiConfigured, type BackendMovieRow, fetchMovieByIdFromApi } from "@/lib/api";
import type { UserLanguage } from "@/types/user";
import { normalizeMoviePosterUrl } from "@/lib/poster-url";
import { LIBRARY_MOVIES } from "@/lib/library-movies";

type StreamSession = {
  movieId: string;
  startedAt: string;
  lastWatchedAt: string;
  speedFactor: number;
};

type StoredComment = {
  id: string;
  movieId: string;
  author: string;
  body: string;
  createdAt: string;
};

export type VideoComment = StoredComment;

export type VideoSubtitle = {
  id: string;
  label: string;
  language: UserLanguage;
  src: string;
  autoSuggested: boolean;
};

export type VideoDetails = {
  id: string;
  title: string;
  year: number;
  durationMin: number;
  imdbRating: number;
  genre: string;
  source: "archive.org" | "legittorrents.info";
  coverImage: string;
  summary: string;
  producer: string;
  director: string;
  cast: string[];
  spokenLanguage: UserLanguage;
  container: "mp4" | "mkv";
  browserReadable: boolean;
  streamUrl: string;
  torrentMagnet: string;
  seeders: number;
  peers: number;
  downloads: number;
  subtitles: VideoSubtitle[];
};

export type VideoStreamState = {
  readyToStream: boolean;
  torrentStarted: boolean;
  bufferingPercent: number;
  downloadPercent: number;
  transcodingPercent: number;
  browserReady: boolean;
  fullyDownloaded: boolean;
  cachedOnServer: boolean;
  purgeEligibleInDays: number | null;
};

const STREAM_SESSION_KEY = "hypertube.video.stream-sessions";
const COMMENTS_KEY = "hypertube.video.comments";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function safeRead<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  const raw = localStorage.getItem(key);
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function safeWrite<T>(key: string, data: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(data));
}

function readSessions(): StreamSession[] {
  return safeRead<StreamSession[]>(STREAM_SESSION_KEY, []);
}

function writeSessions(next: StreamSession[]): void {
  safeWrite(STREAM_SESSION_KEY, next);
}

function getOrCreateSession(movieId: string): StreamSession {
  const sessions = readSessions();
  const existing = sessions.find((s) => s.movieId === movieId);
  if (existing) return existing;

  const now = new Date().toISOString();
  const created: StreamSession = {
    movieId,
    startedAt: now,
    lastWatchedAt: now,
    speedFactor: 0.8 + Math.random() * 0.5,
  };
  writeSessions([...sessions, created]);
  return created;
}

function updateSession(movieId: string, updater: (prev: StreamSession) => StreamSession): void {
  const sessions = readSessions();
  const idx = sessions.findIndex((s) => s.movieId === movieId);
  if (idx === -1) return;
  const next = [...sessions];
  next[idx] = updater(next[idx]);
  writeSessions(next);
}

function readComments(): StoredComment[] {
  return safeRead<StoredComment[]>(COMMENTS_KEY, []);
}

function writeComments(next: StoredComment[]): void {
  safeWrite(COMMENTS_KEY, next);
}

function getSpokenLanguage(movieId: string): UserLanguage {
  const checksum = movieId.split("").reduce((sum, c) => sum + c.charCodeAt(0), 0);
  return checksum % 3 === 0 ? "fr" : "en";
}

function parseRuntimeMinutes(runtime: string | undefined): number {
  if (!runtime?.trim()) {
    return 90;
  }
  const match = runtime.match(/(\d+)/);
  return match ? Math.min(600, Math.max(1, parseInt(match[1], 10))) : 90;
}

function mapBackendMovieToVideoDetails(
  movie: BackendMovieRow,
  preferredLanguage: UserLanguage,
): VideoDetails {
  const spokenLanguage = getSpokenLanguage(String(movie.id));
  const sourceLower = (movie.source || "").toLowerCase();
  const sourceLabel: "archive.org" | "legittorrents.info" = sourceLower.includes("archive")
    ? "archive.org"
    : "legittorrents.info";
  const container: "mp4" | "mkv" = sourceLabel === "legittorrents.info" ? "mkv" : "mp4";
  const browserReadable = container === "mp4";
  const cast = (movie.cast || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  const backendBase = process.env.NEXT_PUBLIC_API_URL ?? "";
  const subtitles: VideoSubtitle[] = [
    {
      id: "en",
      label: "English",
      language: "en",
      src: `${backendBase}/api/stream/${movie.id}/subtitles/en/`,
      autoSuggested: spokenLanguage !== "en",
    },
    {
      id: "fr",
      label: "Francais",
      language: "fr",
      src: `${backendBase}/api/stream/${movie.id}/subtitles/fr/`,
      autoSuggested: spokenLanguage !== "fr",
    },
  ];

  if (spokenLanguage === preferredLanguage) {
    subtitles[0].autoSuggested = false;
    subtitles[1].autoSuggested = false;
  }

  return {
    id: String(movie.id),
    title: movie.title,
    year: movie.year ?? 0,
    durationMin: parseRuntimeMinutes(movie.runtime),
    imdbRating: movie.imdb_rating ?? 0,
    genre: movie.genre || "—",
    source: sourceLabel,
    coverImage: normalizeMoviePosterUrl(movie.cover_image),
    summary: movie.summary?.trim() || "—",
    producer: movie.director?.trim() || "—",
    director: movie.director?.trim() || "—",
    cast: cast.length ? cast : ["—"],
    spokenLanguage,
    container,
    browserReadable,
    streamUrl: `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/stream/${movie.id}/`,
    torrentMagnet:
      movie.torrent_url?.trim() ||
      `magnet:?xt=urn:btih:${String(movie.id)}&dn=${encodeURIComponent(movie.title)}`,
    seeders: movie.view_count ?? 0,
    peers: 0,
    downloads: movie.view_count ?? 0,
    subtitles,
  };
}

export async function getVideoDetails(movieId: string, preferredLanguage: UserLanguage): Promise<VideoDetails | null> {
  if (isApiConfigured && /^\d+$/.test(movieId)) {
    const raw = await fetchMovieByIdFromApi(movieId);
    if (raw) {
      return mapBackendMovieToVideoDetails(raw, preferredLanguage);
    }
    return null;
  }

  await sleep(280);
  const movie = LIBRARY_MOVIES.find((m) => m.id === movieId);
  if (!movie) return null;

  const spokenLanguage = getSpokenLanguage(movie.id);
  const container: "mp4" | "mkv" = movie.source === "legit" ? "mkv" : "mp4";
  const browserReadable = container === "mp4";
  const sourceLabel = movie.source === "archive" ? "archive.org" : "legittorrents.info";

  const subtitles: VideoSubtitle[] = [
    {
      id: "en",
      label: "English",
      language: "en",
      src: "/subtitles/en-sample.vtt",
      autoSuggested: spokenLanguage !== "en",
    },
    {
      id: "fr",
      label: "Francais",
      language: "fr",
      src: "/subtitles/fr-sample.vtt",
      autoSuggested: spokenLanguage !== "fr",
    },
  ];

  if (spokenLanguage === preferredLanguage) {
    subtitles[0].autoSuggested = false;
    subtitles[1].autoSuggested = false;
  }

  return {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    durationMin: 95 + (movie.id.length % 45),
    imdbRating: movie.imdbRating,
    genre: movie.genre,
    source: sourceLabel,
    coverImage: movie.image,
    summary:
      "A front-end simulation of the Hypertube watch flow: torrent startup, adaptive buffering, and background processing before seamless playback.",
    producer: "Nadir K. Halim",
    director: "Elias Moreau",
    cast: ["Ari Dane", "Nahla Voss", "K. Turner", "Mina Sol"],
    spokenLanguage,
    container,
    browserReadable,
    streamUrl: `/stream-mock/${movie.id}.mp4`,
    torrentMagnet: `magnet:?xt=urn:btih:${movie.id.replace(/-/g, "")}&dn=${encodeURIComponent(movie.title)}`,
    seeders: movie.seeders,
    peers: movie.peers,
    downloads: movie.downloads,
    subtitles,
  };
}

interface StreamStatusResponse {
  status: "complete" | "ready" | "downloading";
  percent: number;
  ready_to_stream?: boolean;
}

export async function getVideoStreamState(movieId: string, browserReadable: boolean): Promise<VideoStreamState> {
  if (isApiConfigured && /^\d+$/.test(movieId)) {
    try {
      const numericId = parseInt(movieId, 10);
      const { data } = await apiClient.get<StreamStatusResponse>(`/api/stream/${numericId}/status/`);
      const isReady = data.status === "complete" || (data.ready_to_stream ?? false);
      const percent = data.percent ?? 0;

      return {
        readyToStream: isReady,
        torrentStarted: true,
        bufferingPercent: isReady ? 100 : Math.min(100, percent),
        downloadPercent: percent,
        transcodingPercent: 100,
        browserReady: isReady,
        fullyDownloaded: data.status === "complete",
        cachedOnServer: data.status === "complete",
        purgeEligibleInDays: data.status === "complete" ? 30 : null,
      };
    } catch (error) {
      console.error("Failed to get stream status:", error);
      return {
        readyToStream: false,
        torrentStarted: false,
        bufferingPercent: 0,
        downloadPercent: 0,
        transcodingPercent: 0,
        browserReady: false,
        fullyDownloaded: false,
        cachedOnServer: false,
        purgeEligibleInDays: null,
      };
    }
  }

  await sleep(180);
  const session = getOrCreateSession(movieId);
  const elapsedMs = Date.now() - new Date(session.startedAt).getTime();
  const speed = Math.max(0.55, session.speedFactor);

  const bufferingPercent = Math.min(100, Math.floor((elapsedMs / (11000 / speed)) * 100));
  const downloadPercent = Math.min(100, Math.floor((elapsedMs / (65000 / speed)) * 100));
  const transcodingPercent = browserReadable ? 100 : Math.min(100, Math.floor((elapsedMs / 32000) * 100));
  const browserReady = browserReadable || transcodingPercent >= 28;
  const readyToStream = bufferingPercent >= 30 && browserReady;
  const fullyDownloaded = downloadPercent >= 100;

  const lastWatched = new Date(session.lastWatchedAt).getTime();
  const msSinceWatch = Date.now() - lastWatched;
  const daysSinceWatch = Math.floor(msSinceWatch / (1000 * 60 * 60 * 24));
  const purgeEligibleInDays = fullyDownloaded ? Math.max(0, 30 - daysSinceWatch) : null;

  return {
    readyToStream,
    torrentStarted: true,
    bufferingPercent,
    downloadPercent,
    transcodingPercent,
    browserReady,
    fullyDownloaded,
    cachedOnServer: fullyDownloaded,
    purgeEligibleInDays,
  };
}

export async function markVideoViewed(movieId: string): Promise<void> {
  if (isApiConfigured && /^\d+$/.test(movieId)) {
    try {
      const numericId = parseInt(movieId, 10);
      await apiClient.post(`/api/stream/${numericId}/viewed/`);
      return;
    } catch (error) {
      console.warn("Failed to mark video as viewed:", error);
    }
  }

  await sleep(80);
  updateSession(movieId, (prev) => ({ ...prev, lastWatchedAt: new Date().toISOString() }));
}

export async function listVideoComments(movieId: string): Promise<VideoComment[]> {
  if (isApiConfigured && /^\d+$/.test(movieId)) {
    try {
      const { data } = await apiClient.get(`/api/movies/${movieId}/comments/`);
      return data.results || [];
    } catch (error) {
      console.warn("Failed to load comments from API:", error);
    }
  }

  await sleep(100);
  return readComments()
    .filter((comment) => comment.movieId === movieId)
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

export async function addVideoComment(movieId: string, author: string, body: string): Promise<VideoComment> {
  const trimmed = body.trim();
  if (!trimmed) {
    throw new Error("Comment cannot be empty.");
  }

  if (isApiConfigured && /^\d+$/.test(movieId)) {
    try {
      const { data } = await apiClient.post(`/api/movies/${movieId}/comments/`, {
        username: author.trim(),
        body: trimmed,
      });
      return data;
    } catch (error) {
      console.warn("Failed to post comment to API:", error);
    }
  }

  await sleep(140);
  const item: StoredComment = {
    id: crypto.randomUUID(),
    movieId,
    author: author.trim() || "Anonymous",
    body: trimmed,
    createdAt: new Date().toISOString(),
  };
  const all = readComments();
  writeComments([item, ...all]);
  return item;
}

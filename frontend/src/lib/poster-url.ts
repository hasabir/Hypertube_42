/** OMDb returns `Poster: "N/A"` when missing; avoid using that as image `src`. */
export const POSTER_FALLBACK_SRC = "/window.svg";

const INVALID_TOKENS = new Set(["n/a", "null", "undefined", ""]);

function isInvalidPosterToken(t: string): boolean {
  const key = t.trim().toLowerCase();
  return INVALID_TOKENS.has(key);
}

function apiOrigin(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
}

/** Amazon / IMDB poster paths often contain `@` before `._V1_…`; some stacks mishandle the raw character in requests. */
function encodeAtInPosterPath(url: string): string {
  if (!/^https?:\/\//i.test(url) || !url.includes("@")) return url;
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return url;
  }
  const shouldFix =
    host === "m.media-amazon.com" ||
    host.endsWith(".media-amazon.com") ||
    host === "ia.media-imdb.com" ||
    host.endsWith(".imdb.com");
  if (!shouldFix) return url;
  try {
    const u = new URL(url);
    if (u.pathname.includes("@")) {
      u.pathname = u.pathname.replace(/@/g, "%40");
    }
    return u.href;
  } catch {
    return url;
  }
}

/** Upgrade legacy http poster URLs to https for known CDNs (avoids mixed-content blocks on https sites). */
function tryHttpsForKnownPosterHost(url: string): string {
  if (!url.toLowerCase().startsWith("http://")) return url;
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return url;
  }
  const httpsOk =
    host === "m.media-amazon.com" ||
    host === "ia.media-imdb.com" ||
    host.endsWith(".media-amazon.com") ||
    host.endsWith(".amazon.com") ||
    host.endsWith(".imdb.com") ||
    host.endsWith(".archive.org") ||
    host === "archive.org" ||
    host.endsWith(".googleusercontent.com");
  if (!httpsOk) return url;
  return `https://${url.slice("http://".length)}`;
}

/** True when the string should not be used as an image URL (before network load). */
export function isUnusablePosterUrl(url: string | null | undefined): boolean {
  const t = url?.trim() ?? "";
  if (!t || isInvalidPosterToken(t)) {
    return true;
  }
  if (/^\/n\/a$/i.test(t)) {
    return true;
  }
  return false;
}

/**
 * Returns a URL the browser can load: fixes protocol-relative URLs, joins Django
 * `/media` and `/static` paths to `NEXT_PUBLIC_API_URL`, upgrades http→https for common poster hosts,
 * and normalizes Amazon/IMDB path encoding.
 * Site-relative paths that are not API assets stay as-is (e.g. `/window.svg` from `public/`).
 */
export function normalizeMoviePosterUrl(url: string | null | undefined): string {
  let t = url?.trim() ?? "";
  if (isUnusablePosterUrl(t)) {
    return POSTER_FALLBACK_SRC;
  }

  if (t.startsWith("//")) {
    t = `https:${t}`;
  }

  t = tryHttpsForKnownPosterHost(t);

  if (t.startsWith("https://") || t.startsWith("http://")) {
    return encodeAtInPosterPath(t);
  }

  const base = apiOrigin();
  if (base && !t.startsWith("/") && /^(media|static)\//i.test(t)) {
    t = `/${t}`;
  }

  if (t.startsWith("/") && base && (t.startsWith("/media/") || t.startsWith("/static/"))) {
    return `${base}${t}`;
  }

  if (t.startsWith("/")) {
    return t;
  }

  return POSTER_FALLBACK_SRC;
}

/**
 * OMDb/API posters often end in `._V1_SX300.jpg`. That file is ~300 px wide; stretching it edge‑to‑edge on a hero looks soft/blocky.
 * Amazon CDN paths accept larger SX/SY hints. Note: `\bSX300\b` does NOT match `_SX300` because `_` counts as a “word” char in JS `\b`.
 */
export function upscalePosterUrlForHeroBanner(url: string): string {
  const out = url.trim();
  if (!out.includes("media-amazon.com")) return out;

  let next = out;
  /** Any explicit width hint SXnnn → at least poster-sized for retina heroes */
  next = next.replace(/SX(\d{3,4})(?=\.|_|,|\s|$|jpg)/gi, (_, pxStr) => {
    const px = Number.parseInt(pxStr, 10);
    return Number.isFinite(px) && px >= 1440 ? `SX${pxStr}` : "SX2048";
  });
  /** Height hints often paired with width on composite thumbnails */
  next = next.replace(/SY(\d{3,4})(?=\.|_|,|\s|$|jpg)/gi, (_, pxStr) => {
    const px = Number.parseInt(pxStr, 10);
    return Number.isFinite(px) && px >= 2160 ? `SY${pxStr}` : "SY2880";
  });
  /** e.g. _UX300_CR0,... */
  next = next.replace(/UX(\d{3,4})(?=\.|_|,|\s|$|jpg)/gi, (_, pxStr) => {
    const px = Number.parseInt(pxStr, 10);
    return Number.isFinite(px) && px >= 1600 ? `UX${pxStr}` : "UX1920";
  });
  return next;
}

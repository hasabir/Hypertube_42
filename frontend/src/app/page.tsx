"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { NavUserToolbar } from "@/components/NavUserToolbar";
import { getLibraryMovies } from "@/lib/library-api";
import type { LibraryMovie } from "@/lib/library-movies";
import { normalizeMoviePosterUrl, POSTER_FALLBACK_SRC, upscalePosterUrlForHeroBanner } from "@/lib/poster-url";
import { useAuth } from "@/providers/AuthProvider";
import { useLanguage } from "@/providers/LanguageProvider";

const HOME_PAGE_SIZE = 12;

function qualityAbbrev(q: LibraryMovie["quality"]): string {
  return q === "4K HDR" ? "4K" : "1080P";
}

function ratingLabel(score: number): string {
  if (!Number.isFinite(score) || score <= 0) return "—";
  return score.toFixed(1);
}

function HomeCatalogPoster({ movie }: { movie: LibraryMovie }) {
  const canonicalSrc = useMemo(() => normalizeMoviePosterUrl(movie.image), [movie.image]);
  const [brokenCanonical, setBrokenCanonical] = useState<string | null>(null);
  const src = brokenCanonical === canonicalSrc ? POSTER_FALLBACK_SRC : canonicalSrc;

  return (
    <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-xl bg-[#2a2a2a] transition-transform duration-500 group-hover:scale-[1.02]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={movie.imageAlt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="absolute inset-0 h-full w-full object-cover"
        onError={() => setBrokenCanonical(canonicalSrc)}
      />
      <div className="absolute right-3 top-3 flex items-center gap-1 rounded bg-black/60 px-2 py-1 text-[10px] font-bold text-[#d2bbff] backdrop-blur-md">
        <span className="material-symbols-outlined text-xs" style={{ fontVariationSettings: "'FILL' 1" }}>
          star
        </span>
        {ratingLabel(movie.imdbRating)}
      </div>
    </div>
  );
}

export default function Home() {
  const { isAuthenticated, user } = useAuth();
  const { t } = useLanguage();
  const [movies, setMovies] = useState<LibraryMovie[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [heroPosterFailed, setHeroPosterFailed] = useState(false);

  const featured = useMemo(() => (movies.length > 0 ? movies[0] : null), [movies]);

  useEffect(() => {
    let cancelled = false;
    const ac = new AbortController();

    const load = async () => {
      setCatalogLoading(true);
      setCatalogError(null);
      try {
        const { items } = await getLibraryMovies(
          {
            page: 1,
            pageSize: HOME_PAGE_SIZE,
            query: "",
            sortBy: "popularity",
            genreFilter: "all",
            sourceFilter: "all",
            watchedFilter: "all",
            minRating: 0,
          },
          { signal: ac.signal },
        );
        if (!cancelled) {
          setMovies(items);
          setHeroPosterFailed(false);
        }
      } catch (e) {
        if (cancelled || (e instanceof DOMException && e.name === "AbortError")) return;
        setCatalogError("Could not load catalog. Try again from the Library.");
      } finally {
        if (!cancelled) setCatalogLoading(false);
      }
    };

    void load();

    return () => {
      cancelled = true;
      ac.abort();
    };
  }, []);

  const posterSrcFor = (m: LibraryMovie) => normalizeMoviePosterUrl(m.image);
  const heroPosterRaw = featured ? upscalePosterUrlForHeroBanner(posterSrcFor(featured)) : null;
  const heroPoster = !heroPosterRaw ? null : heroPosterFailed ? POSTER_FALLBACK_SRC : heroPosterRaw;

  const heroWatchHref =
    featured && isAuthenticated ? `/watch/${featured.id}` : !isAuthenticated ? "/register" : "/library";

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] selection:bg-[#7c3aed] selection:text-white">
      <nav className="fixed top-0 z-50 flex h-20 w-full items-center gap-4 bg-[#131313]/60 px-8 shadow-[0_40px_60px_-10px_rgba(0,0,0,0.4)] backdrop-blur-2xl">
        <div className="flex shrink-0 items-center gap-12">
          <Link href="/" className="text-2xl font-black tracking-tighter text-[#d2bbff]">
            HYPERTUBE
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium tracking-tight md:flex">
            <Link
              className="border-b-2 border-[#7c3aed] pb-1 text-[#d2bbff]"
              href={isAuthenticated ? "/library" : "/register"}
            >
              Library
            </Link>
          </div>
        </div>
        <span className="min-w-[1rem] flex-1" aria-hidden />
        <div className="flex shrink-0 items-center gap-4">
          {isAuthenticated && user ? (
            <NavUserToolbar
              username={user.username}
              avatarUrl={user.avatarUrl}
              logoutLabel={t("logout")}
              settingsAriaLabel={t("settings")}
            />
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-6 py-2.5 text-sm font-bold text-[#ede0ff] transition-transform active:scale-95"
              >
                Register
              </Link>
            </>
          )}
        </div>
      </nav>

      <main className="pt-20">
        <section className="relative flex h-[min(870px,100svh)] w-full items-end overflow-hidden px-8 pb-24 md:px-20 md:pb-32">
          <div className="absolute inset-0 z-0 bg-[#0b0b0f]">
            {!catalogLoading && heroPoster ? (
              <>
                {/* Larger CDN hint + softened blur backdrop mask residual upscaling on very wide heroes */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  aria-hidden
                  className="absolute inset-0 h-full w-full scale-110 select-none object-cover object-center brightness-95 blur-xl"
                  decoding="async"
                  fetchPriority="high"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  src={heroPoster}
                  onError={() => setHeroPosterFailed(true)}
                />
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={featured ? featured.imageAlt || featured.title : ""}
                  className="absolute inset-0 h-full w-full object-cover object-center opacity-95"
                  decoding="async"
                  fetchPriority="high"
                  loading="eager"
                  referrerPolicy="no-referrer"
                  src={heroPoster}
                  onError={() => setHeroPosterFailed(true)}
                />
              </>
            ) : catalogLoading ? (
              <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-[#1e1033] via-[#131313] to-[#0b0b0f]" />
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: "linear-gradient(135deg, #1e1033 0%, #131313 50%, #0b0b0f 100%)",
                }}
              />
            )}
            <div
              className="absolute inset-0"
              style={{
                background: "linear-gradient(180deg, rgba(19,19,19,0) 0%, rgba(19,19,19,1) 100%)",
              }}
            />
          </div>
          <div className="relative z-10 grid w-full max-w-4xl grid-cols-1 items-end gap-8 md:grid-cols-12">
            <div className="md:col-span-8">
              <div className="mb-4 flex flex-wrap gap-4">
                <span className="rounded bg-[#d2bbff]/20 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#d2bbff]">
                  Trending Now
                </span>
                {featured ? (
                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ccc3d8]">
                    {featured.year} • {featured.genre}
                  </span>
                ) : !catalogLoading ? (
                  <span className="px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-[#ccc3d8]">
                    Hypertube library
                  </span>
                ) : null}
              </div>

              <h1 className="mb-6 text-5xl font-black leading-none tracking-tighter text-[#e5e2e1] sm:text-6xl md:text-7xl lg:text-8xl">
                {catalogLoading ? (
                  <span className="block h-[1.1em] w-64 max-w-full animate-pulse rounded bg-white/10" />
                ) : featured ? (
                  featured.title
                ) : (
                  "Discover"
                )}
              </h1>
              <p className="mb-8 max-w-xl text-lg leading-relaxed text-[#ccc3d8]">
                {catalogError ? (
                  catalogError
                ) : catalogLoading ? (
                  <span className="block h-14 w-full max-w-md animate-pulse rounded bg-white/5" />
                ) : featured ? (
                  `Stream “${featured.title}” and more from your Hypertube catalog.`
                ) : (
                  "No titles loaded yet. Open the library to browse or check your connection."
                )}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-br from-[#7c3aed] to-[#5a00c6] px-6 py-4 text-sm font-bold text-white transition-opacity hover:opacity-90 sm:px-8"
                  href={heroWatchHref}
                >
                  <span className="material-symbols-outlined !text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    play_arrow
                  </span>
                  Watch Now
                </Link>
                <Link
                  className="flex items-center gap-2 rounded-lg border border-white/20 bg-white/10 px-6 py-4 text-sm font-bold text-white backdrop-blur-md transition-colors hover:bg-white/20 sm:px-8"
                  href="/library"
                >
                  <span className="material-symbols-outlined !text-2xl">movie</span>
                  Library
                </Link>
              </div>
            </div>
            <div className="hidden text-right md:col-span-4 md:block">
              <div className="inline-flex flex-col items-end">
                <span className="mb-2 text-xs uppercase tracking-[0.2em] text-[#ccc3d8]">IMDb</span>
                <span className="text-5xl font-black text-[#d2bbff]">
                  {catalogLoading ? "…" : featured ? ratingLabel(featured.imdbRating) : "—"}
                </span>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#131313] px-8 py-24 md:px-20">
          <div className="mb-16 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <h2 className="mb-2 text-2xl font-black tracking-tight text-[#e5e2e1] sm:text-3xl">POPULAR RELEASES</h2>
              <div className="h-1 w-24 bg-[#7c3aed]" />
            </div>
            <div className="flex gap-4 self-end sm:self-auto">
              <button
                className="rounded-full border border-[#4a4455]/30 p-2 transition-colors hover:bg-[#2a2a2a]"
                type="button"
                aria-label="Scroll left"
              >
                <span className="material-symbols-outlined">chevron_left</span>
              </button>
              <button
                className="rounded-full border border-[#4a4455]/30 p-2 transition-colors hover:bg-[#2a2a2a]"
                type="button"
                aria-label="Scroll right"
              >
                <span className="material-symbols-outlined">chevron_right</span>
              </button>
            </div>
          </div>

          {catalogLoading ? (
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={idx} className="">
                  <div className="relative mb-4 aspect-[2/3] overflow-hidden rounded-xl bg-[#2a2a2a]">
                    <div className="absolute inset-0 animate-pulse bg-[#353534]" />
                  </div>
                  <div className="space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-[#353534]" />
                    <div className="h-3 w-full animate-pulse rounded bg-[#2a2a2a]" />
                  </div>
                </div>
              ))}
            </div>
          ) : catalogError ? (
            <p className="text-center text-[#ccc3d8]">{catalogError}</p>
          ) : movies.length === 0 ? (
            <p className="text-center text-[#ccc3d8]">
              Nothing to show here yet.{" "}
              <Link href="/library" className="font-semibold text-[#d2bbff] underline-offset-4 hover:underline">
                Open the Library
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-x-6 gap-y-12 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
              {movies.map((m) => (
                <Link key={m.id} href={`/watch/${m.id}`} className="group block">
                  <HomeCatalogPoster movie={m} />
                  <div>
                    <h3 className="text-base font-bold text-[#e5e2e1] transition-colors group-hover:text-[#d2bbff]">
                      {m.title}
                    </h3>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-[#ccc3d8]">{m.year || "—"}</span>
                      <span className="rounded bg-[#2a2a2a] px-1.5 py-0.5 text-[10px] font-black uppercase text-white ring-1 ring-white/10">
                        {qualityAbbrev(m.quality)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <footer className="mt-12 w-full border-t border-white/5 bg-[#0e0e0e] py-12">
        <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-8 px-8 md:flex-row">
          <div className="flex max-w-md flex-col gap-4 text-center md:text-left">
            <span className="text-xl font-black tracking-tighter text-[#d2bbff]">HYPERTUBE</span>
            <p className="text-xs text-gray-500">The Cinematic Void. Peer-to-peer streaming evolved for the modern enthusiast.</p>
          </div>
          <div className="flex flex-col items-center gap-8 md:flex-row">
            <div className="flex flex-wrap justify-center gap-6 md:gap-8">
              <a className="text-xs font-medium text-gray-600 transition-colors hover:text-white" href="#">
                Privacy Policy
              </a>
              <a className="text-xs font-medium text-gray-600 transition-colors hover:text-white" href="#">
                Terms of Service
              </a>
              <a className="text-xs font-medium text-gray-600 transition-colors hover:text-white" href="#">
                API
              </a>
              <a className="text-xs font-medium text-gray-600 transition-colors hover:text-white" href="#">
                Contact
              </a>
            </div>
            <p className="text-xs font-medium text-gray-500">© 2026 Hypertube. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

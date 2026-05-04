"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ProtectedPage } from "@/components/ProtectedPage";
import { LIBRARY_MOVIES, LIBRARY_SOURCE_LABELS, type LibraryMovie } from "@/lib/library-movies";
import { getLibraryMovies, type SortKey, type SourceFilter, type WatchedFilter } from "@/lib/library-api";
import { isApiConfigured } from "@/lib/api";
import { useAuth } from "@/providers/AuthProvider";
import { resolveAvatarSrc } from "@/lib/avatar";

const PAGE_SIZE = 8;
const DEFAULT_SORT: SortKey = "popularity";

function trBadgeClass(style: "violet" | "neutral" | "new") {
  if (style === "violet") {
    return "bg-[#7c3aed]/90";
  }
  if (style === "new") {
    return "bg-[#7c3aed]/90";
  }
  return "bg-[#131313]/90";
}

function sortLabel(sortBy: SortKey): string {
  if (sortBy === "year") return "Release Year";
  if (sortBy === "rating") return "IMDb Rating";
  if (sortBy === "name") return "Name";
  return "Popularity";
}

function sourceLabel(source: SourceFilter): string {
  if (source === "all") return "All Sources";
  return LIBRARY_SOURCE_LABELS[source];
}

function LibraryMovieCard({ movie, layout }: { movie: LibraryMovie; layout: "grid" | "list" }) {
  const imageFrame =
    layout === "grid" ? "aspect-[2/3] w-full" : "h-40 w-28 shrink-0 sm:h-48 sm:w-32";
  const titleMeta = `${movie.genre} • ${movie.year} • ${movie.imdbRating.toFixed(1)}`;
  const sourceText = LIBRARY_SOURCE_LABELS[movie.source];

  const img = (
    <div
      className={[
        "relative overflow-hidden rounded-lg bg-[#2a2a2a] transition-all duration-500",
        movie.watched &&
          "opacity-40 grayscale group-hover:opacity-100 group-hover:grayscale-0 group-hover:scale-105",
        !movie.watched && "group-hover:scale-105",
        movie.highlightPlay &&
          "group-hover:scale-105 group-hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className={`relative ${imageFrame}`}>
        <Image
          src={movie.image}
          alt={movie.imageAlt}
          fill
          unoptimized
          className={[
            "object-cover",
            movie.highlightPlay ? "grayscale-[30%] group-hover:grayscale-0" : "",
          ]
            .filter(Boolean)
            .join(" ")}
          sizes={layout === "grid" ? "(min-width: 1280px) 16vw, 20vw" : "128px"}
        />
      </div>
      <div
        className={`absolute right-3 top-3 rounded px-2 py-1 text-[10px] font-black text-white backdrop-blur ${trBadgeClass(
          movie.isNew ? "new" : movie.quality === "4K HDR" ? "violet" : "neutral",
        )}`}
      >
        {movie.isNew ? "NEW" : movie.quality}
      </div>
      {movie.watched ? (
        <div
          className="absolute left-3 top-3 flex items-center gap-1 rounded-sm bg-emerald-500 px-2 py-1 text-[10px] font-black text-black shadow-lg"
        >
          <span
            className="material-symbols-outlined text-[12px]"
            style={{ fontVariationSettings: '"FILL" 1' }}
          >
            check_circle
          </span>
          WATCHED
        </div>
      ) : null}
      {movie.highlightPlay ? (
        <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="flex w-full items-center justify-center gap-2 rounded bg-white py-3 text-sm font-black text-black">
            <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
              play_arrow
            </span>
            WATCH NOW
          </span>
        </div>
      ) : null}
      <div className="absolute bottom-3 left-3 rounded bg-black/60 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[#d2bbff]">
        {sourceText}
      </div>
    </div>
  );

  const text = (
    <div>
      <h3
        className={[
          "line-clamp-1 font-bold",
          movie.watched ? "text-white/50 group-hover:text-white" : "text-white group-hover:text-[#d2bbff]",
        ].join(" ")}
      >
        {movie.title}
      </h3>
      <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-[#ccc3d8]">{titleMeta}</p>
    </div>
  );

  if (layout === "list") {
    return (
      <div className="group flex w-full max-w-4xl cursor-pointer gap-4 sm:gap-6">
        {img}
        <div className="flex min-w-0 flex-1 items-center py-2">{text}</div>
      </div>
    );
  }

  return (
    <div className="group w-full space-y-3">
      {img}
      {text}
    </div>
  );
}

function LibraryContent() {
  const router = useRouter();
  const { user } = useAuth();
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>(DEFAULT_SORT);
  const [genreFilter, setGenreFilter] = useState("all");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [watchedFilter, setWatchedFilter] = useState<WatchedFilter>("all");
  const [minRating, setMinRating] = useState(0);
  const [movies, setMovies] = useState<LibraryMovie[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const filtersSectionRef = useRef<HTMLElement | null>(null);
  const requestIdRef = useRef(0);
  /** Mobile / tablet: collapsible filters; lg+ ignores false and always shows the panel. */
  const [filtersOpen, setFiltersOpen] = useState(false);

  const displayName = user?.username ? user.username : "User";
  const avatarSrc = resolveAvatarSrc(user?.avatarUrl);
  const normalizedQuery = query.trim().toLowerCase();
  /** Spec: search hits both mock sources — results locked to alphabetical order. */
  const searchActive = query.trim().length > 0;
  const effectiveSortDisplay: SortKey = searchActive ? "name" : sortBy;

  const [apiGenres, setApiGenres] = useState<string[]>([]);
  useEffect(() => {
    if (!isApiConfigured) {
      return;
    }
    setApiGenres((prev) => {
      const next = new Set([...prev, ...movies.map((m) => m.genre).filter(Boolean)]);
      return Array.from(next).sort((a, b) => a.localeCompare(b));
    });
  }, [movies]);
  const genres = useMemo(() => {
    if (isApiConfigured) {
      return apiGenres;
    }
    const unique = Array.from(new Set(LIBRARY_MOVIES.map((movie) => movie.genre)));
    return unique.sort((a, b) => a.localeCompare(b));
  }, [apiGenres]);

  const watchedCount = movies.filter((movie) => movie.watched).length;
  const activeFilterCount =
    (genreFilter !== "all" ? 1 : 0) +
    (sourceFilter !== "all" ? 1 : 0) +
    (watchedFilter !== "all" ? 1 : 0) +
    (minRating > 0 ? 1 : 0) +
    (normalizedQuery ? 1 : 0);

  const fetchPage = useCallback(async (targetPage: number, append: boolean) => {
    const requestId = ++requestIdRef.current;
    if (!append) {
      setLoadingInitial(true);
      setError(null);
    } else {
      setLoadingMore(true);
    }

    try {
      const result = await getLibraryMovies({
        page: targetPage,
        pageSize: PAGE_SIZE,
        query,
        sortBy,
        genreFilter,
        sourceFilter,
        watchedFilter,
        minRating,
      });

      if (requestId !== requestIdRef.current) {
        return;
      }

      setMovies((current) => (append ? [...current, ...result.items] : result.items));
      setTotalCount(result.total);
      setHasMore(result.hasMore);
      setPage(targetPage);
      setError(null);
    } catch (err: unknown) {
      if (requestId !== requestIdRef.current) {
        return;
      }
      const message = err instanceof Error ? err.message : "Could not load library data.";
      setError(message);
    } finally {
      if (requestId === requestIdRef.current) {
        setLoadingInitial(false);
        setLoadingMore(false);
      }
    }
  }, [genreFilter, minRating, query, sortBy, sourceFilter, watchedFilter]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void fetchPage(1, false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [fetchPage]);

  useEffect(() => {
    const loader = loaderRef.current;
    if (!loader || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (!entry?.isIntersecting || loadingMore || loadingInitial || error) return;
        void fetchPage(page + 1, true);
      },
      { rootMargin: "260px" },
    );

    observer.observe(loader);
    return () => observer.disconnect();
  }, [error, fetchPage, hasMore, loadingInitial, loadingMore, page]);

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] selection:bg-[#7c3aed] selection:text-white">
      <nav className="fixed top-0 z-50 flex h-20 w-full items-center justify-between bg-[#131313]/60 px-4 shadow-[0_40px_60px_-10px_rgba(0,0,0,0.4)] backdrop-blur-xl sm:px-8">
        <div className="flex min-w-0 items-center gap-6 sm:gap-12">
          <Link href="/" className="shrink-0 text-2xl font-black tracking-tighter text-[#d2bbff]">
            HYPERTUBE
          </Link>
          <div className="hidden items-center gap-8 text-sm font-medium tracking-tight md:flex">
            <Link
              className="border-b-2 border-[#7c3aed] pb-1 text-[#d2bbff]"
              href="/library"
              aria-current="page"
            >
              Movies
            </Link>
          </div>
        </div>
        <div className="flex min-h-11 min-w-0 max-w-xl flex-1 justify-center px-2 max-lg:hidden">
          <label className="relative w-full min-w-[8rem]" htmlFor="library-search-desktop">
            <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#ccc3d8]">
              search
            </span>
            <input
              id="library-search-desktop"
              className="ht-dark-input w-full rounded-lg border-none bg-[#0e0e0e] py-3 pl-12 pr-4 text-sm text-[#e5e2e1] transition-all focus:ring-2 focus:ring-[#d2bbff]/30"
              placeholder="Search the void…"
              type="search"
              autoComplete="off"
              aria-describedby="library-search-note"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
              }}
            />
          </label>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link
            href="/settings/profile"
            className="rounded-full p-2 text-[#ccc3d8] transition-all hover:bg-[#2a2a2a] active:scale-95"
            title="Settings"
          >
            <span className="material-symbols-outlined">settings</span>
          </Link>
          <div className="flex min-w-0 max-w-[40%] items-center gap-2 border-l border-white/10 pl-3 sm:max-w-none sm:gap-3 sm:pl-4">
            <div className="min-w-0 max-w-[8rem] truncate text-right text-xs font-bold leading-none sm:max-w-none sm:text-sm lg:block">
              {displayName}
            </div>
            <Image
              src={avatarSrc}
              alt=""
              width={40}
              height={40}
              className="h-10 w-10 rounded-lg object-cover ring-2 ring-[#d2bbff]/20"
            />
            <Link
              href="/logout"
              className="ml-1 inline-flex items-center gap-1.5 rounded-md border border-[#ffb4ab]/35 bg-[#93000a]/15 px-2.5 py-1.5 text-xs font-semibold text-[#ffdad6] transition-all hover:border-[#ffb4ab]/60 hover:bg-[#93000a]/25"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Sign out
            </Link>
          </div>
        </div>
      </nav>

      <main className="px-4 pb-12 pt-28 sm:px-8">
        <header className="mb-12 flex flex-col justify-between gap-8 lg:flex-row lg:items-start">
          <div className="w-full max-w-2xl">
            <p id="library-search-note" className="sr-only">
              {isApiConfigured
                ? "Search and filters use the Hypertube API. Source and watched filters apply to the current result page."
                : "Search merges legal catalogues modeled on archive.org and legittorrents.info (local mock data)."}
            </p>
            <h1 className="mb-4 text-4xl font-black tracking-tighter text-white sm:text-5xl md:text-6xl">Library</h1>
            <p className="text-lg leading-relaxed text-[#ccc3d8]">
              {isApiConfigured
                ? normalizedQuery
                  ? "Search mode: results are ordered by title. Use filters to narrow the list."
                  : "Browse popular titles from the API. Use filters to narrow the list."
                : normalizedQuery
                  ? `Search mode from archive.org + legittorrents.info. Results are sorted by name.`
                  : `No search query: showing most popular titles from legal sources (mock).`}
            </p>
            <label className="mt-8 block lg:hidden">
              <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#d2bbff]">Search</span>
              <div className="relative">
                <span className="material-symbols-outlined pointer-events-none absolute left-4 top-1/2 z-10 -translate-y-1/2 text-[#ccc3d8]">
                  search
                </span>
                <input
                  id="library-search-mobile"
                  className="ht-dark-input w-full rounded-lg border-none bg-[#0e0e0e] py-3 pl-12 pr-4 text-sm text-[#e5e2e1] transition-all focus:ring-2 focus:ring-[#d2bbff]/30"
                  placeholder="Search the void…"
                  type="search"
                  autoComplete="off"
                  aria-describedby="library-search-note"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                  }}
                />
              </div>
            </label>
          </div>
          <div className="flex flex-wrap items-center gap-4 self-end">
            <div className="flex items-center rounded-full bg-[#0e0e0e] p-1.5 ring-1 ring-white/5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={`rounded-full px-4 py-2 text-sm font-semibold sm:px-6 ${
                  view === "grid" ? "bg-[#2a2a2a] text-white shadow-xl" : "text-[#ccc3d8] hover:text-white"
                }`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={`rounded-full px-4 py-2 text-sm font-medium sm:px-6 ${
                  view === "list" ? "bg-[#2a2a2a] text-white shadow-xl" : "text-[#ccc3d8] hover:text-white"
                }`}
              >
                List
              </button>
            </div>
            <button
              type="button"
              aria-expanded={filtersOpen}
              aria-controls="library-filters"
              className="flex items-center gap-2 rounded-lg bg-[#1c1b1b] px-4 py-3 text-sm font-medium text-white ring-1 ring-white/5 transition-colors hover:bg-[#2a2a2a] sm:px-6 lg:hidden"
              onClick={() => {
                setFiltersOpen((open) => !open);
              }}
            >
              <span className="material-symbols-outlined text-lg">tune</span>
              {filtersOpen ? "Hide filters" : "Advanced filters"}
            </button>
          </div>
        </header>

        <section
          ref={filtersSectionRef}
          id="library-filters"
          aria-label="Sorting and filtering"
          className={`mb-12 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 ${!filtersOpen ? "hidden lg:grid" : ""}`}
        >
          <div className="flex min-h-[8rem] flex-col justify-between rounded-xl bg-[#1c1b1b] p-5 ring-1 ring-white/5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#d2bbff]">Sort By</span>
            {searchActive ? (
              <p className="text-sm leading-snug text-[#9ca3af]">
                With an active search, results follow the spec — sorted&nbsp;
                <span className="font-semibold text-[#e5e2e1]">A–Z by title</span>.
              </p>
            ) : null}
            <div className="flex items-end justify-between">
              <select
                value={effectiveSortDisplay}
                disabled={searchActive}
                onChange={(event) => {
                  setSortBy(event.target.value as SortKey);
                }}
                className="w-full bg-transparent text-2xl font-bold outline-none disabled:cursor-not-allowed disabled:opacity-60"
                aria-describedby={searchActive ? "library-sort-note" : undefined}
              >
                <option value="popularity" className="bg-[#131313] text-sm">
                  Popularity
                </option>
                <option value="name" className="bg-[#131313] text-sm">
                  Name
                </option>
                <option value="year" className="bg-[#131313] text-sm">
                  Release Year
                </option>
                <option value="rating" className="bg-[#131313] text-sm">
                  IMDb Rating
                </option>
              </select>
            </div>
            {searchActive ? (
              <p id="library-sort-note" className="sr-only">
                Browse sort options are inactive while searching; catalogue enforces alphabetical order.
              </p>
            ) : null}
          </div>
          <div className="flex min-h-[8rem] flex-col justify-between rounded-xl bg-[#1c1b1b] p-5 ring-1 ring-white/5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#d2bbff]">Genre / Source</span>
            <div className="flex items-end justify-between">
              <div className="w-full">
                <select
                  value={genreFilter}
                  onChange={(event) => {
                    setGenreFilter(event.target.value);
                  }}
                  className="w-full bg-transparent text-lg font-bold outline-none"
                >
                  <option value="all" className="bg-[#131313] text-sm">
                    All Genres
                  </option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre} className="bg-[#131313] text-sm">
                      {genre}
                    </option>
                  ))}
                </select>
                <select
                  value={sourceFilter}
                  onChange={(event) => {
                    setSourceFilter(event.target.value as SourceFilter);
                  }}
                  className="mt-1 w-full bg-transparent text-xs uppercase tracking-widest text-[#ccc3d8] outline-none"
                >
                  <option value="all" className="bg-[#131313] text-xs">
                    All Sources
                  </option>
                  <option value="archive" className="bg-[#131313] text-xs">
                    archive.org
                  </option>
                  <option value="legit" className="bg-[#131313] text-xs">
                    legittorrents.info
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex min-h-[8rem] flex-col justify-between rounded-xl bg-[#1c1b1b] p-5 ring-1 ring-white/5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#d2bbff]">Rating / Status</span>
            <div className="flex items-end justify-between">
              <div>
                <span className="text-2xl font-bold">{minRating.toFixed(1)} - 10.0</span>
                <input
                  type="range"
                  min={0}
                  max={10}
                  step={0.5}
                  value={minRating}
                  onChange={(event) => {
                    setMinRating(Number(event.target.value));
                  }}
                  className="mt-1 w-full accent-[#d2bbff]"
                />
                <select
                  value={watchedFilter}
                  onChange={(event) => {
                    setWatchedFilter(event.target.value as WatchedFilter);
                  }}
                  className="mt-1 w-full bg-transparent text-xs uppercase tracking-widest text-[#ccc3d8] outline-none"
                >
                  <option value="all" className="bg-[#131313]">
                    All Status
                  </option>
                  <option value="watched" className="bg-[#131313]">
                    Watched
                  </option>
                  <option value="unwatched" className="bg-[#131313]">
                    Unwatched
                  </option>
                </select>
              </div>
            </div>
          </div>
          <div className="flex min-h-[8rem] flex-col justify-between rounded-xl bg-[#7c3aed] p-5 shadow-[0_20px_40px_-15px_rgba(124,58,237,0.4)]">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#ede0ff]">Active Filters</span>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">{sortLabel(effectiveSortDisplay)}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">{sourceLabel(sourceFilter)}</span>
              <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">{totalCount} RESULTS</span>
              {activeFilterCount > 0 ? (
                <span className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold">{activeFilterCount} ACTIVE</span>
              ) : null}
            </div>
          </div>
        </section>

        {loadingInitial ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {Array.from({ length: PAGE_SIZE }, (_, idx) => (
              <div key={idx} className="space-y-3">
                <div className="aspect-[2/3] w-full animate-pulse rounded-lg bg-[#2a2a2a]" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-[#2a2a2a]" />
                <div className="h-3 w-3/5 animate-pulse rounded bg-[#2a2a2a]" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="rounded-xl border border-[#ffb4ab]/30 bg-[#93000a]/20 p-6 text-center">
            <p className="text-sm text-[#ffb4ab]">{error}</p>
            <button
              type="button"
              onClick={() => void fetchPage(1, false)}
              className="mt-4 rounded-lg bg-gradient-to-r from-[#7c3aed] to-[#5a00c6] px-5 py-2 text-sm font-semibold text-white"
            >
              Retry
            </button>
          </div>
        ) : movies.length === 0 ? (
          <div className="rounded-xl border border-white/10 bg-[#1c1b1b] p-8 text-center">
            <p className="text-sm text-[#ccc3d8]">No movies match your filters. Try relaxing your criteria.</p>
          </div>
        ) : view === "grid" ? (
          <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {movies.map((m) => (
              <div
                key={m.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/watch/${m.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/watch/${m.id}`);
                  }
                }}
                className="cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[#d2bbff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131313]"
                aria-label={`Open ${m.title}`}
              >
                <LibraryMovieCard movie={m} layout="grid" />
              </div>
            ))}
          </div>
        ) : (
          <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
            {movies.map((m) => (
              <div
                key={m.id}
                role="link"
                tabIndex={0}
                onClick={() => router.push(`/watch/${m.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    router.push(`/watch/${m.id}`);
                  }
                }}
                className="cursor-pointer border-b border-white/5 pb-6 outline-none last:border-0 last:pb-0 focus-visible:ring-2 focus-visible:ring-[#d2bbff] focus-visible:ring-offset-2 focus-visible:ring-offset-[#131313]"
                aria-label={`Open ${m.title}`}
              >
                <LibraryMovieCard movie={m} layout="list" />
              </div>
            ))}
          </div>
        )}

        <div ref={loaderRef} className="mt-20 flex min-h-20 flex-col items-center gap-4">
          {loadingMore ? (
            <>
              <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#d2bbff]/20 border-t-[#d2bbff]" />
              <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Scanning deeper into the void...</p>
            </>
          ) : hasMore ? (
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Scroll for more…</p>
          ) : (
            <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
              End of feed • {watchedCount} watched / {totalCount} total
            </p>
          )}
        </div>
      </main>

      <footer className="mt-12 w-full border-t border-white/5 bg-[#0e0e0e] py-12">
        <div className="flex w-full flex-col items-center justify-between gap-6 px-4 sm:px-8 md:flex-row">
          <p className="text-xs text-gray-500">© 2026 Hypertube. All rights reserved.</p>
          <div className="flex flex-wrap justify-center gap-6">
            <a className="text-xs text-gray-600 transition-colors hover:text-white" href="#">
              Privacy Policy
            </a>
            <a className="text-xs text-gray-600 transition-colors hover:text-white" href="#">
              Terms of Service
            </a>
            <a className="text-xs text-gray-600 transition-colors hover:text-white" href="#">
              API
            </a>
            <a className="text-xs text-gray-600 transition-colors hover:text-white" href="#">
              Contact
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <ProtectedPage>
      <LibraryContent />
    </ProtectedPage>
  );
}

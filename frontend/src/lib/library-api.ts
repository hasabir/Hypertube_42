import type { LibraryMovie, LibrarySource } from "@/lib/library-movies";
import {
  getLibraryMovies as getMockLibraryMovies,
  type LibraryQueryParams,
  type LibraryQueryResult,
  type SortKey,
  type SourceFilter,
  type WatchedFilter,
} from "@/lib/library-api-mock";
import { apiClient, isApiConfigured } from "@/lib/api";

export type {
  LibraryQueryParams,
  LibraryQueryResult,
  SortKey,
  SourceFilter,
  WatchedFilter,
} from "@/lib/library-api-mock";

type BackendMovieRow = {
  id: number;
  title: string;
  year: number | null;
  imdb_rating: number | null;
  genre: string;
  cover_image: string;
  source: string;
  view_count: number;
  is_watched?: boolean;
};

type PaginatedMovies = {
  count: number;
  next: string | null;
  previous: string | null;
  results: BackendMovieRow[];
};

function mapSourceString(source: string): LibrarySource {
  const s = (source || "").toLowerCase();
  if (s.includes("archive")) {
    return "archive";
  }
  return "legit";
}

function mapRow(m: BackendMovieRow): LibraryMovie {
  const cover = m.cover_image?.trim() || "/window.svg";
  return {
    id: String(m.id),
    title: m.title,
    year: m.year ?? 0,
    genre: m.genre || "—",
    imdbRating: m.imdb_rating ?? 0,
    image: cover,
    imageAlt: `${m.title} poster`,
    quality: "1080p",
    source: mapSourceString(m.source),
    watched: Boolean(m.is_watched),
    seeders: Math.max(0, m.view_count ?? 0),
    peers: 0,
    downloads: Math.max(0, m.view_count ?? 0),
  };
}

function sortToOrdering(sortBy: SortKey, searchActive: boolean): string | undefined {
  if (searchActive) {
    return "title";
  }
  switch (sortBy) {
    case "popularity":
      return "-view_count";
    case "name":
      return "title";
    case "year":
      return "-year";
    case "rating":
      return "-imdb_rating";
    default:
      return "-view_count";
  }
}

function applyClientFilters(
  items: LibraryMovie[],
  sourceFilter: SourceFilter,
  watchedFilter: WatchedFilter,
): LibraryMovie[] {
  let next = items;
  if (sourceFilter !== "all") {
    next = next.filter((m) => m.source === sourceFilter);
  }
  if (watchedFilter === "watched") {
    next = next.filter((m) => m.watched);
  } else if (watchedFilter === "unwatched") {
    next = next.filter((m) => !m.watched);
  }
  return next;
}

async function fetchMoviesListPage(params: LibraryQueryParams): Promise<LibraryQueryResult> {
  const searchActive = params.query.trim().length > 0;
  const offset = (params.page - 1) * params.pageSize;

  const qp: Record<string, string | number> = {
    limit: params.pageSize,
    offset,
  };

  const q = params.query.trim();
  if (q) {
    qp.movie = q;
  }
  if (params.genreFilter !== "all") {
    qp.genre = params.genreFilter;
  }
  if (params.minRating > 0) {
    qp.min_rating = params.minRating;
  }

  const ordering = sortToOrdering(params.sortBy, searchActive);
  if (ordering) {
    qp.ordering = ordering;
  }

  const { data } = await apiClient.get<PaginatedMovies>("/api/movies/", {
    params: qp,
  });

  let items = data.results.map(mapRow);
  items = applyClientFilters(items, params.sourceFilter, params.watchedFilter);

  return {
    items,
    total: data.count,
    hasMore: Boolean(data.next),
  };
}

export async function getLibraryMovies(
  params: LibraryQueryParams,
): Promise<LibraryQueryResult> {
  if (!isApiConfigured) {
    return getMockLibraryMovies(params);
  }
  return fetchMoviesListPage(params);
}

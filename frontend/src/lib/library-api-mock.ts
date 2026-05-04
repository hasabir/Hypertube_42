import { LIBRARY_MOVIES, type LibraryMovie, type LibrarySource } from "@/lib/library-movies";

export type SortKey = "popularity" | "name" | "year" | "rating";
export type WatchedFilter = "all" | "watched" | "unwatched";
export type SourceFilter = "all" | LibrarySource;

export type LibraryQueryParams = {
  page: number;
  pageSize: number;
  query: string;
  sortBy: SortKey;
  genreFilter: string;
  sourceFilter: SourceFilter;
  watchedFilter: WatchedFilter;
  minRating: number;
};

export type LibraryQueryResult = {
  items: LibraryMovie[];
  total: number;
  hasMore: boolean;
};

function delay(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function applyFilters(params: LibraryQueryParams): LibraryMovie[] {
  const normalizedQuery = params.query.trim().toLowerCase();
  let movies = [...LIBRARY_MOVIES];

  if (normalizedQuery) {
    movies = movies.filter((movie) => {
      return (
        movie.title.toLowerCase().includes(normalizedQuery) ||
        movie.genre.toLowerCase().includes(normalizedQuery) ||
        movie.source.toLowerCase().includes(normalizedQuery)
      );
    });
  }

  if (params.genreFilter !== "all") {
    movies = movies.filter((movie) => movie.genre === params.genreFilter);
  }

  if (params.sourceFilter !== "all") {
    movies = movies.filter((movie) => movie.source === params.sourceFilter);
  }

  if (params.watchedFilter === "watched") {
    movies = movies.filter((movie) => movie.watched);
  } else if (params.watchedFilter === "unwatched") {
    movies = movies.filter((movie) => !movie.watched);
  }

  movies = movies.filter((movie) => movie.imdbRating >= params.minRating);

  // Subject requirement: once search is done, sort by names.
  if (normalizedQuery) {
    movies.sort((a, b) => a.title.localeCompare(b.title));
    return movies;
  }

  if (params.sortBy === "name") {
    movies.sort((a, b) => a.title.localeCompare(b.title));
  } else if (params.sortBy === "year") {
    movies.sort((a, b) => b.year - a.year || a.title.localeCompare(b.title));
  } else if (params.sortBy === "rating") {
    movies.sort((a, b) => b.imdbRating - a.imdbRating || a.title.localeCompare(b.title));
  } else {
    // Popularity fallback (seeders + downloads signal)
    movies.sort((a, b) => b.seeders - a.seeders || b.downloads - a.downloads || a.title.localeCompare(b.title));
  }

  return movies;
}

export async function getLibraryMovies(params: LibraryQueryParams): Promise<LibraryQueryResult> {
  // Simulate network/API roundtrip.
  await delay(420);

  // Debug trigger to test error UI quickly from search box.
  if (params.query.trim().toLowerCase() === "fail") {
    throw new Error("Mock API failure. Please try again.");
  }

  const filtered = applyFilters(params);
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const items = filtered.slice(start, end);

  return {
    items,
    total: filtered.length,
    hasMore: end < filtered.length,
  };
}


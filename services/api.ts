export interface Movie {
  id: number;
  title: string;
  poster_path: string | null;
  vote_average: number;
  release_date: string;
  overview?: string;
  media_type?: string;
  [key: string]: any;
}

export interface MovieDetails extends Movie {
  runtime: number;
  genres: Array<{ id: number; name: string }>;
  credits: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
    }>;
  };
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
  budget: number;
  revenue: number;
  [key: string]: any;
}

export interface TVShow {
  id: number;
  name: string;
  poster_path: string | null;
  vote_average: number;
  first_air_date: string;
  overview?: string;
  media_type?: string;
  [key: string]: any;
}

export interface TVShowDetails extends TVShow {
  number_of_seasons: number;
  number_of_episodes: number;
  genres: Array<{ id: number; name: string }>;
  credits: {
    cast: Array<{
      id: number;
      name: string;
      character: string;
      profile_path: string | null;
    }>;
    crew: Array<{
      id: number;
      name: string;
      job: string;
      department: string;
    }>;
  };
  production_companies: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
  networks: Array<{
    id: number;
    name: string;
    logo_path: string | null;
  }>;
  created_by: Array<{
    id: number;
    name: string;
    profile_path: string | null;
  }>;
  [key: string]: any;
}

export interface Actor {
  id: number;
  name: string;
  profile_path: string | null;
  known_for_department: string;
  known_for?: Array<any>;
  popularity: number;
  media_type?: string;
  [key: string]: any;
}

export interface ActorDetails {
  id: number;
  name: string;
  birthday: string | null;
  deathday: string | null;
  biography: string;
  place_of_birth: string | null;
  profile_path: string | null;
  gender: number;
  known_for_department: string;
  popularity: number;
  also_known_as: string[];

  // From append_to_response
  credits?: {
    cast: Array<{
      id: number;
      title?: string; // For movies
      name?: string; // For TV shows
      media_type: string; // "movie" or "tv"
      character: string;
      poster_path: string | null;
      credit_id: string;
    }>;
    crew?: Array<any>;
  };

  // Optional additional fields
  images?: {
    profiles: Array<{
      file_path: string;
      width: number;
      height: number;
    }>;
  };

  external_ids?: {
    imdb_id: string | null;
    facebook_id: string | null;
    instagram_id: string | null;
    twitter_id: string | null;
  };
}

export const TMDB_CONFIG = {
  BASE_URL: "https://api.themoviedb.org/3",
  API_KEY: process.env.EXPO_PUBLIC_MOVIE_API_KEY,
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${process.env.EXPO_PUBLIC_MOVIE_API_KEY}`,
  },
};

export const fetchMovies = async ({
  query,
  sortBy = "popularity.desc",
}: {
  query: string;
  sortBy?: string;
}): Promise<Movie[]> => {
  const endpoint = query
    ? `${TMDB_CONFIG.BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
    : `${TMDB_CONFIG.BASE_URL}/discover/movie?sort_by=${sortBy}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch movies: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
};

// New function to fetch latest movies
export const fetchLatestMovies = async (): Promise<Movie[]> => {
  return fetchMovies({ query: "", sortBy: "primary_release_date.desc" });
};

export const fetchMovieDetails = async (
  movieId: string
): Promise<MovieDetails> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/movie/${movieId}?append_to_response=credits`,
      {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch movie details: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching movie details:", error);
    throw error;
  }
};

export const fetchActorDetails = async (
  actorId: string
): Promise<ActorDetails> => {
  try {
    // Fetch actor details with append_to_response for credits, images, and external_ids
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/person/${actorId}?append_to_response=credits,images,external_ids`,
      {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch actor details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching actor details:", error);
    throw error;
  }
};

export const fetchTVShows = async (
  sortBy = "popularity.desc"
): Promise<TVShow[]> => {
  const endpoint =
    sortBy === "trending"
      ? `${TMDB_CONFIG.BASE_URL}/trending/tv/week`
      : `${TMDB_CONFIG.BASE_URL}/discover/tv?sort_by=${sortBy}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch TV shows: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results;
};

// New function to fetch latest TV shows
export const fetchLatestTVShows = async (): Promise<TVShow[]> => {
  return fetchTVShows("first_air_date.desc");
};

export const fetchTVShowDetails = async (
  tvId: string
): Promise<TVShowDetails> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/tv/${tvId}?append_to_response=credits`,
      {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch TV details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching TV details:", error);
    throw error;
  }
};


export const fetchTVSeasonDetails = async (
  tvId: string,
  seasonNumber: number
) => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/tv/${tvId}/season/${seasonNumber}`,
      {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch season details: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching season details:", error);
    throw error;
  }
};

export const searchActors = async (query: string): Promise<Actor[]> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/search/person?query=${encodeURIComponent(query)}`,
      {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search actors: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map((actor: Actor) => ({
      ...actor,
      media_type: "person", // Explicitly add media_type
    }));
  } catch (error) {
    console.error("Error searching actors:", error);
    throw error;
  }
};

export const fetchPopularActors = async (
  page: number = 1
): Promise<Actor[]> => {
  try {
    const response = await fetch(
      `${TMDB_CONFIG.BASE_URL}/person/popular?page=${page}`,
      {
        method: "GET",
        headers: TMDB_CONFIG.headers,
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch popular actors: ${response.statusText}`);
    }

    const data = await response.json();
    return data.results.map((actor: Actor) => ({
      ...actor,
      media_type: "person", // Explicitly add media_type
    }));
  } catch (error) {
    console.error("Error fetching popular actors:", error);
    throw error;
  }
};

// Updated multiSearch to include people/actors
export const fetchMultiSearch = async ({
  query,
}: {
  query: string;
}): Promise<(Movie | TVShow | Actor)[]> => {
  const endpoint = `${
    TMDB_CONFIG.BASE_URL
  }/search/multi?query=${encodeURIComponent(query)}`;

  const response = await fetch(endpoint, {
    method: "GET",
    headers: TMDB_CONFIG.headers,
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch search results: ${response.statusText}`);
  }

  const data = await response.json();

  // Return all types including person
  return data.results;
};

// Helper function to get a media item's title consistently
export const getMediaTitle = (item: Movie | TVShow | Actor): string => {
  if (item.media_type === "movie") {
    return (item as Movie).title;
  } else if (item.media_type === "tv") {
    return (item as TVShow).name;
  } else if (item.media_type === "person") {
    return (item as Actor).name;
  }

  // Fallback for items without media_type
  if ("title" in item) return item.title;
  if ("name" in item) return item.name;

  return "Unknown";
};

// Helper to get the correct link route based on media type
export const getMediaRoute = (item: Movie | TVShow | Actor): string => {
  if (item.media_type === "movie") {
    return `/movies/${item.id}`;
  } else if (item.media_type === "tv") {
    return `/tv/${item.id}`;
  } else if (item.media_type === "person") {
    return `/actor/${item.id}`;
  }

  // Fallback based on property existence
  if ("title" in item) return `/movies/${item.id}`;
  if ("first_air_date" in item) return `/tv/${item.id}`;
  if ("known_for_department" in item) return `/actor/${item.id}`;

  return "#";
};

export interface Genre {
  id: number;
  name: string;
}

// TMDb movie genres
export const movieGenres: Genre[] = [
  { id: 28, name: "Action" },
  { id: 12, name: "Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 14, name: "Fantasy" },
  { id: 36, name: "History" },
  { id: 27, name: "Horror" },
  { id: 10402, name: "Music" },
  { id: 9648, name: "Mystery" },
  { id: 10749, name: "Romance" },
  { id: 878, name: "Science Fiction" },
  { id: 10770, name: "TV Movie" },
  { id: 53, name: "Thriller" },
  { id: 10752, name: "War" },
  { id: 37, name: "Western" },
];

// TMDb TV genres
export const tvGenres: Genre[] = [
  { id: 10759, name: "Action & Adventure" },
  { id: 16, name: "Animation" },
  { id: 35, name: "Comedy" },
  { id: 80, name: "Crime" },
  { id: 99, name: "Documentary" },
  { id: 18, name: "Drama" },
  { id: 10751, name: "Family" },
  { id: 10762, name: "Kids" },
  { id: 9648, name: "Mystery" },
  { id: 10763, name: "News" },
  { id: 10764, name: "Reality" },
  { id: 10765, name: "Sci-Fi & Fantasy" },
  { id: 10766, name: "Soap" },
  { id: 10767, name: "Talk" },
  { id: 10768, name: "War & Politics" },
  { id: 37, name: "Western" },
];

// Helper function to get combined and sorted genres
export const getAllGenres = (): Genre[] => {
  // Combine genres and remove duplicates
  const allGenres = [...movieGenres];
  tvGenres.forEach((tvGenre) => {
    if (!allGenres.some((genre) => genre.id === tvGenre.id)) {
      allGenres.push(tvGenre);
    }
  });

  // Sort genres alphabetically
  return allGenres.sort((a, b) => a.name.localeCompare(b.name));
};

// Get a genre by ID
export const getGenreById = (id: number): Genre | undefined => {
  return getAllGenres().find((genre) => genre.id === id);
};

// Get genres by IDs
export const getGenresByIds = (ids: number[]): Genre[] => {
  return getAllGenres().filter((genre) => ids.includes(genre.id));
};

// Helper for fetching genres from TMDb API (optional)
export const fetchGenresFromApi = async (): Promise<Genre[]> => {
  try {
    // Replace with your actual API key and implementation
    const API_KEY = "EXPO_PUBLIC_MOVIE_API_KEYy";

    // Fetch movie genres
    const movieResponse = await fetch(
      `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`
    );
    const movieData = await movieResponse.json();

    // Fetch TV genres
    const tvResponse = await fetch(
      `https://api.themoviedb.org/3/genre/tv/list?api_key=${API_KEY}&language=en-US`
    );
    const tvData = await tvResponse.json();

    // Combine and de-duplicate
    const combinedGenres = [...movieData.genres];
    tvData.genres.forEach((tvGenre: Genre) => {
      if (!combinedGenres.some((genre: Genre) => genre.id === tvGenre.id)) {
        combinedGenres.push(tvGenre);
      }
    });

    // Sort alphabetically
    return combinedGenres.sort((a: Genre, b: Genre) =>
      a.name.localeCompare(b.name)
    );
  } catch (error) {
    console.error("Error fetching genres:", error);
    // Fall back to hard-coded genres
    return getAllGenres();
  }
};

export default {
  movieGenres,
  tvGenres,
  getAllGenres,
  getGenreById,
  getGenresByIds,
  fetchGenresFromApi,
};

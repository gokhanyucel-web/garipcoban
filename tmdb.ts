const API_KEY = "6e24d9cca96b2ac08abfc12a9714a52c";
const BASE_URL = "https://api.themoviedb.org/3";
const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/w500";

const posterCache: Record<string, string> = {};
const creditsCache: Record<string, any> = {};

// Helper to find movie ID
const getMovieId = async (title: string, year: number): Promise<number | null> => {
  try {
    const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(title)}&year=${year}`;
    const response = await fetch(searchUrl);
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return data.results[0].id;
    }
  } catch (e) { console.error(e); }
  return null;
};

export const getRealPoster = async (title: string, year: number): Promise<string | null> => {
  if (!API_KEY) return null;
  const cacheKey = `${title}-${year}`;
  if (posterCache[cacheKey]) return posterCache[cacheKey];

  try {
    const id = await getMovieId(title, year);
    if (id) {
        const detailUrl = `${BASE_URL}/movie/${id}?api_key=${API_KEY}`;
        const res = await fetch(detailUrl);
        const data = await res.json();
        if (data.poster_path) {
            const fullUrl = `${IMAGE_BASE_URL}${data.poster_path}`;
            posterCache[cacheKey] = fullUrl;
            return fullUrl;
        }
    }
  } catch (error) { console.error("TMDB Poster Error:", error); }
  return null;
};

export const getRealCredits = async (title: string, year: number): Promise<{director: string, cast: string[], runtime: number, screenplay: string[], music: string[]} | null> => {
    if (!API_KEY) return null;
    const cacheKey = `${title}-${year}-credits-full`;
    if (creditsCache[cacheKey]) return creditsCache[cacheKey];

    try {
        const id = await getMovieId(title, year);
        if (id) {
            const creditsUrl = `${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits`;
            const res = await fetch(creditsUrl);
            const data = await res.json();
            
            const director = data.credits?.crew?.find((p: any) => p.job === 'Director')?.name || "Unknown";
            
            // Get Screenplay / Writer
            const screenplay = data.credits?.crew
                ?.filter((p: any) => p.job === 'Screenplay' || p.job === 'Writer')
                .slice(0, 2)
                .map((p: any) => p.name) || [];

            // Get Composer
            const music = data.credits?.crew
                ?.filter((p: any) => p.job === 'Original Music Composer' || p.job === 'Music')
                .slice(0, 2)
                .map((p: any) => p.name) || [];

            const cast = data.credits?.cast?.slice(0, 5).map((p: any) => p.name) || [];
            const runtime = data.runtime || 0;

            const result = { director, cast, runtime, screenplay, music };
            creditsCache[cacheKey] = result;
            return result;
        }
    } catch (e) { console.error("TMDB Credits Error:", e); }
    return null;
};
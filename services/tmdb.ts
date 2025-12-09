import { createFilm } from '../constants';
import { Film } from '../types';

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

export const getRealCredits = async (title: string, year: number): Promise<{director: string, cast: string[], runtime: number, screenplay: string[], music: string[], overview: string, vote_average: number, dop: string[], keywords: string[], recommendations: any[], tagline: string} | null> => {
    if (!API_KEY) return null;
    const cacheKey = `${title}-${year}-credits-full`;
    if (creditsCache[cacheKey]) return creditsCache[cacheKey];

    try {
        const id = await getMovieId(title, year);
        if (id) {
            const creditsUrl = `${BASE_URL}/movie/${id}?api_key=${API_KEY}&append_to_response=credits,recommendations,keywords`;
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
            
            // Get DOP (Director of Photography)
            const dop = data.credits?.crew
                ?.filter((p: any) => p.job === 'Director of Photography' || p.job === 'Cinematographer')
                .slice(0, 2)
                .map((p: any) => p.name) || [];

            const cast = data.credits?.cast?.slice(0, 5).map((p: any) => p.name) || [];
            const runtime = data.runtime || 0;
            const overview = data.overview || "";
            const vote_average = data.vote_average || 0;
            const tagline = data.tagline || "";
            
            const keywords = data.keywords?.keywords?.map((k: any) => k.name).slice(0, 5) || [];
            const recommendations = data.recommendations?.results?.slice(0, 4).map((r: any) => ({
                id: r.id,
                title: r.title,
                year: r.release_date ? parseInt(r.release_date.split('-')[0]) : 0,
                posterUrl: r.poster_path ? `${IMAGE_BASE_URL}${r.poster_path}` : undefined
            })) || [];

            const result = { director, cast, runtime, screenplay, music, overview, vote_average, dop, keywords, recommendations, tagline };
            creditsCache[cacheKey] = result;
            return result;
        }
    } catch (e) { console.error("TMDB Credits Error:", e); }
    return null;
};

export const getDirectorPicks = async (query: string): Promise<any[]> => {
    if (!API_KEY) return [];
    try {
        // 1. Search for the person (Director)
        const personUrl = `${BASE_URL}/search/person?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
        const personRes = await fetch(personUrl);
        const personData = await personRes.json();

        if (!personData.results || personData.results.length === 0) {
            return [];
        }

        const person = personData.results[0];
        const personId = person.id;
        const personName = person.name;

        // 2. Get movie credits for this person
        const creditsUrl = `${BASE_URL}/person/${personId}/movie_credits?api_key=${API_KEY}`;
        const creditsRes = await fetch(creditsUrl);
        const creditsData = await creditsRes.json();

        // 3. Filter for Directing roles
        let movies = creditsData.crew?.filter((c: any) => c.job === 'Director') || [];
        
        // If no directing credits, fallback to cast (maybe they meant an actor)
        if (movies.length === 0 && creditsData.cast) {
            movies = creditsData.cast;
        }

        // 4. Sort by popularity (descending) to get "Picks" / Top films
        movies.sort((a: any, b: any) => b.popularity - a.popularity);

        // 5. Map to simple format including Overview and Vote Average
        return movies.slice(0, 10).map((m: any) => ({
            title: m.title,
            year: m.release_date ? parseInt(m.release_date.split('-')[0]) : 0,
            director: personName, // Use the searched person's name as the key director for context
            posterUrl: m.poster_path ? `${IMAGE_BASE_URL}${m.poster_path}` : undefined,
            overview: m.overview,
            vote_average: m.vote_average
        }));

    } catch (e) {
        console.error("TMDB Director Picks Error:", e);
        return [];
    }
};

export const searchMovies = async (query: string): Promise<Film[]> => {
    if (!API_KEY) return [];
    try {
        const searchUrl = `${BASE_URL}/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;
        const response = await fetch(searchUrl);
        const data = await response.json();

        if (!data.results) return [];

        return data.results.map((m: any) => {
            const releaseDate = m.release_date ? m.release_date.split('-')[0] : "";
            const year = releaseDate ? parseInt(releaseDate) : 0;
            const poster = m.poster_path ? `${IMAGE_BASE_URL}${m.poster_path}` : undefined;
            
            // Create base film object using the helper
            // We use "Unknown" for director initially as search results don't provide crew.
            const film = createFilm(m.title, year, "Unknown", poster);
            
            // Enrich with details available in search result
            film.plot = m.overview;
            film.imdbScore = m.vote_average;
            
            // Append TMDB ID to internal slug to ensure uniqueness in search lists
            film.id = `${film.id}-${m.id}`;
            
            return film;
        });

    } catch (e) {
        console.error("TMDB Search Error:", e);
        return [];
    }
};
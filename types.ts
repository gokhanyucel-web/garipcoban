export interface Film {
  id: string;
  title: string;
  year: number;
  director: string;
  runtime?: number; // in minutes
  posterUrl?: string; // Optional URL for poster
  ves: number; // Visual Excellence Score (0-100)
  isCustomEntry?: boolean;
  
  // Extended Metadata
  plot?: string;
  cinematicImportance?: string;
  listContext?: string;
  
  // Credits
  screenplay?: string[];
  music?: string[];
  cast?: string[];
  
  // Ratings
  rtScore?: number; // 0-100
  imdbScore?: number; // 0-10
  letterboxdScore?: number; // 0-5

  briefing?: string;
  streamingServices?: string[];

  // External Links
  imdb?: string;
  letterboxd?: string;
}

export interface FilmAnalysis {
  summary: string;
  significance: string;
  funFact: string;
  director: string;
  cast: string[];
  year: number;
}

export interface Tier {
  level: number;
  name: string;
  films: Film[];
}

export type UserRole = 'user' | 'curator' | 'admin';

export interface CuratedList {
  id: string;
  title: string;
  subtitle: string;
  description?: string;
  author?: string;
  tiers: Tier[];
  seriesTiers?: Tier[]; // For lists that have a sequel/franchise structure
  isCustom?: boolean;
  status?: 'draft' | 'published';
  privacy?: 'public' | 'private';
  originalListId?: string;
  sherpaNotes?: Record<string, string>; // filmId -> note text

  // Discovery / curator attribution (set on lists fetched from OTHER users)
  isExternal?: boolean;          // true if this list belongs to another user (read-only here)
  authorRole?: UserRole;         // role of the list's author, for the verified ✓ badge
  authorUsername?: string;       // author's profile username (used for /c/:username)
  authorAvatar?: string;         // author's avatar url
}

export interface UserFilmLog {
  watched: boolean;
  rating: number; // 0 if not rated, 1-5 otherwise
  notes?: string;
}

export type UserDatabase = Record<string, UserFilmLog>;

export interface ListCategory {
  title: string;
  lists: CuratedList[];
}

export type ArchiveCategory = ListCategory;

export interface Badge {
  id: string;
  title: string;
  listId: string;
  level: 'initiate' | 'adept' | 'master';
  unlockedDate: string;
}

export interface AI_Suggestion {
  title: string;
  year: number;
  director: string;
}

export type SortOption = 'curator' | 'chronological';
import React, { useEffect, useState } from 'react';
import { Film, UserFilmLog } from '../types';
import { getFilmAnalysis } from '../services/geminiService';
import { getRealCredits, getRealPoster } from '../services/tmdb';
import { getAllFilms } from '../constants';

interface FilmModalProps {
  film: Film | null;
  log?: UserFilmLog;
  onUpdateLog?: (filmId: string, updates: Partial<{ watched: boolean; rating: number }>) => void;
  onClose: () => void;
  onNavigateToList: (listId: string) => void;
  sherpaNote?: string;
  isEditing?: boolean;
  onSaveNote?: (note: string) => void;
  isUGC?: boolean;
  listTitle?: string;
}

const FilmModal: React.FC<FilmModalProps> = ({ film, log, onUpdateLog, onClose, onNavigateToList, sherpaNote, isEditing, onSaveNote, isUGC, listTitle }) => {
  // Default structure to ensure boxes render immediately
  const [aiData, setAiData] = useState<{ analysis: string, trivia: string, vibes: string[] }>({
      analysis: "",
      trivia: "",
      vibes: []
  });
  const [vibePosters, setVibePosters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState(sherpaNote || "");
  const [hoverRating, setHoverRating] = useState(0);
  
  // Real Data State
  const [realDetails, setRealDetails] = useState<{director: string, cast: string[], runtime: number, screenplay: string[], music: string[], overview: string, vote_average: number, dop: string[], keywords: string[]} | null>(null);
  const [realPoster, setRealPoster] = useState<string | null>(null);

  const fetchVibePosters = (titles: string[]) => {
      titles.forEach(vibeTitle => {
        getRealPoster(vibeTitle, 0).then(url => {
            if (url) {
                setVibePosters(prev => ({...prev, [vibeTitle]: url}));
            }
        });
      });
  };

  const generateFallbackData = (currentFilm: Film) => {
      try {
          const allFilms = getAllFilms();
          const similar = allFilms
              .filter(f => f.id !== currentFilm.id)
              .map(f => {
                  let score = Math.random();
                  if (f.director === currentFilm.director) score += 0.5;
                  if (Math.abs(f.year - currentFilm.year) < 5) score += 0.2;
                  return { film: f, score };
              })
              .sort((a, b) => b.score - a.score)
              .slice(0, 3)
              .map(item => item.film.title);

          return {
              analysis: currentFilm.briefing || currentFilm.plot || `A significant entry in the ${currentFilm.year} cinematic landscape, directed by ${currentFilm.director}. Essential viewing for the archive.`,
              trivia: `This film is often cited as a key influence in the work of ${currentFilm.director}, representing a pivotal moment in their filmography.`,
              vibes: similar.length > 0 ? similar : ["Metropolis", "The Godfather", "Pulp Fiction"]
          };
      } catch (e) {
          // Absolute last resort fallback if getAllFilms fails
          return {
              analysis: "A cinematic work of significance.",
              trivia: "Released in " + currentFilm.year + ".",
              vibes: ["Cinema Paradiso", "The Godfather", "Pulp Fiction"]
          };
      }
  };

  useEffect(() => {
    if (!film) return;

    // RESET STATE
    setLoading(true);
    setNoteContent(sherpaNote || "");
    setRealDetails(null);
    setRealPoster(null);
    setVibePosters({});
    setAiData({ analysis: "", trivia: "", vibes: [] }); // Clear data so we don't show old stuff

    // 1. FETCH TMDB DATA (Non-blocking for the AI part, but useful for visuals)
    getRealCredits(film.title, film.year).then(data => setRealDetails(data));
    
    if (film.posterUrl && film.posterUrl.includes("placehold.co")) {
        getRealPoster(film.title, film.year).then(url => setRealPoster(url));
    } else {
        setRealPoster(film.posterUrl || null);
    }

    if (!film.plot || film.plot.length < 10) {
        getRealCredits(film.title, film.year).then(data => {
            if (data) setRealDetails(data);
        });
    }

    // 2. FETCH AI/FALLBACK DATA (The Blocking Part)
    const fetchData = async () => {
        // Force a minimum loading time for better UX (prevents instant flash)
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 600));
        let resultData;

        try {
            if (film.isCustomEntry) {
                resultData = { 
                    analysis: film.plot || "Custom entry curated by user.", 
                    trivia: "Added via Custom List.", 
                    vibes: [] 
                };
            } else {
                // Try API
                const aiResult = await getFilmAnalysis(film.title, film.director, film.year);
                if (aiResult) {
                    resultData = aiResult;
                } else {
                    throw new Error("AI Failed");
                }
            }
        } catch (e) {
            // Fallback
            resultData = generateFallbackData(film);
        }

        // Wait for minimum time
        await minLoadTime;

        // Set Data & Reveal
        setAiData(resultData);
        fetchVibePosters(resultData.vibes);
        setLoading(false);
    };

    fetchData();

  }, [film]);

  if (!film) return null;

  const watched = log?.watched || false;
  const rating = log?.rating || 0;
  const displayRating = hoverRating > 0 ? hoverRating : rating;
  
  // Display Helpers
  const displayDirector = realDetails?.director || film.director;
  const displayRuntime = realDetails?.runtime || film.runtime;
  const displayScreenplay = realDetails?.screenplay || film.screenplay;
  const displayMusic = realDetails?.music || film.music;
  const displayImage = realPoster || film.posterUrl;
  const displayCast = realDetails?.cast || film.cast;
  const displayDop = realDetails?.dop || [];
  const displaySynopsis = realDetails?.overview || film.plot || "No details available.";
  const displayVoteAverage = realDetails?.vote_average ? realDetails.vote_average.toFixed(1) : (film.imdbScore ? film.imdbScore.toString() : "-");
  
  const RatingBar = () => (
    <div className="flex gap-1 w-full mt-2" onMouseLeave={() => setHoverRating(0)}>
      {Array.from({ length: 10 }).map((_, i) => {
        const val = (i + 1) * 0.5;
        const isActive = displayRating >= val;
        return (
          <button
            key={i}
            onMouseEnter={() => setHoverRating(val)}
            onClick={() => onUpdateLog && onUpdateLog(film.id, { rating: val })}
            className={`h-8 flex-1 border border-[#F5C71A] transition-all duration-150 ${isActive ? 'bg-[#F5C71A]' : 'bg-transparent'}`}
            title={`${val} Stars`}
          />
        );
      })}
    </div>
  );

  // Skeleton Components for Loading State
  const TextSkeleton = () => (
      <div className="animate-pulse space-y-2">
          <div className="h-3 bg-black/10 rounded w-full"></div>
          <div className="h-3 bg-black/10 rounded w-5/6"></div>
          <div className="h-3 bg-black/10 rounded w-4/6"></div>
      </div>
  );

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-[#F5C71A] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 max-h-[90vh] overflow-y-auto text-black">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-black hover:bg-black hover:text-[#F5C71A] w-8 h-8 border-2 border-black flex items-center justify-center font-bold transition-colors">X</button>
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* LEFT COLUMN */}
          <div className="md:w-1/3 flex-shrink-0 flex flex-col items-center md:items-start space-y-4">
            <img src={displayImage || ''} className="w-full border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] object-cover" />
            
            <div className="w-full border-4 border-black bg-black text-[#F5C71A] p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
               <button onClick={() => onUpdateLog && onUpdateLog(film.id, { watched: !watched })} className={`w-full py-2 font-black uppercase border-2 border-[#F5C71A] transition-colors mb-4 ${watched ? 'bg-[#F5C71A] text-black' : 'bg-transparent text-[#F5C71A]'}`}>{watched ? '✓ WATCHED' : 'MARK AS WATCHED'}</button>
               <div className="w-full">
                 <div className="flex justify-between items-end"><span className="text-xs font-bold uppercase">Your Rating</span><span className="text-xl font-black">{rating > 0 ? rating : '-'}</span></div>
                 <RatingBar />
               </div>
            </div>
            
            <div className="w-full flex justify-between gap-2 text-xs font-mono font-bold">
                <div className="flex-1 bg-black text-[#F5C71A] border border-[#F5C71A] p-1 flex items-center justify-center gap-2">
                    <span className="opacity-70">RT</span>
                    <span className="text-sm">{film.rtScore ? `${film.rtScore}%` : '-'}</span>
                </div>
                <div className="flex-1 bg-black text-[#F5C71A] border border-[#F5C71A] p-1 flex items-center justify-center gap-2">
                    <span className="opacity-70">IMDB</span>
                    <span className="text-sm">{displayVoteAverage}</span>
                </div>
                <div className="flex-1 bg-black text-[#F5C71A] border border-[#F5C71A] p-1 flex items-center justify-center gap-2">
                    <span className="opacity-70">LB</span>
                    <span className="text-sm">{film.letterboxdScore ? film.letterboxdScore : '-'}</span>
                </div>
            </div>

            <div className="w-full text-black border-2 border-black bg-white/20 p-3 text-sm space-y-2">
               <div className="grid grid-cols-[80px_1fr] gap-2 border-b border-black/20 pb-2"><span className="font-bold uppercase opacity-70">Director</span><span className="font-bold">{displayDirector}</span></div>
               <div className="grid grid-cols-[80px_1fr] gap-2 border-b border-black/20 pb-2"><span className="font-bold uppercase opacity-70">Cast</span><span className="font-medium text-xs leading-tight">{displayCast && displayCast.length > 0 ? displayCast.slice(0, 3).join(', ') : '-'}</span></div>
               <div className="grid grid-cols-[80px_1fr] gap-2 border-b border-black/20 pb-2"><span className="font-bold uppercase opacity-70">Writer</span><span className="font-medium italic">{displayScreenplay ? displayScreenplay.join(', ') : '-'}</span></div>
               <div className="grid grid-cols-[80px_1fr] gap-2"><span className="font-bold uppercase opacity-70">Runtime</span><span className="font-bold">{displayRuntime}m</span></div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:w-2/3 flex-grow flex flex-col gap-6">
            <header className="border-b-4 border-black pb-4">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">{film.title}</h2>
              <div className="flex justify-between items-end">
                <div className="flex gap-4"><p className="text-xl font-mono font-bold">YEAR: {film.year}</p></div>
                {listTitle && <p className="text-xs font-mono opacity-60 uppercase">Context: {listTitle}</p>}
              </div>
            </header>

            {(sherpaNote || isEditing) && <div className="bg-black text-[#F5C71A] p-4 border-2 border-black"> 
                <h3 className="font-black text-sm uppercase tracking-widest mb-2">Sherpa Note</h3> 
                {isEditing ? <textarea className="w-full bg-transparent border border-[#F5C71A] p-2 text-sm" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} /> : <p className="font-mono text-sm italic">"{sherpaNote}"</p>} 
                {isEditing && <button onClick={() => onSaveNote && onSaveNote(noteContent)} className="bg-[#F5C71A] text-black font-bold uppercase text-xs px-4 py-2 mt-2">Save Note</button>} 
            </div>}

            <div className="space-y-6">
                {/* SYNOPSIS - ALWAYS VISIBLE */}
                <div className="bg-[#F5C71A] p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-lg mb-2 uppercase">Synopsis</h3>
                    <p className="text-lg font-medium leading-relaxed font-sans">{displaySynopsis}</p>
                </div>

                {/* AI ANALYSIS - ALWAYS RENDER CONTAINER */}
                <div className="flex flex-col gap-6">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h3 className="font-black text-lg uppercase">Why This Film?</h3>
                        </div>
                        {loading ? <TextSkeleton /> : <p className="text-lg italic font-medium">{aiData.analysis}</p>}
                    </div>
                    
                    {/* TRIVIA BOX - ALWAYS RENDER CONTAINER */}
                    <div className="relative bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4 min-h-[100px]">
                        <div className="absolute -top-3 left-4 bg-black text-[#F5C71A] px-3 py-1 text-xs font-black uppercase tracking-widest border border-black transform -rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                            ★ SHERPA INTEL
                        </div>
                        {loading ? (
                            <div className="pt-2"><TextSkeleton /></div>
                        ) : (
                            <p className="font-mono text-sm leading-relaxed text-black pt-2">{aiData.trivia}</p>
                        )}
                    </div>
                </div>

                {/* AI VIBES - ALWAYS RENDER CONTAINER */}
                <div className="pt-6 border-t-4 border-black">
                    <h3 className="font-black text-lg mb-4 uppercase">Curator Recommends</h3>
                    <div className="relative bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] min-h-[150px]">
                         <div className="absolute -top-3 left-4 bg-black text-[#F5C71A] px-3 py-1 text-xs font-black uppercase tracking-widest border border-black transform rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                            Vibes Check
                        </div>
                        <div className="pt-2">
                            {loading ? (
                                <div className="grid grid-cols-3 gap-3 animate-pulse">
                                    <div className="aspect-[2/3] bg-black/10"></div>
                                    <div className="aspect-[2/3] bg-black/10"></div>
                                    <div className="aspect-[2/3] bg-black/10"></div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {aiData.vibes.map((vibe, idx) => (
                                        <div key={idx} className="flex flex-col gap-1 group cursor-default">
                                            <div className="w-full aspect-[2/3] bg-gray-200 border-2 border-black overflow-hidden relative">
                                                {vibePosters[vibe] ? (
                                                    <img src={vibePosters[vibe]} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center bg-black/10 text-[9px] text-center p-1 font-mono uppercase opacity-50">Image Missing</div>
                                                )}
                                            </div>
                                            <span className="font-bold uppercase text-[10px] leading-tight text-center text-black">{vibe}</span>
                                        </div>
                                    ))}
                                    {aiData.vibes.length === 0 && <div className="col-span-3 text-center text-xs font-mono opacity-50">No recommendations available.</div>}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* THEMES */}
                {realDetails?.keywords && realDetails.keywords.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-black/20">
                        <h3 className="font-black text-xs mb-2 uppercase tracking-widest opacity-60">THEMES</h3>
                        <div className="flex flex-wrap gap-2">
                            {realDetails.keywords.map(k => (
                                <span key={k} className="px-2 py-1 border border-black text-[10px] font-bold uppercase hover:bg-black hover:text-[#F5C71A] cursor-default">#{k}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FilmModal;
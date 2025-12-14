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
  // AI Data State
  const [aiData, setAiData] = useState<{ analysis: string, trivia: string, vibes: string[] } | null>(null);
  
  // Visuals State
  const [vibePosters, setVibePosters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState(sherpaNote || "");
  const [hoverRating, setHoverRating] = useState(0);
  
  // Real Data State (TMDB)
  const [realDetails, setRealDetails] = useState<{director: string, cast: string[], runtime: number, screenplay: string[], music: string[], overview: string, vote_average: number, dop: string[], keywords: string[], recommendations: any[]} | null>(null);
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

  useEffect(() => {
    if (!film) return;

    // RESET STATE
    setLoading(true);
    setNoteContent(sherpaNote || "");
    setRealDetails(null);
    setRealPoster(null);
    setVibePosters({});
    setAiData(null);

    // 1. FETCH TMDB DATA FIRST (We need this for the high-quality fallback if AI fails)
    const loadRealData = async () => {
        let details = null;
        try {
            details = await getRealCredits(film.title, film.year);
            if (details) setRealDetails(details);
            
            // Poster logic
            if (film.posterUrl && film.posterUrl.includes("placehold.co")) {
                const url = await getRealPoster(film.title, film.year);
                if (url) setRealPoster(url);
            } else {
                setRealPoster(film.posterUrl || null);
            }
        } catch (e) {
            console.error("TMDB Fetch Error", e);
        }
        return details;
    };

    // 2. FETCH AI DATA (With Pulse Effect)
    const loadAiData = async (tmdbDetails: any) => {
        // Force minimum load time for the "Pulse" effect (UX)
        const minLoadPromise = new Promise(resolve => setTimeout(resolve, 800));
        
        let resultData = { analysis: "", trivia: "", vibes: [] as string[] };
        let aiSuccess = false;

        try {
            if (film.isCustomEntry) {
                 // Custom entries don't query AI to save tokens/time usually, but we can if we want.
                 // For now, simple fallback.
                 resultData.analysis = film.plot || "User curated entry.";
                 resultData.trivia = "Added via Custom Journey.";
                 aiSuccess = true;
            } else {
                // Race Condition: 4 seconds timeout for AI
                const apiPromise = getFilmAnalysis(film.title, film.director, film.year);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 4000));

                const aiResult = await Promise.race([apiPromise, timeoutPromise]) as any;
                
                if (aiResult) {
                    resultData = aiResult;
                    aiSuccess = true;
                }
            }
        } catch (e) {
            console.log("AI Unavailable, switching to high-fidelity backups.");
        }

        // Wait for the pulse effect to finish
        await minLoadPromise;

        // FALLBACK LOGIC (High Fidelity Only)
        if (!aiSuccess) {
            // 1. Analysis: If failed, we DO NOT make up text. 
            // We leave it empty or use the TMDB tagline if available, or a system message.
            resultData.analysis = "Analysis unavailable."; 
            
            // 2. Trivia: If failed, show nothing.
            resultData.trivia = "";

            // 3. Vibes: CRITICAL. Use TMDB Recommendations instead of AI.
            // This ensures high-quality "More Like This" without hallucination.
            if (tmdbDetails && tmdbDetails.recommendations && tmdbDetails.recommendations.length > 0) {
                resultData.vibes = tmdbDetails.recommendations.map((r: any) => r.title).slice(0, 3);
            } else {
                 resultData.vibes = [];
            }
        }

        setAiData(resultData);
        if (resultData.vibes.length > 0) fetchVibePosters(resultData.vibes);
        setLoading(false);
    };

    // Execute Sequence
    loadRealData().then((details) => loadAiData(details));

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

  // High-End Skeleton Loader
  const SkeletonLine = ({ width }: { width: string }) => (
      <div className={`h-3 bg-black/10 rounded ${width} animate-pulse mb-2`}></div>
  );

  const BoxSkeleton = () => (
      <div className="w-full h-full flex flex-col gap-2 p-1">
          <SkeletonLine width="w-full" />
          <SkeletonLine width="w-11/12" />
          <SkeletonLine width="w-4/5" />
      </div>
  );

  const VibeSkeleton = () => (
      <div className="grid grid-cols-3 gap-3">
           <div className="aspect-[2/3] bg-black/10 animate-pulse border border-black/5"></div>
           <div className="aspect-[2/3] bg-black/10 animate-pulse border border-black/5"></div>
           <div className="aspect-[2/3] bg-black/10 animate-pulse border border-black/5"></div>
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
                        {loading ? <BoxSkeleton /> : <p className="text-lg italic font-medium">{aiData?.analysis}</p>}
                    </div>
                    
                    {/* TRIVIA BOX - CONDITIONALLY RENDER OR SKELETON */}
                    {loading ? (
                        <div className="relative bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4 min-h-[100px]">
                             <div className="absolute -top-3 left-4 bg-black text-[#F5C71A] px-3 py-1 text-xs font-black uppercase tracking-widest border border-black transform -rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                                ★ SHERPA INTEL
                            </div>
                            <div className="pt-2"><BoxSkeleton /></div>
                        </div>
                    ) : (
                        aiData?.trivia && (
                            <div className="relative bg-white border-4 border-black p-5 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] mt-4 min-h-[100px]">
                                <div className="absolute -top-3 left-4 bg-black text-[#F5C71A] px-3 py-1 text-xs font-black uppercase tracking-widest border border-black transform -rotate-1 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)]">
                                    ★ SHERPA INTEL
                                </div>
                                <p className="font-mono text-sm leading-relaxed text-black pt-2">{aiData.trivia}</p>
                            </div>
                        )
                    )}
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
                                <VibeSkeleton />
                            ) : (
                                <div className="grid grid-cols-3 gap-3">
                                    {aiData?.vibes && aiData.vibes.length > 0 ? aiData.vibes.map((vibe, idx) => (
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
                                    )) : (
                                        <div className="col-span-3 text-center text-xs font-mono opacity-50 py-4">
                                            No archival recommendations found.
                                        </div>
                                    )}
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
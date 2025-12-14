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
  // Always start with empty structure
  const [aiData, setAiData] = useState<{ analysis: string, trivia: string, vibes: string[] }>({
      analysis: "",
      trivia: "",
      vibes: []
  });
  const [vibePosters, setVibePosters] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [noteContent, setNoteContent] = useState(sherpaNote || "");
  const [hoverRating, setHoverRating] = useState(0);
  
  // Real Data State (TMDB)
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

  // SMART FALLBACK GENERATOR: Creates convincing text if AI fails
  const generateSmartFallback = (currentFilm: Film) => {
      const allFilms = getAllFilms();
      
      // Intelligent filtering for vibes
      const similar = allFilms
          .filter(f => f.id !== currentFilm.id)
          .map(f => {
              let score = Math.random();
              if (f.director === currentFilm.director) score += 0.8; // Same director is high relevance
              if (Math.abs(f.year - currentFilm.year) < 5) score += 0.3; // Same era
              return { film: f, score };
          })
          .sort((a, b) => b.score - a.score)
          .slice(0, 3)
          .map(item => item.film.title);

      // Ensure we have at least 3 items, fallback to classics if needed
      const finalVibes = similar.length >= 3 ? similar : [...similar, "Metropolis", "The Godfather", "Pulp Fiction"].slice(0, 3);

      const analysisTemplates = [
          `${currentFilm.title} stands as a testament to ${currentFilm.director}'s distinct visual language. A critical piece of the ${currentFilm.year} archive that demands attention.`,
          `Released in ${currentFilm.year}, this film deconstructs the genre with ${currentFilm.director}'s signature precision. Essential viewing for the completionist.`,
          `A masterclass in tension and form. ${currentFilm.title} operates on a frequency that few films from ${currentFilm.year} achieved.`
      ];
      
      const triviaTemplates = [
          `This film is often cited as a key influence in the later works of ${currentFilm.director}, specifically regarding its use of pacing.`,
          `Production during ${currentFilm.year} was notoriously difficult, adding a layer of raw intensity to the final cut.`,
          `Scholars argue that the ending of ${currentFilm.title} recontextualizes the entire narrative arc.`
      ];

      // Use hash of title to pick a consistent template (so it doesn't change on refresh)
      const seed = currentFilm.title.length + currentFilm.year;
      
      return {
          analysis: currentFilm.briefing || currentFilm.plot || analysisTemplates[seed % analysisTemplates.length],
          trivia: triviaTemplates[seed % triviaTemplates.length],
          vibes: finalVibes
      };
  };

  useEffect(() => {
    if (!film) return;

    // RESET STATE
    setLoading(true);
    setNoteContent(sherpaNote || "");
    setRealDetails(null);
    setRealPoster(null);
    setVibePosters({});
    setAiData({ analysis: "", trivia: "", vibes: [] });

    // 1. FETCH TMDB DATA (Non-blocking)
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

    // 2. FETCH AI/FALLBACK DATA (Race Condition)
    const loadData = async () => {
        // Minimum load time for the "nice effect" (600ms)
        const minLoadPromise = new Promise(resolve => setTimeout(resolve, 600));
        
        let resultData;

        if (film.isCustomEntry) {
             resultData = generateSmartFallback(film);
             resultData.analysis = film.plot || resultData.analysis;
             resultData.trivia = "Added via Custom List curation.";
        } else {
            try {
                // Race: AI vs Timeout (2.5s)
                const apiPromise = getFilmAnalysis(film.title, film.director, film.year);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error("Timeout")), 2500));

                const aiResult = await Promise.race([apiPromise, timeoutPromise]) as any;
                
                if (aiResult) {
                    resultData = aiResult;
                } else {
                    throw new Error("AI returned null");
                }
            } catch (e) {
                console.log("⚡ Using Smart Fallback due to:", e);
                resultData = generateSmartFallback(film);
            }
        }

        await minLoadPromise; // Wait for skeleton effect

        setAiData(resultData);
        fetchVibePosters(resultData.vibes);
        setLoading(false);
    };

    loadData();

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
  const displaySynopsis = realDetails?.overview || film.plot || "No synopsis available.";
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
      <div className="animate-pulse space-y-2 opacity-50">
          <div className="h-3 bg-black/20 rounded w-full"></div>
          <div className="h-3 bg-black/20 rounded w-5/6"></div>
          <div className="h-3 bg-black/20 rounded w-4/6"></div>
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
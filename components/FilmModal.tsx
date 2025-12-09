import React, { useEffect, useState } from 'react';
import { Film, FilmAnalysis, UserFilmLog } from '../types';
import { getFilmAnalysis } from '../services/geminiService';
import { getRealCredits, getRealPoster } from '../services/tmdb'; // TMDB'den veri çek
import { getListsContainingFilm, createFilm } from '../constants';

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
  const [analysis, setAnalysis] = useState<FilmAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [noteContent, setNoteContent] = useState(sherpaNote || "");
  const [featuredIn, setFeaturedIn] = useState<{id: string, title: string}[]>([]);
  const [hoverRating, setHoverRating] = useState(0);
  
  // Kesin veriler için state
  const [realDetails, setRealDetails] = useState<{director: string, cast: string[], runtime: number, screenplay: string[], music: string[], overview: string, vote_average: number, dop: string[], keywords: string[], recommendations: any[], tagline: string} | null>(null);
  const [realPoster, setRealPoster] = useState<string | null>(null);

  useEffect(() => {
    setNoteContent(sherpaNote || "");
    setRealDetails(null);
    setRealPoster(null);
    setAnalysis(null);
    setLoading(false);
    
    if (film) {
      setFeaturedIn(getListsContainingFilm(film.id));
      
      // 1. TMDB'den kesin veri ve poster çek
      getRealCredits(film.title, film.year).then(data => setRealDetails(data));
      if (film.posterUrl && film.posterUrl.includes("placehold.co")) {
          getRealPoster(film.title, film.year).then(url => setRealPoster(url));
      } else {
          setRealPoster(film.posterUrl || null);
      }

      // If plot is missing, ensure we get details to populate the right panel
      if (!film.plot || film.plot.length < 10) {
          getRealCredits(film.title, film.year).then(data => {
              if (data) setRealDetails(data);
          });
      }

      // 2. Gemini'den yorum/analiz çek
      if (film.isCustomEntry) {
         setAnalysis({ summary: film.plot || "Custom entry.", significance: "User curated.", funFact: "-", director: film.director, cast: film.cast || [], year: film.year });
      } else {
        setLoading(true);
        // Call AI with full context for better results
        getFilmAnalysis(film.title, film.director, film.year).then(data => { 
            setAnalysis(data); 
            setLoading(false); 
        });
      }
    }
  }, [film]);

  if (!film) return null;

  const watched = log?.watched || false;
  const rating = log?.rating || 0;
  const displayRating = hoverRating > 0 ? hoverRating : rating;
  
  // Left Side Data
  const displayDirector = realDetails?.director || film.director;
  const displayRuntime = realDetails?.runtime || film.runtime;
  const displayScreenplay = realDetails?.screenplay || film.screenplay;
  const displayMusic = realDetails?.music || film.music;
  const displayImage = realPoster || film.posterUrl;
  const displayCast = realDetails?.cast || analysis?.cast || film.cast;
  const displayDop = realDetails?.dop || [];

  // Right Side Data (Prioritize Real Details for facts, Analysis for flair)
  const displaySynopsis = realDetails?.overview || analysis?.summary || film.plot || "No details available.";
  const displayVoteAverage = realDetails?.vote_average ? realDetails.vote_average.toFixed(1) : (film.imdbScore ? film.imdbScore.toString() : "-");
  
  // Use AI Significance (Curator Note) if available, otherwise Tagline, otherwise default
  const displayWhy = loading ? "Consulting Archives..." : (analysis?.significance || realDetails?.tagline || "A significant entry in cinema history.");

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

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-5xl bg-[#F5C71A] border-4 border-black shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] p-6 md:p-8 max-h-[90vh] overflow-y-auto text-black">
        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-black hover:bg-black hover:text-[#F5C71A] w-8 h-8 border-2 border-black flex items-center justify-center font-bold transition-colors">X</button>
        <div className="flex flex-col md:flex-row gap-8">
          
          {/* LEFT COLUMN: Poster, User Actions, Credits */}
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

            {film.streamingServices && film.streamingServices.length > 0 && (
                <div className="w-full">
                    <div className="text-[10px] font-bold uppercase opacity-60 mb-1">Where to watch:</div>
                    <div className="flex flex-wrap gap-1">
                        {film.streamingServices.map(s => (
                            <span key={s} className="px-2 py-1 bg-black text-[#F5C71A] text-[9px] font-bold uppercase border border-white/20">{s}</span>
                        ))}
                    </div>
                </div>
            )}

            {/* CREDITS BOX */}
            <div className="w-full text-black border-2 border-black bg-white/20 p-3 text-sm space-y-2">
               <div className="grid grid-cols-[80px_1fr] gap-2 border-b border-black/20 pb-2">
                  <span className="font-bold uppercase opacity-70">Director</span>
                  <span className="font-bold">{displayDirector}</span>
               </div>
               <div className="grid grid-cols-[80px_1fr] gap-2 border-b border-black/20 pb-2">
                  <span className="font-bold uppercase opacity-70">Cast</span>
                  <span className="font-medium text-xs leading-tight">{displayCast && displayCast.length > 0 ? displayCast.slice(0, 3).join(', ') : '-'}</span>
               </div>
               <div className="grid grid-cols-[80px_1fr] gap-2 border-b border-black/20 pb-2">
                  <span className="font-bold uppercase opacity-70">Writer</span>
                  <span className="font-medium italic">{displayScreenplay ? displayScreenplay.join(', ') : '-'}</span>
               </div>
               <div className="grid grid-cols-[80px_1fr] gap-2 border-b border-black/20 pb-2">
                  <span className="font-bold uppercase opacity-70">DOP</span>
                  <span className="font-medium">{displayDop.length > 0 ? displayDop.join(', ') : '-'}</span>
               </div>
               <div className="grid grid-cols-[80px_1fr] gap-2 border-b border-black/20 pb-2">
                  <span className="font-bold uppercase opacity-70">Music</span>
                  <span className="font-medium italic">{displayMusic ? displayMusic.join(', ') : '-'}</span>
               </div>
               <div className="grid grid-cols-[80px_1fr] gap-2">
                  <span className="font-bold uppercase opacity-70">Runtime</span>
                  <span className="font-bold">{displayRuntime}m</span>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Content */}
          <div className="md:w-2/3 flex-grow flex flex-col gap-6">
            <header className="border-b-4 border-black pb-4">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">{film.title}</h2>
              <div className="flex justify-between items-end">
                <div className="flex gap-4">
                     <p className="text-xl font-mono font-bold">YEAR: {film.year}</p>
                     <p className="text-xl font-mono font-bold opacity-60">RATING: {displayVoteAverage}/10</p>
                </div>
                {listTitle && <p className="text-xs font-mono opacity-60 uppercase">Context: {listTitle}</p>}
              </div>
            </header>

            {(sherpaNote || isEditing) && <div className="bg-black text-[#F5C71A] p-4 border-2 border-black"> 
                <h3 className="font-black text-sm uppercase tracking-widest mb-2">Sherpa Note</h3> 
                {isEditing ? <textarea className="w-full bg-transparent border border-[#F5C71A] p-2 text-sm" value={noteContent} onChange={(e) => setNoteContent(e.target.value)} /> : <p className="font-mono text-sm italic">"{sherpaNote}"</p>} 
                {isEditing && <button onClick={() => onSaveNote && onSaveNote(noteContent)} className="bg-[#F5C71A] text-black font-bold uppercase text-xs px-4 py-2 mt-2">Save Note</button>} 
            </div>}

            <div className="space-y-6">
                {/* SYNOPSIS */}
                <div className="bg-[#F5C71A] p-4 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                    <h3 className="font-black text-lg mb-2 uppercase">Synopsis</h3>
                    <p className="text-lg font-medium leading-relaxed font-sans">
                        {displaySynopsis}
                    </p>
                </div>

                {/* SIGNIFICANCE / ANALYSIS */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="font-black text-lg mb-2 uppercase">Why This Film?</h3>
                        <p className={`text-lg italic font-medium ${loading ? 'opacity-50 animate-pulse' : ''}`}>
                            {displayWhy}
                        </p>
                    </div>
                    {analysis?.funFact && (
                        <div className="bg-black/5 p-4 border-2 border-black/10 border-dashed">
                            <h3 className="font-black text-xs mb-1 uppercase">★ Classified Info</h3>
                            <p className="text-sm font-mono opacity-80">{analysis.funFact}</p>
                        </div>
                    )}
                </div>

                {/* SIMILAR VIBES */}
                {realDetails?.recommendations && realDetails.recommendations.length > 0 && (
                    <div className="pt-6 border-t-4 border-black">
                        <h3 className="font-black text-lg mb-4 uppercase">Similar Vibes</h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {realDetails.recommendations.map(r => (
                                <div key={r.id} className="relative group cursor-pointer border-2 border-black" title={r.title}>
                                    {r.posterUrl ? <img src={r.posterUrl} className="w-full h-32 object-cover grayscale group-hover:grayscale-0 transition-all" /> : <div className="w-full h-32 bg-black/10 flex items-center justify-center text-xs font-bold p-2 text-center">{r.title}</div>}
                                    <div className="absolute bottom-0 left-0 w-full bg-black/80 text-[#F5C71A] text-[9px] p-1 font-bold uppercase truncate">{r.title}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* KEYWORDS / TRIVIA (MOVED TO BOTTOM) */}
                {realDetails?.keywords && realDetails.keywords.length > 0 && (
                    <div className="mt-4 pt-4 border-t-2 border-black/20">
                        <h3 className="font-black text-xs mb-2 uppercase tracking-widest opacity-60">TRIVIA / VIBE</h3>
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
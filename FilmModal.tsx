import React, { useEffect, useState } from 'react';
import { Film, UserFilmLog } from '../types';
import { getFilmAnalysis } from '../services/geminiService';
import { getRealCredits, getRealPoster } from '../services/tmdb'; // TMDB'den veri çek
import { getListsContainingFilm } from '../constants';

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
  const [aiData, setAiData] = useState<{ analysis: string, trivia: string, vibes: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [noteContent, setNoteContent] = useState(sherpaNote || "");
  const [hoverRating, setHoverRating] = useState(0);
  
  // Kesin veriler için state (TMDB)
  const [realDetails, setRealDetails] = useState<{director: string, cast: string[], runtime: number, screenplay: string[], music: string[], overview: string, vote_average: number, dop: string[], keywords: string[]} | null>(null);
  const [realPoster, setRealPoster] = useState<string | null>(null);

  useEffect(() => {
    setNoteContent(sherpaNote || "");
    setRealDetails(null);
    setRealPoster(null);
    setAiData(null);
    setLoading(false);
    
    if (film) {
      
      // 1. TMDB'den kesin veri ve poster çek
      getRealCredits(film.title, film.year).then(data => setRealDetails(data));
      if (film.posterUrl && film.posterUrl.includes("placehold.co")) {
          getRealPoster(film.title, film.year).then(url => setRealPoster(url));
      } else {
          setRealPoster(film.posterUrl || null);
      }

      // Plot kontrolü (Eğer plot yoksa TMDB'den gelen overview'i kullanmak için)
      if (!film.plot || film.plot.length < 10) {
          getRealCredits(film.title, film.year).then(data => {
              if (data) setRealDetails(data);
          });
      }

      // 2. Gemini'den yorum/analiz çek
      if (film.isCustomEntry) {
         setAiData({ analysis: film.plot || "Custom entry curated by user.", trivia: "Added via Custom List.", vibes: [] });
      } else {
        setLoading(true);
        // List Title'ı context olarak gönderiyoruz
        getFilmAnalysis(film.title, film.director, film.year, listTitle).then(data => { 
            setAiData(data); 
            setLoading(false); 
        });
      }
    }
  }, [film, listTitle]);

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
  const displayCast = realDetails?.cast || film.cast;
  const displayDop = realDetails?.dop || [];

  // Right Side Data 
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
            </div>

            {/* CREDITS */}
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
                  <span className="font-bold uppercase opacity-70">Runtime</span>
                  <span className="font-bold">{displayRuntime}m</span>
               </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:w-2/3 flex-grow flex flex-col gap-6">
            <header className="border-b-4 border-black pb-4">
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-2">{film.title}</h2>
              <div className="flex justify-between items-end">
                <div className="flex gap-4">
                     <p className="text-xl font-mono font-bold">YEAR: {film.year}</p>
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

                {/* AI ANALYSIS & TRIVIA */}
                <div className="flex flex-col gap-4">
                    <div>
                        <h3 className="font-black text-lg mb-2 uppercase">Why This Film?</h3>
                        <p className={`text-lg italic font-medium ${loading ? 'opacity-50 animate-pulse' : ''}`}>
                            {loading ? "Consulting Archives..." : (aiData?.analysis || "Analysis unavailable.")}
                        </p>
                    </div>
                    
                    {(aiData?.trivia || loading) && (
                        <div className="bg-black/5 p-4 border-2 border-black/10 border-dashed">
                            <h3 className="font-black text-xs mb-1 uppercase">★ Trivia</h3>
                            <p className={`text-sm font-mono opacity-80 ${loading ? 'animate-pulse' : ''}`}>{loading ? "Retrieving classified data..." : aiData?.trivia}</p>
                        </div>
                    )}
                </div>

                {/* VIBES */}
                {aiData?.vibes && aiData.vibes.length > 0 && (
                    <div className="pt-6 border-t-4 border-black">
                        <h3 className="font-black text-lg mb-4 uppercase">Curator Recommends (Vibes)</h3>
                        <div className="flex flex-col gap-2">
                            {aiData.vibes.map((vibe, idx) => (
                                <div key={idx} className="flex items-center gap-3 border-2 border-transparent hover:border-black p-2 transition-all cursor-default">
                                    <div className="w-2 h-2 bg-black"></div>
                                    <span className="font-bold uppercase text-lg">{vibe}</span>
                                </div>
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
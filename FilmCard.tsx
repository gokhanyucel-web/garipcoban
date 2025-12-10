import React, { useState, useEffect } from 'react';
import { Film, UserFilmLog } from '../types';
import { getRealPoster } from '../services/tmdb';

interface FilmCardProps {
  film: Film;
  log?: UserFilmLog;
  onClick: (film: Film) => void;
  isEditable?: boolean;
  onRemove?: (filmId: string) => void;
  hasNote?: boolean;
  onUpdateLog?: (filmId: string, updates: Partial<{ watched: boolean; rating: number }>) => void;
  onDragStart?: (e: React.DragEvent, film: Film) => void;
}

const FilmCard: React.FC<FilmCardProps> = ({ film, log, onClick, isEditable, onRemove, hasNote, onUpdateLog, onDragStart }) => {
  const isWatched = log?.watched || false;
  const rating = log?.rating || 0;
  const [displayPoster, setDisplayPoster] = useState(film.posterUrl);
  const [showWhy, setShowWhy] = useState(false);

  useEffect(() => {
    if (film.posterUrl && film.posterUrl.includes("placehold.co")) {
      getRealPoster(film.title, film.year).then((realUrl) => {
        if (realUrl) setDisplayPoster(realUrl);
      });
    } else {
      setDisplayPoster(film.posterUrl);
    }
  }, [film.title, film.year, film.posterUrl]);

  return (
    <div 
      className={`relative group ${isEditable ? 'opacity-100 z-50' : 'z-10'}`}
      style={{ zIndex: showWhy ? 999 : (isEditable ? 50 : 10) }}
      draggable={isEditable}
      onDragStart={(e) => { if(onDragStart) onDragStart(e, film); }}
    >
      {isEditable && (
         <div className="absolute -top-3 right-0 z-50 flex gap-1">
            <button onClick={(e) => { e.stopPropagation(); onRemove && onRemove(film.id); }} className="bg-red-600 text-white w-5 h-5 flex items-center justify-center text-xs font-bold border border-black hover:scale-110 transition-transform">✕</button>
         </div>
      )}

      <div onClick={() => onClick(film)} className={`relative flex flex-col items-center justify-center w-32 md:w-44 h-auto min-h-[5.5rem] border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all duration-300 ease-in-out bg-[#F5C71A] text-black ${isWatched ? 'bg-black text-[#F5C71A]' : 'hover:bg-black hover:text-[#F5C71A]'} ${isEditable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer'} hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]`}>
        
        {hasNote && <div className="absolute -top-3 -left-1 text-[10px] w-5 h-5 flex items-center justify-center border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] bg-white text-black z-30 pointer-events-none">✎</div>}

        {!isEditable && (
          <button onClick={(e) => { e.stopPropagation(); onUpdateLog && onUpdateLog(film.id, { watched: !isWatched }); }} className="absolute top-0 right-0 z-40 w-8 h-8 flex items-start justify-end p-1 hover:scale-110 transition-transform duration-200 group/check" title="Toggle Watched">
             <div className={`w-3 h-3 border border-current transition-colors duration-300 ${isWatched ? 'bg-[#F5C71A]' : 'bg-transparent'}`}></div>
          </button>
        )}

        {/* WHY THIS FILM TOGGLE */}
        {!isEditable && (
            <button 
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowWhy(!showWhy); }}
                className="absolute top-0 left-0 z-40 bg-black text-white text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider hover:bg-white hover:text-black border-r border-b border-black"
            >
                {showWhy ? "Close" : "Why?"}
            </button>
        )}

        <div className="w-full h-48 md:h-60 mb-2 overflow-hidden border border-current relative bg-black/10">
            <img 
                src={displayPoster} 
                alt={film.title}
                className={`w-full h-full object-cover transition-all duration-500 ${isWatched ? 'grayscale opacity-60' : 'grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100'}`}
                loading="lazy"
            />
        </div>

        {rating > 0 && isWatched && <div className="absolute bottom-1 right-1 flex items-center gap-0.5 text-[10px] font-black opacity-80"><span>★</span><span>{rating}</span></div>}

        <span className="text-xs md:text-sm font-black text-inherit uppercase text-center leading-tight mt-1 select-none pointer-events-none transition-colors duration-300 px-1">{film.title}</span>
        <span className={`text-[10px] font-bold opacity-80 border px-1 rounded-sm mt-1 select-none pointer-events-none transition-colors duration-300 ${isWatched ? 'border-[#F5C71A]' : 'border-black'}`}>{film.year}</span>

        {/* EXPANDED INFO SECTION */}
        {showWhy && (
            <div 
                className="absolute top-full left-[-2px] w-[calc(100%+4px)] bg-[#F5C71A] border-2 border-black border-t-0 p-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-left flex flex-col gap-3 text-black cursor-default"
                style={{ zIndex: 999 }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* ANALYSIS */}
                <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Why This Film?</h4>
                    <p className="text-[10px] font-medium leading-tight">{film.briefing || "A cinematic essential."}</p>
                </div>
                
                {/* TRIVIA */}
                <div className="border-t border-black/10 pt-2">
                    <h4 className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Trivia</h4>
                    <p className="text-[10px] font-mono opacity-80 leading-tight">Director: {film.director} • Year: {film.year}</p>
                </div>

                {/* VIBES */}
                {(film.screenplay && film.screenplay.length > 0 && film.screenplay[0] !== "Unknown") && (
                    <div className="border-t border-black/10 pt-2">
                        <h4 className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Similar Vibes</h4>
                        <div className="flex flex-wrap gap-1">
                            {film.screenplay.map(v => (
                                <span key={v} className="px-1.5 py-0.5 bg-black text-[#F5C71A] text-[8px] font-bold uppercase">{v}</span>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default FilmCard;
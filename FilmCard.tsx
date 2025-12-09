import React, { useState, useEffect } from 'react';
import { Film, UserFilmLog } from '../types';
import { getRealPoster } from '../services/tmdb';
import { getFilmAnalysis } from '../services/geminiService';

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
  const [isExpanded, setIsExpanded] = useState(false);
  const [aiData, setAiData] = useState<{ analysis: string, trivia: string, vibes: string[] } | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  useEffect(() => {
    if (film.posterUrl && film.posterUrl.includes("placehold.co")) {
      getRealPoster(film.title, film.year).then((realUrl) => {
        if (realUrl) setDisplayPoster(realUrl);
      });
    } else {
      setDisplayPoster(film.posterUrl);
    }
  }, [film.title, film.year, film.posterUrl]);

  const handleToggleExpand = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const newState = !isExpanded;
      setIsExpanded(newState);
      
      if (newState && !aiData) {
          setLoadingAi(true);
          // If it's a custom entry, mock the data, otherwise fetch
          if (film.isCustomEntry) {
              setAiData({ analysis: film.plot || "User curated entry.", trivia: "No trivia available.", vibes: [] });
              setLoadingAi(false);
          } else {
              const data = await getFilmAnalysis(film.title, film.director, film.year);
              setAiData(data);
              setLoadingAi(false);
          }
      }
  };

  return (
    <div 
      className={`relative group ${isEditable ? 'opacity-100 z-50' : 'z-10'}`}
      style={{ zIndex: isExpanded ? 999 : (isEditable ? 50 : 10) }}
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
                onClick={handleToggleExpand}
                className="absolute top-0 left-0 z-40 bg-black text-white text-[9px] px-1.5 py-0.5 font-bold uppercase tracking-wider hover:bg-white hover:text-black border-r border-b border-black"
            >
                {isExpanded ? "Close" : "Why?"}
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
        {isExpanded && (
            <div 
                className="absolute top-full left-[-2px] w-[calc(100%+4px)] bg-[#F5C71A] border-2 border-black border-t-0 p-3 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] text-left flex flex-col gap-3 text-black cursor-default"
                style={{ zIndex: 999 }}
                onClick={(e) => e.stopPropagation()}
            >
                {loadingAi ? (
                    <div className="text-[10px] font-mono animate-pulse">CONSULTING ARCHIVES...</div>
                ) : (
                    <>
                        {/* ANALYSIS */}
                        <div>
                            <h4 className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Why This Film?</h4>
                            <p className="text-[10px] font-medium leading-tight">{aiData?.analysis}</p>
                        </div>
                        
                        {/* TRIVIA */}
                        {aiData?.trivia && (
                            <div className="border-t border-black/10 pt-2">
                                <h4 className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Trivia</h4>
                                <p className="text-[10px] font-mono opacity-80 leading-tight">{aiData.trivia}</p>
                            </div>
                        )}

                        {/* VIBES */}
                        {aiData?.vibes && aiData.vibes.length > 0 && (
                            <div className="border-t border-black/10 pt-2">
                                <h4 className="text-[9px] font-black uppercase tracking-widest mb-1 opacity-60">Curator Recommends</h4>
                                <div className="flex flex-wrap gap-1">
                                    {aiData.vibes.map(v => (
                                        <span key={v} className="px-1.5 py-0.5 bg-black text-[#F5C71A] text-[8px] font-bold uppercase">{v}</span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        )}
      </div>
    </div>
  );
};

export default FilmCard;
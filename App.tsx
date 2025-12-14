import React, { useState, useEffect, useMemo } from 'react';
import { ARCHIVE_CATEGORIES } from './constants';
import { Film, UserDatabase, AI_Suggestion } from './types';
import FilmCard from './components/FilmCard';
import FilmModal from './components/FilmModal';
import { getAIListSuggestions } from './services/geminiService';
import { searchMovies } from './services/tmdb';

const App: React.FC = () => {
  const [userDb, setUserDb] = useState<UserDatabase>(() => {
    try {
        const saved = localStorage.getItem('virgil_user_db');
        return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Film[]>([]);
  const [aiSuggestions, setAiSuggestions] = useState<AI_Suggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [view, setView] = useState<'home' | 'list' | 'search'>('home');

  useEffect(() => {
    localStorage.setItem('virgil_user_db', JSON.stringify(userDb));
  }, [userDb]);

  const handleUpdateLog = (filmId: string, updates: Partial<{ watched: boolean; rating: number }>) => {
    setUserDb(prev => {
      const current = prev[filmId] || { watched: false, rating: 0 };
      return { ...prev, [filmId]: { ...current, ...updates } };
    });
  };

  const handleNavigateToList = (listId: string) => {
    setCurrentListId(listId);
    setView('list');
    window.scrollTo(0, 0);
  };

  const handleHome = () => {
    setCurrentListId(null);
    setView('home');
    setSearchQuery("");
    setSearchResults([]);
    setAiSuggestions([]);
    window.scrollTo(0, 0);
  };

  const performSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setView('search');
    
    // TMDB Search
    const tmdbResults = await searchMovies(searchQuery);
    setSearchResults(tmdbResults);

    // AI Suggestions
    const aiResults = await getAIListSuggestions(searchQuery);
    setAiSuggestions(aiResults);
    
    setIsSearching(false);
  };

  const currentList = useMemo(() => {
    if (!currentListId) return null;
    for (const cat of ARCHIVE_CATEGORIES) {
      const found = cat.lists.find(l => l.id === currentListId);
      if (found) return found;
    }
    return null;
  }, [currentListId]);

  return (
    <div className="min-h-screen bg-[#F5C71A] text-black font-sans selection:bg-black selection:text-[#F5C71A]">
      <header className="sticky top-0 z-40 bg-[#F5C71A] border-b-4 border-black px-4 py-3 flex justify-between items-center shadow-sm">
        <h1 onClick={handleHome} className="text-4xl font-black tracking-tighter cursor-pointer hover:scale-105 transition-transform uppercase">
          THE SHERPA
        </h1>
        
        <form onSubmit={performSearch} className="flex gap-2">
            <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ask the Curator..."
                className="border-2 border-black bg-white px-3 py-1 font-bold text-sm uppercase placeholder:text-black/40 focus:outline-none focus:bg-black focus:text-[#F5C71A] w-32 md:w-64"
            />
            <button type="submit" className="bg-black text-[#F5C71A] px-4 py-1 font-black uppercase text-sm border-2 border-black hover:bg-white hover:text-black transition-colors">
                {isSearching ? "..." : "GO"}
            </button>
        </form>
      </header>

      <main className="p-4 md:p-8 max-w-7xl mx-auto min-h-[80vh]">
        
        {view === 'home' && (
            <div className="space-y-12">
                <div className="text-center mb-12 border-b-2 border-black pb-8">
                    <h2 className="text-6xl md:text-8xl font-black uppercase leading-none mb-4">Cinema<br/>Archives</h2>
                    <p className="text-xl font-bold font-mono">Curated paths to cinematic mastery.</p>
                </div>

                {ARCHIVE_CATEGORIES.map((cat, idx) => (
                    <div key={idx} className="space-y-6">
                        <h3 className="text-3xl font-black bg-black text-[#F5C71A] inline-block px-4 py-1 transform -rotate-1">{cat.title}</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {cat.lists.map(list => {
                                const totalFilms = list.tiers.reduce((acc, t) => acc + t.films.length, 0);
                                const watchedFilms = list.tiers.reduce((acc, t) => acc + t.films.filter(f => userDb[f.id]?.watched).length, 0);
                                const progress = totalFilms > 0 ? Math.round((watchedFilms / totalFilms) * 100) : 0;

                                return (
                                    <div key={list.id} onClick={() => handleNavigateToList(list.id)} className="group cursor-pointer border-4 border-black bg-white p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
                                        <div className="flex justify-between items-start mb-4">
                                            <h4 className="text-2xl font-black uppercase leading-none">{list.title}</h4>
                                            <span className="font-mono font-bold text-xs border border-black px-1">{progress}%</span>
                                        </div>
                                        <p className="font-bold opacity-60 uppercase text-sm mb-4">{list.subtitle}</p>
                                        <div className="w-full bg-black/10 h-2 mt-auto">
                                            <div className="bg-black h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        )}

        {view === 'list' && currentList && (
            <div className="animate-fadeIn">
                <button onClick={handleHome} className="mb-8 font-bold uppercase hover:underline">← Back to Archives</button>
                
                <header className="mb-12 border-b-4 border-black pb-6">
                    <h2 className="text-5xl md:text-7xl font-black uppercase mb-2">{currentList.title}</h2>
                    <p className="text-2xl font-bold font-mono opacity-70">{currentList.subtitle}</p>
                    {currentList.description && <p className="mt-4 text-lg font-medium max-w-2xl">{currentList.description}</p>}
                </header>

                <div className="space-y-16">
                    {currentList.tiers.map((tier) => (
                        <div key={tier.level} className="relative">
                             <div className="absolute -top-4 left-0 bg-black text-[#F5C71A] px-3 py-1 font-black text-sm uppercase transform -rotate-1 z-10">
                                {tier.name}
                             </div>
                             <div className="border-l-4 border-black pl-6 pt-6 pb-2">
                                <div className="flex flex-wrap gap-6">
                                    {tier.films.map(film => (
                                        <FilmCard 
                                            key={film.id} 
                                            film={film} 
                                            log={userDb[film.id]}
                                            onClick={setSelectedFilm}
                                            onUpdateLog={handleUpdateLog}
                                            hasNote={!!currentList.sherpaNotes?.[film.id]}
                                        />
                                    ))}
                                </div>
                             </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {view === 'search' && (
             <div className="animate-fadeIn">
                 <button onClick={handleHome} className="mb-8 font-bold uppercase hover:underline">← Back to Archives</button>
                 <h2 className="text-4xl font-black uppercase mb-8 border-b-4 border-black pb-4">
                    Search Results: "{searchQuery}"
                 </h2>

                 {aiSuggestions.length > 0 && (
                     <div className="mb-12">
                         <h3 className="text-xl font-black bg-black text-[#F5C71A] inline-block px-3 py-1 mb-4">SHERPA SUGGESTS</h3>
                         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                             {aiSuggestions.map((s, i) => (
                                 <div key={i} className="border-2 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                                     <h4 className="font-bold text-lg">{s.title}</h4>
                                     <p className="text-sm font-mono">{s.year} • {s.director}</p>
                                     <button 
                                        onClick={async () => {
                                            const results = await searchMovies(s.title);
                                            if (results.length > 0) setSelectedFilm(results[0]);
                                        }}
                                        className="mt-2 text-xs font-black uppercase underline hover:text-[#F5C71A] hover:bg-black"
                                     >
                                        View Details
                                     </button>
                                 </div>
                             ))}
                         </div>
                     </div>
                 )}

                 <div className="flex flex-wrap gap-6">
                     {searchResults.map(film => (
                         <FilmCard 
                            key={film.id} 
                            film={film} 
                            log={userDb[film.id]}
                            onClick={setSelectedFilm}
                            onUpdateLog={handleUpdateLog}
                         />
                     ))}
                     {searchResults.length === 0 && !isSearching && (
                         <p className="text-xl font-bold opacity-50">No records found in the archives.</p>
                     )}
                 </div>
             </div>
        )}

      </main>

      <footer className="border-t-4 border-black bg-black text-[#F5C71A] py-12 text-center">
          <p className="font-black uppercase tracking-widest text-sm">The Sherpa Project © 2025</p>
          <p className="font-mono text-xs opacity-60 mt-2">Curated by Virgil</p>
      </footer>

      {selectedFilm && ( 
        <FilmModal 
            film={selectedFilm} 
            log={userDb[selectedFilm.id]} 
            onUpdateLog={handleUpdateLog} 
            onClose={() => setSelectedFilm(null)} 
            onNavigateToList={handleNavigateToList} 
            sherpaNote={currentList?.sherpaNotes?.[selectedFilm.id]} 
            listTitle={currentList?.title} 
            forceRender={true} 
        /> 
      )}
    </div>
  );
};

export default App;
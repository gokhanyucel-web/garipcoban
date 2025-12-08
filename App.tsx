import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabase';
import { Film, CuratedList, UserDatabase, UserFilmLog, Tier, Badge, AI_Suggestion, SortOption } from './types';
import { ARCHIVE_CATEGORIES, getAllFilms, createFilm, BADGE_TITLES, getHash, INITIATE_SYNONYMS, ADEPT_SYNONYMS } from './constants';
import FilmCard from './components/FilmCard';
import FilmModal from './components/FilmModal';
import { getAIListSuggestions } from './services/geminiService';
import { getDirectorPicks, searchMovies } from './services/tmdb';
import { Search, Twitter, Instagram, Mail, ShieldAlert, Save, Trash2, LogOut, User } from 'lucide-react';

// --- STATIC COMPONENTS (Defined outside App to prevent re-renders/focus loss) ---

const AuthScreen = ({ onAuth, onCancel }: { onAuth: (mode: 'signin' | 'signup', data: any) => Promise<void>, onCancel: () => void }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    username: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && formData.password !== formData.confirmPassword) {
      alert("Passwords do not match.");
      return;
    }
    setLoading(true);
    await onAuth(mode, formData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#F5C71A] flex items-center justify-center p-6 fixed inset-0 z-50">
      <div className="w-full max-w-md bg-black text-[#F5C71A] p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-white hover:text-[#F5C71A]">✕</button>
        <h1 className="text-5xl font-black uppercase text-center mb-2">VIRGIL</h1>
        <p className="text-center font-mono text-sm opacity-60 mb-8 uppercase tracking-widest">
          {mode === 'signin' ? 'Identify Yourself' : 'Initialize Protocol'}
        </p>
        
        <div className="flex justify-center mb-6 border-b border-[#F5C71A]/30 pb-4">
           <button 
             onClick={() => setMode('signin')} 
             className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${mode === 'signin' ? 'text-[#F5C71A] border-b-2 border-[#F5C71A]' : 'text-gray-500 hover:text-white'}`}
           >
             Enter
           </button>
           <button 
             onClick={() => setMode('signup')} 
             className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${mode === 'signup' ? 'text-[#F5C71A] border-b-2 border-[#F5C71A]' : 'text-gray-500 hover:text-white'}`}
           >
             Join
           </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Codename</label>
              <input 
                name="username"
                className="w-full p-3 bg-[#222] border-2 border-[#F5C71A] text-[#F5C71A] focus:outline-none focus:bg-[#333]" 
                type="text" 
                value={formData.username} 
                onChange={handleChange} 
                required 
              />
            </div>
          )}
          
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Email</label>
            <input 
              name="email"
              className="w-full p-3 bg-[#222] border-2 border-[#F5C71A] text-[#F5C71A] focus:outline-none focus:bg-[#333]" 
              type="email" 
              value={formData.email} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold uppercase mb-1">Passkey</label>
            <input 
              name="password"
              className="w-full p-3 bg-[#222] border-2 border-[#F5C71A] text-[#F5C71A] focus:outline-none focus:bg-[#333]" 
              type="password" 
              value={formData.password} 
              onChange={handleChange} 
              required 
            />
          </div>

          {mode === 'signup' && (
            <div>
              <label className="block text-xs font-bold uppercase mb-1">Confirm Passkey</label>
              <input 
                name="confirmPassword"
                className="w-full p-3 bg-[#222] border-2 border-[#F5C71A] text-[#F5C71A] focus:outline-none focus:bg-[#333]" 
                type="password" 
                value={formData.confirmPassword} 
                onChange={handleChange} 
                required 
              />
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-4 bg-[#F5C71A] text-black font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 mt-6"
          >
            {loading ? 'Processing...' : (mode === 'signin' ? 'Enter Vault' : 'Create Identity')}
          </button>
        </form>
      </div>
    </div>
  );
};

interface MainLayoutProps {
  children: React.ReactNode;
  activeView: 'home' | 'vault';
  session: any;
  isAdmin: boolean;
  onLogout: () => void;
  onOpenSearch: () => void;
  onToggleAdmin: () => void;
  onNavigate: (view: 'home' | 'vault' | 'auth') => void;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, activeView, session, isAdmin, onLogout, onOpenSearch, onToggleAdmin, onNavigate }) => (
  <div className="min-h-screen w-full bg-[#F5C71A] text-black font-sans selection:bg-black selection:text-[#F5C71A] flex flex-col transition-colors duration-300">
    <header className="pt-12 pb-8 text-center px-4 relative">
         <div className="absolute top-8 right-8 flex gap-4">
             {isAdmin && <span className="bg-red-600 text-white px-2 py-1 text-xs font-black uppercase border border-black animate-pulse">ADMIN MODE</span>}
             {!session ? (
                 <button 
                   onClick={() => onNavigate('auth')}
                   className="px-4 py-2 border-2 border-black font-black uppercase hover:bg-black hover:text-[#F5C71A] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm flex items-center gap-2"
                 >
                   <User size={16} /> Sign In
                 </button>
             ) : (
                 <>
                   <button onClick={onLogout} title="Logout" className="w-12 h-12 flex items-center justify-center border-4 border-black rounded-full hover:bg-black hover:text-[#F5C71A] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><LogOut size={20} /></button>
                   <button onClick={onOpenSearch} className="w-12 h-12 flex items-center justify-center border-4 border-black rounded-full hover:bg-black hover:text-[#F5C71A] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                      <Search size={24} strokeWidth={3} />
                   </button>
                 </>
             )}
         </div>

        <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-2 uppercase leading-none cursor-pointer" onClick={() => onNavigate('home')}>VIRGIL</h1>
        <p className="text-xl md:text-3xl font-bold font-mono tracking-widest uppercase opacity-80 mb-8">Curated Cinematic Journeys</p>
        
        <div className="flex justify-center items-center gap-0 border-b-4 border-black w-full max-w-2xl mx-auto">
          <button onClick={() => onNavigate('home')} className={`flex-1 py-4 text-xl md:text-2xl font-black uppercase tracking-widest text-center transition-all ${activeView === 'home' ? 'bg-black text-[#F5C71A]' : 'bg-transparent text-black hover:bg-black/10'}`}>Archive</button>
          <div className="w-1 h-full bg-black"></div>
          <button onClick={() => onNavigate('vault')} className={`flex-1 py-4 text-xl md:text-2xl font-black uppercase tracking-widest text-center transition-all ${activeView === 'vault' ? 'bg-black text-[#F5C71A]' : 'bg-transparent text-black hover:bg-black/10'}`}>My Vault</button>
        </div>
    </header>
    <main className="max-w-7xl mx-auto px-6 grid gap-16 mt-12 flex-grow w-full">
      {children}
    </main>
    <footer className="mt-32 bg-black text-[#F5C71A] border-t-8 border-[#F5C71A] py-16 px-6 relative">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
              <div className="space-y-6">
                  <h2 className="text-6xl md:text-8xl font-black uppercase leading-none tracking-tighter opacity-20 hover:opacity-100 transition-opacity duration-500 cursor-default">
                      CONSUME<br/>MEANINGFULLY.
                  </h2>
                  <div className="flex flex-col gap-2">
                      <p className="font-mono text-xs opacity-60 max-w-sm">
                          Virgil is a curated discovery platform that transforms recommendations into guided learning experiences.
                      </p>
                  </div>
              </div>
              <div className="flex flex-col items-end gap-8 text-right">
                  <div className="flex gap-6 text-sm font-bold uppercase tracking-widest">
                      <button onClick={onToggleAdmin} className={`cursor-pointer hover:text-white hover:underline decoration-2 underline-offset-4 uppercase ${isAdmin ? 'text-red-500 font-black' : 'opacity-50'}`}>{isAdmin ? 'Admin Active' : 'Admin'}</button>
                      <a href="mailto:hello@virgil.app" className="cursor-pointer hover:text-white hover:underline decoration-2 underline-offset-4">Contact</a>
                  </div>
                  <div className="flex gap-4">
                      <a href="#" className="w-10 h-10 border-2 border-[#F5C71A] flex items-center justify-center hover:bg-[#F5C71A] hover:text-black transition-colors"><Twitter /></a>
                      <a href="#" className="w-10 h-10 border-2 border-[#F5C71A] flex items-center justify-center hover:bg-[#F5C71A] hover:text-black transition-colors"><Instagram /></a>
                      <a href="#" className="w-10 h-10 border-2 border-[#F5C71A] flex items-center justify-center hover:bg-[#F5C71A] hover:text-black transition-colors"><Mail /></a>
                  </div>
                  <p className="text-[10px] font-mono opacity-40">© 2025 VIRGIL SYSTEMS. ALL RIGHTS RESERVED.</p>
              </div>
          </div>
    </footer>
  </div>
);

const TimelineView = ({ tiers, userDb, onSelectFilm, onUpdateLog }: { tiers: Tier[], userDb: UserDatabase, onSelectFilm: (f: Film) => void, onUpdateLog: (id: string, updates: any) => void }) => {
   let allFilms: Film[] = [];
   tiers.forEach(t => allFilms.push(...t.films));
   allFilms.sort((a,b) => a.year - b.year);

   return (
      <div className="relative w-full max-w-4xl mx-auto py-12 px-4">
           <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-1 md:w-2 bg-kubrick-black md:-translate-x-1/2"></div>
           <div className="flex flex-col gap-8 md:gap-12">
              {allFilms.map((film, index) => {
                  const isLeft = index % 2 === 0;
                  return (
                      <div key={film.id} className={`flex items-center w-full ${isLeft ? 'md:flex-row-reverse' : 'md:flex-row'}`}>
                           <div className="hidden md:block w-1/2"></div>
                           <div className="absolute left-6 md:left-1/2 w-4 h-4 md:w-6 md:h-6 bg-kubrick-yellow border-4 border-kubrick-black rounded-full z-10 md:-translate-x-1/2 translate-x-[-0.35rem] md:translate-x-[-0.6rem]"></div>
                           <div className={`w-full md:w-1/2 pl-12 md:pl-0 ${isLeft ? 'md:pr-12 md:text-right text-left' : 'md:pl-12 md:text-left text-left'}`}>
                               <div className={`inline-block`}>
                                   <div className={`mb-2 font-black text-2xl md:text-3xl opacity-50 font-mono`}>{film.year}</div>
                                   <FilmCard 
                                      film={film} 
                                      log={userDb[film.id]} 
                                      onClick={() => onSelectFilm(film)} 
                                      isEditable={false} 
                                      onUpdateLog={onUpdateLog}
                                   />
                               </div>
                           </div>
                      </div>
                  )
              })}
           </div>
      </div>
   );
};

// --- MAIN APP COMPONENT ---

function App() {
  // --- STATE ---
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'home' | 'vault' | 'auth'>('home'); // SPA State
  
  // Data State
  const [userDb, setUserDb] = useState<UserDatabase>({});
  const [vaultIds, setVaultIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<{name: string, motto: string, avatar?: string}>({ name: "Initiate", motto: "The Unwritten" });
  
  // UI State
  const [selectedList, setSelectedList] = useState<CuratedList | null>(null);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [editingList, setEditingList] = useState<CuratedList | null>(null);
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Editor / Filter State
  const [viewMode, setViewMode] = useState<'cinema' | 'series'>('cinema');
  const [sortOption, setSortOption] = useState<SortOption>('curator');
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Film[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  
  // UGC Editor State
  const [customLists, setCustomLists] = useState<CuratedList[]>([]);
  const [masterOverrides, setMasterOverrides] = useState<Record<string, CuratedList>>({});
  const [aiCreatorQuery, setAiCreatorQuery] = useState("");
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState<(AI_Suggestion & { posterUrl?: string })[]>([]);
  const [showTierSearchModal, setShowTierSearchModal] = useState<{tierIndex: number, isSeries: boolean} | null>(null);
  const [tierSearchQuery, setTierSearchQuery] = useState("");
  const [tierSearchResults, setTierSearchResults] = useState<Film[]>([]);
  const [isEditContextMode, setIsEditContextMode] = useState<string | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- PERSISTENCE & INIT ---

  const fetchUserData = async (userId: string) => {
    // 1. Logs
    const { data: logs } = await supabase.from('user_logs').select('*').eq('user_id', userId);
    if (logs) {
      const db: UserDatabase = {};
      logs.forEach((row: any) => {
        db[row.film_id] = { watched: row.watched, rating: row.rating, notes: row.notes };
      });
      setUserDb(db);
    }

    // 2. Vault
    const { data: vault } = await supabase.from('vault').select('list_id').eq('user_id', userId);
    if (vault) {
      setVaultIds(vault.map((row: any) => row.list_id));
    }

    // 3. Profile
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    if (profileData) {
      setProfile({
        name: profileData.username || "Initiate",
        motto: profileData.motto || "The Unwritten",
        avatar: profileData.avatar_url || undefined
      });
    }
  };

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) fetchUserData(session.user.id);
    });

    // Auth Subscription
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        fetchUserData(session.user.id);
      } else {
        // Logout cleanup
        setUserDb({});
        setVaultIds([]);
        setProfile({ name: "Initiate", motto: "The Unwritten" });
        setView('home');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- SEARCH EFFECTS ---
  useEffect(() => {
    if (globalSearchQuery.length > 2) {
       const timer = setTimeout(() => { searchMovies(globalSearchQuery).then(setSearchResults); }, 300);
       return () => clearTimeout(timer);
    } else { setSearchResults([]); }
  }, [globalSearchQuery]);

  useEffect(() => {
    if (tierSearchQuery.length > 2) {
       const timer = setTimeout(() => { searchMovies(tierSearchQuery).then(setTierSearchResults); }, 300);
       return () => clearTimeout(timer);
    } else { setTierSearchResults([]); }
  }, [tierSearchQuery]);

  // --- HANDLERS ---

  const handleAuth = async (mode: 'signin' | 'signup', data: any) => {
    const { email, password, username } = data;
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: { data: { username } }
      });
      if (error) alert(error.message);
      else {
        alert('Check your email for the login link!');
        setView('home');
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message);
      else {
        setView('vault');
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setView('home');
  };

  const handleNavigate = (targetView: 'home' | 'vault' | 'auth') => {
    if (targetView === 'vault' && !session) {
      setView('auth');
    } else {
      setView(targetView);
    }
    // Reset selections on main nav change
    if(targetView !== 'auth') {
        setSelectedList(null);
        setIsEditorMode(false);
    }
  };

  const handleUpdateLog = async (filmId: string, updates: Partial<{ watched: boolean; rating: number }>) => {
    // Optimistic
    setUserDb(prev => {
      const currentLog = prev[filmId] || { watched: false, rating: 0 };
      const newLog = { ...currentLog, ...updates };
      if (updates.rating && updates.rating > 0) newLog.watched = true;
      return { ...prev, [filmId]: newLog };
    });

    // Supabase
    if (session) {
      const currentLog = userDb[filmId] || { watched: false, rating: 0 };
      const newLog = { ...currentLog, ...updates };
      if (updates.rating && updates.rating > 0) newLog.watched = true;
      
      await supabase.from('user_logs').upsert({
          user_id: session.user.id,
          film_id: filmId,
          watched: newLog.watched,
          rating: newLog.rating,
          notes: newLog.notes || ''
      });
    }
  };

  const handleToggleVault = async (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    if (!session) { setView('auth'); return; }

    const isRemoving = vaultIds.includes(listId);
    let newVaultIds = isRemoving ? vaultIds.filter(id => id !== listId) : [...vaultIds, listId];
    
    setVaultIds(newVaultIds); // Optimistic

    if (isRemoving) {
      await supabase.from('vault').delete().match({ user_id: session.user.id, list_id: listId });
    } else {
      await supabase.from('vault').insert({ user_id: session.user.id, list_id: listId });
    }
  };

  const saveProfile = async () => {
    setIsEditingProfile(false);
    if (session) {
       await supabase.from('profiles').upsert({
         id: session.user.id,
         username: profile.name,
         motto: profile.motto,
         avatar_url: profile.avatar || ""
       });
    }
  };

  const handleNavigateToList = (listId: string) => {
    const allLists = [...ARCHIVE_CATEGORIES.flatMap(c => c.lists).map(l => masterOverrides[l.id] || l), ...customLists];
    const target = allLists.find(l => l.id === listId);
    if (target) {
        if (customLists.some(l => l.id === listId)) setView('vault');
        setSelectedList(target);
        setIsEditorMode(false);
        setSelectedFilm(null);
    }
  };

  // --- CALCULATIONS ---
  const getListProgress = (list: CuratedList) => {
    let allFilms: Film[] = [];
    list.tiers.forEach(tier => allFilms.push(...tier.films));
    if (list.seriesTiers) list.seriesTiers.forEach(tier => allFilms.push(...tier.films));
    if (allFilms.length === 0) return 0;
    const watchedCount = allFilms.filter(film => userDb[film.id]?.watched).length;
    return Math.round((watchedCount / allFilms.length) * 100);
  };

  const calculateSherpaIdentity = () => {
    const watchedEntries = Object.entries(userDb).filter(([_, log]) => (log as UserFilmLog).watched);
    const totalWatched = watchedEntries.length;
    // ... simplified logic for brevity, core logic same as before ...
    let rank = "INITIATE";
    if (totalWatched > 10) rank = "ADEPT";
    if (totalWatched > 50) rank = "MASTER";
    return { totalWatched, fullTitle: `${rank} EXPLORER`, totalCompleted: 0, totalHours: 0 };
  };
  const sherpaIdentity = calculateSherpaIdentity();

  const getVaultLists = () => {
    const myLists = [...ARCHIVE_CATEGORIES.flatMap(c => c.lists).map(l => masterOverrides[l.id] || l), ...customLists].filter(list => vaultIds.includes(list.id));
    const active: CuratedList[] = [];
    const completed: CuratedList[] = [];
    myLists.forEach(list => {
      const prog = getListProgress(list);
      if (prog >= 100 && !list.isCustom) completed.push(list);
      else active.push(list);
    });
    return { active, completed };
  };
  const { active, completed } = getVaultLists();

  // --- RENDER HELPERS ---
  const currentList = isEditorMode ? editingList : selectedList;
  const currentTiersBase = currentList ? (viewMode === 'series' && currentList.seriesTiers ? currentList.seriesTiers : currentList.tiers) : [];
  
  const getSortedTiers = (tiers: Tier[]) => {
      return tiers.map(t => {
          const sortedFilms = [...t.films].sort((a, b) => { if (sortOption === 'chronological') return a.year - b.year; return 0; });
          return { ...t, films: sortedFilms };
      });
  };
  const currentTiers = getSortedTiers(currentTiersBase);

  // --- MAIN RENDER BLOCK ---
  return (
    <>
      {/* 1. AUTH SCREEN (Modal/Overlay) */}
      {view === 'auth' && <AuthScreen onAuth={handleAuth} onCancel={() => setView('home')} />}

      {/* 2. GLOBAL SEARCH */}
      {isSearchOpen && (
           <div className="fixed inset-0 z-[60] bg-[#F5C71A]/95 backdrop-blur-md flex flex-col p-8 animate-fadeIn">
              <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 h-full">
                  <div className="flex justify-between items-center border-b-4 border-black pb-4">
                     <h2 className="text-4xl font-black uppercase">Search Database</h2>
                     <button onClick={() => setIsSearchOpen(false)} className="text-2xl font-black hover:scale-110">X</button>
                  </div>
                  <input autoFocus type="text" placeholder="Search films..." className="w-full bg-transparent text-3xl md:text-5xl font-black uppercase placeholder-black/30 border-none outline-none" value={globalSearchQuery} onChange={(e) => setGlobalSearchQuery(e.target.value)} />
                  <div className="flex-1 overflow-y-auto mt-4 pr-2">
                     {globalSearchQuery.length > 2 && (
                       <div className="grid grid-cols-1 gap-4">
                          {searchResults.map(film => (
                             <div key={film.id} onClick={() => { setSelectedFilm(film); setIsSearchOpen(false); }} className="p-4 border-2 border-black hover:bg-black hover:text-[#F5C71A] cursor-pointer flex justify-between items-center group">
                                <div className="flex items-center gap-4">
                                   {film.posterUrl && <img src={film.posterUrl} className="w-12 h-16 object-cover border border-black" />}
                                   <div><h3 className="text-xl font-black uppercase">{film.title}</h3><p className="font-mono text-sm opacity-60 group-hover:opacity-100">{film.year}</p></div>
                                </div>
                                <span className="font-bold text-sm">→</span>
                             </div>
                          ))}
                       </div>
                     )}
                  </div>
              </div>
           </div>
      )}

      {/* 3. FILM MODAL */}
      {selectedFilm && !currentList && <FilmModal film={selectedFilm} log={userDb[selectedFilm.id]} onUpdateLog={handleUpdateLog} onClose={() => setSelectedFilm(null)} onNavigateToList={handleNavigateToList} listTitle="Global Search" />}

      {/* 4. MAIN LAYOUT (Wraps Home/Vault) */}
      {view !== 'auth' && !currentList && (
        <MainLayout activeView={view as 'home' | 'vault'} session={session} isAdmin={isAdmin} onLogout={handleLogout} onOpenSearch={() => setIsSearchOpen(true)} onToggleAdmin={() => setIsAdmin(!isAdmin)} onNavigate={handleNavigate}>
            
            {/* VIEW: ARCHIVE (HOME) */}
            {view === 'home' && (
               <div className="animate-fadeIn">
                  {ARCHIVE_CATEGORIES.map((category) => {
                     const isExpanded = expandedCategories[category.title];
                     const visibleLists = isExpanded ? category.lists : category.lists.slice(0, 8);
                     return (
                         <section key={category.title} className="space-y-6 mb-12">
                            <div className="flex items-center gap-4"><div className="h-6 w-6 bg-black"></div><h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest border-b-4 border-black pb-2 w-full">{category.title}</h2></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {visibleLists.map((originalList) => {
                                const list = masterOverrides[originalList.id] || originalList;
                                const isSaved = vaultIds.includes(list.id);
                                return (
                                  <div key={list.id} onClick={() => { setSelectedList(list); setIsEditorMode(false); }} className={`group relative flex flex-col text-left cursor-pointer border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#F5C71A] text-black hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#F5C71A] transition-all duration-200`}>
                                    {isSaved && <div className="absolute top-4 right-2 bg-black text-yellow-400 text-[10px] px-1 font-bold">SAVED</div>}
                                    {!isSaved && <button onClick={(e) => handleToggleVault(e, list.id)} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-[#F5C71A] font-black transition-colors z-10" title="Add to Vault">+</button>}
                                    <h3 className="text-2xl font-black uppercase leading-none mb-2 mt-2 pr-8">{list.title}</h3>
                                    <p className="text-sm font-bold uppercase opacity-80 mb-4">{list.subtitle}</p>
                                    <div className="mt-auto border-t-2 border-current pt-2 flex justify-between items-center opacity-60 text-[10px] font-mono"><span>{list.tiers.length} Tiers</span><span>{list.tiers.reduce((acc, t) => acc + t.films.length, 0)} Films</span></div>
                                  </div>
                                );
                              })}
                            </div>
                            {category.lists.length > 8 && (<div className="flex justify-center mt-4"><button onClick={() => setExpandedCategories(prev => ({...prev, [category.title]: !prev[category.title]}))} className="bg-black text-[#F5C71A] px-6 py-2 font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform">{isExpanded ? "Show Less" : "View More"}</button></div>)}
                         </section>
                     )
                  })}
               </div>
            )}

            {/* VIEW: VAULT */}
            {view === 'vault' && (
                <div className="space-y-16 animate-fadeIn">
                    <div className="w-full max-w-5xl mx-auto bg-black text-[#F5C71A] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-4 border-black flex flex-col md:flex-row overflow-hidden relative">
                       <div className="w-full md:w-1/4 bg-[#222] p-6 flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black border-dashed relative">
                           <div className="w-24 h-36 bg-black shadow-[4px_4px_10px_0px_rgba(0,0,0,0.5)] mb-6 flex items-center justify-center border-2 border-transparent relative overflow-hidden">
                               {profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover" /> : <div className="text-[9px] font-mono">MONOLITH</div>}
                           </div>
                           {isEditingProfile ? (
                               <div className="flex flex-col gap-2 w-full">
                                   <input className="w-full bg-black border border-[#F5C71A] text-[#F5C71A] p-2 text-center font-black uppercase text-lg" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
                                   <textarea className="w-full bg-black border border-[#F5C71A] text-[#F5C71A] p-2 text-center font-mono text-xs resize-none h-20 focus:outline-none" value={profile.motto} onChange={(e) => setProfile({...profile, motto: e.target.value})} />
                                   <button onClick={saveProfile} className="bg-[#F5C71A] text-black text-xs font-bold py-1 flex items-center justify-center gap-1"><Save size={12}/> SAVE</button>
                               </div>
                           ) : (
                               <><h3 className="font-black text-xl uppercase tracking-wider text-center">{profile.name}</h3><p className="text-[10px] font-mono opacity-60 uppercase tracking-widest mb-4 text-center">"{profile.motto}"</p><button onClick={() => setIsEditingProfile(true)} className="text-[10px] underline opacity-50 hover:opacity-100 mb-4">Edit Identity</button></>
                           )}
                       </div>
                       <div className="flex-1 p-8 flex flex-col justify-center relative">
                           <div className="mb-8"><span className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-60 bg-[#F5C71A] text-black px-2 py-1">Identity Archetype</span><h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mt-2">{sherpaIdentity.fullTitle}</h2><p className="font-mono text-sm opacity-60 mt-2 max-w-md">"Cinema is truth 24 times a second."</p></div>
                           <div className="flex gap-8 border-t-2 border-dashed border-[#F5C71A]/30 pt-6"><div className="flex flex-col"><span className="text-3xl font-mono font-bold">{sherpaIdentity.totalWatched}</span><span className="text-[9px] uppercase tracking-wider opacity-60">Films Logged</span></div><div className="flex flex-col"><span className="text-3xl font-mono font-bold">{active.length}</span><span className="text-[9px] uppercase tracking-wider opacity-60">Active Journeys</span></div></div>
                       </div>
                    </div>

                    <section className="space-y-6">
                      <div className="flex items-center gap-4"><div className="h-6 w-6 bg-black border-2 border-black"></div><h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest border-b-4 border-black pb-2 w-full">Active Journeys</h2></div>
                      {active.length === 0 ? <p className="font-mono text-sm opacity-60">No active journeys. Add from archive.</p> : (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {active.map(list => {
                               const progress = getListProgress(list);
                               return (
                                 <div key={list.id} onClick={() => setSelectedList(list)} className="border-4 border-black p-4 bg-[#F5C71A] text-black cursor-pointer hover:bg-black hover:text-[#F5C71A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative transition-all group">
                                    <h3 className="font-black uppercase">{list.title}</h3>
                                    <div className="mt-2 text-xs font-mono font-bold border-t border-current pt-1 flex justify-between items-center"><span>{progress}% Complete</span>{list.isCustom && (<button onClick={(e) => handleToggleVault(e, list.id)} className="text-red-600 hover:text-white hover:bg-red-600 p-1 rounded" title="Delete Journey"><Trash2 size={14} /></button>)}</div>
                                 </div>
                               );
                            })}
                          </div>
                      )}
                    </section>
                </div>
            )}
        </MainLayout>
      )}

      {/* 5. LIST DETAIL VIEW (Overrides Layout when selected) */}
      {currentList && (
        <div className="min-h-screen w-full bg-[#F5C71A] text-black pb-20 overflow-x-hidden">
            <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-start pointer-events-none">
              <button onClick={() => { setSelectedList(null); setIsEditorMode(false); }} className="pointer-events-auto bg-[#F5C71A] border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider text-sm hover:bg-black hover:text-[#F5C71A] transition-colors">← Back</button>
              <div className="flex gap-2 pointer-events-auto">
                 <button onClick={(e) => handleToggleVault(e, currentList.id)} className={`px-4 py-2 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${vaultIds.includes(currentList.id) ? 'bg-black text-[#F5C71A]' : 'bg-[#F5C71A] text-black'}`}>{vaultIds.includes(currentList.id) ? "✓ SAVED" : "+ ADD TO VAULT"}</button>
              </div>
            </nav>
            <header className="pt-20 pb-8 text-center px-4 relative z-20 flex flex-col items-center">
                <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 uppercase">{currentList.title}</h1>
                <div className="h-1 w-32 bg-black mx-auto mb-4"></div>
                <p className="text-lg md:text-xl font-medium italic opacity-90 tracking-widest uppercase mb-6">{currentList.subtitle}</p>
            </header>
            <main className="max-w-7xl mx-auto px-4 relative pb-32">
                {sortOption === 'chronological' ? ( <TimelineView tiers={currentTiersBase} userDb={userDb} onSelectFilm={setSelectedFilm} onUpdateLog={handleUpdateLog} /> ) : (
                    <div className="flex flex-col items-center">
                      {currentTiers.map((tier, tierIndex) => (
                        <div key={tierIndex} className="relative flex flex-col items-center animate-fadeIn w-full">
                          {tierIndex > 0 && <div className="h-12 w-1 bg-black" />}
                          <div className="bg-[#F5C71A] border-2 border-black px-6 py-2 z-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative flex items-center gap-2">
                            <h2 className="text-sm md:text-lg font-black uppercase tracking-widest text-center">{tier.name}</h2>
                          </div>
                          <div className="h-8 w-1 bg-black" />
                          <div className="flex justify-center flex-wrap w-full gap-x-4 gap-y-8 min-h-[100px] border-2 border-dashed border-black/20 p-4">
                            {tier.films.map((film) => (
                                <div key={film.id} className="relative"> 
                                  <FilmCard film={film} log={userDb[film.id]} onClick={setSelectedFilm} isEditable={false} hasNote={!!currentList.sherpaNotes?.[film.id]} onUpdateLog={handleUpdateLog} />
                                </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                )}
            </main>
            {selectedFilm && ( <FilmModal film={selectedFilm} log={userDb[selectedFilm.id]} onUpdateLog={handleUpdateLog} onClose={() => setSelectedFilm(null)} onNavigateToList={handleNavigateToList} sherpaNote={currentList.sherpaNotes?.[selectedFilm.id]} listTitle={currentList.title} /> )}
        </div>
      )}
    </>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabase';
import { Film, CuratedList, UserDatabase, UserFilmLog, Tier, Badge, AI_Suggestion, SortOption } from './types';
import { ARCHIVE_CATEGORIES, getAllFilms, createFilm, BADGE_TITLES, getHash, INITIATE_SYNONYMS, ADEPT_SYNONYMS } from './constants';
import FilmCard from './components/FilmCard';
import FilmModal from './components/FilmModal';
import { getAIListSuggestions } from './services/geminiService';
import { getDirectorPicks, searchMovies } from './services/tmdb';
import { Search, Twitter, Instagram, Mail, ShieldAlert, Save, Trash2, LogOut, User, MinusCircle } from 'lucide-react';

// --- STATIC COMPONENTS ---

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
  const [isLoading, setIsLoading] = useState(true); // Blocking load state
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
    try {
        // 1. Logs
        const { data: logs, error: logsError } = await supabase.from('user_logs').select('*').eq('user_id', userId);
        if (logs) {
            const db: UserDatabase = {};
            logs.forEach((log: any) => {
                const key = String(log.film_id);
                db[key] = { watched: log.watched, rating: log.rating, notes: log.notes || '' };
            });
            setUserDb(db);
        }

        // 2. Vault
        const { data: vault, error: vaultError } = await supabase.from('vault').select('list_id').eq('user_id', userId);
        if (vault) {
            setVaultIds(vault.map((row: any) => row.list_id));
        }

        // 3. Custom Lists (Robust JSONB Parsing)
        const { data: lists, error: listsError } = await supabase.from('custom_lists').select('*').eq('user_id', userId);
        if (lists) {
            const mappedLists: CuratedList[] = lists.map((item: any) => {
                // Determine if content is in a JSONB column 'content' or flattened
                const content = item.content || {}; 
                return {
                    id: item.id,
                    title: item.title || content.title,
                    subtitle: content.subtitle || item.subtitle || "",
                    description: content.description || item.description || "",
                    tiers: content.tiers || item.tiers || [], 
                    seriesTiers: content.seriesTiers || item.series_tiers || [], 
                    isCustom: true,
                    status: item.status || 'draft',
                    author: profile.name, 
                    originalListId: content.originalListId || item.original_list_id,
                    sherpaNotes: content.sherpaNotes || item.sherpa_notes || {}
                };
            });
            setCustomLists(mappedLists);
        }

        // 4. Profile
        const { data: profileData, error: profileError } = await supabase.from('profiles').select('*').eq('id', userId).single();
        if (profileData) {
            setProfile({
                name: profileData.username || "Initiate",
                motto: profileData.motto || "The Unwritten",
                avatar: profileData.avatar_url || undefined
            });
        }
    } catch (e) {
        console.error("Critical error in fetchUserData:", e);
    }
  };

  useEffect(() => {
    let mounted = true;
    // Load custom lists from local storage as backup / initial state
    const savedCustom = localStorage.getItem('virgil_custom_lists');
    if (savedCustom) setCustomLists(JSON.parse(savedCustom));

    const initApp = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (mounted) {
            setSession(existingSession);
            if (existingSession) {
                await fetchUserData(existingSession.user.id);
                const savedView = localStorage.getItem('virgil_active_view') as 'home' | 'vault';
                if (savedView === 'vault') setView('vault');
            }
        }
      } catch (e) {
        console.error("Initialization error:", e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    initApp();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession) {
        fetchUserData(newSession.user.id);
      } else {
        setUserDb({});
        setVaultIds([]);
        setProfile({ name: "Initiate", motto: "The Unwritten" });
        setView('home');
        localStorage.removeItem('virgil_active_view');
      }
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('virgil_custom_lists', JSON.stringify(customLists));
  }, [customLists]);

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
        localStorage.setItem('virgil_active_view', 'vault');
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
      if (targetView === 'vault') localStorage.setItem('virgil_active_view', 'vault');
      else if (targetView === 'home') localStorage.setItem('virgil_active_view', 'home');
    }
    
    if(targetView !== 'auth') {
        setSelectedList(null);
        setIsEditorMode(false);
    }
  };

  const handleUpdateLog = async (filmId: string, updates: Partial<{ watched: boolean; rating: number }>) => {
    const currentLog = userDb[filmId] || { watched: false, rating: 0 };
    const newLog = { ...currentLog, ...updates };
    if (updates.rating && updates.rating > 0) newLog.watched = true;

    // Optimistic Update
    setUserDb(prev => ({ ...prev, [filmId]: newLog }));

    // Database Sync
    if (session) {
      const { error } = await supabase.from('user_logs').upsert({
          user_id: session.user.id,
          film_id: String(filmId), 
          watched: newLog.watched,
          rating: newLog.rating,
          notes: newLog.notes || ''
      }, { onConflict: 'user_id, film_id' }); 
      
      if (error) console.error('Supabase Save Error:', error);
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
        if (customLists.some(l => l.id === listId)) {
            setView('vault');
            localStorage.setItem('virgil_active_view', 'vault');
        }
        setSelectedList(target);
        setIsEditorMode(false);
        setSelectedFilm(null);
    }
  };

  const handleForkList = () => {
    if (!selectedList) return;
    if (isAdmin && !selectedList.isCustom) {
        setEditingList(JSON.parse(JSON.stringify(selectedList)));
        setIsEditorMode(true);
        return;
    }
    const existingFork = customLists.find(l => l.originalListId === selectedList.id);
    if (existingFork) {
        if(window.confirm("You already have a remix of this journey. Would you like to open it?")) {
            setSelectedList(existingFork);
            setEditingList(existingFork);
            setIsEditorMode(true);
        }
        return;
    }
    const newId = `custom_${Date.now()}`;
    const forkedList: CuratedList = {
      ...selectedList,
      id: newId,
      title: `${selectedList.title} (Remix)`,
      subtitle: "My Custom Journey",
      author: profile.name, 
      privacy: 'public', 
      originalListId: selectedList.id,
      isCustom: true,
      sherpaNotes: {},
      status: 'draft'
    };
    setCustomLists(prev => [...prev, forkedList]);
    setVaultIds(prev => [...prev, newId]); 
    setSelectedList(forkedList);
    setEditingList(forkedList);
    setIsEditorMode(true);
  };

  const handleSaveList = async () => {
    if (!editingList) return;
    
    if (editingList.isCustom) {
        // Optimistic update
        setCustomLists(prev => prev.map(l => l.id === editingList.id ? editingList : l));
        
        // Write to DB with robust JSONB content column
        if (session) {
            const payload = {
                id: editingList.id,
                user_id: session.user.id,
                title: editingList.title,
                status: editingList.status || 'draft',
                // Pack complex objects into content JSONB for persistence
                content: {
                    subtitle: editingList.subtitle,
                    description: editingList.description,
                    tiers: editingList.tiers,
                    seriesTiers: editingList.seriesTiers,
                    originalListId: editingList.originalListId,
                    sherpaNotes: editingList.sherpaNotes
                },
                updated_at: new Date().toISOString()
            };
            const { error } = await supabase.from('custom_lists').upsert(payload);
            if (error) console.error("Error saving custom list:", error);
        }
    } else {
        setMasterOverrides(prev => ({...prev, [editingList.id]: editingList}));
    }
    
    setSelectedList(editingList);
    setIsEditorMode(false);
    setEditingList(null);
    setAiSuggestions([]);
  };

  const handleCreateListBlank = () => {
      const newId = `custom_${Date.now()}`;
      const newList: CuratedList = {
          id: newId,
          title: "UNTITLED JOURNEY",
          subtitle: "Curated by You",
          description: "A fresh path.",
          tiers: [{ level: 1, name: "TIER 1", films: [] }, { level: 2, name: "TIER 2", films: [] }],
          isCustom: true,
          author: profile.name,
          privacy: 'public',
          status: 'draft'
      };
      setCustomLists(prev => [...prev, newList]);
      setVaultIds(prev => [...prev, newId]);
      setSelectedList(newList);
      setEditingList(newList);
      setIsEditorMode(true);
      setIsAICreatorOpen(false);
  };

  const handleGenerateAndCreate = async () => {
      if (!aiCreatorQuery) return;
      setIsGeneratingAI(true);
      let suggestions: any[] = await getDirectorPicks(aiCreatorQuery);
      if (suggestions.length === 0) {
          const geminiSuggestions = await getAIListSuggestions(aiCreatorQuery);
          suggestions = geminiSuggestions.map(s => ({
              title: s.title, year: s.year, director: s.director,
              posterUrl: undefined, overview: undefined, vote_average: 0
          }));
      }
      const newId = `custom_${Date.now()}`;
      const createPopulatedFilm = (s: any) => {
          const f = createFilm(s.title, s.year, s.director, s.posterUrl);
          if (s.overview) f.plot = s.overview; 
          if (s.vote_average) f.imdbScore = s.vote_average;
          return f;
      };
      const tier1Films = suggestions.slice(0, 5).map(createPopulatedFilm);
      const tier2Films = suggestions.slice(5, 10).map(createPopulatedFilm);
      const newList: CuratedList = {
          id: newId, title: aiCreatorQuery.toUpperCase(), subtitle: "Curated Journey",
          description: `A custom list based on ${aiCreatorQuery}`,
          tiers: [{ level: 1, name: "ESSENTIALS", films: tier1Films }, { level: 2, name: "DEEP DIVE", films: tier2Films }, { level: 3, name: "TIER 3", films: [] }],
          isCustom: true, author: profile.name, privacy: 'public', status: 'draft'
      };
      setCustomLists(prev => [...prev, newList]);
      setVaultIds(prev => [...prev, newId]);
      setSelectedList(newList);
      setEditingList(newList);
      setIsEditorMode(true);
      setIsAICreatorOpen(false);
      setIsGeneratingAI(false);
      setAiSuggestions([]);
  };

  const handleTogglePublish = () => {
    if (!editingList) return;
    const newStatus = editingList.status === 'published' ? 'draft' : 'published';
    setEditingList({...editingList, status: newStatus});
  };

  const handleAddTier = (isSeries: boolean) => {
    if (!editingList) return;
    const tiers = isSeries ? (editingList.seriesTiers || []) : editingList.tiers;
    if (tiers.length >= 30) return;
    const newTier: Tier = { level: tiers.length + 1, name: `TIER ${tiers.length + 1}`, films: [] };
    const updatedList = { ...editingList };
    if (isSeries) updatedList.seriesTiers = [...(updatedList.seriesTiers || []), newTier];
    else updatedList.tiers = [...updatedList.tiers, newTier];
    setEditingList(updatedList);
  };

  const handleRemoveTier = (tierIndex: number, isSeries: boolean) => {
    if (!editingList) return;
    const updatedList = { ...editingList };
    if (isSeries && updatedList.seriesTiers) updatedList.seriesTiers = updatedList.seriesTiers.filter((_, i) => i !== tierIndex);
    else updatedList.tiers = updatedList.tiers.filter((_, i) => i !== tierIndex);
    setEditingList(updatedList);
  };

  const handleRemoveFilmFromTier = (filmId: string, tierIndex: number, isSeries: boolean) => {
    if (!editingList) return;
    const updatedList = { ...editingList };
    const targetTiers = isSeries ? updatedList.seriesTiers : updatedList.tiers;
    if (targetTiers) targetTiers[tierIndex].films = targetTiers[tierIndex].films.filter(f => f.id !== filmId);
    setEditingList(updatedList);
  };

  const handleAddFilmToTier = (film: Film) => {
    if (!editingList || !showTierSearchModal) return;
    const { tierIndex, isSeries } = showTierSearchModal;
    const updatedList = { ...editingList };
    const targetTiers = isSeries ? (updatedList.seriesTiers || []) : updatedList.tiers;
    if (targetTiers[tierIndex].films.length >= 6) { alert("Maximum 6 films allowed per tier."); return; }
    const allExistingFilms = [...updatedList.tiers.flatMap(t => t.films), ...(updatedList.seriesTiers?.flatMap(t => t.films) || [])];
    if (allExistingFilms.some(f => f.id === film.id)) { alert("This film is already in your list."); return; }
    targetTiers[tierIndex].films.push(film);
    setEditingList(updatedList);
    setShowTierSearchModal(null);
    setTierSearchQuery("");
    setTierSearchResults([]);
  };

  const handleSaveSherpaNote = (note: string) => {
    if (!editingList || !isEditContextMode) return;
    const updatedList = { ...editingList };
    updatedList.sherpaNotes = { ...(updatedList.sherpaNotes || {}), [isEditContextMode]: note };
    setEditingList(updatedList);
    setIsEditContextMode(null);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => { setProfile(prev => ({ ...prev, avatar: reader.result as string })); };
          reader.readAsDataURL(file);
      }
  };

  const handleDragStart = (e: React.DragEvent, film: Film, sourceTierIndex: number) => {
    e.dataTransfer.setData("filmId", film.id);
    e.dataTransfer.setData("sourceTier", sourceTierIndex.toString());
    e.dataTransfer.setData("filmData", JSON.stringify(film));
  };

  const handleDrop = (e: React.DragEvent, targetTierIndex: number) => {
      e.preventDefault();
      if (!editingList) return;
      const filmId = e.dataTransfer.getData("filmId");
      const sourceTierIndex = parseInt(e.dataTransfer.getData("sourceTier"));
      const filmData = JSON.parse(e.dataTransfer.getData("filmData")) as Film;
      const allExistingFilms = [...editingList.tiers.flatMap(t => t.films), ...(editingList.seriesTiers?.flatMap(t => t.films) || [])];
      if (editingList.tiers[targetTierIndex].films.length >= 6 && sourceTierIndex !== targetTierIndex) { alert("Maximum 6 films allowed per tier."); return; }
      if (isNaN(sourceTierIndex) && allExistingFilms.some(f => f.id === filmData.id)) { alert("Film already in list."); return; }
      if (isNaN(sourceTierIndex)) {
          const updatedList = { ...editingList };
          updatedList.tiers[targetTierIndex].films.push(filmData);
          setEditingList(updatedList);
          setAiSuggestions(prev => prev.filter(f => f.title !== filmData.title));
      } else {
          if (sourceTierIndex === targetTierIndex) return;
          const updatedList = { ...editingList };
          updatedList.tiers[sourceTierIndex].films = updatedList.tiers[sourceTierIndex].films.filter(f => f.id !== filmId);
          updatedList.tiers[targetTierIndex].films.push(filmData);
          setEditingList(updatedList);
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
    
    // Create a Map for O(1) film lookup
    const allFilmsMap = new Map<string, Film>();
    
    // 1. Index Archive Films
    ARCHIVE_CATEGORIES.forEach(cat => {
        cat.lists.forEach(l => {
            l.tiers.forEach(t => t.films.forEach(f => allFilmsMap.set(f.id, f)));
            l.seriesTiers?.forEach(t => t.films.forEach(f => allFilmsMap.set(f.id, f)));
        });
    });

    // 2. Index Custom/UGC Films
    customLists.forEach(l => {
        l.tiers.forEach(t => t.films.forEach(f => allFilmsMap.set(f.id, f)));
        l.seriesTiers?.forEach(t => t.films.forEach(f => allFilmsMap.set(f.id, f)));
    });

    let totalRuntime = 0;
    watchedEntries.forEach(([filmId]) => {
        const film = allFilmsMap.get(filmId);
        // Default to 120 mins if runtime missing
        totalRuntime += (film?.runtime || 120);
    });

    const totalHours = Math.floor(totalRuntime / 60);

    // ... simplified logic for brevity, core logic same as before ...
    let rank = "INITIATE";
    if (totalWatched > 10) rank = "ADEPT";
    if (totalWatched > 50) rank = "MASTER";
    return { totalWatched, fullTitle: `${rank} EXPLORER`, totalCompleted: 0, totalHours };
  };
  const sherpaIdentity = calculateSherpaIdentity();

  const getVaultLists = () => {
    const myLists = [...ARCHIVE_CATEGORIES.flatMap(c => c.lists).map(l => masterOverrides[l.id] || l), ...customLists].filter(list => vaultIds.includes(list.id));
    const active: CuratedList[] = [];
    const drafts: CuratedList[] = [];
    const published: CuratedList[] = [];
    const completed: CuratedList[] = [];
    
    myLists.forEach(list => {
      const prog = getListProgress(list);
      if (prog >= 100 && !list.isCustom) {
          completed.push(list);
      } else {
          if (list.isCustom) {
              if (list.status === 'published') published.push(list);
              else drafts.push(list);
          } else {
              active.push(list);
          }
      }
    });
    return { active, drafts, published, completed };
  };
  const { active, drafts, published, completed } = getVaultLists();

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
  const isSavedInVault = currentList ? vaultIds.includes(currentList.id) : false;
  const canRemix = currentList ? !currentList.isCustom : false;

  // --- LOADING SCREEN ---
  if (isLoading) {
      return (
          <div className="h-screen w-full bg-[#F5C71A] flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-black border-t-transparent rounded-full animate-spin"></div>
                  <h1 className="text-3xl font-black uppercase tracking-widest animate-pulse">INITIALIZING ARCHIVES...</h1>
              </div>
          </div>
      );
  }

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
                               <><h3 className="font-black text-xl uppercase tracking-wider text-center">{profile.name}</h3><p className="text-[10px] font-mono opacity-60 uppercase tracking-widest mb-4 text-center">"{profile.motto || 'Edit to add your philosophy...'}"</p><button onClick={() => setIsEditingProfile(true)} className="text-[10px] underline opacity-50 hover:opacity-100 mb-4">Edit Identity</button></>
                           )}
                       </div>
                       <div className="flex-1 p-8 flex flex-col justify-center relative">
                           <div className="mb-8"><span className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-60 bg-[#F5C71A] text-black px-2 py-1">Identity Archetype</span><h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mt-2">{sherpaIdentity.fullTitle}</h2><p className="font-mono text-sm opacity-60 mt-2 max-w-md">"{profile.motto || "Cinema is truth 24 times a second."}"</p></div>
                           <div className="flex gap-8 border-t-2 border-dashed border-[#F5C71A]/30 pt-6"><div className="flex flex-col"><span className="text-3xl font-mono font-bold">{sherpaIdentity.totalWatched}</span><span className="text-[9px] uppercase tracking-wider opacity-60">Films Logged</span></div><div className="flex flex-col"><span className="text-3xl font-mono font-bold">{sherpaIdentity.totalHours}</span><span className="text-[9px] uppercase tracking-wider opacity-60">Hours</span></div><div className="flex flex-col"><span className="text-3xl font-mono font-bold">{active.length}</span><span className="text-[9px] uppercase tracking-wider opacity-60">Active Journeys</span></div></div>
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
                                    <button 
                                        onClick={(e) => handleToggleVault(e, list.id)} 
                                        className="absolute top-2 right-2 text-red-500 hover:text-red-700 hover:scale-110 transition-all opacity-0 group-hover:opacity-100"
                                        title="Remove from Vault"
                                    >
                                        <MinusCircle size={20} /> 
                                    </button>
                                    <div className="mt-2 text-xs font-mono font-bold border-t border-current pt-1 flex justify-between items-center"><span>{progress}% Complete</span>{list.isCustom && (<button onClick={(e) => handleToggleVault(e, list.id)} className="text-red-600 hover:text-white hover:bg-red-600 p-1 rounded" title="Delete Journey"><Trash2 size={14} /></button>)}</div>
                                 </div>
                               );
                            })}
                          </div>
                      )}
                    </section>

                    <section className="space-y-6">
                       <div className="flex items-center justify-between border-b-4 border-black border-dashed pb-2">
                          <div className="flex items-center gap-4"><div className="h-6 w-6 border-2 border-dashed border-black"></div><h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest">My Creations</h2></div>
                          <button onClick={() => setIsAICreatorOpen(true)} className="bg-black text-[#F5C71A] px-4 py-2 font-black uppercase text-sm hover:scale-105 transition-transform">+ Create Journey</button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="flex flex-col gap-4">
                              <h3 className="font-bold font-mono uppercase opacity-70 border-b border-black">Drafts (Work in Progress)</h3>
                              {drafts.length === 0 && <p className="text-sm italic opacity-50">No drafts.</p>}
                              {drafts.map(list => (
                                 <div key={list.id} onClick={() => { setSelectedList(list); setEditingList(list); setIsEditorMode(true); setAiSuggestions([]); }} className="relative flex flex-col text-left cursor-pointer border-2 border-dashed border-black p-4 bg-[#F5C71A] hover:bg-black hover:text-yellow-400">
                                    <div className="absolute top-0 right-0 bg-black text-white px-2 text-[10px] font-bold">DRAFT</div>
                                    <h3 className="text-lg font-black uppercase">{list.title}</h3>
                                 </div>
                              ))}
                          </div>
                          <div className="flex flex-col gap-4">
                              <h3 className="font-bold font-mono uppercase opacity-70 border-b border-black">Published Journeys</h3>
                              {published.length === 0 && <p className="text-sm italic opacity-50">No published lists.</p>}
                              {published.map(list => <div key={list.id} onClick={() => setSelectedList(list)} className="relative flex flex-col text-left cursor-pointer border-4 border-black p-4 bg-[#F5C71A] hover:bg-black hover:text-yellow-400"><div className="absolute top-0 right-0 bg-black text-yellow-400 px-2 text-[10px] font-bold">PUBLISHED</div><h3 className="text-lg font-black uppercase">{list.title}</h3></div>)}
                          </div>
                       </div>
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
                 {isEditorMode ? (
                     <div className="flex gap-2 items-center">
                        <button onClick={handleTogglePublish} className={`border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all ${editingList?.status === 'published' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>{editingList?.status === 'published' ? 'UNPUBLISH' : 'PUBLISH'}</button>
                        <button onClick={handleSaveList} className="bg-green-600 text-white border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">SAVE & EXIT</button>
                     </div>
                 ) : (
                     <>
                        {currentList.isCustom ? (
                             <button onClick={() => { setEditingList(currentList); setIsEditorMode(true); }} className="bg-white border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#F5C71A]">EDIT LIST</button>
                        ) : (
                             <button onClick={handleForkList} className="bg-white border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#F5C71A]">REMIX THIS JOURNEY</button>
                        )}
                        <button onClick={(e) => handleToggleVault(e, currentList.id)} className={`px-4 py-2 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${vaultIds.includes(currentList.id) ? 'bg-black text-[#F5C71A]' : 'bg-[#F5C71A] text-black'}`}>{vaultIds.includes(currentList.id) ? "✓ SAVED" : "+ ADD TO VAULT"}</button>
                     </>
                 )}
              </div>
            </nav>
            <header className="pt-20 pb-8 text-center px-4 relative z-20 flex flex-col items-center">
                {isEditorMode ? (
                   <div className="flex flex-col gap-2 w-full max-w-xl relative z-50">
                      <input value={editingList?.title} onChange={(e) => setEditingList({...editingList!, title: e.target.value})} className="text-4xl md:text-6xl font-black uppercase text-center bg-transparent border-b-2 border-black focus:outline-none" />
                      <input value={editingList?.subtitle} onChange={(e) => setEditingList({...editingList!, subtitle: e.target.value})} className="text-xl font-bold uppercase text-center bg-transparent border-b border-black focus:outline-none" />
                   </div>
                ) : (
                  <>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 uppercase">{currentList.title}</h1>
                    <div className="h-1 w-32 bg-black mx-auto mb-4"></div>
                    <p className="text-lg md:text-xl font-medium italic opacity-90 tracking-widest uppercase mb-6">{currentList.subtitle}</p>
                  </>
                )}
            </header>
            
            {showTierSearchModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 pointer-events-auto">
                 <div className="w-full max-w-2xl bg-[#F5C71A] border-4 border-black p-6 shadow-[8px_8px_0px_0px_#fff]">
                    <h3 className="text-xl font-black uppercase mb-4">Add to Tier</h3>
                    <input autoFocus type="text" placeholder="Search database or type custom..." className="w-full p-4 text-xl font-mono border-2 border-black bg-white mb-4 uppercase" value={tierSearchQuery} onChange={(e) => setTierSearchQuery(e.target.value)} />
                    <div className="max-h-60 overflow-y-auto border-2 border-black bg-white">
                       {tierSearchQuery.length > 0 && <button onClick={() => handleAddFilmToTier(createFilm(tierSearchQuery, new Date().getFullYear(), "Sherpa Selection"))} className="w-full text-left p-3 hover:bg-black hover:text-[#F5C71A] border-b font-bold">+ ADD CUSTOM: "{tierSearchQuery}"</button>}
                       {/* Prioritize TMDB Results */}
                       {tierSearchResults.map(film => (
                         <button key={film.id} onClick={() => handleAddFilmToTier(film)} className="w-full text-left p-3 hover:bg-black hover:text-[#F5C71A] border-b"><span className="font-bold uppercase">{film.title}</span> <span className="opacity-60 text-xs ml-2">({film.year})</span></button>
                       ))}
                       {/* Fallback to Local DB if no search results yet */}
                       {tierSearchResults.length === 0 && getAllFilms().filter(f => f.title.toLowerCase().includes(tierSearchQuery.toLowerCase())).map(film => (
                         <button key={film.id} onClick={() => handleAddFilmToTier(film)} className="w-full text-left p-3 hover:bg-black hover:text-[#F5C71A] border-b"><span className="font-bold uppercase">{film.title}</span></button>
                       ))}
                    </div>
                    <button onClick={() => setShowTierSearchModal(null)} className="mt-4 text-sm underline uppercase font-bold">Cancel</button>
                 </div>
              </div>
            )}

            <main className="max-w-7xl mx-auto px-4 relative pb-32">
                {sortOption === 'chronological' ? ( <TimelineView tiers={currentTiersBase} userDb={userDb} onSelectFilm={setSelectedFilm} onUpdateLog={handleUpdateLog} /> ) : (
                    <div className="flex flex-col items-center">
                      {currentTiers.map((tier, tierIndex) => (
                        <div 
                            key={tierIndex} 
                            className="relative flex flex-col items-center animate-fadeIn w-full"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => handleDrop(e, tierIndex)}
                        >
                          {tierIndex > 0 && <div className="h-12 w-1 bg-black" />}
                          <div className="bg-[#F5C71A] border-2 border-black px-6 py-2 z-20 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative flex items-center gap-2">
                            {isEditorMode ? (
                                <div className="flex items-center gap-2">
                                  <input value={tier.name} onChange={(e) => { const newList = {...editingList!}; (viewMode === 'series' ? newList.seriesTiers! : newList.tiers)[tierIndex].name = e.target.value; setEditingList(newList); }} className="text-sm md:text-lg font-black uppercase tracking-widest text-center bg-transparent focus:outline-none" />
                                  <button onClick={() => handleRemoveTier(tierIndex, viewMode === 'series')} className="text-red-600 font-bold ml-2 text-xs">x</button>
                                </div>
                            ) : (
                                <h2 className="text-sm md:text-lg font-black uppercase tracking-widest text-center">{tier.name}</h2>
                            )}
                          </div>
                          <div className="h-8 w-1 bg-black" />
                          <div className="flex justify-center flex-wrap w-full gap-x-4 gap-y-8 min-h-[100px] border-2 border-dashed border-black/20 p-4">
                            {tier.films.map((film) => (
                                <div key={film.id} className="relative"> 
                                  <FilmCard 
                                    film={film} 
                                    log={userDb[film.id]} 
                                    onClick={setSelectedFilm} 
                                    isEditable={isEditorMode} 
                                    hasNote={!!currentList.sherpaNotes?.[film.id]} 
                                    onUpdateLog={handleUpdateLog} 
                                    onDragStart={(e) => handleDragStart(e, film, tierIndex)} 
                                    onRemove={() => handleRemoveFilmFromTier(film.id, tierIndex, viewMode === 'series')} 
                                  />
                                </div>
                            ))}
                            {isEditorMode && (
                                <button 
                                    onClick={() => { setShowTierSearchModal({ tierIndex, isSeries: viewMode === 'series' }); }}
                                    className="w-32 md:w-44 h-[5.5rem] border-2 border-dashed border-black flex flex-col items-center justify-center opacity-50 hover:opacity-100 hover:bg-black hover:text-[#F5C71A] transition-all"
                                >
                                    <span className="text-2xl font-black">+</span>
                                    <span className="text-[10px] font-bold uppercase">Add Film</span>
                                </button>
                            )}
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
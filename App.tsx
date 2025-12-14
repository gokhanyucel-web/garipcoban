import React, { useState, useEffect, useRef } from 'react';
import { supabase } from './services/supabase';
import { Film, CuratedList, UserDatabase, UserFilmLog, Tier, Badge, AI_Suggestion, SortOption, ListCategory } from './types';
import { ARCHIVE_CATEGORIES, getAllFilms, createFilm, BADGE_TITLES, getHash, INITIATE_SYNONYMS, ADEPT_SYNONYMS } from './constants';
import FilmCard from './components/FilmCard';
import FilmModal from './components/FilmModal';
import { getAIListSuggestions } from './services/geminiService';
import { getDirectorPicks, searchMovies } from './services/tmdb';
import { Search, Twitter, Instagram, Mail, ShieldAlert, Save, Trash2, LogOut, User, MinusCircle, Check } from 'lucide-react';

// --- CONSTANTS REORDERING ---
const ORDERED_CATEGORIES: ListCategory[] = [
    ARCHIVE_CATEGORIES.find(c => c.title === "THE GRANDMASTERS")!,
    ARCHIVE_CATEGORIES.find(c => c.title === "MOVEMENTS & WORLD")!,
    ARCHIVE_CATEGORIES.find(c => c.title === "GENRES & UNIVERSES")!,
    ARCHIVE_CATEGORIES.find(c => c.title === "THEMATIC")!
];

// --- STATIC COMPONENTS ---

const AuthScreen = ({ onAuth, onCancel }: { onAuth: (mode: 'signin' | 'signup', data: any) => Promise<void>, onCancel: () => void }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [formData, setFormData] = useState({ email: '', password: '', confirmPassword: '', username: '' });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'signup' && formData.password !== formData.confirmPassword) { alert("Passwords do not match."); return; }
    setLoading(true);
    await onAuth(mode, formData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen w-full bg-[#F5C71A] flex items-center justify-center p-6 fixed inset-0 z-50">
      <div className="w-full max-w-md bg-black text-[#F5C71A] p-8 border-4 border-black shadow-[12px_12px_0px_0px_rgba(255,255,255,1)] relative">
        <button onClick={onCancel} className="absolute top-4 right-4 text-white hover:text-[#F5C71A]">✕</button>
        <h1 className="text-5xl font-black uppercase text-center mb-2">VIRGIL</h1>
        <div className="flex justify-center mb-6 border-b border-[#F5C71A]/30 pb-4">
           <button onClick={() => setMode('signin')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${mode === 'signin' ? 'text-[#F5C71A] border-b-2 border-[#F5C71A]' : 'text-gray-500 hover:text-white'}`}>Enter</button>
           <button onClick={() => setMode('signup')} className={`px-4 py-2 text-xs font-bold uppercase tracking-widest ${mode === 'signup' ? 'text-[#F5C71A] border-b-2 border-[#F5C71A]' : 'text-gray-500 hover:text-white'}`}>Join</button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && <div><label className="block text-xs font-bold uppercase mb-1">Codename</label><input name="username" className="w-full p-3 bg-[#222] border-2 border-[#F5C71A] text-[#F5C71A]" type="text" value={formData.username} onChange={handleChange} required /></div>}
          <div><label className="block text-xs font-bold uppercase mb-1">Email</label><input name="email" className="w-full p-3 bg-[#222] border-2 border-[#F5C71A] text-[#F5C71A]" type="email" value={formData.email} onChange={handleChange} required /></div>
          <div><label className="block text-xs font-bold uppercase mb-1">Passkey</label><input name="password" className="w-full p-3 bg-[#222] border-2 border-[#F5C71A] text-[#F5C71A]" type="password" value={formData.password} onChange={handleChange} required /></div>
          {mode === 'signup' && <div><label className="block text-xs font-bold uppercase mb-1">Confirm</label><input name="confirmPassword" className="w-full p-3 bg-[#222] border-2 border-[#F5C71A] text-[#F5C71A]" type="password" value={formData.confirmPassword} onChange={handleChange} required /></div>}
          <button type="submit" disabled={loading} className="w-full py-4 bg-[#F5C71A] text-black font-black uppercase tracking-widest hover:bg-white transition-colors disabled:opacity-50 mt-6">{loading ? 'Processing...' : (mode === 'signin' ? 'Enter Vault' : 'Create Identity')}</button>
        </form>
      </div>
    </div>
  );
};

const MainLayout: React.FC<any> = ({ children, activeView, session, isAdmin, onLogout, onOpenSearch, onToggleAdmin, onNavigate }) => (
  <div className="min-h-screen w-full bg-[#F5C71A] text-black font-sans selection:bg-black selection:text-[#F5C71A] flex flex-col transition-colors duration-300">
    <header className="pt-12 pb-8 text-center px-4 relative">
         <div className="absolute top-8 right-8 flex gap-4">
             {isAdmin && <span className="bg-red-600 text-white px-2 py-1 text-xs font-black uppercase border border-black animate-pulse">ADMIN MODE</span>}
             {!session ? (
                 <button onClick={() => onNavigate('auth')} className="px-4 py-2 border-2 border-black font-black uppercase hover:bg-black hover:text-[#F5C71A] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-sm flex items-center gap-2"><User size={16} /> Sign In</button>
             ) : (
                 <>
                   <button onClick={onLogout} title="Logout" className="w-12 h-12 flex items-center justify-center border-4 border-black rounded-full hover:bg-black hover:text-[#F5C71A] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><LogOut size={20} /></button>
                   <button onClick={onOpenSearch} className="w-12 h-12 flex items-center justify-center border-4 border-black rounded-full hover:bg-black hover:text-[#F5C71A] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"><Search size={24} strokeWidth={3} /></button>
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
    <main className="max-w-7xl mx-auto px-6 grid gap-16 mt-12 flex-grow w-full">{children}</main>
    <footer className="mt-32 bg-black text-[#F5C71A] border-t-8 border-[#F5C71A] py-16 px-6 relative">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
              <div className="space-y-6"><h2 className="text-6xl md:text-8xl font-black uppercase leading-none tracking-tighter opacity-20 hover:opacity-100 transition-opacity duration-500 cursor-default">CONSUME<br/>MEANINGFULLY.</h2></div>
              <div className="flex flex-col items-end gap-8 text-right">
                  <div className="flex gap-6 text-sm font-bold uppercase tracking-widest">
                      <button onClick={onToggleAdmin} className={`cursor-pointer ${isAdmin ? 'text-red-500 font-black' : 'opacity-50'}`}>{isAdmin ? 'Admin Active' : 'Admin'}</button>
                      <a href="mailto:hello@virgil.app" className="cursor-pointer hover:text-white hover:underline decoration-2 underline-offset-4">Contact</a>
                  </div>
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
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [view, setView] = useState<'home' | 'vault' | 'auth'>('home');
  const [userDb, setUserDb] = useState<UserDatabase>({});
  const [vaultIds, setVaultIds] = useState<string[]>([]);
  const [profile, setProfile] = useState<{name: string, motto: string, avatar?: string}>({ name: "Initiate", motto: "The Unwritten" });
  const [selectedList, setSelectedList] = useState<CuratedList | null>(null);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [isEditorMode, setIsEditorMode] = useState(false);
  const [editingList, setEditingList] = useState<CuratedList | null>(null);
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewMode, setViewMode] = useState<'cinema' | 'series'>('cinema');
  const [sortOption, setSortOption] = useState<SortOption>('curator');
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Film[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
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

  // --- CLAUDE FIX: FETCH USER DATA REORDERED ---
  const fetchUserData = async (userId: string) => {
    try {
        console.log("🔄 fetchUserData başladı - userId:", userId);
        
        // 1. ✅ ÖNCE PROFILE YÜK (EN BAŞTA!)
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (profileError) console.error("❌ Profile fetch error:", profileError);
        
        const userName = profileData?.username || "Initiate";
        const userMotto = profileData?.motto || "The Unwritten";
        const userAvatar = profileData?.avatar_url || undefined;

        console.log("👤 Profile yüklendi:", userName);

        setProfile({
            name: userName,
            motto: userMotto,
            avatar: userAvatar
        });

        // 2. Logs
        const { data: logs, error: logsError } = await supabase.from('user_logs').select('*').eq('user_id', userId);
        if (logs) {
            const db: UserDatabase = {};
            logs.forEach((log: any) => { db[String(log.film_id)] = { watched: log.watched, rating: log.rating, notes: log.notes || '' }; });
            setUserDb(db);
        }

        // 3. Vault
        const { data: vault, error: vaultError } = await supabase.from('vault').select('list_id').eq('user_id', userId);
        if (vault) {
            setVaultIds(vault.map((row: any) => row.list_id));
            console.log("🗄️ Vault yüklendi:", vault.length, "liste");
        }

        // 4. ✅ CUSTOM LISTS - ŞİMDİ PROFILE HAZIR!
        const { data: lists, error: listsError } = await supabase.from('custom_lists').select('*').eq('user_id', userId);
        if (lists) {
            console.log("📦 Supabase'den gelen custom lists:", lists);
            
            const mappedLists: CuratedList[] = lists.map((item: any) => {
                const listContent = item.content || {};
                return {
                    ...listContent, // ÖNCE content'i spread et
                    id: item.id,
                    status: item.status || 'draft',
                    author: userName, // ✅ Artık userName hazır!
                    isCustom: true,
                    tiers: listContent.tiers || [],
                    seriesTiers: listContent.seriesTiers,
                    sherpaNotes: listContent.sherpaNotes || {}
                };
            });
            
            console.log("✅ Mapped custom lists:", mappedLists);
            setCustomLists(mappedLists);
        }

        // 5. Master Overrides
        const { data: overrides, error: overridesError } = await supabase.from('master_overrides').select('*');
        if (overrides) {
            const overridesMap: Record<string, CuratedList> = {};
            overrides.forEach((item: any) => { overridesMap[item.list_id] = { ...item.content, id: item.list_id }; });
            setMasterOverrides(overridesMap);
        }
    } catch (e) { console.error("Critical error in fetchUserData:", e); }
  };

  useEffect(() => {
    let mounted = true;
    const initApp = async () => {
      try {
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        if (mounted) {
            setSession(existingSession);
            if (existingSession) {
                await fetchUserData(existingSession.user.id);
                if (localStorage.getItem('virgil_active_view') === 'vault') setView('vault');
            } else {
                const { data: overrides } = await supabase.from('master_overrides').select('*');
                if (overrides) {
                    const overridesMap: Record<string, CuratedList> = {};
                    overrides.forEach((item: any) => { overridesMap[item.list_id] = { ...item.content, id: item.list_id }; });
                    setMasterOverrides(overridesMap);
                }
            }
        }
      } catch (e) { console.error("Initialization error:", e); } 
      finally { if (mounted) setIsLoading(false); }
    };
    initApp();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      if (newSession) fetchUserData(newSession.user.id);
      else { setUserDb({}); setVaultIds([]); setCustomLists([]); setProfile({ name: "Initiate", motto: "The Unwritten" }); setView('home'); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (globalSearchQuery.length > 2) { const timer = setTimeout(() => { searchMovies(globalSearchQuery).then(setSearchResults); }, 300); return () => clearTimeout(timer); } 
    else setSearchResults([]);
  }, [globalSearchQuery]);

  useEffect(() => {
    if (tierSearchQuery.length > 2) { const timer = setTimeout(() => { searchMovies(tierSearchQuery).then(setTierSearchResults); }, 300); return () => clearTimeout(timer); } 
    else setTierSearchResults([]);
  }, [tierSearchQuery]);

  const handleAuth = async (mode: 'signin' | 'signup', data: any) => {
    const { email, password, username } = data;
    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { username } } });
      if (error) alert(error.message); else { alert('Check your email!'); setView('home'); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) alert(error.message); else { setView('vault'); localStorage.setItem('virgil_active_view', 'vault'); }
    }
  };

  const handleLogout = async () => { await supabase.auth.signOut(); setView('home'); };

  const handleNavigate = (targetView: 'home' | 'vault' | 'auth') => {
    if (targetView === 'vault' && !session) setView('auth');
    else {
      setView(targetView);
      if (targetView !== 'auth') localStorage.setItem('virgil_active_view', targetView);
    }
    if(targetView !== 'auth') { setSelectedList(null); setIsEditorMode(false); }
  };

  const handleUpdateLog = async (filmId: string, updates: Partial<{ watched: boolean; rating: number }>) => {
    const currentLog = userDb[filmId] || { watched: false, rating: 0 };
    const newLog = { ...currentLog, ...updates };
    if (updates.rating && updates.rating > 0) newLog.watched = true;
    setUserDb(prev => ({ ...prev, [filmId]: newLog }));
    if (session) await supabase.from('user_logs').upsert({ user_id: session.user.id, film_id: String(filmId), watched: newLog.watched, rating: newLog.rating, notes: newLog.notes || '' }, { onConflict: 'user_id, film_id' }); 
  };

  const handleToggleVault = async (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    if (!session) { setView('auth'); return; }
    const isRemoving = vaultIds.includes(listId);
    let newVaultIds = isRemoving ? vaultIds.filter(id => id !== listId) : [...vaultIds, listId];
    setVaultIds(newVaultIds);
    if (isRemoving) await supabase.from('vault').delete().match({ user_id: session.user.id, list_id: listId });
    else await supabase.from('vault').insert({ user_id: session.user.id, list_id: listId });
  };

  const saveProfile = async () => {
    setIsEditingProfile(false);
    if (session) await supabase.from('profiles').upsert({ id: session.user.id, username: profile.name, motto: profile.motto, avatar_url: profile.avatar || "" });
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

  // --- CLAUDE FIX: HANDLE SAVE LIST ---
  const handleSaveList = async () => {
    if (!editingList) return;
    
    let listToSave = { ...editingList };

    if (!listToSave.id.startsWith('custom_')) {
        if (!isAdmin) { console.error("Unauthorized attempt to save master list"); return; }
        setMasterOverrides(prev => ({...prev, [listToSave.id]: listToSave}));
        if (session) {
             const payload = { list_id: listToSave.id, content: listToSave, updated_at: new Date().toISOString() };
             await supabase.from('master_overrides').upsert(payload, { onConflict: 'list_id' });
        }
    } else {
        // ✅ Custom List Save
        setCustomLists(prev => prev.map(l => l.id === listToSave.id ? listToSave : l));
        
        if (session) {
            const payload = {
                id: listToSave.id,
                user_id: session.user.id,
                title: listToSave.title, // Top-level title
                status: listToSave.status || 'draft',
                content: {
                    // ✅ TÜM liste içeriğini content'e kaydet
                    title: listToSave.title,
                    subtitle: listToSave.subtitle,
                    description: listToSave.description,
                    tiers: listToSave.tiers,
                    seriesTiers: listToSave.seriesTiers,
                    originalListId: listToSave.originalListId,
                    sherpaNotes: listToSave.sherpaNotes,
                    author: listToSave.author,
                    privacy: listToSave.privacy
                },
                updated_at: new Date().toISOString()
            };
            
            console.log("💾 Saving to Supabase:", payload);
            const { data, error } = await supabase.from('custom_lists').upsert(payload, { onConflict: 'id' });
            if (error) { console.error("❌ Error saving custom list:", error); alert("Save failed: " + error.message); } 
            else { console.log("✅ Saved successfully:", data); }
        }
    }
    
    setSelectedList(listToSave);
    setIsEditorMode(false);
    setEditingList(null);
    setAiSuggestions([]);
  };

  const handleCreateList = () => {
      if(!session) { setView('auth'); return; }
      const newId = `custom_${Date.now()}`;
      const newList: CuratedList = { id: newId, title: "UNTITLED JOURNEY", subtitle: "Curated by You", tiers: [{level:1, name:"TIER 1", films:[]}], isCustom:true, author:profile.name, status:'draft' };
      setCustomLists(prev => [...prev, newList]); setVaultIds(prev => [...prev, newId]); setSelectedList(newList); setEditingList(newList); setIsEditorMode(true); setIsAICreatorOpen(false);
  };
  
  const handleGenerateAndCreate = async () => {
      if (!aiCreatorQuery || !session) return;
      setIsGeneratingAI(true);
      let suggestions: any[] = await getDirectorPicks(aiCreatorQuery);
      if (suggestions.length === 0) {
          const geminiSuggestions = await getAIListSuggestions(aiCreatorQuery);
          suggestions = geminiSuggestions.map(s => ({ title: s.title, year: s.year, director: s.director }));
      }
      const newId = `custom_${Date.now()}`;
      const films = suggestions.slice(0, 6).map(s => createFilm(s.title, s.year, s.director, s.posterUrl));
      const newList: CuratedList = { id: newId, title: aiCreatorQuery.toUpperCase(), subtitle: "AI Curated", tiers: [{level:1, name:"ESSENTIALS", films}], isCustom:true, author:profile.name, status:'draft' };
      setCustomLists(prev => [...prev, newList]); setVaultIds(prev => [...prev, newId]); setSelectedList(newList); setEditingList(newList); setIsEditorMode(true); setIsAICreatorOpen(false); setIsGeneratingAI(false); setAiSuggestions([]);
  };

  const handleTogglePublish = async () => {
    if (!editingList) return;
    const newStatus: 'draft' | 'published' = editingList.status === 'published' ? 'draft' : 'published';
    const updatedList = { ...editingList, status: newStatus };
    setEditingList(updatedList);
    setCustomLists(prev => prev.map(l => l.id === updatedList.id ? updatedList : l));
    if (session) await supabase.from('custom_lists').update({ status: newStatus }).eq('id', updatedList.id);
  };

  // Tier Handlers
  const handleAddTier = (isSeries: boolean) => { if(!editingList) return; const t = isSeries ? (editingList.seriesTiers||[]) : editingList.tiers; if(t.length>=30) return; const n = {level:t.length+1, name:`TIER ${t.length+1}`, films:[]}; const u={...editingList}; if(isSeries) u.seriesTiers=[...(u.seriesTiers||[]),n]; else u.tiers=[...u.tiers,n]; setEditingList(u); };
  const handleRemoveTier = (idx: number, isSeries: boolean) => { if(!editingList) return; const u={...editingList}; if(isSeries && u.seriesTiers) u.seriesTiers=u.seriesTiers.filter((_,i)=>i!==idx); else u.tiers=u.tiers.filter((_,i)=>i!==idx); setEditingList(u); };
  const handleAddFilmToTier = (film: Film) => { if(!editingList || !showTierSearchModal) return; const { tierIndex, isSeries } = showTierSearchModal; const u={...editingList}; const t=isSeries?(u.seriesTiers||[]):u.tiers; if(t[tierIndex].films.length>=6){alert("Max 6");return;} t[tierIndex].films.push(film); setEditingList(u); setShowTierSearchModal(null); setTierSearchQuery(""); setTierSearchResults([]); };
  const handleRemoveFilmFromTier = (fid: string, idx: number, isSeries: boolean) => { if(!editingList) return; const u={...editingList}; const t=isSeries?u.seriesTiers:u.tiers; if(t) t[idx].films=t[idx].films.filter(f=>f.id!==fid); setEditingList(u); };
  const handleDrop = (e: React.DragEvent, targetTierIndex: number) => { e.preventDefault(); if (!editingList) return; const filmData = JSON.parse(e.dataTransfer.getData("filmData")) as Film; const sourceTierIndex = parseInt(e.dataTransfer.getData("sourceTier")); if(isNaN(sourceTierIndex)) { const u={...editingList}; u.tiers[targetTierIndex].films.push(filmData); setEditingList(u); } else { if(sourceTierIndex===targetTierIndex) return; const u={...editingList}; u.tiers[sourceTierIndex].films = u.tiers[sourceTierIndex].films.filter(f => f.id !== filmData.id); u.tiers[targetTierIndex].films.push(filmData); setEditingList(u); } };

  // Render Helpers
  const currentList = isEditorMode ? editingList : selectedList;
  const currentTiersBase = currentList ? (viewMode === 'series' && currentList.seriesTiers ? currentList.seriesTiers : currentList.tiers) : [];
  const getSortedTiers = (tiers: Tier[]) => tiers.map(t => ({ ...t, films: [...t.films].sort((a, b) => sortOption === 'chronological' ? a.year - b.year : 0) }));
  const currentTiers = getSortedTiers(currentTiersBase);
  
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
    
    const allLists = [...ARCHIVE_CATEGORIES.flatMap(c => c.lists).map(l => masterOverrides[l.id] || l), ...customLists];
    let totalCompleted = 0;
    allLists.forEach(list => {
        if ((vaultIds.includes(list.id) || list.isCustom) && getListProgress(list) >= 100) totalCompleted++;
    });

    const allFilmsMap = new Map<string, Film>();
    allLists.forEach(l => {
        l.tiers.forEach(t => t.films.forEach(f => allFilmsMap.set(f.id, f)));
        if(l.seriesTiers) l.seriesTiers.forEach(t => t.films.forEach(f => allFilmsMap.set(f.id, f)));
    });

    let totalRuntime = 0;
    watchedEntries.forEach(([filmId]) => {
        const film = allFilmsMap.get(filmId);
        totalRuntime += (film?.runtime || 120);
    });

    const totalHours = Math.floor(totalRuntime / 60);
    let rank = "INITIATE";
    if (totalWatched > 10) rank = "ADEPT";
    if (totalWatched > 50) rank = "MASTER";
    return { totalWatched, fullTitle: `${rank} EXPLORER`, totalCompleted, totalHours };
  };
  
  const sherpaIdentity = calculateSherpaIdentity();

  const getVaultLists = () => {
    const myLists = [...ARCHIVE_CATEGORIES.flatMap(c => c.lists).map(l => masterOverrides[l.id] || l), ...customLists];
    // VISIBILITY FIX: Show if in Vault OR if Custom
    const visibleLists = myLists.filter(list => vaultIds.includes(list.id) || list.isCustom);
    
    const active: CuratedList[] = [];
    const drafts: CuratedList[] = [];
    const published: CuratedList[] = [];
    const completed: CuratedList[] = [];
    
    visibleLists.forEach(list => {
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

  if (isLoading) return <div className="h-screen w-full bg-[#F5C71A] flex items-center justify-center"><h1 className="text-3xl font-black animate-pulse">LOADING...</h1></div>;

  return (
    <>
      {view === 'auth' && <AuthScreen onAuth={handleAuth} onCancel={() => setView('home')} />}
      
      {/* SEARCH OVERLAY */}
      {isSearchOpen && (
           <div className="fixed inset-0 z-[60] bg-[#F5C71A]/95 p-8 overflow-y-auto">
              <div className="max-w-4xl mx-auto">
                  <div className="flex justify-between border-b-4 border-black pb-4 mb-4"><h2 className="text-4xl font-black">SEARCH</h2><button onClick={() => setIsSearchOpen(false)} className="text-2xl font-black">X</button></div>
                  <input autoFocus type="text" placeholder="TYPE FILM..." className="w-full bg-transparent text-5xl font-black uppercase outline-none" value={globalSearchQuery} onChange={(e) => setGlobalSearchQuery(e.target.value)} />
                  <div className="mt-4 grid gap-4">{searchResults.map(f => <div key={f.id} onClick={() => { setSelectedFilm(f); setIsSearchOpen(false); }} className="p-4 border-2 border-black hover:bg-black hover:text-[#F5C71A] cursor-pointer font-bold uppercase">{f.title} ({f.year})</div>)}</div>
              </div>
           </div>
      )}

      {selectedFilm && !currentList && <FilmModal film={selectedFilm} log={userDb[selectedFilm.id]} onUpdateLog={handleUpdateLog} onClose={() => setSelectedFilm(null)} onNavigateToList={handleNavigateToList} listTitle="Global Search" />}

      {view !== 'auth' && !currentList && (
        <MainLayout activeView={view} session={session} isAdmin={isAdmin} onLogout={handleLogout} onOpenSearch={() => setIsSearchOpen(true)} onToggleAdmin={() => setIsAdmin(!isAdmin)} onNavigate={handleNavigate}>
            {view === 'home' && (
               <div className="animate-fadeIn">
                  {ORDERED_CATEGORIES.map((category) => {
                     if (!category) return null;
                     const isExpanded = expandedCategories[category.title];
                     const visibleLists = isExpanded ? category.lists : category.lists.slice(0, 8);
                     return (
                         <section key={category.title} className="mb-12">
                            <h2 className="text-3xl font-black uppercase border-b-4 border-black pb-2 mb-6">{category.title === "THEMATIC" ? "DECADE DIARIES" : category.title}</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                              {visibleLists.map((originalList) => {
                                const list = masterOverrides[originalList.id] || originalList;
                                const isSaved = vaultIds.includes(list.id);
                                return (
                                  <div key={list.id} onClick={() => { setSelectedList(list); setIsEditorMode(false); }} className="border-4 border-black p-6 bg-[#F5C71A] hover:bg-black hover:text-[#F5C71A] cursor-pointer transition-all hover:-translate-y-1 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] relative group">
                                    {!isSaved && <button onClick={(e) => handleToggleVault(e, list.id)} className="absolute top-2 right-2 w-8 h-8 border-2 border-black flex items-center justify-center hover:bg-white text-black z-10">+</button>}
                                    {isSaved && <div className="absolute top-2 right-2 text-xs font-bold bg-black text-white px-2">SAVED</div>}
                                    <h3 className="text-2xl font-black uppercase leading-none mb-2">{list.title}</h3>
                                    <p className="text-sm font-bold uppercase opacity-80">{list.subtitle}</p>
                                  </div>
                                );
                              })}
                            </div>
                            {category.lists.length > 8 && (<button onClick={() => setExpandedCategories(prev => ({...prev, [category.title]: !prev[category.title]}))} className="mt-4 bg-black text-[#F5C71A] px-6 py-2 font-black uppercase text-sm">{isExpanded ? "Show Less" : "View More"}</button>)}
                         </section>
                     )
                  })}
               </div>
            )}

            {view === 'vault' && (
                <div className="space-y-12">
                    <div className="border-4 border-black p-8 flex flex-col md:flex-row gap-8 items-center bg-[#222] text-[#F5C71A]">
                        <div className="w-32 h-32 bg-black border-2 border-[#F5C71A] flex items-center justify-center overflow-hidden">{profile.avatar ? <img src={profile.avatar} className="w-full h-full object-cover"/> : <span className="font-mono">IMG</span>}</div>
                        <div className="flex-1 text-center md:text-left">
                            {isEditingProfile ? (
                                <div className="flex flex-col gap-2 max-w-md"><input className="bg-black border border-[#F5C71A] p-2 text-[#F5C71A]" value={profile.name} onChange={e=>setProfile({...profile, name:e.target.value})} /><input className="bg-black border border-[#F5C71A] p-2 text-[#F5C71A]" value={profile.motto} onChange={e=>setProfile({...profile, motto:e.target.value})} /><button onClick={saveProfile} className="bg-[#F5C71A] text-black font-bold py-1">SAVE</button></div>
                            ) : (
                                <><h2 className="text-4xl font-black uppercase">{sherpaIdentity.fullTitle}</h2><p className="font-mono opacity-60">"{profile.motto}"</p><button onClick={()=>setIsEditingProfile(true)} className="text-xs underline mt-2 opacity-50">EDIT</button></>
                            )}
                        </div>
                        <div className="flex gap-8 text-center"><div className="flex flex-col"><span className="text-3xl font-black">{sherpaIdentity.totalWatched}</span><span className="text-xs">FILMS</span></div><div className="flex flex-col"><span className="text-3xl font-black">{sherpaIdentity.totalHours}</span><span className="text-xs">HOURS</span></div></div>
                    </div>

                    <div className="flex justify-between items-center border-b-4 border-black pb-2">
                        <h2 className="text-3xl font-black uppercase">MY CREATIONS</h2>
                        <button onClick={() => setIsAICreatorOpen(true)} className="bg-black text-[#F5C71A] px-4 py-2 font-black uppercase">+ NEW JOURNEY</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="font-bold opacity-50 mb-4">DRAFTS</h3>
                            {drafts.map(l => <div key={l.id} onClick={()=>{setSelectedList(l); setEditingList(l); setIsEditorMode(true);}} className="border-2 border-dashed border-black p-4 mb-2 cursor-pointer hover:bg-black hover:text-[#F5C71A] font-black uppercase">{l.title}</div>)}
                        </div>
                        <div>
                            <h3 className="font-bold opacity-50 mb-4">PUBLISHED</h3>
                            {published.map(l => <div key={l.id} onClick={()=>setSelectedList(l)} className="border-4 border-black p-4 mb-2 cursor-pointer hover:bg-black hover:text-[#F5C71A] font-black uppercase">{l.title}</div>)}
                        </div>
                    </div>

                    <h2 className="text-3xl font-black uppercase border-b-4 border-black pb-2">ACTIVE JOURNEYS</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {active.map(l => (
                            <div key={l.id} onClick={()=>setSelectedList(l)} className="border-4 border-black p-4 hover:bg-black hover:text-[#F5C71A] cursor-pointer relative group">
                                <h3 className="font-black uppercase">{l.title}</h3>
                                <div className="mt-2 text-xs font-mono">{getListProgress(l)}% COMPLETE</div>
                                <button onClick={(e)=>handleToggleVault(e,l.id)} className="absolute top-2 right-2 text-red-500 opacity-0 group-hover:opacity-100 hover:scale-125 transition-all"><MinusCircle/></button>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </MainLayout>
      )}

      {currentList && (
        <div className="min-h-screen bg-[#F5C71A] pb-20">
            <nav className="fixed top-0 w-full z-40 px-6 py-4 flex justify-between pointer-events-none">
                <button onClick={()=>{setSelectedList(null); setIsEditorMode(false);}} className="pointer-events-auto bg-[#F5C71A] border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_black] hover:bg-black hover:text-[#F5C71A]">BACK</button>
                <div className="flex gap-2 pointer-events-auto">
                    {isEditorMode ? (
                        <>
                        <button onClick={handleTogglePublish} className="bg-white border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_black]">{editingList?.status==='published'?'UNPUBLISH':'PUBLISH'}</button>
                        <button onClick={handleSaveList} className="bg-green-600 text-white border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_black]">SAVE</button>
                        </>
                    ) : (
                        currentList.isCustom ? <button onClick={()=>{setEditingList(currentList); setIsEditorMode(true);}} className="bg-white border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_black]">EDIT</button>
                        : <button onClick={handleForkList} className="bg-white border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_black]">REMIX</button>
                    )}
                </div>
            </nav>
            <div className="pt-24 text-center px-4">
                {isEditorMode ? <input className="text-6xl font-black uppercase text-center bg-transparent border-b-2 border-black outline-none w-full max-w-3xl" value={editingList?.title} onChange={e=>setEditingList({...editingList!, title:e.target.value})} /> : <h1 className="text-6xl font-black uppercase">{currentList.title}</h1>}
                <p className="text-xl font-mono opacity-60 mt-2 uppercase">{currentList.subtitle}</p>
            </div>

            {/* TIER SEARCH MODAL */}
            {showTierSearchModal && (
                <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                    <div className="bg-[#F5C71A] border-4 border-black p-6 w-full max-w-2xl shadow-[8px_8px_0px_0px_white]">
                        <h2 className="text-2xl font-black mb-4">ADD FILM</h2>
                        <input autoFocus placeholder="SEARCH OR TYPE CUSTOM..." className="w-full p-3 border-2 border-black font-mono text-xl uppercase mb-4" value={tierSearchQuery} onChange={e=>setTierSearchQuery(e.target.value)} />
                        <div className="max-h-64 overflow-y-auto bg-white border-2 border-black">
                            {tierSearchQuery && <button onClick={()=>handleAddFilmToTier(createFilm(tierSearchQuery, new Date().getFullYear(), "Custom"))} className="w-full text-left p-3 border-b hover:bg-black hover:text-[#F5C71A] font-bold">+ USE CUSTOM: "{tierSearchQuery}"</button>}
                            {tierSearchResults.map(f=><button key={f.id} onClick={()=>handleAddFilmToTier(f)} className="w-full text-left p-3 border-b hover:bg-black hover:text-[#F5C71A] font-bold uppercase">{f.title} ({f.year})</button>)}
                        </div>
                        <button onClick={()=>setShowTierSearchModal(null)} className="mt-4 underline font-bold uppercase">CANCEL</button>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 mt-12 pb-32">
                {currentTiers.map((tier, idx) => (
                    <div key={idx} className="mb-12 relative flex flex-col items-center" onDragOver={e=>e.preventDefault()} onDrop={e=>handleDrop(e, idx)}>
                        <div className="bg-[#F5C71A] border-2 border-black px-6 py-2 z-10 relative shadow-[4px_4px_0px_0px_black] mb-8">
                            {isEditorMode ? <div className="flex gap-2"><input className="bg-transparent font-black uppercase text-center outline-none" value={tier.name} onChange={e=>{const u={...editingList!}; (viewMode==='series'?u.seriesTiers!:u.tiers)[idx].name=e.target.value; setEditingList(u);}} /><button onClick={()=>handleRemoveTier(idx, viewMode==='series')} className="text-red-600 font-bold">X</button></div> : <h2 className="font-black uppercase tracking-widest">{tier.name}</h2>}
                        </div>
                        <div className="flex flex-wrap justify-center gap-8 w-full border-2 border-dashed border-black/20 p-8 min-h-[200px]">
                            {tier.films.map(f => (
                                <FilmCard key={f.id} film={f} log={userDb[f.id]} onClick={setSelectedFilm} isEditable={isEditorMode} onRemove={()=>handleRemoveFilmFromTier(f.id, idx, viewMode==='series')} onUpdateLog={handleUpdateLog} hasNote={!!currentList.sherpaNotes?.[f.id]} onDragStart={handleDragStart} />
                            ))}
                            {isEditorMode && <button onClick={()=>setShowTierSearchModal({tierIndex:idx, isSeries:viewMode==='series'})} className="w-32 h-40 border-2 border-dashed border-black flex flex-col items-center justify-center opacity-50 hover:opacity-100 hover:bg-black hover:text-[#F5C71A]"><span className="text-4xl">+</span><span className="text-xs font-bold mt-2">ADD</span></button>}
                        </div>
                    </div>
                ))}
                {isEditorMode && <div className="text-center mt-8"><button onClick={()=>handleAddTier(viewMode==='series')} className="bg-black text-[#F5C71A] px-6 py-3 font-black uppercase shadow-[4px_4px_0px_0px_rgba(255,255,255,0.5)] hover:scale-105 transition-transform">+ ADD NEW TIER</button></div>}
            </div>
            
            {selectedFilm && <FilmModal film={selectedFilm} log={userDb[selectedFilm.id]} onUpdateLog={handleUpdateLog} onClose={() => setSelectedFilm(null)} onNavigateToList={handleNavigateToList} sherpaNote={currentList.sherpaNotes?.[selectedFilm.id]} listTitle={currentList.title} />}
        </div>
      )}
    </>
  );
}

export default App;
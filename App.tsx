import React, { useState, useEffect } from 'react';
import { Film, CuratedList, UserDatabase, UserFilmLog, Tier, Badge, AI_Suggestion, SortOption } from './types';
import { ARCHIVE_CATEGORIES, getAllFilms, createFilm, BADGE_TITLES, getHash, INITIATE_SYNONYMS, ADEPT_SYNONYMS } from './constants';
import FilmCard from './components/FilmCard';
import FilmModal from './components/FilmModal';
import { getAIListSuggestions } from './services/geminiService';
import { Search, Twitter, Instagram, Mail, ShieldAlert, Edit2, Save } from 'lucide-react';

function App() {
  // --- STATE ---
  const [selectedList, setSelectedList] = useState<CuratedList | null>(null);
  const [selectedFilm, setSelectedFilm] = useState<Film | null>(null);
  const [viewMode, setViewMode] = useState<'cinema' | 'series'>('cinema');
  const [activeTab, setActiveTab] = useState<'archive' | 'vault'>('archive');
  const [sortOption, setSortOption] = useState<SortOption>('curator');
  const [isAdmin, setIsAdmin] = useState(false); // ADMIN MODU

  const [userDb, setUserDb] = useState<UserDatabase>({});
  const [vaultIds, setVaultIds] = useState<string[]>([]);
  
  // Profile State
  const [profile, setProfile] = useState<{name: string, motto: string}>({ name: "Gökhan", motto: "The Architect" });
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  // UGC / Editor State
  const [customLists, setCustomLists] = useState<CuratedList[]>([]);
  // Master List Overrides (Admin düzenlemelerini saklamak için)
  const [masterOverrides, setMasterOverrides] = useState<Record<string, CuratedList>>({}); 

  const [isEditorMode, setIsEditorMode] = useState(false);
  const [editingList, setEditingList] = useState<CuratedList | null>(null);
  const [showTierSearchModal, setShowTierSearchModal] = useState<{tierIndex: number, isSeries: boolean} | null>(null);
  const [tierSearchQuery, setTierSearchQuery] = useState("");
  const [isEditContextMode, setIsEditContextMode] = useState<string | null>(null);
  
  // AI Creator State
  const [isAICreatorOpen, setIsAICreatorOpen] = useState(false);
  const [aiCreatorQuery, setAiCreatorQuery] = useState("");
  const [aiSuggestions, setAiSuggestions] = useState<AI_Suggestion[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState("");

  // Category View State
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // --- EFFECTS ---
  useEffect(() => {
    const savedDb = localStorage.getItem('virgil_user_db');
    if (savedDb) setUserDb(JSON.parse(savedDb));
    const savedVault = localStorage.getItem('virgil_vault_ids');
    if (savedVault) setVaultIds(JSON.parse(savedVault));
    const savedCustom = localStorage.getItem('virgil_custom_lists');
    if (savedCustom) setCustomLists(JSON.parse(savedCustom));
    const savedOverrides = localStorage.getItem('virgil_master_overrides');
    if (savedOverrides) setMasterOverrides(JSON.parse(savedOverrides));
    const savedProfile = localStorage.getItem('virgil_user_profile');
    if (savedProfile) setProfile(JSON.parse(savedProfile));
  }, []);

  useEffect(() => { localStorage.setItem('virgil_user_db', JSON.stringify(userDb)); }, [userDb]);
  useEffect(() => { localStorage.setItem('virgil_vault_ids', JSON.stringify(vaultIds)); }, [vaultIds]);
  useEffect(() => { localStorage.setItem('virgil_custom_lists', JSON.stringify(customLists)); }, [customLists]);
  useEffect(() => { localStorage.setItem('virgil_master_overrides', JSON.stringify(masterOverrides)); }, [masterOverrides]);
  useEffect(() => { localStorage.setItem('virgil_user_profile', JSON.stringify(profile)); }, [profile]);

  // --- HANDLERS ---

  const handleUpdateLog = (filmId: string, updates: Partial<{ watched: boolean; rating: number }>) => {
    setUserDb(prev => {
      const currentLog = prev[filmId] || { watched: false, rating: 0 };
      const newLog = { ...currentLog, ...updates };
      if (updates.rating && updates.rating > 0) newLog.watched = true;
      return { ...prev, [filmId]: newLog };
    });
  };

  const handleToggleVault = (e: React.MouseEvent, listId: string) => {
    e.stopPropagation();
    if (vaultIds.includes(listId)) {
      setVaultIds(prev => prev.filter(id => id !== listId));
    } else {
      setVaultIds(prev => [...prev, listId]);
    }
  };

  const handleNavigateToList = (listId: string) => {
    // Master Overrides var mı kontrol et
    const allLists = [...ARCHIVE_CATEGORIES.flatMap(c => c.lists).map(l => masterOverrides[l.id] || l), ...customLists];
    const target = allLists.find(l => l.id === listId);
    if (target) {
        const isCustom = customLists.some(l => l.id === listId);
        if (isCustom) setActiveTab('vault');
        setSelectedList(target);
        setIsEditorMode(false);
        setSelectedFilm(null);
    }
  };

  const handleForkList = () => {
    if (!selectedList) return;
    
    // ADMIN MODE: Edit Master directly
    if (isAdmin && !selectedList.isCustom) {
        setEditingList(JSON.parse(JSON.stringify(selectedList))); // Deep copy
        setIsEditorMode(true);
        return;
    }

    // NORMAL MODE: Create Copy
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

  const handleSaveList = () => {
    if (!editingList) return;
    
    if (editingList.isCustom) {
        // Save Custom List
        setCustomLists(prev => prev.map(l => l.id === editingList.id ? editingList : l));
    } else {
        // Save Master Override (Admin)
        setMasterOverrides(prev => ({...prev, [editingList.id]: editingList}));
    }
    
    setSelectedList(editingList);
    setIsEditorMode(false);
    setEditingList(null);
    setAiSuggestions([]);
  };

  const handleCreateList = () => {
      const newId = `custom_${Date.now()}`;
      const newList: CuratedList = {
          id: newId,
          title: aiCreatorQuery || "UNTITLED JOURNEY",
          subtitle: "Curated by You",
          description: "A fresh path.",
          tiers: [
              { level: 1, name: "TIER 1", films: [] },
              { level: 2, name: "TIER 2", films: [] }
          ],
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

  const handleGenerateAISuggestions = async () => {
      if (!aiCreatorQuery) return;
      setIsGeneratingAI(true);
      const suggestions = await getAIListSuggestions(aiCreatorQuery);
      setAiSuggestions(suggestions);
      setIsGeneratingAI(false);
  };

  const handleTogglePublish = () => {
    if (!editingList) return;
    const newStatus = editingList.status === 'published' ? 'draft' : 'published';
    setEditingList({...editingList, status: newStatus});
  };

  const handleAddTier = (isSeries: boolean) => {
    if (!editingList) return;
    const tiers = isSeries ? (editingList.seriesTiers || []) : editingList.tiers;
    if (tiers.length >= 7) return; 
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
    
    const allExistingFilms = [...updatedList.tiers.flatMap(t => t.films), ...(updatedList.seriesTiers?.flatMap(t => t.films) || [])];
    if (allExistingFilms.some(f => f.id === film.id)) {
        alert("This film is already in your list.");
        return;
    }

    targetTiers[tierIndex].films.push(film);
    setEditingList(updatedList);
    setShowTierSearchModal(null);
    setTierSearchQuery("");
  };

  const handleSaveSherpaNote = (note: string) => {
    if (!editingList || !isEditContextMode) return;
    const updatedList = { ...editingList };
    updatedList.sherpaNotes = { ...(updatedList.sherpaNotes || {}), [isEditContextMode]: note };
    setEditingList(updatedList);
    setIsEditContextMode(null);
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
      
      if (isNaN(sourceTierIndex) && allExistingFilms.some(f => f.id === filmData.id)) {
          alert("Film already in list.");
          return;
      }

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

  const getListProgress = (list: CuratedList) => {
    let allFilms: Film[] = [];
    list.tiers.forEach(tier => { allFilms = [...allFilms, ...tier.films]; });
    if (list.seriesTiers) { list.seriesTiers.forEach(tier => { allFilms = [...allFilms, ...tier.films]; }); }
    if (allFilms.length === 0) return 0;
    const watchedCount = allFilms.filter(film => userDb[film.id]?.watched).length;
    return Math.round((watchedCount / allFilms.length) * 100);
  };

  const getTopFilmsForList = (list: CuratedList) => {
      let allFilms: Film[] = [];
      list.tiers.forEach(tier => { allFilms = [...allFilms, ...tier.films]; });
      if (list.seriesTiers) { list.seriesTiers.forEach(tier => { allFilms = [...allFilms, ...tier.films]; }); }
      return allFilms.sort((a,b) => b.ves - a.ves).slice(0, 4);
  };

  const calculateSherpaIdentity = () => {
    const watchedEntries = Object.entries(userDb).filter(([_, log]) => (log as UserFilmLog).watched);
    const totalWatched = watchedEntries.length;
    const totalCreated = customLists.length;
    
    // Master Overrides dahil tüm listeler
    const allLists = [...ARCHIVE_CATEGORIES.flatMap(c => c.lists).map(l => masterOverrides[l.id] || l), ...customLists];
    let totalCompleted = 0;
    let totalRuntime = 0;

    allLists.forEach(l => {
        if (vaultIds.includes(l.id) && getListProgress(l) >= 100) totalCompleted++;
    });

    const genreCounts: Record<string, number> = {};
    
    watchedEntries.forEach(([filmId]) => {
       // Calculate Runtime
       let foundFilm: Film | undefined;
       for (const l of allLists) {
           foundFilm = l.tiers.flatMap(t => t.films).find(f => f.id === filmId) || 
                       l.seriesTiers?.flatMap(t => t.films).find(f => f.id === filmId);
           if (foundFilm) break;
       }
       if (foundFilm) {
           totalRuntime += (foundFilm.runtime || 0);
       }

       // Calculate Genre Archetype
       const containingLists = allLists.filter(l => 
          l.tiers.some(t => t.films.some(f => f.id === filmId)) ||
          l.seriesTiers?.some(t => t.films.some(f => f.id === filmId))
       );
       
       containingLists.forEach(l => {
          let key = 'GENERAL';
          const t = l.title.toUpperCase();
          if (t.includes('HORROR') || t.includes('FOLK') || t.includes('BODY')) key = 'HORROR';
          else if (t.includes('SCI-FI') || t.includes('SPACE') || t.includes('CYBERPUNK') || t.includes('TREK') || t.includes('WARS')) key = 'SCI-FI';
          else if (t.includes('NOIR') || t.includes('HEIST') || t.includes('CRIME') || t.includes('MAFIA')) key = 'NOIR';
          else if (t.includes('ART') || t.includes('WAVE') || t.includes('SLOW') || t.includes('FEMALE')) key = 'ARTHOUSE';
          else if (t.includes('KUBRICK') || t.includes('TARANTINO') || t.includes('HITCHCOCK') || t.includes('SCORSESE')) key = 'AUTEUR';
          
          genreCounts[key] = (genreCounts[key] || 0) + 1;
       });
    });

    let topGenre = 'INITIATE';
    let maxCount = 0;
    Object.entries(genreCounts).forEach(([genre, count]) => {
       if (count > maxCount) { maxCount = count; topGenre = genre; }
    });

    let title = "OBSERVER";
    if (topGenre === 'HORROR') title = "ABYSS WALKER";
    if (topGenre === 'SCI-FI') title = "MIND SURFER";
    if (topGenre === 'NOIR') title = "SHADOW HUNTER";
    if (topGenre === 'ARTHOUSE') title = "POETIC SOUL";
    if (topGenre === 'AUTEUR') title = "CINEMA DISCIPLE";
    
    let rank = "NOVICE";
    if (totalWatched > 10) rank = "ADEPT";
    if (totalWatched > 50) rank = "MASTER";
    if (totalCreated > 0) rank = "ARCHITECT"; 

    const totalHours = Math.floor(totalRuntime / 60);

    return { totalWatched, totalLists: vaultIds.length, totalCreated, totalCompleted, totalHours, fullTitle: `${rank} ${title}` };
  };
  const sherpaIdentity = calculateSherpaIdentity();

  const getVaultLists = () => {
    // Master Overrides'ı burada da hesaba katıyoruz
    const myLists = [...ARCHIVE_CATEGORIES.flatMap(c => c.lists).map(l => masterOverrides[l.id] || l), ...customLists].filter(list => vaultIds.includes(list.id));
    const active: CuratedList[] = [];
    const drafts: CuratedList[] = [];
    const published: CuratedList[] = [];
    const completed: CuratedList[] = [];
    const earnedBadges: Badge[] = [];

    myLists.forEach(list => {
      const prog = getListProgress(list);
      
      if (prog >= 100 && !list.isCustom) {
          completed.push(list);
          earnedBadges.push({ 
               id: `${list.id}_master`, 
               title: BADGE_TITLES[list.id] || "THE CREATOR", 
               listId: list.id, 
               level: 'master',
               unlockedDate: new Date().toISOString() 
           });
      } else {
          if (list.isCustom) {
              if (list.status === 'published') published.push(list);
              else drafts.push(list);
          } else {
              active.push(list);
              if (prog >= 50) {
                 earnedBadges.push({ 
                     id: `${list.id}_adept`, 
                     title: `${list.title.split(' ')[0]} ${ADEPT_SYNONYMS[getHash(list.id) % ADEPT_SYNONYMS.length]}`, 
                     listId: list.id, 
                     level: 'adept',
                     unlockedDate: new Date().toISOString() 
                 });
              } else if (prog > 0) {
                  earnedBadges.push({ 
                     id: `${list.id}_initiate`, 
                     title: `${list.title.split(' ')[0]} ${INITIATE_SYNONYMS[getHash(list.id) % INITIATE_SYNONYMS.length]}`, 
                     listId: list.id, 
                     level: 'initiate',
                     unlockedDate: new Date().toISOString() 
                 });
              }
          }
      }
    });

    return { active, drafts, published, completed, earnedBadges };
  };

  const { active, drafts, published, completed, earnedBadges } = getVaultLists();

  useEffect(() => { 
      setViewMode('cinema'); 
      setSortOption('curator');
  }, [selectedList]);

  const getSortedTiers = (tiers: Tier[]) => {
      return tiers.map(t => {
          const sortedFilms = [...t.films].sort((a, b) => {
              if (sortOption === 'chronological') return a.year - b.year;
              return 0; 
          });
          return { ...t, films: sortedFilms };
      });
  };

  const TimelineView = ({ tiers }: { tiers: Tier[] }) => {
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
                                        onClick={() => setSelectedFilm(film)} 
                                        isEditable={false} 
                                        onUpdateLog={handleUpdateLog}
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

  // --- RENDER HELPERS ---
  const currentList = isEditorMode ? editingList : selectedList;
  const currentTiersBase = currentList ? (viewMode === 'series' && currentList.seriesTiers ? currentList.seriesTiers : currentList.tiers) : [];
  const currentTiers = getSortedTiers(currentTiersBase);
  const isSavedInVault = currentList ? vaultIds.includes(currentList.id) : false;
  const canRemix = currentList ? !currentList.isCustom : false;

  const toggleAdmin = () => setIsAdmin(!isAdmin);

  if (!selectedList) {
    return (
      <div className="min-h-screen w-full bg-[#F5C71A] text-black font-sans selection:bg-black selection:text-[#F5C71A] flex flex-col transition-colors duration-300">
        
        {isSearchOpen && (
           <div className="fixed inset-0 z-50 bg-[#F5C71A]/95 backdrop-blur-md flex flex-col p-8 animate-fadeIn">
              <div className="w-full max-w-4xl mx-auto flex flex-col gap-8 h-full">
                  <div className="flex justify-between items-center border-b-4 border-black pb-4">
                     <h2 className="text-4xl font-black uppercase">Search Database</h2>
                     <button onClick={() => setIsSearchOpen(false)} className="text-2xl font-black hover:scale-110">X</button>
                  </div>
                  <input 
                    autoFocus
                    type="text" 
                    placeholder="Search films, directors..." 
                    className="w-full bg-transparent text-3xl md:text-5xl font-black uppercase placeholder-black/30 border-none outline-none"
                    value={globalSearchQuery}
                    onChange={(e) => setGlobalSearchQuery(e.target.value)}
                  />
                  <div className="flex-1 overflow-y-auto mt-4 pr-2">
                     {globalSearchQuery.length > 2 && (
                       <div className="grid grid-cols-1 gap-4">
                          {getAllFilms().filter(f => f.title.toLowerCase().includes(globalSearchQuery.toLowerCase()) || f.director.toLowerCase().includes(globalSearchQuery.toLowerCase())).slice(0, 20).map(film => (
                             <div key={film.id} onClick={() => setSelectedFilm(film)} className="p-4 border-2 border-black hover:bg-black hover:text-[#F5C71A] cursor-pointer flex justify-between items-center group">
                                <div>
                                   <h3 className="text-xl font-black uppercase">{film.title}</h3>
                                   <p className="font-mono text-sm opacity-60 group-hover:opacity-100">{film.year} • {film.director}</p>
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

        {isAICreatorOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
                <div className="w-full max-w-2xl bg-[#F5C71A] border-4 border-black p-8 shadow-[12px_12px_0px_0px_#fff]">
                    <h2 className="text-3xl font-black uppercase mb-4">Create New Journey</h2>
                    <p className="font-mono mb-4 text-sm">Enter a director, genre, or theme. The AI will assist you in building your tiers.</p>
                    <input 
                        type="text" 
                        placeholder="e.g. Christopher Nolan, 90s Cyberpunk..." 
                        className="w-full p-4 text-xl font-bold uppercase border-2 border-black mb-4 focus:outline-none"
                        value={aiCreatorQuery}
                        onChange={(e) => setAiCreatorQuery(e.target.value)}
                    />
                    <div className="flex gap-4">
                        <button onClick={handleGenerateAISuggestions} disabled={isGeneratingAI} className="flex-1 bg-black text-[#F5C71A] py-3 font-black uppercase hover:opacity-80">
                            {isGeneratingAI ? "Consulting Archives..." : "Start & Generate"}
                        </button>
                         <button onClick={handleCreateList} className="flex-1 bg-white text-black border-2 border-black py-3 font-black uppercase hover:bg-gray-100">
                            Start Blank
                        </button>
                        <button onClick={() => setIsAICreatorOpen(false)} className="px-4 py-3 font-bold uppercase underline">Cancel</button>
                    </div>
                </div>
            </div>
        )}

        {/* HEADER */}
        <header className="pt-12 pb-8 text-center px-4 relative">
           <div className="absolute top-8 right-8 flex gap-4">
               {isAdmin && <span className="bg-red-600 text-white px-2 py-1 text-xs font-black uppercase border border-black animate-pulse">ADMIN MODE ACTIVE</span>}
               <button onClick={() => setIsSearchOpen(true)} className="w-12 h-12 flex items-center justify-center border-4 border-black rounded-full hover:bg-black hover:text-[#F5C71A] transition-all shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                  <Search size={24} strokeWidth={3} />
               </button>
           </div>

          <h1 className="text-7xl md:text-9xl font-black tracking-tighter mb-2 uppercase leading-none cursor-pointer" onClick={() => window.location.reload()}>VIRGIL</h1>
          <p className="text-xl md:text-3xl font-bold font-mono tracking-widest uppercase opacity-80 mb-8">Curated Cinematic Journeys</p>
          
          <div className="flex justify-center items-center gap-0 border-b-4 border-black w-full max-w-2xl mx-auto">
            <button onClick={() => setActiveTab('archive')} className={`flex-1 py-4 text-xl md:text-2xl font-black uppercase tracking-widest transition-all ${activeTab === 'archive' ? 'bg-black text-[#F5C71A]' : 'bg-transparent text-black hover:bg-black/10'}`}>Archive</button>
            <div className="w-1 h-full bg-black"></div>
            <button onClick={() => setActiveTab('vault')} className={`flex-1 py-4 text-xl md:text-2xl font-black uppercase tracking-widest transition-all ${activeTab === 'vault' ? 'bg-black text-[#F5C71A]' : 'bg-transparent text-black hover:bg-black/10'}`}>My Vault</button>
          </div>
        </header>

        {/* MAIN CONTENT */}
        <main className="max-w-7xl mx-auto px-6 grid gap-16 mt-12 flex-grow w-full">
          
          {/* ARCHIVE TAB */}
          {activeTab === 'archive' && ARCHIVE_CATEGORIES.map((category) => {
             const isExpanded = expandedCategories[category.title];
             // Initial visible count = 8 (2 rows on desktop lg)
             const visibleLists = isExpanded ? category.lists : category.lists.slice(0, 8);
             
             return (
             <section key={category.title} className="space-y-6">
                <div className="flex items-center gap-4"><div className="h-6 w-6 bg-black"></div><h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest border-b-4 border-black pb-2 w-full">{category.title}</h2></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {visibleLists.map((originalList) => {
                    const list = masterOverrides[originalList.id] || originalList; // Use override if exists
                    const isSaved = vaultIds.includes(list.id);
                    const topFilms = getTopFilmsForList(list).map(f => f.title).join(" • ");
                    return (
                      <div key={list.id} onClick={() => { setSelectedList(list); setIsEditorMode(false); }} className={`group relative flex flex-col text-left cursor-pointer border-4 border-black p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] bg-[#F5C71A] text-black hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#F5C71A] transition-all duration-200`}>
                        {isSaved && <div className="absolute top-0 left-0 w-full h-3 bg-black"></div>}
                        {isSaved && <div className="absolute top-4 right-2 bg-black text-yellow-400 text-[10px] px-1 font-bold">SAVED</div>}
                        {!isSaved && <button onClick={(e) => handleToggleVault(e, list.id)} className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center border-2 border-black hover:bg-black hover:text-[#F5C71A] font-black transition-colors z-10" title="Add to Vault">+</button>}
                        <h3 className="text-2xl font-black uppercase leading-none mb-2 mt-2 pr-8">{list.title}</h3>
                        <p className="text-sm font-bold uppercase opacity-80 mb-4">{list.subtitle}</p>
                        <div className="mt-auto border-t-2 border-current pt-2 flex flex-col gap-2">
                             <p className="text-[10px] font-mono opacity-90 leading-tight uppercase tracking-wide line-clamp-2 min-h-[1.5em]">{topFilms || "Explore Films..."}</p>
                             <div className="flex justify-between items-center opacity-60 text-[10px] font-mono">
                                <span>{list.tiers.length} Tiers</span>
                                <span>{list.tiers.reduce((acc, t) => acc + t.films.length, 0)} Films</span>
                             </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {category.lists.length > 8 && (
                    <div className="flex justify-center mt-4">
                        <button 
                            onClick={() => setExpandedCategories(prev => ({...prev, [category.title]: !prev[category.title]}))}
                            className="bg-black text-[#F5C71A] px-6 py-2 font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform"
                        >
                            {isExpanded ? "Show Less" : "View More"}
                        </button>
                    </div>
                )}
             </section>
          )})}

          {/* VAULT (PROFILE) TAB */}
          {activeTab === 'vault' && (
             <div className="space-y-16 animate-fadeIn">
                
                {/* IDENTITY CARD (UPDATED) */}
                <div className="w-full max-w-5xl mx-auto bg-black text-[#F5C71A] shadow-[12px_12px_0px_0px_rgba(0,0,0,0.2)] border-4 border-black flex flex-col md:flex-row overflow-hidden relative">
                   {/* Left: Avatar & Socials */}
                   <div className="w-full md:w-1/4 bg-[#222] p-6 flex flex-col items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-black border-dashed relative">
                       {/* MONOLITH AVATAR */}
                       <div className="w-20 h-36 bg-black shadow-[4px_4px_10px_0px_rgba(0,0,0,0.5)] mb-6 transform hover:scale-105 transition-transform duration-500 cursor-pointer flex items-center justify-center group relative overflow-hidden">
                           <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-white/10 opacity-30"></div>
                           <div className="opacity-0 group-hover:opacity-100 text-white text-[9px] font-mono">MONOLITH</div>
                       </div>

                       {isEditingProfile ? (
                           <div className="flex flex-col gap-2 w-full">
                               <input className="bg-black border border-[#F5C71A] text-[#F5C71A] px-2 py-1 text-center font-black uppercase text-lg" value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} />
                               <input className="bg-black border border-[#F5C71A] text-[#F5C71A] px-2 py-1 text-center font-mono text-xs" value={profile.motto} onChange={(e) => setProfile({...profile, motto: e.target.value})} />
                               <button onClick={() => setIsEditingProfile(false)} className="bg-[#F5C71A] text-black text-xs font-bold py-1 flex items-center justify-center gap-1"><Save size={12}/> SAVE</button>
                           </div>
                       ) : (
                           <>
                               <h3 className="font-black text-xl uppercase tracking-wider text-center">{profile.name}</h3>
                               <p className="text-[10px] font-mono opacity-60 uppercase tracking-widest mb-4 text-center">"{profile.motto}"</p>
                               <button onClick={() => setIsEditingProfile(true)} className="text-[10px] underline opacity-50 hover:opacity-100 mb-4">Edit Identity</button>
                           </>
                       )}

                       <div className="flex gap-4 mt-2">
                           <Twitter size={16} className="hover:text-white cursor-pointer" />
                           <Instagram size={16} className="hover:text-white cursor-pointer" />
                           <div className="w-4 h-4 border border-[#F5C71A] flex items-center justify-center text-[8px] font-black hover:bg-[#F5C71A] hover:text-black cursor-pointer">LB</div>
                       </div>
                   </div>

                   {/* Right: Stats & Archetype */}
                   <div className="flex-1 p-8 flex flex-col justify-center relative">
                       <div className="absolute top-4 right-4 flex flex-col items-end">
                           <span className="text-[10px] font-mono uppercase opacity-50">Member Since</span>
                           <span className="text-xs font-bold font-mono">2025</span>
                       </div>
                       
                       <div className="mb-8">
                           <span className="text-[10px] font-mono uppercase tracking-[0.4em] opacity-60 bg-[#F5C71A] text-black px-2 py-1">Identity Archetype</span>
                           <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mt-2">{sherpaIdentity.fullTitle}</h2>
                           <p className="font-mono text-sm opacity-60 mt-2 max-w-md">"Cinema is truth 24 times a second."</p>
                       </div>

                       <div className="flex gap-8 border-t-2 border-dashed border-[#F5C71A]/30 pt-6">
                           <div className="flex flex-col"><span className="text-3xl font-mono font-bold">{sherpaIdentity.totalWatched}</span><span className="text-[9px] uppercase tracking-wider opacity-60">Films Logged</span></div>
                           <div className="flex flex-col"><span className="text-3xl font-mono font-bold">{sherpaIdentity.totalHours}</span><span className="text-[9px] uppercase tracking-wider opacity-60">Hours</span></div>
                           <div className="flex flex-col"><span className="text-3xl font-mono font-bold">{sherpaIdentity.totalCompleted}</span><span className="text-[9px] uppercase tracking-wider opacity-60">Journeys Done</span></div>
                       </div>
                   </div>
                </div>

                {/* Active Journeys */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4"><div className="h-6 w-6 bg-black border-2 border-black"></div><h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest border-b-4 border-black pb-2 w-full">Active Journeys</h2></div>
                  {active.length === 0 ? <p className="font-mono text-sm opacity-60">No active journeys. Add from archive.</p> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {active.map(list => {
                           const listBadges = earnedBadges.filter(b => b.listId === list.id);
                           const badge = listBadges.length > 0 ? listBadges[listBadges.length - 1] : null;
                           const progress = getListProgress(list);
                           return (
                             <div key={list.id} onClick={() => setSelectedList(list)} className="border-4 border-black p-4 bg-[#F5C71A] text-black cursor-pointer hover:bg-black hover:text-[#F5C71A] shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] relative transition-all">
                                <h3 className="font-black uppercase">{list.title}</h3>
                                {badge && (
                                   <div className="absolute top-2 right-2 bg-black text-yellow-400 border border-yellow-400 px-2 py-0.5 text-[10px] font-bold uppercase">
                                     {badge.title}
                                   </div>
                                )}
                                <div className="mt-2 text-xs font-mono font-bold border-t border-current pt-1 flex justify-between">
                                    <span>{progress}% Complete</span>
                                </div>
                             </div>
                           );
                        })}
                      </div>
                  )}
                </section>

                {/* Completed Journeys */}
                <section className="space-y-6">
                  <div className="flex items-center gap-4"><div className="h-6 w-6 bg-black border-2 border-black"></div><h2 className="text-2xl md:text-3xl font-black uppercase tracking-widest border-b-4 border-black pb-2 w-full">Completed Journeys</h2></div>
                  {completed.length === 0 ? <p className="font-mono text-sm opacity-60">No completed journeys yet.</p> : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {completed.map(list => {
                           const badge = earnedBadges.find(b => b.listId === list.id && b.level === 'master');
                           return (
                             <div key={list.id} onClick={() => setSelectedList(list)} className="border-4 border-black p-4 bg-black text-[#F5C71A] cursor-pointer shadow-[4px_4px_0px_0px_rgba(245,199,26,1)] relative transition-all">
                                <div className="absolute top-2 right-2 bg-yellow-400 text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                                    {badge?.title || "MASTER"}
                                </div>
                                <h3 className="font-black uppercase mt-4 text-xl">{list.title}</h3>
                                <div className="mt-2 text-xs font-mono opacity-80 border-t border-yellow-400 pt-1">JOURNEY COMPLETE</div>
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
                      {/* Drafts */}
                      <div className="flex flex-col gap-4">
                          <h3 className="font-bold font-mono uppercase opacity-70 border-b border-black">Drafts (Work in Progress)</h3>
                          {drafts.length === 0 && <p className="text-sm italic opacity-50">No drafts.</p>}
                          {drafts.map(list => (
                             <div 
                                key={list.id} 
                                onClick={() => {
                                   setSelectedList(list);
                                   setEditingList(list);
                                   setIsEditorMode(true);
                                   setAiSuggestions([]);
                                }} 
                                className="relative flex flex-col text-left cursor-pointer border-2 border-dashed border-black p-4 bg-[#F5C71A] hover:bg-black hover:text-yellow-400"
                             >
                                <div className="absolute top-0 right-0 bg-black text-white px-2 text-[10px] font-bold">DRAFT</div>
                                <h3 className="text-lg font-black uppercase">{list.title}</h3>
                             </div>
                          ))}
                      </div>

                      {/* Published */}
                      <div className="flex flex-col gap-4">
                          <h3 className="font-bold font-mono uppercase opacity-70 border-b border-black">Published Journeys</h3>
                          {published.length === 0 && <p className="text-sm italic opacity-50">No published lists.</p>}
                          {published.map(list => <div key={list.id} onClick={() => setSelectedList(list)} className="relative flex flex-col text-left cursor-pointer border-4 border-black p-4 bg-[#F5C71A] hover:bg-black hover:text-yellow-400"><div className="absolute top-0 right-0 bg-black text-yellow-400 px-2 text-[10px] font-bold">PUBLISHED</div><h3 className="text-lg font-black uppercase">{list.title}</h3></div>)}
                      </div>
                   </div>
                </section>
             </div>
          )}
        </main>

        {/* FOOTER */}
        <footer className="mt-32 bg-black text-[#F5C71A] border-t-8 border-[#F5C71A] py-16 px-6 relative">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-end gap-12">
                <div className="space-y-6">
                    <h2 className="text-6xl md:text-8xl font-black uppercase leading-none tracking-tighter opacity-20 hover:opacity-100 transition-opacity duration-500 cursor-default">
                        CONSUME<br/>MEANINGFULLY.
                    </h2>
                    <div className="flex flex-col gap-2">
                        <p className="font-mono text-xs opacity-60 max-w-sm">
                            Virgil is a curated discovery platform designed to replace algorithms with curated content lists.
                        </p>
                    </div>
                </div>

                <div className="flex flex-col items-end gap-8 text-right">
                    <div className="flex gap-6 text-sm font-bold uppercase tracking-widest">
                        <span className="cursor-pointer hover:text-white hover:underline decoration-2 underline-offset-4">Manifesto</span>
                        <span className="cursor-pointer hover:text-white hover:underline decoration-2 underline-offset-4 opacity-50">Privacy</span>
                        <button onClick={toggleAdmin} className={`cursor-pointer hover:text-white hover:underline decoration-2 underline-offset-4 uppercase ${isAdmin ? 'text-red-500 font-black' : 'opacity-50'}`}>
                            {isAdmin ? 'Admin Active' : 'Admin'}
                        </button>
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

         {selectedFilm && !selectedList && <FilmModal film={selectedFilm} log={userDb[selectedFilm.id]} onUpdateLog={handleUpdateLog} onClose={() => setSelectedFilm(null)} onNavigateToList={handleNavigateToList} isUGC={selectedFilm.isCustomEntry} listTitle="Global Search" />}
      </div>
    );
  }

  // --- EDITOR / LIST VIEW ---
  if (!currentList) return null;

  return (
    <div className="min-h-screen w-full bg-[#F5C71A] text-black pb-20 overflow-x-hidden">
      
      {/* ADMIN WARNING BANNER */}
      {isEditorMode && !currentList.isCustom && isAdmin && (
            <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-600 text-white px-6 py-2 font-black uppercase z-50 shadow-xl border-2 border-black animate-pulse flex items-center gap-2">
                <ShieldAlert size={20} />
                <span>⚠ EDITING MASTER LIST (ADMIN MODE)</span>
            </div>
      )}

      {showTierSearchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4">
           <div className="w-full max-w-2xl bg-[#F5C71A] border-4 border-black p-6 shadow-[8px_8px_0px_0px_#fff]">
              <h3 className="text-xl font-black uppercase mb-4">Add to Tier</h3>
              <input autoFocus type="text" placeholder="Search database or type custom..." className="w-full p-4 text-xl font-mono border-2 border-black bg-white mb-4 uppercase" value={tierSearchQuery} onChange={(e) => setTierSearchQuery(e.target.value)} />
              <div className="max-h-60 overflow-y-auto border-2 border-black bg-white">
                 {tierSearchQuery.length > 0 && <button onClick={() => handleAddFilmToTier(createFilm(tierSearchQuery, new Date().getFullYear(), "Sherpa Selection"))} className="w-full text-left p-3 hover:bg-black hover:text-[#F5C71A] border-b font-bold">+ ADD CUSTOM: "{tierSearchQuery}"</button>}
                 {getAllFilms().filter(f => f.title.toLowerCase().includes(tierSearchQuery.toLowerCase())).map(film => (
                   <button key={film.id} onClick={() => handleAddFilmToTier(film)} className="w-full text-left p-3 hover:bg-black hover:text-[#F5C71A] border-b"><span className="font-bold uppercase">{film.title}</span></button>
                 ))}
              </div>
              <button onClick={() => setShowTierSearchModal(null)} className="mt-4 text-sm underline uppercase font-bold">Cancel</button>
           </div>
        </div>
      )}

      <nav className="fixed top-0 left-0 w-full z-40 px-6 py-4 flex justify-between items-start pointer-events-none">
        <button onClick={() => { setSelectedList(null); setIsEditorMode(false); setAiSuggestions([]); }} className="pointer-events-auto bg-[#F5C71A] border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] font-black uppercase tracking-wider text-sm hover:bg-black hover:text-[#F5C71A] transition-colors">← Back</button>
        <div className="flex gap-2 pointer-events-auto">
           {isEditorMode ? (
             <div className="flex gap-2 items-center">
                <button 
                  onClick={handleTogglePublish} 
                  className={`border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1 transition-all ${editingList?.status === 'published' ? 'bg-red-600 text-white hover:bg-red-700' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
                >
                    {editingList?.status === 'published' ? 'UNPUBLISH' : 'PUBLISH'}
                </button>
                <button onClick={handleSaveList} className="bg-green-600 text-white border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-1">SAVE & EXIT</button>
             </div>
           ) : (
             <>
               {canRemix && <button onClick={handleForkList} className="bg-white border-2 border-black px-4 py-2 font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:bg-black hover:text-[#F5C71A]">
                   {(isAdmin && !currentList.isCustom) ? "EDIT MASTER (ADMIN)" : "REMIX THIS JOURNEY"}
               </button>}
               <button onClick={(e) => handleToggleVault(e, currentList.id)} className={`px-4 py-2 border-2 border-black font-black uppercase shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] ${isSavedInVault ? 'bg-black text-[#F5C71A]' : 'bg-[#F5C71A] text-black'}`}>{isSavedInVault ? "✓ SAVED" : "+ ADD TO VAULT"}</button>
             </>
           )}
        </div>
      </nav>

      <header className="pt-20 pb-8 text-center px-4 relative z-20 flex flex-col items-center">
        {isEditorMode ? (
           <div className="flex flex-col gap-2 w-full max-w-xl">
              <input value={currentList.title} onChange={(e) => setEditingList({...editingList!, title: e.target.value})} className="text-4xl md:text-6xl font-black uppercase text-center bg-transparent border-b-2 border-black focus:outline-none" />
              <input value={currentList.subtitle} onChange={(e) => setEditingList({...editingList!, subtitle: e.target.value})} className="text-xl font-bold uppercase text-center bg-transparent border-b border-black focus:outline-none" />
           </div>
        ) : (
          <>
            <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-2 uppercase">{currentList.title}</h1>
            <div className="h-1 w-32 bg-black mx-auto mb-4"></div>
            <p className="text-lg md:text-xl font-medium italic opacity-90 tracking-widest uppercase mb-6">{currentList.subtitle}</p>
          </>
        )}
        
        <div className="flex flex-col items-center gap-4 mt-4 w-full max-w-3xl pointer-events-auto">
             {(currentList.seriesTiers || isEditorMode) && (
              <div className="flex border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] bg-[#F5C71A]">
                <button onClick={() => setViewMode('cinema')} className={`px-6 py-2 font-black uppercase text-sm ${viewMode === 'cinema' ? 'bg-black text-[#F5C71A]' : 'bg-transparent'}`}>Cinema</button>
                <div className="w-0.5 bg-black"></div>
                <button onClick={() => setViewMode('series')} className={`px-6 py-2 font-black uppercase text-sm ${viewMode === 'series' ? 'bg-black text-[#F5C71A]' : 'bg-transparent'}`}>Series</button>
              </div>
            )}
            
            {!isEditorMode && (
                <div className="flex flex-wrap justify-center gap-4 border-t-2 border-black/20 pt-4 w-full">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-mono uppercase tracking-widest mb-1">Sort By</span>
                        <div className="flex border-2 border-black bg-white">
                             {(['curator', 'chronological'] as SortOption[]).map(s => (
                                <button key={s} onClick={() => setSortOption(s)} className={`px-3 py-1 text-xs font-bold uppercase border-r last:border-r-0 border-black ${sortOption === s ? 'bg-black text-[#F5C71A]' : 'hover:bg-gray-100'}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
      </header>

      {isEditorMode && aiSuggestions.length > 0 && (
          <div className="fixed bottom-0 left-0 w-full bg-black p-4 z-[60] border-t-4 border-[#F5C71A]">
              <div className="flex justify-between items-center mb-2">
                 <h4 className="text-[#F5C71A] font-black uppercase">Draft Bin (Drag to Tier)</h4>
                 <button onClick={() => setAiSuggestions([])} className="text-white text-xs underline">Clear Bin</button>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-2">
                  {aiSuggestions.map((s, i) => (
                      <div 
                        key={i} 
                        className="min-w-[150px] bg-[#F5C71A] text-black p-2 border border-white cursor-grab active:cursor-grabbing hover:scale-105 transition-transform"
                        draggable
                        onDragStart={(e) => { e.dataTransfer.setData("filmData", JSON.stringify(createFilm(s.title, s.year, s.director))); e.dataTransfer.setData("sourceTier", "draft"); }}
                      >
                          <p className="font-bold text-xs uppercase">{s.title}</p>
                          <p className="text-[10px]">{s.director}</p>
                      </div>
                  ))}
              </div>
          </div>
      )}

      <main className="max-w-7xl mx-auto px-4 relative pb-32">
        {sortOption === 'chronological' ? (
           <TimelineView tiers={currentTiersBase} />
        ) : (
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
                    <input value={tier.name} onChange={(e) => { const newList = {...editingList!}; (viewMode === 'series' ? newList.seriesTiers! : newList.tiers)[tierIndex].name = e.target.value; setEditingList(newList); }} className="text-sm md:text-lg font-black uppercase tracking-widest text-center bg-transparent focus:outline-none" />
                  ) : (
                    <h2 className="text-sm md:text-lg font-black uppercase tracking-widest text-center">{tier.name}</h2>
                  )}
                  {isEditorMode && <button onClick={() => handleRemoveTier(tierIndex, viewMode === 'series')} className="text-red-600 font-bold ml-2 text-xs">x</button>}
                </div>
                <div className="h-8 w-1 bg-black" />
                <div className="flex justify-center flex-wrap w-full gap-x-4 gap-y-8 min-h-[100px] border-2 border-dashed border-black/20 p-4">
                  {tier.films.map((film) => (
                      <div key={film.id} className="relative"> 
                        <FilmCard 
                          film={film} 
                          log={userDb[film.id]} 
                          onClick={(f) => isEditorMode ? setIsEditContextMode(f.id) : setSelectedFilm(f)} 
                          isEditable={isEditorMode} 
                          onRemove={() => handleRemoveFilmFromTier(film.id, tierIndex, viewMode === 'series')} 
                          hasNote={!!currentList.sherpaNotes?.[film.id]} 
                          onUpdateLog={handleUpdateLog}
                          onDragStart={(e) => handleDragStart(e, film, tierIndex)}
                        />
                      </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {selectedFilm && (
        <FilmModal 
          film={selectedFilm} 
          log={userDb[selectedFilm.id]} 
          onUpdateLog={handleUpdateLog} 
          onClose={() => setSelectedFilm(null)} 
          onNavigateToList={handleNavigateToList} 
          sherpaNote={currentList.sherpaNotes?.[selectedFilm.id]}
          listTitle={currentList.title}
        />
      )}

      {isEditContextMode && editingList && (
         <FilmModal 
            film={[...editingList.tiers.flatMap(t => t.films), ...(editingList.seriesTiers?.flatMap(t => t.films) || [])].find(f => f.id === isEditContextMode) || null} 
            onClose={() => setIsEditContextMode(null)}
            onNavigateToList={() => {}}
            isEditing={true}
            sherpaNote={editingList.sherpaNotes?.[isEditContextMode] || ""}
            onSaveNote={handleSaveSherpaNote}
         />
      )}

    </div>
  );
}

export default App;
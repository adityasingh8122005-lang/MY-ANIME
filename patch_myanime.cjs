const fs = require('fs');
// This script will just overwrite MyAnimePage with a complete React implementation.
// Instead of writing a massive heredoc in bash that gets mangled, I'll write the raw code block and write it to disk.

const code = `import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGroupedCollection, autoHealUnknownMetadata, autoHealFranchiseDates, autoSyncStaleData, autoRebuildFranchises } from '../services/franchiseService';
import { getIntelligenceData } from '../services/intelligence/intelligenceService';
import { getCustomCollections, createCustomCollection, deleteCustomCollection, updateCustomCollection } from '../services/collectionService';
import { Loader2, Folder, LayoutGrid, Menu, Check, Edit2, Search, Filter, Plus, Trash2, Settings, PlayCircle } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableAnimeItem from '../components/SortableAnimeItem';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';
import clsx from 'clsx';
import { Button } from '../components/ui/Button';

export default function MyAnimePage() {
  const { session } = useAuth();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [collection, setCollection] = useState([]);
  const [customCollections, setCustomCollections] = useState([]);
  const [intelligence, setIntelligence] = useState(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [errorObj, setErrorObj] = useState(null);
  
  // Navigation / Views
  const [activeView, setActiveView] = useState('library'); // 'library' or custom_collection_id
  
  // Smart Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [ratingFilter, setRatingFilter] = useState('All');
  const [genreFilter, setGenreFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [showFilters, setShowFilters] = useState(false);
  
  const [sortBy, setSortBy] = useState(() => localStorage.getItem('myAnimeSortBy') || 'updatedAt');
  useEffect(() => { localStorage.setItem('myAnimeSortBy', sortBy); }, [sortBy]);
  
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [customOrder, setCustomOrder] = useState(() => JSON.parse(localStorage.getItem('myAnimeOrder')) || []);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('myAnimeViewMode') || 'grid');
  useEffect(() => { localStorage.setItem('myAnimeViewMode', viewMode); }, [viewMode]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const [data, intData, ccData] = await Promise.all([
           getGroupedCollection(false),
           getIntelligenceData(),
           getCustomCollections()
        ]);
        
        autoHealUnknownMetadata();
        autoHealFranchiseDates();
        autoSyncStaleData();
        
        setCollection(data);
        setIntelligence(intData);
        setCustomCollections(ccData);
      } catch (err) {
        console.error(err);
        setErrorObj(err.toString());
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  const handleCreateCollection = async (e) => {
     e.preventDefault();
     if (!newColName.trim()) return;
     setIsCreating(true);
     try {
         const col = await createCustomCollection(newColName, newColDesc);
         setCustomCollections([col, ...customCollections]);
         setShowCreateModal(false);
         setNewColName("");
         setNewColDesc("");
         setActiveView(col.id);
     } catch (err) {
         alert("Failed to create collection: " + err.message);
     } finally {
         setIsCreating(false);
     }
  };
  
  const handleDeleteCollection = async (id) => {
     if (!window.confirm("Are you sure you want to delete this custom collection? The anime themselves will not be deleted.")) return;
     try {
         await deleteCustomCollection(id);
         setCustomCollections(customCollections.filter(c => c.id !== id));
         if (activeView === id) setActiveView('library');
     } catch(err) {
         alert("Failed to delete: " + err.message);
     }
  };

  const handleDragStart = (e) => setActiveDragItem(collection.find(i => (i.isFranchise ? i.franchiseId : i.malId) === e.active.id));
  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over) return;
    if (active.id !== over.id) {
      const oldIndex = filtered.findIndex(i => (i.isFranchise ? i.franchiseId : i.malId) === active.id);
      const newIndex = filtered.findIndex(i => (i.isFranchise ? i.franchiseId : i.malId) === over.id);
      const newOrder = arrayMove(filtered, oldIndex, newIndex);
      const orderIds = newOrder.map(item => item.isFranchise ? item.franchiseId : item.malId);
      setCustomOrder(orderIds);
      localStorage.setItem('myAnimeOrder', JSON.stringify(orderIds));
      setSortBy('custom');
    }
  };

  // Build Filter Options
  const allGenres = Array.from(new Set(collection.flatMap(c => c.metadata?.genres?.map(g => g.name) || []))).sort();
  const hasActiveFilters = statusFilter !== 'All' || ratingFilter !== 'All' || genreFilter !== 'All' || typeFilter !== 'All';

  const clearFilters = () => {
     setStatusFilter('All');
     setRatingFilter('All');
     setGenreFilter('All');
     setTypeFilter('All');
  };

  let filtered = collection.filter(item => {
    if (activeView !== 'library') {
       const custom = customCollections.find(c => c.id === activeView);
       if (!custom || !custom.items.includes(item.isFranchise ? item.franchiseId : item.malId)) return false;
    }
    
    if (statusFilter !== 'All' && item.personalStatus !== statusFilter) return false;
    if (ratingFilter !== 'All') {
       if (ratingFilter === 'Unrated' && item.personalRating > 0) return false;
       if (ratingFilter !== 'Unrated') {
          const min = parseInt(ratingFilter);
          if ((item.personalRating || 0) < min) return false;
       }
    }
    if (genreFilter !== 'All' && !item.metadata?.genres?.find(g => g.name === genreFilter)) return false;
    if (typeFilter !== 'All' && item.metadata?.format !== typeFilter) return false;
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'custom') {
      const indexA = customOrder.indexOf(a.isFranchise ? a.franchiseId : a.malId);
      const indexB = customOrder.indexOf(b.isFranchise ? b.franchiseId : b.malId);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    }
    if (sortBy === 'title') return a.title.localeCompare(b.title);
    if (sortBy === 'episodes') return (b.totalEpisodes || b.canonEpisodes || 0) - (a.totalEpisodes || a.canonEpisodes || 0);
    if (sortBy === 'rating') return (b.personalRating || 0) - (a.personalRating || 0);
    if (sortBy === 'rating_asc') return (a.personalRating || 0) - (b.personalRating || 0);
    if (sortBy === 'addedAt') return new Date(a.updatedAt) - new Date(b.updatedAt);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  if (isLoading) return <div className="flex justify-center items-center h-64"><Loader2 size={32} className="animate-spin text-accent" /></div>;

  return (
    <div className="max-w-[1600px] mx-auto pb-12 relative isolate min-h-screen">
      <AnimatedAnimeBackground anime={collection} />
      
      <div className="relative z-10 px-4 pt-12 md:pt-20">
        
        {/* Cinematic Header */}
        <div className="mb-12 border-b border-white/5 pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
           <h1 className="text-display-s md:text-display-m font-bold text-white mb-6 tracking-tight drop-shadow-lg">
             MY LIBRARY
           </h1>
           <div className="flex flex-wrap items-center gap-6 md:gap-12">
              <div className="flex flex-col">
                 <span className="text-h2 md:text-display-s font-bold text-primary">{intelligence?.totalAnime || 0}</span>
                 <span className="text-micro font-bold text-zinc-500 uppercase tracking-wider">Total Anime</span>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col">
                 <span className="text-h2 md:text-display-s font-bold text-success">{intelligence?.statuses?.['Completed'] || 0}</span>
                 <span className="text-micro font-bold text-zinc-500 uppercase tracking-wider">Completed</span>
              </div>
              <div className="w-px h-12 bg-white/10" />
              <div className="flex flex-col">
                 <span className="text-h2 md:text-display-s font-bold text-warning">{intelligence?.statuses?.['Watching'] || 0}</span>
                 <span className="text-micro font-bold text-zinc-500 uppercase tracking-wider">Watching</span>
              </div>
              <div className="w-px h-12 bg-white/10 hidden md:block" />
              <div className="flex-col hidden md:flex">
                 <span className="text-h2 md:text-display-s font-bold text-accent">{intelligence?.watchHours || 0}</span>
                 <span className="text-micro font-bold text-zinc-500 uppercase tracking-wider">Hours Watched</span>
              </div>
           </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
           {/* Sidebar Navigation */}
           <div className="w-full lg:w-64 shrink-0 flex flex-col gap-2 animate-in fade-in slide-in-from-left-4 duration-500 delay-100">
              <button 
                onClick={() => setActiveView('library')} 
                className={clsx("flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl font-bold transition-all text-left", activeView === 'library' ? "bg-primary text-white shadow-depth-2" : "bg-transparent text-zinc-400 hover:bg-surface-2 hover:text-white")}
              >
                <LayoutGrid size={20} /> All Anime
              </button>
              
              <div className="mt-6 mb-2 flex items-center justify-between px-4">
                 <span className="text-micro font-bold text-zinc-500 uppercase tracking-wider">Custom Collections</span>
                 <button onClick={() => setShowCreateModal(true)} className="min-h-[44px] text-zinc-400 hover:text-white p-1 transition-colors" aria-label="Create Collection">
                    <Plus size={18} />
                 </button>
              </div>

              {customCollections.length === 0 ? (
                 <p className="px-4 text-sm text-zinc-600 italic">No custom collections yet.</p>
              ) : (
                 customCollections.map(c => (
                    <div key={c.id} className="flex items-center gap-1">
                       <button 
                         onClick={() => setActiveView(c.id)} 
                         className={clsx("flex-1 flex items-center gap-3 px-4 py-3 min-h-[44px] rounded-xl font-bold transition-all text-left", activeView === c.id ? "bg-surface-2 text-white border border-white/5" : "bg-transparent text-zinc-400 hover:bg-surface-1 hover:text-white")}
                       >
                         <Folder size={18} className={activeView === c.id ? "text-primary" : ""} /> 
                         <span className="truncate">{c.name}</span>
                       </button>
                       {activeView === c.id && (
                          <button onClick={() => handleDeleteCollection(c.id)} className="p-3 text-zinc-500 hover:text-error transition-colors" aria-label="Delete Collection">
                             <Trash2 size={16} />
                          </button>
                       )}
                    </div>
                 ))
              )}
           </div>

           {/* Content Grid */}
           <div className="flex-1 animate-in fade-in duration-700 delay-200">
              
              {/* Active Header & Filters */}
              <div className="mb-6 flex flex-col xl:flex-row xl:items-end justify-between gap-4 bg-surface-1 p-4 rounded-[24px] border border-white/5 shadow-depth-2">
                 
                 <div className="flex-1">
                    <div className="flex items-center justify-between mb-4">
                       <h2 className="text-h3 font-bold text-white flex items-center gap-2">
                          {activeView === 'library' ? 'Entire Collection' : customCollections.find(c => c.id === activeView)?.name}
                       </h2>
                       <button onClick={() => setShowFilters(!showFilters)} className={clsx("flex items-center gap-2 px-3 min-h-[44px] rounded font-bold text-sm transition-colors", showFilters || hasActiveFilters ? "text-primary" : "text-zinc-400 hover:text-white")}>
                          <Filter size={16} /> Filters {hasActiveFilters && '(Active)'}
                       </button>
                    </div>

                    {showFilters && (
                       <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-in slide-in-from-top-2 duration-300">
                          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="bg-surface-2 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary">
                             <option value="All">All Status</option>
                             <option value="Watching">Watching</option>
                             <option value="Completed">Completed</option>
                             <option value="Plan to Watch">Plan to Watch</option>
                             <option value="On Hold">On Hold</option>
                             <option value="Dropped">Dropped</option>
                          </select>
                          <select value={ratingFilter} onChange={e => setRatingFilter(e.target.value)} className="bg-surface-2 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary">
                             <option value="All">All Ratings</option>
                             <option value="9">9+ Masterpiece</option>
                             <option value="8">8+ Great</option>
                             <option value="7">7+ Good</option>
                             <option value="Unrated">Unrated</option>
                          </select>
                          <select value={genreFilter} onChange={e => setGenreFilter(e.target.value)} className="bg-surface-2 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary">
                             <option value="All">All Genres</option>
                             {allGenres.map(g => <option key={g} value={g}>{g}</option>)}
                          </select>
                          <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} className="bg-surface-2 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary">
                             <option value="All">All Formats</option>
                             <option value="TV">TV</option>
                             <option value="MOVIE">Movie</option>
                             <option value="OVA">OVA</option>
                          </select>
                       </div>
                    )}
                 </div>

                 <div className="w-full xl:w-px xl:h-12 bg-white/10 hidden xl:block" />

                 <div className="flex items-center gap-3 pt-4 xl:pt-0 border-t border-white/5 xl:border-none">
                    <select value={sortBy} onChange={e => { setSortBy(e.target.value); setIsEditingOrder(false); }} className="flex-1 xl:flex-none bg-surface-2 border border-white/5 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-primary min-w-[160px]">
                       <option value="updatedAt">Recently Updated</option>
                       <option value="addedAt">Recently Added</option>
                       <option value="rating">Rating (High to Low)</option>
                       <option value="rating_asc">Rating (Low to High)</option>
                       <option value="progress">Progress (High to Low)</option>
                       <option value="episodes">Total Episodes</option>
                       <option value="title">Title (A-Z)</option>
                       {customOrder.length > 0 && <option value="custom">Custom Order</option>}
                    </select>

                    <div className="flex bg-surface-2 border border-white/5 rounded-lg overflow-hidden">
                       <button onClick={() => setViewMode('grid')} className={clsx("p-2.5 min-h-[44px]", viewMode === 'grid' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white")}><LayoutGrid size={18} /></button>
                       <button onClick={() => setViewMode('compact')} className={clsx("p-2.5 min-h-[44px]", viewMode === 'compact' ? "bg-white/10 text-white" : "text-zinc-500 hover:text-white")}><Menu size={18} /></button>
                    </div>
                 </div>

              </div>
              
              {hasActiveFilters && (
                 <div className="mb-6 flex items-center gap-4">
                    <button onClick={clearFilters} className="text-sm text-zinc-400 hover:text-white min-h-[44px]">Clear Filters</button>
                    <div className="h-px flex-1 bg-white/5" />
                 </div>
              )}

              {/* Grid Content */}
              {filtered.length === 0 ? (
                 <div className="text-center py-24 bg-surface-1 border border-white/5 rounded-[32px]">
                    <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6 text-zinc-500">
                       <Search size={32} />
                    </div>
                    <h3 className="text-h3 font-bold text-white mb-2">Nothing here yet.</h3>
                    <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                       {activeView === 'library' 
                          ? "Your universe is empty or no anime match these filters." 
                          : "This custom collection is empty. Add anime from their detail pages."}
                    </p>
                    <Link to="/search" className="inline-flex min-h-[44px] items-center justify-center bg-primary text-white font-bold px-6 py-2 rounded-full hover:bg-primary/90 transition-colors">
                       Discover Anime
                    </Link>
                 </div>
              ) : (
                 <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                    <SortableContext items={filtered.map(i => i.isFranchise ? i.franchiseId : i.malId)} strategy={viewMode === 'compact' ? verticalListSortingStrategy : rectSortingStrategy}>
                       {viewMode === 'compact' ? (
                          <div className="flex flex-col gap-2">
                             {filtered.map((item) => <SortableAnimeItem key={item.isFranchise ? item.franchiseId : item.malId} item={item} activeTab="All" isEditingOrder={isEditingOrder} viewMode={viewMode} />)}
                          </div>
                       ) : (
                          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                             {filtered.map((item) => <SortableAnimeItem key={item.isFranchise ? item.franchiseId : item.malId} item={item} activeTab="All" isEditingOrder={isEditingOrder} viewMode={viewMode} />)}
                          </div>
                       )}
                    </SortableContext>
                    <DragOverlay>
                       {activeDragItem ? <SortableAnimeItem item={activeDragItem} activeTab="All" isEditingOrder={false} viewMode={viewMode} /> : null}
                    </DragOverlay>
                 </DndContext>
              )}

           </div>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
         <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-void/90 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-surface-1 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-depth-5">
               <h2 className="text-h3 font-bold text-white mb-4">Create Collection</h2>
               <form onSubmit={handleCreateCollection}>
                  <div className="mb-4">
                     <label className="block text-sm font-bold text-zinc-400 mb-2">Name</label>
                     <input type="text" maxLength={50} required value={newColName} onChange={e => setNewColName(e.target.value)} className="w-full bg-surface-2 border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none" placeholder="e.g. My Favorites" />
                  </div>
                  <div className="mb-6">
                     <label className="block text-sm font-bold text-zinc-400 mb-2">Description (Optional)</label>
                     <textarea maxLength={200} rows={3} value={newColDesc} onChange={e => setNewColDesc(e.target.value)} className="w-full bg-surface-2 border border-white/5 rounded-lg p-3 text-white focus:border-primary focus:outline-none resize-none" placeholder="What is this collection about?" />
                  </div>
                  <div className="flex items-center gap-3">
                     <Button type="button" onClick={() => setShowCreateModal(false)} variant="ghost" className="flex-1">Cancel</Button>
                     <Button type="submit" disabled={isCreating} variant="primary" className="flex-1">{isCreating ? 'Creating...' : 'Create'}</Button>
                  </div>
               </form>
            </div>
         </div>
      )}

    </div>
  );
}
`;

fs.writeFileSync('src/pages/MyAnimePage.jsx', code);

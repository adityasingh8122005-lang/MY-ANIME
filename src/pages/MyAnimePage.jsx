import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGroupedCollection, autoHealUnknownMetadata, autoHealFranchiseDates, addFranchiseToDb, autoSyncStaleData, autoRebuildFranchises } from '../services/franchiseService';
import { getFranchiseData } from '../services/franchiseApi';
import { Loader2, Library, Folder, Edit2, Check, ArrowUp, ArrowDown, LayoutGrid, Menu, GripVertical } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, rectSortingStrategy, verticalListSortingStrategy } from '@dnd-kit/sortable';
import SortableAnimeItem from '../components/SortableAnimeItem';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';

import clsx from 'clsx';

export default function MyAnimePage() {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const [activeDragItem, setActiveDragItem] = useState(null);
  const [collection, setCollection] = useState([]);
  const showNonCanon = false; // Always hide non-canon from library view by default
  const [isLoading, setIsLoading] = useState(true);
  const [errorObj, setErrorObj] = useState(null);
  const [sortBy, setSortBy] = useState(() => {
    const saved = localStorage.getItem('myAnimeSortBy');
    if (saved === 'addedAt' || saved === 'title') return 'updatedAt';
    return saved || 'updatedAt';
  });
  const [activeTab, setActiveTab] = useState('All');
  useEffect(() => { localStorage.setItem('myAnimeSortBy', sortBy); }, [sortBy]);
  const [completedFilter, setCompletedFilter] = useState('All');
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [customOrder, setCustomOrder] = useState(() => JSON.parse(localStorage.getItem('myAnimeOrder')) || []);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('myAnimeViewMode') || 'grid');
  useEffect(() => { localStorage.setItem('myAnimeViewMode', viewMode); }, [viewMode]);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getGroupedCollection(showNonCanon);
        // Silently heal in background
        autoHealUnknownMetadata();
        autoHealFranchiseDates();
        autoSyncStaleData();
        autoRebuildFranchises();
        setCollection(data);
        
        // Deep heal completely corrupted "Unknown" single animes
        const corrupted = data.filter(item => !item.isFranchise && item.title === "Unknown");
        if (corrupted.length > 0) {
          
          for (const item of corrupted) {
            console.log("Deep healing:", item.malId);
            try {
              const fData = await getFranchiseData(item.malId);
              if (fData) await addFranchiseToDb(fData);
            } catch(e) {}
          }
          // Reload if we healed any
          getGroupedCollection(showNonCanon).then(setCollection);
        }

      } catch (err) {
        console.error(err);
        setErrorObj(err.toString() + "\n" + err.stack);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [showNonCanon]);

  useEffect(() => {
    if (customOrder.length > 0) {
      localStorage.setItem('myAnimeOrder', JSON.stringify(customOrder));
    }
  }, [customOrder]);

  if (errorObj) return <div className="text-red-500 p-8 whitespace-pre-wrap">{errorObj}</div>;
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  const handleDragStart = (event) => {
    const { active } = event;
    const item = filtered.find(i => (i.isFranchise ? i.franchiseId : i.malId) === active.id);
    setActiveDragItem(item);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveDragItem(null);
    
    if (active.id !== over?.id) {
      const oldIndex = filtered.findIndex(i => (i.isFranchise ? i.franchiseId : i.malId) === active.id);
      const newIndex = filtered.findIndex(i => (i.isFranchise ? i.franchiseId : i.malId) === over.id);
      
      const newOrder = arrayMove(filtered, oldIndex, newIndex);
      const orderIds = newOrder.map(item => item.isFranchise ? item.franchiseId : item.malId);
      
      setCustomOrder(orderIds);
      localStorage.setItem('myAnimeOrder', JSON.stringify(orderIds));
      setSortBy('custom');
    }
  };

  let filtered = collection.filter(item => {
    if (activeTab === 'All' && item.personalStatus === 'Plan to Watch') {
      return false; // User requested to hide Plan to Watch items from the 'All' tab
    }
    if (activeTab !== 'All' && item.personalStatus !== activeTab) {
      return false;
    }
    if (activeTab === 'Completed' && completedFilter !== 'All') {
      return item.airStatus === completedFilter;
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'custom' && customOrder.length > 0) {
      const idA = a.isFranchise ? a.franchiseId : a.malId;
      const idB = b.isFranchise ? b.franchiseId : b.malId;
      const indexA = customOrder.indexOf(idA);
      const indexB = customOrder.indexOf(idB);
      if (indexA !== -1 && indexB !== -1) return indexA - indexB;
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;
    }
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'episodes') {
      const epA = a.totalEpisodes || a.canonEpisodes || 0;
      const epB = b.totalEpisodes || b.canonEpisodes || 0;
      return epB - epA;
    } else if (sortBy === 'progress') {
      const progA = a.isFranchise ? (a.totalWatched / (a.totalCanon || 1)) : (a.episodesWatched / (a.canonEpisodes || 1));
      const progB = b.isFranchise ? (b.totalWatched / (b.totalCanon || 1)) : (b.episodesWatched / (b.canonEpisodes || 1));
      return progB - progA;
    } else if (sortBy === 'addedAt') {
      // simulate first watched by sorting by updatedAt ascending
      return new Date(a.updatedAt) - new Date(b.updatedAt);
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  const tabs = ['All', 'Watching', 'Completed', 'Plan to Watch'];

  return (
    <div className="max-w-7xl mx-auto pb-12 relative isolate">
      <AnimatedAnimeBackground anime={collection} />
      <div className="relative z-10 px-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Library className="text-accent" /> My Anime Collection
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center bg-dark-surface border border-zinc-800 rounded overflow-hidden">
            <button 
              onClick={() => setViewMode('grid')}
              className={clsx("p-2 transition-colors", viewMode === 'grid' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}
              title="Grid view"
            >
              <LayoutGrid size={18} />
            </button>
            <button 
              onClick={() => setViewMode('compact')}
              className={clsx("p-2 transition-colors", viewMode === 'compact' ? "bg-zinc-800 text-white" : "text-zinc-500 hover:text-white")}
              title="Compact view"
            >
              <Menu size={18} />
            </button>
          </div>
          <select 
            value={sortBy} 
            onChange={e => { setSortBy(e.target.value); setIsEditingOrder(false); }}
            className="bg-dark-surface border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-accent"
          >
            <option value="updatedAt">Recently Updated</option>
            
            
            <option value="progress">Progress (High to Low)</option>
            <option value="episodes">Total Episodes (High to Low)</option>
            {customOrder.length > 0 && <option value="custom">Custom Order</option>}
          </select>
          
          <button 
            onClick={() => setIsEditingOrder(!isEditingOrder)}
            className={clsx("flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors border", isEditingOrder ? "bg-accent text-white border-accent" : "bg-dark-surface text-zinc-400 border-zinc-800 hover:text-white")}
          >
            {isEditingOrder ? <><Check size={16} /> Done</> : <><Edit2 size={16} /> Edit Order</>}
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6 border-b border-zinc-800 pb-2">
        {tabs.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-2 rounded-t-lg font-medium whitespace-nowrap transition-colors border-b-2",
              activeTab === tab ? "text-accent border-accent" : "text-zinc-500 border-transparent hover:text-white"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {(activeTab === 'Completed' || activeTab === 'Plan to Watch') && (
        <div className="flex gap-2 mb-6 bg-dark-surface p-1 rounded-lg w-fit border border-zinc-800">
          {['All', 'Finished', 'Ongoing'].map(filter => (
            <button
              key={filter}
              onClick={() => setCompletedFilter(filter)}
              className={clsx(
                "px-4 py-1.5 rounded-md text-sm font-medium transition-all",
                completedFilter === filter ? "bg-zinc-800 text-white shadow" : "text-zinc-500 hover:text-white hover:bg-zinc-800/50"
              )}
            >
              {filter}
            </button>
          ))}
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-dark-surface border border-zinc-800 rounded-lg">
          <p className="text-zinc-500 mb-4">No anime found in this section.</p>
          <Link to="/search" className="text-accent hover:underline">Find anime to add</Link>
        </div>
      ) : (
        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <SortableContext 
            items={filtered.map(i => i.isFranchise ? i.franchiseId : i.malId)}
            strategy={viewMode === 'compact' ? verticalListSortingStrategy : rectSortingStrategy}
          >
            {viewMode === 'compact' ? (
              <div className="flex flex-col gap-2">
                {filtered.map((item) => (
                  <SortableAnimeItem 
                    key={item.isFranchise ? item.franchiseId : item.malId}
                    item={item}
                    activeTab={activeTab}
                    isEditingOrder={isEditingOrder}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {filtered.map((item) => (
                  <SortableAnimeItem 
                    key={item.isFranchise ? item.franchiseId : item.malId}
                    item={item}
                    activeTab={activeTab}
                    isEditingOrder={isEditingOrder}
                    viewMode={viewMode}
                  />
                ))}
              </div>
            )}
          </SortableContext>
          <DragOverlay>
            {activeDragItem ? (
              <SortableAnimeItem 
                item={activeDragItem}
                activeTab={activeTab}
                isEditingOrder={false}
                viewMode={viewMode}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
          </div>
    </div>
  );
}

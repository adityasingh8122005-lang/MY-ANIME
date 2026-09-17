import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getGroupedCollection, autoHealUnknownMetadata } from '../services/franchiseService';
import { Loader2, Library, Folder, Edit2, Check, ArrowUp, ArrowDown, LayoutGrid, Menu } from 'lucide-react';
import clsx from 'clsx';

export default function MyAnimePage() {
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
        setCollection(data);
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

  const handleMove = (index, direction) => {
    const newOrder = [...filtered];
    if (direction === -1 && index > 0) {
      [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    } else if (direction === 1 && index < newOrder.length - 1) {
      [newOrder[index + 1], newOrder[index]] = [newOrder[index], newOrder[index + 1]];
    }
    
    // Save to customOrder by their IDs
    const orderIds = newOrder.map(item => item.isFranchise ? item.franchiseId : item.malId);
    setCustomOrder(orderIds);
    setSortBy('custom');
  };

  let filtered = collection.filter(item => {
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
    <div className="max-w-7xl mx-auto pb-12">
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
        
        viewMode === 'compact' ? (
          <div className="flex flex-col gap-2">
            {filtered.map((item, index) => {
              const isFranchise = item.isFranchise;
              const to = isFranchise ? `/franchise/${item.franchiseId}` : `/anime/${item.malId}`;
              
              return (
                <div key={isFranchise ? item.franchiseId : item.malId} className="relative group rounded-md overflow-hidden bg-dark-surface border border-zinc-800 hover:border-accent transition-colors">
                  <Link to={to} className="flex flex-row items-center h-16 sm:h-20">
                    <div className="w-12 sm:w-14 h-full bg-zinc-900 flex-shrink-0 relative">
                      {item.poster ? (
                        <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-zinc-600">No Image</div>
                      )}
                      {(item.totalCanon > 0 || item.canonEpisodes > 0) && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 z-10">
                          <div 
                            className="h-full bg-accent" 
                            style={{ width: `${Math.min(100, ((item.totalWatched ?? item.episodesWatched) / (item.totalCanon ?? item.canonEpisodes)) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 py-2 px-3 flex flex-col justify-center">
                      <h3 className="font-bold text-sm text-zinc-200 truncate group-hover:text-white" title={item.title}>
                        {item.title}
                      </h3>
                      <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                        {isFranchise ? (
                          <span className="flex items-center gap-1 text-accent"><Folder size={10} /> Franchise</span>
                        ) : (
                          <span className="text-zinc-400">{item.personalStatus}</span>
                        )}
                        {(activeTab === 'Completed' || activeTab === 'Plan to Watch') && item.airStatus && (
                          <>
                            <span className="opacity-50">•</span>
                            <span className={clsx(item.airStatus === 'Ongoing' ? 'text-green-500' : 'text-zinc-600')}>
                              {item.airStatus}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex-shrink-0 px-4 text-right">
                      <div className="text-xs font-medium text-zinc-300">
                        {item.totalWatched ?? item.episodesWatched ?? 0} / {item.totalCanon ?? item.canonEpisodes ?? '?'}
                      </div>
                      <div className="text-[10px] text-zinc-600 mt-0.5">Eps</div>
                    </div>
                  </Link>

                  {isEditingOrder && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] z-20 flex flex-row items-center justify-end px-4 gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleMove(index, -1); }}
                        disabled={index === 0}
                        className="p-1.5 bg-zinc-800 rounded-full hover:bg-accent hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
                      >
                        <ArrowUp size={18} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleMove(index, 1); }}
                        disabled={index === filtered.length - 1}
                        className="p-1.5 bg-zinc-800 rounded-full hover:bg-accent hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
                      >
                        <ArrowDown size={18} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {filtered.map((item, index) => {
              const isFranchise = item.isFranchise;
              const to = isFranchise ? `/franchise/${item.franchiseId}` : `/anime/${item.malId}`;
              
              return (
                <div key={isFranchise ? item.franchiseId : item.malId} className="relative group rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-accent transition-colors flex flex-col h-full">
                  <Link to={to} className="flex flex-col h-full">
                    <div className="aspect-[2/3] w-full bg-zinc-900 relative">
                      {item.poster ? (
                        <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                      )}
                      
                      {isFranchise ? (
                        <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-white shadow flex items-center justify-center z-10">
                          <Folder size={14} />
                        </div>
                      ) : (
                        <div className="absolute top-2 right-2 bg-dark-base/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-white border border-zinc-700 z-10">
                          {item.personalStatus}
                        </div>
                      )}

                      {(item.totalCanon > 0 || item.canonEpisodes > 0) && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800 z-10">
                          <div 
                            className="h-full bg-accent" 
                            style={{ width: `${Math.min(100, ((item.totalWatched ?? item.episodesWatched) / (item.totalCanon ?? item.canonEpisodes)) * 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="p-3 flex-1 flex flex-col z-10 bg-dark-surface">
                      <h3 className="font-medium text-xs text-zinc-100 line-clamp-2" title={item.title}>
                        {item.title}
                      </h3>
                      <p className="text-[10px] text-zinc-500 mt-auto pt-2 flex justify-between items-center">
                        <span>{item.totalWatched ?? item.episodesWatched ?? 0} / {item.totalCanon ?? item.canonEpisodes ?? '?'} Eps</span>
                        {(activeTab === 'Completed' || activeTab === 'Plan to Watch') && item.airStatus && (
                          <span className={clsx(item.airStatus === 'Ongoing' ? 'text-green-500' : 'text-zinc-600')}>
                            {item.airStatus}
                          </span>
                        )}
                      </p>
                    </div>
                  </Link>
                  
                  {isEditingOrder && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-20 flex flex-col items-center justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.preventDefault(); handleMove(index, -1); }}
                        disabled={index === 0}
                        className="p-2 bg-zinc-800 rounded-full hover:bg-accent hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
                      >
                        <ArrowUp size={24} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); handleMove(index, 1); }}
                        disabled={index === filtered.length - 1}
                        className="p-2 bg-zinc-800 rounded-full hover:bg-accent hover:text-white disabled:opacity-30 disabled:hover:bg-zinc-800 transition-colors"
                      >
                        <ArrowDown size={24} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGroupedCollection } from '../services/franchiseService';
import { PlayCircle, CheckCircle, List, Loader2, Folder } from 'lucide-react';

function AnimeGrid({ animes, title, icon: Icon, emptyText }) {
  if (!animes || animes.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Icon size={20} className="text-accent" /> {title}
        </h2>
        <div className="text-zinc-500 bg-dark-surface border border-zinc-800 rounded-lg p-8 text-center">
          {emptyText}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <Icon size={20} className="text-accent" /> {title}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {animes.map(item => {
          if (item.isFranchise) {
            return (
              <Link key={item.franchiseId} to={`/franchise/${item.franchiseId}`} className="group relative rounded-lg overflow-hidden bg-dark-surface border border-accent/50 hover:border-accent transition-colors flex flex-col h-full">
                <div className="aspect-[2/3] w-full bg-zinc-900 relative">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                  )}
                  
                  <div className="absolute top-2 right-2 bg-accent/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-white shadow flex items-center gap-1">
                    <Folder size={10} /> FRANCHISE
                  </div>

                  {item.totalCanon > 0 && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                      <div 
                        className="h-full bg-accent" 
                        style={{ width: `${Math.min(100, (item.totalWatched / item.totalCanon) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-medium text-xs text-zinc-100 line-clamp-2" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-auto pt-2">
                    {item.totalWatched} / {item.totalCanon || '?'} Canon Eps
                  </p>
                </div>
              </Link>
            );
          } else {
            return (
              <Link key={item.malId} to={`/anime/${item.malId}`} className="group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-accent transition-colors flex flex-col h-full">
                <div className="aspect-[2/3] w-full bg-zinc-900 relative">
                  {item.poster ? (
                    <img src={item.poster} alt={item.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                  )}
                  {item.canonEpisodes > 0 && item.episodesWatched !== undefined && (
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                      <div 
                        className="h-full bg-accent" 
                        style={{ width: `${Math.min(100, (item.episodesWatched / item.canonEpisodes) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>
                <div className="p-3 flex-1 flex flex-col">
                  <h3 className="font-medium text-xs text-zinc-100 line-clamp-2" title={item.title}>
                    {item.title}
                  </h3>
                  <p className="text-[10px] text-zinc-500 mt-auto pt-2 flex justify-between">
                    <span>{item.episodesWatched || 0} / {item.canonEpisodes || '?'} eps</span>
                  </p>
                </div>
              </Link>
            );
          }
        })}
      </div>
    </div>
  );
}

export default function HomePage() {
  const [collection, setCollection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getGroupedCollection();
        setCollection(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  // Filter collections
  // For franchises, their "status" isn't perfectly 1-to-1. We need to derive status.
  // A franchise is "Watching" if any of its seasons are Watching.
  // A franchise is "Completed" if all of its seasons are Completed.
  // A franchise is "Plan to Watch" if all are Plan to Watch.
  
  const getDerivedStatus = (item) => {
    if (!item.isFranchise) return item.personalStatus;
    
    // It's a franchise. We have item.seasons array.
    if (!item.seasons || item.seasons.length === 0) return 'Plan to Watch';
    
    let hasWatching = false;
    let allCompleted = true;
    let allPlanToWatch = true;
    
    for (const s of item.seasons) {
      if (s.personalStatus === 'Watching') hasWatching = true;
      if (s.personalStatus !== 'Completed') allCompleted = false;
      if (s.personalStatus !== 'Plan to Watch') allPlanToWatch = false;
    }
    
    if (hasWatching) return 'Watching';
    if (allCompleted) return 'Completed';
    if (allPlanToWatch) return 'Plan to Watch';
    
    // Default fallback if a mix of Hold/Dropped etc.
    return 'Watching'; // Or you could say 'Mixed'
  };

  const watching = collection.filter(a => getDerivedStatus(a) === 'Watching').slice(0, 6);
  const planToWatch = collection.filter(a => getDerivedStatus(a) === 'Plan to Watch').slice(0, 6);
  const completed = collection.filter(a => getDerivedStatus(a) === 'Completed').slice(0, 6);

  if (collection.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Welcome to MY AN!ME</h1>
        <p className="text-zinc-400 mb-8 max-w-md">
          Your personal tracking dashboard is currently empty. Start by searching for your favorite anime and adding them to your collection.
        </p>
        <Link to="/search" className="bg-accent hover:bg-accent-hover text-white px-6 py-3 rounded-lg font-semibold transition-colors">
          Search Anime
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <AnimeGrid 
        animes={watching} 
        title="Currently Watching" 
        icon={PlayCircle} 
        emptyText="You aren't watching anything right now." 
      />
      <AnimeGrid 
        animes={planToWatch} 
        title="Plan to Watch" 
        icon={List} 
        emptyText="Your watchlist is empty." 
      />
      <AnimeGrid 
        animes={completed} 
        title="Recently Completed" 
        icon={CheckCircle} 
        emptyText="You haven't completed any anime yet." 
      />
    </div>
  );
}

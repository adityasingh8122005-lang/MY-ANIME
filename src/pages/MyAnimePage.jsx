import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getGroupedCollection } from '../services/franchiseService';
import { Loader2, Library, Folder } from 'lucide-react';

export default function MyAnimePage() {
  const [collection, setCollection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('updatedAt');

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

  let filtered = [...collection];
  filtered.sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    } else if (sortBy === 'progress') {
      const progA = a.isFranchise ? (a.totalWatched / (a.totalCanon || 1)) : (a.episodesWatched / (a.canonEpisodes || 1));
      const progB = b.isFranchise ? (b.totalWatched / (b.totalCanon || 1)) : (b.episodesWatched / (b.canonEpisodes || 1));
      return progB - progA;
    }
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Library className="text-accent" /> My Anime Collection
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            className="bg-dark-surface border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-accent"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="title">Title (A-Z)</option>
            <option value="progress">Progress (High to Low)</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-dark-surface border border-zinc-800 rounded-lg">
          <p className="text-zinc-500 mb-4">No anime found in your collection.</p>
          <Link to="/search" className="text-accent hover:underline">Find anime to add</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(item => {
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
                    
                    <div className="absolute top-2 right-2 bg-dark-base/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-white border border-zinc-700">
                      {item.personalStatus}
                    </div>

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
                    <p className="text-[10px] text-zinc-500 mt-auto pt-2">
                      {item.episodesWatched || 0} / {item.canonEpisodes || '?'} eps
                    </p>
                  </div>
                </Link>
              );
            }
          })}
        </div>
      )}
    </div>
  );
}

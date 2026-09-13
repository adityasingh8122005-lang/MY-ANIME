import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAllUserAnime } from '../services/userService';
import { Loader2, Library } from 'lucide-react';

export default function MyAnimePage() {
  const [collection, setCollection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [maxEpisodes, setMaxEpisodes] = useState(''); // Empty means no limit
  const [sortBy, setSortBy] = useState('updatedAt');

  useEffect(() => {
    async function load() {
      setIsLoading(true);
      try {
        const data = await getAllUserAnime(true);
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

  let filtered = collection;
  if (filterStatus !== 'All') {
    filtered = collection.filter(a => a.personalStatus === filterStatus);
  }

  if (maxEpisodes !== '') {
    const limit = parseInt(maxEpisodes, 10);
    if (!isNaN(limit)) {
      filtered = filtered.filter(a => {
        // Unknown handled gracefully by excluding if we enforce a max limit, 
        // or we could include. The prompt says "handled gracefully". Let's exclude unknown for strict filtering.
        if (!a.metadata || !a.metadata.episodes) return false;
        return a.metadata.episodes <= limit;
      });
    }
  }

  filtered.sort((a, b) => {
    if (sortBy === 'title') {
      const titleA = a.metadata?.title || '';
      const titleB = b.metadata?.title || '';
      return titleA.localeCompare(titleB);
    } else if (sortBy === 'progress') {
      const progA = a.episodesWatched || 0;
      const progB = b.episodesWatched || 0;
      return progB - progA;
    } else if (sortBy === 'rating') {
      const ratA = a.personalRating || 0;
      const ratB = b.personalRating || 0;
      return ratB - ratA;
    }
    // Default: updatedAt (recently added/updated)
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Library className="text-accent" /> My Anime Collection
        </h1>

        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-dark-surface border border-zinc-800 rounded p-1">
            <label className="text-xs text-zinc-500 font-semibold uppercase px-2">Max Eps</label>
            <input 
              type="number"
              min="1"
              placeholder="Any"
              value={maxEpisodes}
              onChange={e => setMaxEpisodes(e.target.value)}
              className="w-16 bg-transparent text-sm text-white focus:outline-none placeholder:text-zinc-600 text-center"
            />
          </div>

          <select 
            value={filterStatus} 
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-dark-surface border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-accent"
          >
            <option value="All">All Statuses</option>
            <option value="Watching">Watching</option>
            <option value="Plan to Watch">Plan to Watch</option>
            <option value="Completed">Completed</option>
            <option value="On Hold">On Hold</option>
            <option value="Dropped">Dropped</option>
          </select>

          <select 
            value={sortBy} 
            onChange={e => setSortBy(e.target.value)}
            className="bg-dark-surface border border-zinc-800 rounded p-2 text-sm text-white focus:outline-none focus:border-accent"
          >
            <option value="updatedAt">Recently Updated</option>
            <option value="title">Title (A-Z)</option>
            <option value="progress">Progress (High to Low)</option>
            <option value="rating">My Rating (High to Low)</option>
          </select>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 bg-dark-surface border border-zinc-800 rounded-lg">
          <p className="text-zinc-500 mb-4">No anime found in this category.</p>
          <Link to="/search" className="text-accent hover:underline">Find anime to add</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.map(({ malId, metadata, episodesWatched, personalStatus, personalRating }) => (
            <Link key={malId} to={`/anime/${malId}`} className="group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-accent transition-colors flex flex-col h-full">
              <div className="aspect-[2/3] w-full bg-zinc-900 relative">
                {metadata?.poster ? (
                  <img src={metadata.poster} alt={metadata.title || 'Unknown Anime'} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                )}
                
                <div className="absolute top-2 right-2 bg-dark-base/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-white border border-zinc-700">
                  {personalStatus}
                </div>
                
                {personalRating && (
                  <div className="absolute top-2 left-2 bg-accent/90 backdrop-blur-sm text-[10px] font-bold px-2 py-1 rounded text-white shadow">
                    ⭐ {personalRating}
                  </div>
                )}

                {metadata?.episodes && episodesWatched !== undefined && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-800">
                    <div 
                      className="h-full bg-accent" 
                      style={{ width: `${Math.min(100, (episodesWatched / metadata.episodes) * 100)}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="p-3 flex-1 flex flex-col">
                <h3 className="font-medium text-xs text-zinc-100 line-clamp-2" title={metadata?.title || 'Unknown Anime'}>
                  {metadata?.title || 'Unknown Anime'}
                </h3>
                <p className="text-[10px] text-zinc-500 mt-auto pt-2">
                  {episodesWatched || 0} / {metadata?.episodes || '?'} eps
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

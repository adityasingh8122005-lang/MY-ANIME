import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllUserAnime } from '../services/userService';
import { Dices, Loader2 } from 'lucide-react';

export default function SurpriseMePage() {
  const [collection, setCollection] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Filters
  const [statusFilter, setStatusFilter] = useState('Plan to Watch');
  const [maxEpisodes, setMaxEpisodes] = useState('Any');
  const [minMyRating, setMinMyRating] = useState('Any');
  const [progressFilter, setProgressFilter] = useState('Any');
  const [genreFilter, setGenreFilter] = useState('Any');
  
  // Result
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [matchReason, setMatchReason] = useState('');
  const [error, setError] = useState(null);

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

  const availableGenres = useMemo(() => {
    const genres = new Set();
    collection.forEach(a => {
      if (a.metadata?.genres) {
        a.metadata.genres.forEach(g => genres.add(g));
      }
    });
    return Array.from(genres).sort();
  }, [collection]);

  const handleSurpriseMe = () => {
    setError(null);
    setSelectedAnime(null);
    setMatchReason('');

    let eligible = collection;

    // 1. Status Filter
    if (statusFilter !== 'Any') {
      eligible = eligible.filter(a => a.personalStatus === statusFilter);
    }

    // 2. Max Episodes Filter
    if (maxEpisodes !== '') {
      const limit = parseInt(maxEpisodes, 10);
      if (!isNaN(limit)) {
        eligible = eligible.filter(a => {
          if (!a.metadata || !a.metadata.episodes) return false;
          return a.metadata.episodes <= limit;
        });
      }
    }

    // 4. Min My Rating
    if (minMyRating !== 'Any') {
      const min = parseInt(minMyRating, 10);
      eligible = eligible.filter(a => a.personalRating && a.personalRating >= min);
    }

    // 5. Genre Filter
    if (genreFilter !== 'Any') {
      eligible = eligible.filter(a => a.metadata?.genres?.includes(genreFilter));
    }

    // 6. Progress Filter
    if (progressFilter !== 'Any') {
      eligible = eligible.filter(a => {
        const epsWatched = a.episodesWatched || 0;
        const total = a.metadata?.episodes;
        
        if (progressFilter === 'Not Started') return epsWatched === 0;
        
        if (!total) return false; // Need total for % based filters
        
        const pct = (epsWatched / total) * 100;
        
        // Exact mutually exclusive boundaries
        if (progressFilter === '1-25%') return pct > 0 && pct <= 25;
        if (progressFilter === '25-75%') return pct > 25 && pct <= 75;
        if (progressFilter === '75%+ (Not Finished)') return pct > 75 && pct < 100;
        
        const isOngoing = a.metadata?.status === 'Currently Airing';
        const isFinished = a.metadata?.status === 'Finished Airing';

        if (progressFilter === 'Caught Up') return pct === 100 && isOngoing;
        if (progressFilter === 'Completed') return pct === 100 && isFinished;
        
        return false;
      });
    }

    if (eligible.length === 0) {
      setError("No anime in your collection matches these combined filters.");
      return;
    }

    // Select Random
    const randomIndex = Math.floor(Math.random() * eligible.length);
    const chosen = eligible[randomIndex];
    setSelectedAnime(chosen);

    // Build a match reason string
    const reasons = [];
    if (statusFilter !== 'Any') reasons.push(chosen.personalStatus);
    if (maxEpisodes !== '') reasons.push(`${chosen.metadata?.episodes} eps`);
    if (genreFilter !== 'Any') reasons.push(genreFilter);
    setMatchReason(reasons.join(', ') || 'Random Pick');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (collection.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center border border-zinc-800 bg-dark-surface rounded-lg">
        <Dices size={48} className="mx-auto text-zinc-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Collection Empty</h1>
        <p className="text-zinc-400 mb-6">You need to add anime to your collection before using Surprise Me.</p>
        <Link to="/search" className="bg-accent hover:bg-accent-hover text-white px-6 py-2 rounded font-semibold transition-colors">
          Search Anime
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto pb-12">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
          <Dices className="text-accent" size={32} /> Surprise Me
        </h1>
        <p className="text-zinc-400">Discover your next watch using advanced filters on your personal collection.</p>
      </div>

      {/* Filter Controls */}
      <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 mb-8 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          
          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase mb-2 block">Status</label>
            <select 
              value={statusFilter} 
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-accent"
            >
              <option value="Any">Any</option>
              <option value="Plan to Watch">Plan to Watch</option>
              <option value="Watching">Watching</option>
              <option value="Completed">Completed</option>
              <option value="On Hold">On Hold</option>
              <option value="Dropped">Dropped</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase mb-2 block">Max Episodes</label>
            <input 
              type="number" 
              min="1"
              placeholder="Any"
              value={maxEpisodes}
              onChange={e => setMaxEpisodes(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-accent placeholder:text-zinc-600"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase mb-2 block">Min My Rating</label>
            <select 
              value={minMyRating} 
              onChange={e => setMinMyRating(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-accent"
            >
              <option value="Any">Any</option>
              <option value="10">10</option>
              <option value="9">9+</option>
              <option value="8">8+</option>
              <option value="7">7+</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase mb-2 block">Progress</label>
            <select 
              value={progressFilter} 
              onChange={e => setProgressFilter(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-accent"
            >
              <option value="Any">Any</option>
              <option value="Not Started">Not Started</option>
              <option value="1-25%">1% - 25%</option>
              <option value="25-75%">25% - 75%</option>
              <option value="75%+ (Not Finished)">75%+ (Not Finished)</option>
              <option value="Caught Up">Caught Up</option>
              <option value="Completed">Completed</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase mb-2 block">Genre</label>
            <select 
              value={genreFilter} 
              onChange={e => setGenreFilter(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-accent"
            >
              <option value="Any">Any</option>
              {availableGenres.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

        </div>
        
        <button 
          onClick={handleSurpriseMe}
          className="w-full bg-accent hover:bg-accent-hover text-white py-3 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 border border-accent/50"
        >
          <Dices size={24} /> SURPRISE ME
        </button>
      </div>

      {/* Error / Empty State */}
      {error && (
        <div className="text-center p-6 bg-red-950/20 border border-red-900/50 rounded-lg max-w-xl mx-auto text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {selectedAnime && (
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 max-w-2xl mx-auto animate-in fade-in zoom-in duration-300">
          <div className="flex flex-col sm:flex-row gap-6">
            <div className="w-full sm:w-48 shrink-0">
              <div className="aspect-[2/3] rounded overflow-hidden bg-zinc-900 border border-zinc-700">
                {selectedAnime.metadata?.poster ? (
                  <img src={selectedAnime.metadata.poster} alt={selectedAnime.metadata.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col flex-1">
              <div className="mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
                  Matched filters: {matchReason}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{selectedAnime.metadata?.title}</h2>
              
              <div className="flex flex-wrap gap-4 mb-4">
                <div className="text-sm text-zinc-300"><span className="text-zinc-500">Eps:</span> {selectedAnime.metadata?.episodes || '?'}</div>
                {selectedAnime.personalRating && (
                  <div className="text-sm text-accent font-medium"><span className="text-zinc-500">My Rating:</span> ⭐ {selectedAnime.personalRating}</div>
                )}
                <div className="text-sm text-zinc-300"><span className="text-zinc-500">Progress:</span> {selectedAnime.episodesWatched || 0} / {selectedAnime.metadata?.episodes || '?'}</div>
              </div>

              {selectedAnime.metadata?.genres?.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedAnime.metadata.genres.slice(0, 4).map(g => (
                    <span key={g} className="text-xs text-zinc-400 bg-dark-elevated border border-zinc-800 px-2 py-1 rounded-full">{g}</span>
                  ))}
                </div>
              )}

              <div className="mt-auto flex gap-3">
                <Link to={`/anime/${selectedAnime.malId}`} className="flex-1 text-center bg-zinc-800 hover:bg-zinc-700 text-white py-2 rounded font-semibold transition-colors">
                  Open Anime
                </Link>
                <button 
                  onClick={handleSurpriseMe} 
                  className="flex-1 bg-dark-elevated hover:bg-zinc-700 border border-zinc-700 text-white py-2 rounded font-semibold transition-colors"
                >
                  Roll Again
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

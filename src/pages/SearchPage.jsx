import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { searchLocalAnime, searchJikanAnime } from '../services/jikanApi';
import { Search as SearchIcon, Loader2 } from 'lucide-react';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const timeoutRef = useRef(null);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    if (query.trim().length < 3) {
      setResults([]);
      setError(null);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setIsLoading(true);
      setError(null);
      
      // 1. Show local results immediately
      try {
        const localData = await searchLocalAnime(query);
        setResults(localData);
      } catch (e) {
        console.error("Local search error", e);
      }

      // 2. Fetch from Jikan and merge
      try {
        const remoteData = await searchJikanAnime(query);
        
        // Merge in state (assuming remoteData has latest info)
        setResults(prev => {
          const map = new Map();
          prev.forEach(item => map.set(item.malId, item));
          remoteData.forEach(item => map.set(item.malId, item));
          return Array.from(map.values());
        });
      } catch (err) {
        if (results.length === 0) {
          setError('Failed to fetch results.');
        }
      } finally {
        setIsLoading(false);
      }
    }, 600); // 600ms debounce

    return () => clearTimeout(timeoutRef.current);
  }, [query]);

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="relative mb-8">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-zinc-500">
          <SearchIcon size={20} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for anime (min. 3 characters)..."
          className="w-full bg-dark-surface border border-zinc-800 rounded-lg py-4 pl-12 pr-4 text-white placeholder-zinc-500 focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all"
        />
        {isLoading && (
          <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
            <Loader2 size={20} className="animate-spin text-accent" />
          </div>
        )}
      </div>

      {error && <div className="text-red-500 text-center py-4">{error}</div>}

      {!isLoading && !error && query.length >= 3 && results.length === 0 && (
        <div className="text-zinc-500 text-center py-12">
          No results found for "{query}"
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {results.map((anime) => (
          <Link key={anime.malId} to={`/anime/${anime.malId}`} className="group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-accent transition-colors flex flex-col h-full">
            <div className="aspect-[2/3] w-full bg-zinc-900 relative">
              {anime.poster ? (
                <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover group-hover:opacity-80 transition-opacity" loading="lazy" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-zinc-600">No Image</div>
              )}
            </div>
            <div className="p-3 flex-1 flex flex-col">
              <h3 className="font-medium text-sm text-zinc-100 line-clamp-2" title={anime.title}>
                {anime.title}
              </h3>
              <p className="text-xs text-zinc-500 mt-auto pt-2">
                {anime.year ? anime.year : 'Unknown Year'} • {anime.episodes ? `${anime.episodes} eps` : 'Ongoing'}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

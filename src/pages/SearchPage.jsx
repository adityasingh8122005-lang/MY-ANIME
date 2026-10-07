import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { searchJikanAnime } from '../services/jikanApi';
import { Search as SearchIcon, Loader2, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';
import { getIntelligenceData } from '../services/intelligence/intelligenceService';
import { calculateTasteScore } from '../services/recommendation/recommendationService';
import { Link } from 'react-router-dom';

export default function SearchPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
     genre: '', format: '', status: '', score: '', episodes: '', matchTaste: false
  });
  
  const [intelData, setIntelData] = useState(null);

  useEffect(() => {
     if (session) {
        getIntelligenceData().then(setIntelData).catch(console.error);
     }
  }, [session]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (query.trim().length < 3 && !filters.genre && !filters.format && !filters.status && !filters.score && !filters.episodes) return;
    setIsSearching(true);
    setHasSearched(true);
    setSelectedIndex(-1);
    try {
      const rawResults = await searchJikanAnime(query, filters);
      setResults(rawResults);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
     if (hasSearched || filters.genre || filters.format || filters.status || filters.score || filters.episodes) {
        const timeoutId = setTimeout(() => handleSearch(), 500);
        return () => clearTimeout(timeoutId);
     }
  }, [query, filters.genre, filters.format, filters.status, filters.score, filters.episodes]);

  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = React.useRef(null);
  
  const finalResults = React.useMemo(() => {
     if (!results || results.length === 0) return [];
     if (!filters.matchTaste || !intelData || !intelData.dna || intelData.dna.length === 0) return results;
     
     const dnaTopGenres = intelData.dna.map(d => ({ genre: d.genre, bonus: d.score, avgRating: d.avgRating }));
     const sorted = results.map(anime => {
         const { score } = calculateTasteScore(anime, dnaTopGenres, false);
         return { ...anime, tasteScore: score };
     });
     return sorted.sort((a,b) => b.tasteScore - a.tasteScore);
  }, [results, filters.matchTaste, intelData]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, finalResults.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
         e.preventDefault();
         const item = finalResults[selectedIndex];
         if (item) navigate(`/anime/${item.idMal}`);
      } else if (e.key === 'Escape') {
         navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, finalResults, navigate]);

  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Horror', 'Mecha', 'Music', 'Mystery', 'Psychological', 'Romance', 'Sci-Fi', 'Slice of Life', 'Sports', 'Supernatural', 'Thriller'];

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-void/90 backdrop-blur-md">
      <AnimatedAnimeBackground />
      <div className="relative z-10 w-full max-w-4xl bg-surface-1 sm:rounded-[24px] shadow-depth-5 flex flex-col h-full sm:h-[85vh] border-0 sm:border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-surface-2 shrink-0">
          <SearchIcon size={24} className="text-zinc-400" />
          <form onSubmit={handleSearch} className="flex-1">
            <input 
              ref={searchInputRef} type="text" value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); setHasSearched(false); }}
              placeholder="Search anime..." className="w-full bg-transparent text-xl text-white placeholder-zinc-500 focus:outline-none"
            />
          </form>
          <button onClick={() => setShowFilters(!showFilters)} className={`p-2 rounded-lg transition-colors flex items-center gap-2 font-bold text-sm ${showFilters || Object.values(filters).some(v => v) ? 'bg-primary text-white' : 'bg-surface-3 text-zinc-400 hover:text-white'}`}>
             <SlidersHorizontal size={18} /> <span className="hidden sm:inline">Filters</span>
          </button>
          <button onClick={() => navigate(-1)} className="p-2 text-zinc-400 hover:text-white transition-colors bg-surface-3 rounded-lg flex items-center justify-center">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-1 min-h-0 relative">
           {showFilters && (
              <div className="w-full sm:w-64 border-r border-white/5 bg-surface-2 p-4 overflow-y-auto shrink-0 flex flex-col gap-6 absolute sm:relative z-20 h-full">
                 <div className="flex items-center justify-between">
                    <h3 className="font-bold text-white">Smart Filters</h3>
                    <button onClick={() => setFilters({ genre: '', format: '', status: '', score: '', episodes: '', matchTaste: false })} className="text-xs font-bold text-zinc-400 hover:text-white">Clear All</button>
                 </div>
                 <button onClick={() => setFilters(f => ({ ...f, matchTaste: !f.matchTaste }))} className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all ${filters.matchTaste ? 'bg-primary/20 border-primary text-primary' : 'bg-surface-1 border-white/5 text-zinc-400 hover:text-zinc-300'}`}>
                    <Sparkles size={18} />
                    <div className="text-left flex-1">
                       <div className="text-sm font-bold">Match My Taste</div>
                       <div className="text-[10px] leading-tight opacity-80">Rank by your DNA</div>
                    </div>
                 </button>
                 <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Genre</label>
                    <select value={filters.genre} onChange={e => setFilters(f => ({ ...f, genre: e.target.value }))} className="w-full bg-surface-1 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-primary">
                       <option value="">Any Genre</option>{genres.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Format</label>
                    <select value={filters.format} onChange={e => setFilters(f => ({ ...f, format: e.target.value }))} className="w-full bg-surface-1 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-primary">
                       <option value="">Any Format</option><option value="TV">TV Series</option><option value="MOVIE">Movie</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Status</label>
                    <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className="w-full bg-surface-1 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-primary">
                       <option value="">Any Status</option><option value="FINISHED">Finished</option><option value="RELEASING">Airing</option><option value="NOT_YET_RELEASED">Upcoming</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Minimum Score</label>
                    <select value={filters.score} onChange={e => setFilters(f => ({ ...f, score: e.target.value }))} className="w-full bg-surface-1 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-primary">
                       <option value="">Any Score</option><option value="85">Masterpiece (85%+)</option><option value="75">Great (75%+)</option><option value="65">Good (65%+)</option>
                    </select>
                 </div>
                 <div>
                    <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2 block">Length</label>
                    <select value={filters.episodes} onChange={e => setFilters(f => ({ ...f, episodes: e.target.value }))} className="w-full bg-surface-1 border border-white/10 rounded-lg p-2 text-sm text-white focus:outline-none focus:border-primary">
                       <option value="">Any Length</option><option value="short">Short (1-13 eps)</option><option value="medium">Medium (14-26 eps)</option><option value="long">Long (27+ eps)</option>
                    </select>
                 </div>
                 <button onClick={() => setShowFilters(false)} className="sm:hidden w-full bg-primary text-white font-bold py-3 rounded-xl mt-4">Apply Filters</button>
              </div>
           )}

           <div className="flex-1 overflow-y-auto p-2 sm:p-4 no-scrollbar bg-surface-1 flex flex-col">
             {isSearching ? (
                <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-4">
                  <Loader2 size={32} className="animate-spin text-primary" />
                  <p className="text-sm font-medium">Searching...</p>
                </div>
             ) : (!hasSearched && query.trim() === '' && !Object.values(filters).some(v => v !== '' && v !== false)) ? (
                <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 px-4 text-center">
                   <div className="w-16 h-16 rounded-full bg-surface-2 flex items-center justify-center mb-4"><SearchIcon size={24} /></div>
                   <p className="text-body-m font-bold text-white mb-2">Search the Universe</p>
                   <p className="text-sm max-w-sm">Type a title or use the smart filters to discover your next favorite anime.</p>
                </div>
             ) : finalResults.length > 0 ? (
                <div className="flex flex-col gap-1 pb-20 sm:pb-0">
                  {finalResults.map((anime, idx) => (
                    <Link 
                      key={anime.idMal} to={`/anime/${anime.idMal}`} onMouseEnter={() => setSelectedIndex(idx)}
                      className={`flex items-center gap-4 p-2 rounded-xl transition-all duration-200 ${selectedIndex === idx ? 'bg-surface-2 border border-white/5 shadow-depth-2 scale-[1.01]' : 'hover:bg-surface-2 border border-transparent'}`}
                    >
                      <div className="w-12 h-16 bg-surface-3 rounded-[8px] overflow-hidden shrink-0 shadow">
                        {anime.coverImage?.large ? (
                          <img src={anime.coverImage.large} alt={anime.title.english || anime.title.romaji} className="w-full h-full object-cover" />
                        ) : <div className="w-full h-full flex items-center justify-center text-micro text-zinc-600">No Image</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white truncate text-body-m">
                           {anime.title.english || anime.title.romaji}
                           {filters.matchTaste && <span className="ml-2 inline-block"><Sparkles size={12} className="text-primary inline -mt-0.5" /></span>}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          {anime.status && <span className="text-micro font-bold uppercase text-zinc-400 bg-surface-3 px-2 py-0.5 rounded border border-white/5">{anime.status}</span>}
                          {anime.episodes && <span className="text-micro font-medium text-zinc-500">{anime.episodes} Eps</span>}
                          {anime.averageScore && <span className="text-micro font-medium text-warning flex items-center gap-0.5"><Sparkles size={10} /> {anime.averageScore}%</span>}
                        </div>
                      </div>
                      <div className="hidden sm:block text-zinc-600 pr-2">
                        {selectedIndex === idx && <span className="text-micro font-bold text-primary">↵ ENTER</span>}
                      </div>
                    </Link>
                  ))}
                </div>
             ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-zinc-500 gap-2">
                   <SearchIcon size={48} className="opacity-20 mb-4" />
                   <p className="text-body-m font-medium text-white">No results found.</p>
                   <p className="text-sm">Try relaxing your filters or using a different term.</p>
                </div>
             )}
           </div>
        </div>
      </div>
    </div>
  );
}

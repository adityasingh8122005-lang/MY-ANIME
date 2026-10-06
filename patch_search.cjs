const fs = require('fs');

const imports = "import React, { useState, useEffect } from 'react';\nimport { useNavigate } from 'react-router-dom';\nimport AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';\nimport { Link } from 'react-router-dom';\nimport { Search as SearchIcon, Loader2, UserCircle } from 'lucide-react';\nimport { supabase } from '../services/supabase';";

const SEARCH_QUERY = "query ($search: String) {\n  Page(page: 1, perPage: 20) {\n    media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {\n      idMal\n      title { romaji english }\n      coverImage { large }\n      bannerImage\n      episodes\n      status\n    }\n  }\n}";

const fullFile = imports + "\n\nconst SEARCH_QUERY = `" + SEARCH_QUERY + "`;\n\n" + `
export default function SearchPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('anime'); // 'anime' | 'profiles'
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [profileResults, setProfileResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    setSelectedIndex(-1);
    
    if (mode === 'anime') {
      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: SEARCH_QUERY, variables: { search: query } })
        });
        const json = await res.json();
        setResults(json.data.Page.media.filter(a => a.idMal));
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    } else {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, avatar_url')
          .ilike('username', \\\`%\\\${query}%\\\`)
          .limit(20);
        if (data) setProfileResults(data);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearching(false);
      }
    }
  };

  // Handle keyboard navigation for results
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchInputRef = React.useRef(null);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, (mode === 'anime' ? results.length : profileResults.length) - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, -1));
      } else if (e.key === 'Enter' && selectedIndex >= 0) {
         e.preventDefault();
         const item = mode === 'anime' ? results[selectedIndex] : profileResults[selectedIndex];
         if (item) {
             if (mode === 'anime') navigate(\`/anime/\${item.idMal}\`);
             else navigate(\`/profile/\${item.username}\`);
         }
      } else if (e.key === 'Escape') {
         navigate(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIndex, results, profileResults, mode, navigate]);

  // Focus input on mount
  useEffect(() => {
    if (searchInputRef.current) searchInputRef.current.focus();
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-0 sm:p-4 bg-void/90 backdrop-blur-md">
      <AnimatedAnimeBackground />
      
      <div className="relative z-10 w-full max-w-3xl bg-surface-1 sm:rounded-[24px] shadow-depth-5 overflow-hidden flex flex-col h-full sm:h-[80vh] border-0 sm:border border-white/10 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Search Header */}
        <div className="p-4 border-b border-white/5 flex items-center gap-4 bg-surface-2 shrink-0">
          <SearchIcon size={24} className="text-zinc-400" />
          <form onSubmit={handleSearch} className="flex-1">
            <input 
              ref={searchInputRef}
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSelectedIndex(-1); setHasSearched(false); }}
              placeholder={mode === 'anime' ? "Search anime..." : "Search users..."}
              className="w-full bg-transparent text-xl text-white placeholder-zinc-500 focus:outline-none"
            />
          </form>
          <div className="hidden sm:flex items-center gap-2">
            <span className="text-micro font-bold text-zinc-500 bg-surface-3 px-2 py-1 rounded">ESC</span>
            <button onClick={() => navigate(-1)} className="text-zinc-400 hover:text-white transition-colors ml-2 font-medium focus-visible-ring rounded">
              Close
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-4 p-3 bg-surface-1 border-b border-white/5 shrink-0">
          <button 
            onClick={() => { setMode('anime'); setSelectedIndex(-1); }}
            className={\`text-sm font-bold px-4 py-1.5 rounded-full transition-colors \${mode === 'anime' ? 'bg-primary text-white shadow-depth-2' : 'text-zinc-400 hover:text-white hover:bg-surface-2'}\`}
          >
            Anime
          </button>
          <button 
            onClick={() => { setMode('profiles'); setSelectedIndex(-1); }}
            className={\`text-sm font-bold px-4 py-1.5 rounded-full transition-colors \${mode === 'profiles' ? 'bg-primary text-white shadow-depth-2' : 'text-zinc-400 hover:text-white hover:bg-surface-2'}\`}
          >
            Users
          </button>
        </div>

        {/* Results Area */}
        <div className="flex-1 overflow-y-auto p-2 sm:p-4 no-scrollbar bg-surface-1">
          {isSearching ? (
             <div className="flex flex-col items-center justify-center h-40 text-zinc-500 gap-4">
               <Loader2 size={32} className="animate-spin text-primary" />
               <p className="text-sm font-medium">Searching...</p>
             </div>
          ) : !hasSearched && query.trim() === '' ? (
             <div className="flex flex-col items-center justify-center h-40 text-zinc-500">
                <p className="text-sm font-medium">Start typing and press Enter to search.</p>
             </div>
          ) : mode === 'anime' && results.length > 0 ? (
             <div className="flex flex-col gap-1">
               {results.map((anime, idx) => (
                 <Link 
                   key={anime.idMal} 
                   to={\`/anime/\${anime.idMal}\`}
                   onMouseEnter={() => setSelectedIndex(idx)}
                   className={\`flex items-center gap-4 p-2 rounded-xl transition-all duration-200 \${selectedIndex === idx ? 'bg-surface-2 border border-white/5 shadow-depth-2 scale-[1.01]' : 'hover:bg-surface-2 border border-transparent'}\`}
                 >
                   <div className="w-12 h-16 bg-surface-3 rounded-[8px] overflow-hidden shrink-0 shadow">
                     {anime.coverImage?.large ? (
                       <img src={anime.coverImage.large} alt={anime.title.english || anime.title.romaji} className="w-full h-full object-cover" />
                     ) : <div className="w-full h-full flex items-center justify-center text-micro text-zinc-600">No Image</div>}
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-white truncate text-body-m">{anime.title.english || anime.title.romaji}</h3>
                     <div className="flex items-center gap-2 mt-1">
                       {anime.status && <span className="text-micro font-bold uppercase text-zinc-400 bg-surface-3 px-2 py-0.5 rounded border border-white/5">{anime.status}</span>}
                       {anime.episodes && <span className="text-micro font-medium text-zinc-500">{anime.episodes} Eps</span>}
                     </div>
                   </div>
                   <div className="hidden sm:block text-zinc-600 pr-2">
                     {selectedIndex === idx && <span className="text-micro font-bold text-primary">↵ ENTER</span>}
                   </div>
                 </Link>
               ))}
             </div>
          ) : mode === 'profiles' && profileResults.length > 0 ? (
             <div className="flex flex-col gap-1">
               {profileResults.map((prof, idx) => (
                 <Link 
                   key={prof.id} 
                   to={\`/profile/\${prof.username}\`}
                   onMouseEnter={() => setSelectedIndex(idx)}
                   className={\`flex items-center gap-4 p-3 rounded-xl transition-all duration-200 \${selectedIndex === idx ? 'bg-surface-2 border border-white/5 shadow-depth-2 scale-[1.01]' : 'hover:bg-surface-2 border border-transparent'}\`}
                 >
                   <div className="w-12 h-12 bg-surface-3 rounded-full overflow-hidden shrink-0 border border-white/10 flex items-center justify-center">
                     {prof.avatar_url ? (
                       <img src={prof.avatar_url} alt={prof.username} className="w-full h-full object-cover" />
                     ) : <UserCircle size={24} className="text-zinc-500" />}
                   </div>
                   <div className="flex-1 min-w-0">
                     <h3 className="font-bold text-white truncate text-body-m">@{prof.username}</h3>
                   </div>
                 </Link>
               ))}
             </div>
          ) : hasSearched ? (
             <div className="flex flex-col items-center justify-center h-64 text-zinc-500 gap-2">
                <SearchIcon size={48} className="opacity-20 mb-4" />
                <p className="text-body-m font-medium text-white">No results found.</p>
                <p className="text-sm">Try a different title or search term.</p>
             </div>
          ) : null}
        </div>
        
      </div>
    </div>
  );
}
`;

fs.writeFileSync('src/pages/SearchPage.jsx', fullFile);

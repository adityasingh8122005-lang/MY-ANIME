import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search as SearchIcon, Loader2, UserCircle } from 'lucide-react';
import { supabase } from '../services/supabase';

const SEARCH_QUERY = `
query ($search: String) {
  Page(page: 1, perPage: 20) {
    media(search: $search, type: ANIME, sort: SEARCH_MATCH, isAdult: false) {
      idMal
      title { romaji english }
      coverImage { large }
      episodes
      status
    }
  }
}
`;

export default function SearchPage() {
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
      }
    } else {
      // Search Profiles
      try {
        const cleanQuery = query.replace('@', '').toLowerCase();
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .ilike('username', `%${cleanQuery}%`)
          .limit(20);
          
        if (!error && data) {
          setProfileResults(data);
        }
      } catch (err) {
        console.error(err);
      }
    }
    
    setIsSearching(false);
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8 text-center pt-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <SearchIcon className="text-accent" size={32} /> Search
        </h1>
        <p className="text-zinc-400">Find your favorite anime or discover other users.</p>
      </div>

      <div className="max-w-2xl mx-auto mb-10">
        <div className="flex justify-center mb-6">
          <div className="bg-dark-surface p-1 rounded-lg inline-flex border border-zinc-800">
            <button 
              onClick={() => { setMode('anime'); setHasSearched(false); setQuery(''); }}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'anime' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Anime
            </button>
            <button 
              onClick={() => { setMode('profiles'); setHasSearched(false); setQuery(''); }}
              className={`px-6 py-2 rounded-md text-sm font-bold transition-colors ${mode === 'profiles' ? 'bg-zinc-800 text-white' : 'text-zinc-400 hover:text-white'}`}
            >
              Profiles
            </button>
          </div>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={mode === 'anime' ? "Search for an anime..." : "Search by username (e.g. aditya_07)..."}
            className="w-full bg-dark-surface border-2 border-zinc-700 focus:border-accent rounded-lg py-4 pl-12 pr-4 text-white text-lg focus:outline-none transition-colors"
          />
          <SearchIcon className="absolute left-4 top-4 text-zinc-500" size={24} />
          <button 
            type="submit"
            className="absolute right-2 top-2 bottom-2 bg-accent hover:bg-accent-hover text-white px-6 rounded-md font-bold transition-colors"
          >
            {isSearching ? <Loader2 size={20} className="animate-spin" /> : 'Search'}
          </button>
        </form>
      </div>

      {mode === 'anime' ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {results.map(anime => (
            <Link key={anime.idMal} to={`/anime/${anime.idMal}`} className="group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-zinc-500 transition-colors">
              <div className="aspect-[2/3] w-full bg-zinc-800 relative">
                {anime.coverImage?.large ? (
                  <img src={anime.coverImage.large} alt={anime.title.english || anime.title.romaji} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">No Image</div>
                )}
                {anime.status && (
                  <div className="absolute top-2 left-2 bg-dark-base/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white border border-zinc-700">
                    {anime.status === 'RELEASING' ? 'ONGOING' : 'COMPLETED'}
                  </div>
                )}
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-accent transition-colors" title={anime.title.english || anime.title.romaji}>
                  {anime.title.english || anime.title.romaji}
                </h3>
              </div>
            </Link>
          ))}
          {hasSearched && !isSearching && results.length === 0 && (
            <div className="col-span-full text-center py-12 text-zinc-500">No anime found.</div>
          )}
        </div>
      ) : (
        <div className="max-w-3xl mx-auto flex flex-col gap-4">
          {profileResults.map(p => (
            <Link key={p.id} to={`/profile/${p.username}`} className="bg-dark-surface border border-zinc-800 hover:border-zinc-500 rounded-lg p-4 flex items-center gap-4 transition-colors">
              <div className="w-16 h-16 rounded-full overflow-hidden bg-zinc-800 shrink-0 border-2 border-zinc-700">
                {p.avatar_url ? (
                  <img src={p.avatar_url} alt={p.username} className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={64} className="text-zinc-500 w-full h-full" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">@{p.username}</h3>
                <p className="text-xs text-zinc-500">Joined {new Date(p.created_at).toLocaleDateString()}</p>
              </div>
            </Link>
          ))}
          {hasSearched && !isSearching && profileResults.length === 0 && (
            <div className="text-center py-12 text-zinc-500">No profiles found matching that username.</div>
          )}
        </div>
      )}
    </div>
  );
}

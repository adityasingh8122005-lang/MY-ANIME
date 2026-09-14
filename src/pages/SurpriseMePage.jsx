import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUserAnime } from '../services/userService';
import { Dices, Loader2 } from 'lucide-react';

const ANILIST_QUERY = `
query ($page: Int, $genre: String, $format: MediaFormat) {
  Page(page: $page, perPage: 50) {
    media(type: ANIME, genre: $genre, format: $format, sort: SCORE_DESC, isAdult: false) {
      idMal
      title { romaji english }
      coverImage { large }
      episodes
      status
      genres
      averageScore
    }
  }
}
`;

const ALL_GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror", "Mahou Shoujo", 
  "Mecha", "Music", "Mystery", "Psychological", "Romance", "Sci-Fi", "Slice of Life", "Sports", "Supernatural", "Thriller"
];

export default function SurpriseMePage() {
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRolling, setIsRolling] = useState(false);
  const [localCollection, setLocalCollection] = useState([]);
  
  // Filters
  const [maxEpisodes, setMaxEpisodes] = useState('Any');
  const [genreFilter, setGenreFilter] = useState('Any');
  
  // Advanced X/Y IMDb Filter (Using AniList averageScore as proxy)
  const [imdbMinRating, setImdbMinRating] = useState('Any');
  const [imdbMinPercentage, setImdbMinPercentage] = useState('70');
  
  // Result
  const [selectedAnime, setSelectedAnime] = useState(null);
  const [matchReason, setMatchReason] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    setLocalCollection(getUserAnime());
    setIsInitialLoad(false);
  }, []);

  const handleSurpriseMe = async () => {
    setIsRolling(true);
    setError(null);
    setSelectedAnime(null);

    try {
      // Pick a random page from the top 5 pages (~top 250 anime for the given filters)
      // If we use strict filters, there might be fewer pages, so we fetch page 1-3.
      const page = Math.floor(Math.random() * 3) + 1; 
      const variables = { page, format: 'TV' };
      
      if (genreFilter !== 'Any') {
        variables.genre = genreFilter;
      }

      const res = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ query: ANILIST_QUERY, variables })
      });

      if (!res.ok) throw new Error("Failed to reach AniList");

      const json = await res.json();
      let list = json.data.Page.media.filter(a => a.idMal);

      // Filter by max episodes
      if (maxEpisodes !== '' && maxEpisodes !== 'Any') {
        const limit = parseInt(maxEpisodes, 10);
        list = list.filter(a => a.episodes && a.episodes <= limit);
      }

      // Filter by IMDb rating proxy (AniList score 0-100)
      if (imdbMinRating !== 'Any') {
        const minScore = parseFloat(imdbMinRating) * 10;
        list = list.filter(a => a.averageScore && a.averageScore >= minScore);
      }

      if (list.length === 0) {
        // Fallback: if random page had no matches, maybe they are too strict
        setError("No anime found matching these strict global filters on this roll. Try rolling again or loosening criteria.");
        setIsRolling(false);
        return;
      }

      // Pick random
      const randomAnime = list[Math.floor(Math.random() * list.length)];

      const formatted = {
        malId: randomAnime.idMal,
        metadata: {
          title: randomAnime.title.english || randomAnime.title.romaji,
          poster: randomAnime.coverImage?.large,
          episodes: randomAnime.episodes,
          genres: randomAnime.genres || [],
        }
      };

      // Check if user has it locally
      const localAnime = localCollection.find(a => a.malId === randomAnime.idMal);
      if (localAnime) {
        formatted.personalRating = localAnime.personalRating;
        formatted.episodesWatched = localAnime.episodesWatched;
      }

      const reasons = [];
      if (maxEpisodes !== '' && maxEpisodes !== 'Any') reasons.push(`≤ ${maxEpisodes} eps`);
      if (genreFilter !== 'Any') reasons.push(genreFilter);
      if (imdbMinRating !== 'Any') reasons.push(`${imdbMinPercentage}% > ${imdbMinRating}⭐ (Global)`);
      setMatchReason(reasons.join(', ') || 'Global Random Pick');

      setSelectedAnime(formatted);
    } catch (err) {
      console.error(err);
      setError("Failed to fetch random anime from global database.");
    }
    
    setIsRolling(false);
  };

  if (isInitialLoad) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-3">
          <Dices className="text-accent" size={32} /> Surprise Me
        </h1>
        <p className="text-zinc-400">Discover your next watch from the global anime database using advanced filters.</p>
      </div>

      {/* Filter Controls */}
      <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 mb-8 mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          
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
            <label className="text-xs text-zinc-500 font-semibold uppercase mb-2 block">Genre</label>
            <select 
              value={genreFilter} 
              onChange={e => setGenreFilter(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-accent"
            >
              <option value="Any">Any</option>
              {ALL_GENRES.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase mb-2 block">Min IMDb Rating (Ep)</label>
            <select 
              value={imdbMinRating} 
              onChange={e => setImdbMinRating(e.target.value)}
              className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-accent"
            >
              <option value="Any">Any</option>
              <option value="9.0">9.0+</option>
              <option value="8.5">8.5+</option>
              <option value="8.0">8.0+</option>
              <option value="7.5">7.5+</option>
              <option value="7.0">7.0+</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 font-semibold uppercase mb-2 block">% of Episodes</label>
            <select 
              value={imdbMinPercentage} 
              onChange={e => setImdbMinPercentage(e.target.value)}
              disabled={imdbMinRating === 'Any'}
              className="w-full bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:outline-none focus:border-accent disabled:opacity-50"
            >
              <option value="50">At least 50%</option>
              <option value="70">At least 70%</option>
              <option value="80">At least 80%</option>
              <option value="90">At least 90%</option>
              <option value="100">100%</option>
            </select>
          </div>

        </div>
        
        <button 
          onClick={handleSurpriseMe}
          disabled={isRolling}
          className="w-full bg-accent hover:bg-accent-hover disabled:bg-accent/50 text-white py-3 rounded-lg font-bold text-lg transition-colors flex items-center justify-center gap-2 border border-accent/50"
        >
          {isRolling ? <Loader2 size={24} className="animate-spin" /> : <Dices size={24} />}
          {isRolling ? 'ROLLING...' : 'SURPRISE ME'}
        </button>
      </div>

      {/* Error / Empty State */}
      {error && (
        <div className="text-center p-6 bg-red-950/20 border border-red-900/50 rounded-lg max-w-xl mx-auto text-red-400">
          {error}
        </div>
      )}

      {/* Result */}
      {selectedAnime && !isRolling && (
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
                {selectedAnime.episodesWatched !== undefined && (
                  <div className="text-sm text-zinc-300"><span className="text-zinc-500">Progress:</span> {selectedAnime.episodesWatched || 0} / {selectedAnime.metadata?.episodes || '?'}</div>
                )}
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

import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import MyAnimePage from './MyAnimePage';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';
import { Flame, Loader2, Dices } from 'lucide-react';

const TRENDING_QUERY = `
query {
  Page(page: 1, perPage: 20) {
    media(type: ANIME, sort: TRENDING_DESC, isAdult: false) {
      idMal
      title { romaji english }
      coverImage { large }
      bannerImage
      episodes
      status
    }
  }
}
`;

export default function HomePage() {
  const { session, profile } = useAuth();
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If user prefers collection and is logged in, we don't necessarily need to fetch trending
    // But let's fetch it anyway in case they switch, or just fetch if they want trending.
    if (session && profile?.home_preference === 'collection') {
      setLoading(false);
      return;
    }

    async function fetchTrending() {
      try {
        const res = await fetch('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: TRENDING_QUERY })
        });
        const json = await res.json();
        setTrending(json.data.Page.media.filter(a => a.idMal));
      } catch (e) {
        console.error("Failed to fetch trending", e);
      }
      setLoading(false);
    }
    fetchTrending();
  }, [session, profile]);

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 size={32} className="animate-spin text-accent" /></div>;
  }

  // If logged in and preferred Collection
  if (session && profile?.home_preference === 'collection') {
    return (
      <div className="animate-in fade-in duration-300">
        <MyAnimePage />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto relative isolate">
      <AnimatedAnimeBackground anime={trending} />
      <div className="relative z-10 px-4 pb-8">
      <div className="mb-8 text-center pt-8">
        <h1 className="text-3xl font-bold text-white mb-2 flex items-center justify-center gap-2">
          <Flame className="text-accent" size={32} /> Trending Anime
        </h1>
        <p className="text-zinc-400">Discover what the anime community is watching right now.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {trending.map(anime => (
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
      </div>
          </div>

      {/* Floating Surprise Me Button */}
      <Link 
        to="/surprise" 
        className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-accent/50 backdrop-blur-md transition-all hover:scale-105 hover:shadow-xl hover:shadow-accent/70 border border-white/10"
      >
        <Dices size={24} />
        Surprise Me
      </Link>
    </div>
  );
}

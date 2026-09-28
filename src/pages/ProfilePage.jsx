import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { UserCircle, Calendar, ShieldAlert, Tv } from 'lucide-react';
import Tilt from 'react-parallax-tilt';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { session } = useAuth();
  const { username } = useParams();
  const [profile, setProfile] = useState(null);
  const [collection, setCollection] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');

  useEffect(() => {
    async function loadProfile() {
      setLoading(true);
      setError(null);
      
      const cleanUsername = username.replace('@', '');

      // Fetch profile
      const { data: pData, error: pError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', cleanUsername)
        .maybeSingle();

      if (pError || !pData) {
        setError('Profile not found.');
        setLoading(false);
        return;
      }

      setProfile(pData);
      
      const isOwner = session?.user?.id === pData.id;

      // Fetch collection if public OR if they are the owner
      if (pData.is_public || isOwner) {
        const { data: animeData } = await supabase
          .from('user_anime')
          .select('*, anime_metadata(*)')
          .eq('user_id', pData.id);
          
        if (animeData) {
          const mapped = animeData.map(a => ({
            malId: a.mal_id,
            personalStatus: a.personal_status,
            episodesWatched: a.episodes_watched,
            personalRating: a.personal_rating,
            metadata: a.anime_metadata ? {
              title: a.anime_metadata.title,
              poster: a.anime_metadata.poster,
              episodes: a.anime_metadata.episodes
            } : null
          }));
          setCollection(mapped);
        }
      }
      
      setLoading(false);
    }
    loadProfile();
  }, [username]);

  if (loading) return <div className="flex justify-center p-12"><div className="animate-spin w-8 h-8 border-4 border-accent border-t-transparent rounded-full" /></div>;
  
  if (error) return (
    <div className="max-w-3xl mx-auto p-12 text-center">
      <UserCircle size={64} className="mx-auto text-zinc-600 mb-4" />
      <h1 className="text-2xl font-bold text-white mb-2">User Not Found</h1>
      <p className="text-zinc-400">The profile you are looking for does not exist.</p>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto">
      {/* Profile Header */}
      <div className="bg-dark-surface border border-zinc-800 rounded-lg p-8 mb-8 flex flex-col md:flex-row items-center gap-6">
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-zinc-700 bg-zinc-800 shrink-0">
          {profile.avatar_url ? (
            <img src={profile.avatar_url} alt={profile.username} className="w-full h-full object-cover" />
          ) : (
            <UserCircle size={120} className="text-zinc-500 w-full h-full" />
          )}
        </div>
        <div className="text-center md:text-left flex-1">
          <h1 className="text-3xl font-bold text-white mb-1">@{profile.username}</h1>
          <div className="flex items-center justify-center md:justify-start gap-4 text-zinc-400 text-sm mt-4">
            <span className="flex items-center gap-1"><Calendar size={16} /> Joined {new Date(profile.created_at).toLocaleDateString()}</span>
            <span className="flex items-center gap-1"><Tv size={16} /> {collection.filter(a => a.personalStatus === 'Completed' || a.personalStatus === 'Watching').length} Watched Anime</span>
          </div>
        </div>
      </div>

      {/* Collection Section */}
      
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-xl font-bold text-white">Anime Collection</h2>
        {collection.length > 0 && (!profile.is_public ? session?.user?.id === profile.id : true) && (
          <div className="flex overflow-x-auto hide-scrollbar gap-2 pb-1 sm:pb-0">
            {['All', 'Watching', 'Completed', 'Plan to Watch'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${activeTab === tab ? 'bg-accent text-white' : 'bg-dark-surface border border-zinc-800 text-zinc-400 hover:border-zinc-500'}`}
              >
                {tab}
              </button>
            ))}
          </div>
        )}
      </div>

      
      {!profile.is_public && session?.user?.id !== profile.id ? (
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-12 text-center flex flex-col items-center justify-center text-zinc-500">
          <ShieldAlert size={48} className="mb-4 text-zinc-600" />
          <p className="text-lg font-medium text-white mb-1">This profile is private</p>
          <p className="text-sm">@{profile.username} has chosen not to share their watch list publicly.</p>
        </div>
      ) : collection.length === 0 ? (
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
          No anime in their collection yet.
        </div>
      ) : (activeTab !== 'All' && collection.filter(a => a.personalStatus === activeTab).length === 0) ? (
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-8 text-center text-zinc-500">
          No anime in this category.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {(activeTab === 'All' ? collection : collection.filter(a => a.personalStatus === activeTab)).map(anime => (
            <Tilt key={anime.malId} tiltMaxAngleX={15} tiltMaxAngleY={15} scale={1.03} transitionSpeed={400} className="rounded-lg h-full">
              <Link to={`/anime/${anime.malId}`} className="h-full block group relative rounded-lg overflow-hidden bg-dark-surface border border-zinc-800 hover:border-accent transition-colors hover:shadow-lg hover:shadow-accent/20">
              <div className="aspect-[2/3] w-full bg-zinc-800 relative">
                {anime.metadata?.poster ? (
                  <img src={anime.metadata.poster} alt={anime.metadata?.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">No Image</div>
                )}
                
                <div className="absolute top-2 left-2 right-2 flex justify-between">
                  <div className="bg-dark-base/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-white border border-zinc-700">
                    {anime.personalStatus}
                  </div>
                  {anime.personalRating && (
                    <div className="bg-dark-base/90 backdrop-blur-sm px-2 py-1 rounded text-[10px] font-bold text-accent border border-zinc-700 flex items-center gap-1">
                      ⭐ {anime.personalRating}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-bold text-white line-clamp-1 group-hover:text-accent transition-colors" title={anime.metadata?.title}>
                  {anime.metadata?.title || 'Unknown Anime'}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Watched: {anime.episodesWatched} / {anime.metadata?.episodes || '?'}
                </p>
              </div>
            </Link>
            </Tilt>
          ))}
        </div>
      )}
    </div>
  );
}

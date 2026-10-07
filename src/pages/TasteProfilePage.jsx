import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getIntelligenceData } from '../services/intelligence/intelligenceService';
import { Loader2, Heart, TrendingDown, TrendingUp, Star, BarChart2, CheckCircle2 } from 'lucide-react';

export default function TasteProfilePage() {
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [intel, setIntel] = useState(null);

  useEffect(() => {
    async function load() {
      if (!session) return;
      try {
        const data = await getIntelligenceData();
        setIntel(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [session]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-void"><Loader2 size={32} className="animate-spin text-primary" /></div>;

  if (!intel || intel.totalAnime < 3 || !intel.allGenreStats || intel.allGenreStats.length === 0) {
    return (
      <div className="max-w-3xl mx-auto pt-24 px-4 text-center">
        <div className="w-24 h-24 rounded-full bg-surface-1 border border-white/5 flex items-center justify-center mx-auto mb-6">
          <BarChart2 size={40} className="text-zinc-600" />
        </div>
        <h1 className="text-display-s font-bold text-white mb-4">Not enough data</h1>
        <p className="text-zinc-400">Add more anime to your collection and rate them to generate your Personal Taste Profile.</p>
      </div>
    );
  }

  // Calculate Deterministic Taste Signals
  const stats = intel.allGenreStats;
  
  // Favorites: High count relative to collection OR exceptionally high rating
  const favorites = stats.filter(g => (g.rawCount >= 3 && g.avgRating >= 8) || (g.rawCount >= 5 && g.avgRating >= 7)).sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
  
  // Most Watched: Simply the highest counts
  const mostWatched = [...stats].sort((a, b) => b.weightedScore - a.weightedScore).slice(0, 3);
  
  // Rarely Watched: Count is 1 or 2, and maybe rating is not high
  const rarelyWatched = [...stats].filter(g => g.rawCount <= 2).sort((a, b) => a.weightedScore - b.weightedScore).slice(0, 5);

  // Highest Rated Genres (regardless of count if > 1)
  const ratedGenres = stats.filter(g => g.ratedCount > 0).sort((a, b) => b.avgRating - a.avgRating);

  return (
    <div className="max-w-5xl mx-auto pt-20 pb-32 px-4 relative isolate">
      <div className="text-center mb-16">
        <h1 className="text-display-s font-bold text-white mb-4">PERSONAL TASTE PROFILE</h1>
        <p className="text-zinc-400">A deterministic breakdown of your anime preferences based on your actual watching behavior.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Most Watched */}
        <div className="bg-surface-1 border border-white/5 rounded-3xl p-8 shadow-depth-2">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <TrendingUp size={24} />
            </div>
            <h2 className="text-h3 font-bold text-white">Staple Genres</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-6">The genres that make up the absolute core of your anime collection.</p>
          <div className="space-y-4">
            {mostWatched.map((g, i) => (
              <div key={g.genre} className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-white/5">
                <span className="font-bold text-white text-lg">{i + 1}. {g.genre}</span>
                <span className="text-sm font-bold text-zinc-500">{g.rawCount} Anime</span>
              </div>
            ))}
          </div>
        </div>

        {/* Favorites (Rating-driven) */}
        <div className="bg-surface-1 border border-white/5 rounded-3xl p-8 shadow-depth-2 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="flex items-center gap-4 mb-6 relative z-10">
            <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-accent">
              <Heart size={24} />
            </div>
            <h2 className="text-h3 font-bold text-white">True Favorites</h2>
          </div>
          <p className="text-sm text-zinc-400 mb-6 relative z-10">Genres where you consistently give high personal ratings when you watch them.</p>
          <div className="space-y-4 relative z-10">
            {favorites.length > 0 ? favorites.slice(0, 3).map(g => (
              <div key={g.genre} className="flex items-center justify-between p-4 rounded-xl bg-surface-2 border border-white/5 border-l-2 border-l-accent">
                <span className="font-bold text-white">{g.genre}</span>
                <div className="flex items-center gap-2">
                  <Star size={16} className="text-warning fill-warning" />
                  <span className="font-bold text-white">{g.avgRating.toFixed(1)}/10</span>
                </div>
              </div>
            )) : (
              <div className="p-4 rounded-xl bg-surface-2 border border-white/5 text-zinc-500 italic text-sm">
                Rate more anime highly to uncover your true favorites.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Rating Breakdown */}
        <div className="bg-surface-1 border border-white/5 rounded-3xl p-8 shadow-depth-2">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-warning/20 flex items-center justify-center text-warning">
                 <Star size={24} />
              </div>
              <h2 className="text-h4 font-bold text-white">Average Ratings</h2>
           </div>
           {ratedGenres.length > 0 ? (
              <div className="space-y-3">
                 {ratedGenres.slice(0, 6).map(g => (
                    <div key={g.genre} className="flex items-center gap-4">
                       <span className="w-24 text-sm font-bold text-zinc-300 truncate">{g.genre}</span>
                       <div className="flex-1 bg-surface-2 h-2 rounded-full overflow-hidden">
                          <div className="h-full bg-warning" style={{ width: `${(g.avgRating / 10) * 100}%` }} />
                       </div>
                       <span className="w-8 text-right text-sm font-bold text-white">{g.avgRating.toFixed(1)}</span>
                    </div>
                 ))}
              </div>
           ) : (
              <p className="text-sm text-zinc-500">You haven't rated any anime yet.</p>
           )}
        </div>

        {/* Rarely Watched */}
        <div className="bg-surface-1 border border-white/5 rounded-3xl p-8 shadow-depth-2">
           <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center text-zinc-400">
                 <TrendingDown size={24} />
              </div>
              <h2 className="text-h4 font-bold text-white">Rarely Explored</h2>
           </div>
           <p className="text-sm text-zinc-400 mb-4">Genres you've barely touched. Good targets for discovery.</p>
           {rarelyWatched.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                 {rarelyWatched.map(g => (
                    <span key={g.genre} className="bg-surface-2 border border-white/5 px-3 py-1.5 rounded-lg text-sm text-zinc-300 font-bold">
                       {g.genre}
                    </span>
                 ))}
              </div>
           ) : (
              <p className="text-sm text-zinc-500">You've thoroughly explored every genre in your collection.</p>
           )}
        </div>
      </div>
    </div>
  );
}

// Ensure the icon imports match our existing library. TrendingUp is missing in my import above? Oh wait, it was there.

import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getSmartContinueQueue } from '../services/smartContinueService';
import { generateRecommendations } from '../services/recommendation/recommendationService';
import { getWatchHistory, getAllUserAnime } from '../services/userService';
import { getIntelligenceData } from '../services/intelligence/intelligenceService';
import { Loader2, PlayCircle, Star, Calendar, ChevronRight, Dices, Search, Flame } from 'lucide-react';
import AnimatedAnimeBackground from '../components/AnimatedAnimeBackground';
import { AnimeCard3DWrapper } from '../components/ui/AnimeCard3DWrapper';
import clsx from 'clsx';

export default function HomePage() {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [continueQueue, setContinueQueue] = useState([]);
  const [releaseRadar, setReleaseRadar] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [heroState, setHeroState] = useState(null);
  const [errorState, setErrorState] = useState(false); // { type: 'empty' | 'watching' | 'completed', anime: null }
  
  // For unauthenticated users or totally empty state
  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(false);

  useEffect(() => {
    async function loadDashboard() {
      if (!session) {
        // Fallback to trending
        fetchTrending();
        return;
      }
      
      try {
        // 1. Fetch critical foundational data safely
        let collection = [];
        let history = [];
        try {
           collection = await getAllUserAnime(true);
           history = await getWatchHistory();
        } catch (e) {
           console.error("Critical collection/history fetch failed", e);
           // If the core database fails completely, we throw to trigger the full-page offline state
           throw e;
        }

        // 2. Fetch derived/optional intelligence safely in parallel
        // If these fail, we gracefully default them so the page still loads
        const [queueResult, recsResult, intelResult] = await Promise.allSettled([
          getSmartContinueQueue().catch(() => []),
          generateRecommendations('TASTE', 6).catch(() => []),
          getIntelligenceData().catch(() => null)
        ]);

        const queue = queueResult.status === 'fulfilled' ? queueResult.value : [];
        const recs = recsResult.status === 'fulfilled' ? recsResult.value : [];
        const intel = intelResult.status === 'fulfilled' ? intelResult.value : null;
        
        // Fetch Release Intelligence for actively watching anime
        const watchingAnime = collection.filter(c => c.personalStatus === 'Watching');
        const watchingIds = watchingAnime.map(c => c.malId);
        let radar = [];
        if (watchingIds.length > 0) {
           try {
               const schedule = await getAiringSchedule(watchingIds);
               radar = schedule.map(s => {
                  const local = watchingAnime.find(c => c.malId === s.malId || c.malId === s.idMal);
                  return { ...s, episodesWatched: local?.episodesWatched || 0, personalStatus: 'Watching' };
               }).filter(s => s.nextAiringEpisode);
           } catch (e) {
               console.error("Release radar fetch failed, degrading gracefully", e);
               // Page remains online, just without Release Radar
           }
        }
        
        setContinueQueue(queue);
        setRecommendations(recs);
        setReleaseRadar(radar);
        
                // Build Recent Activity safely using ONLY historical event sources
        const activity = [];
        history.slice(0, 10).forEach(h => {
          const anime = collection.find(c => c.malId === h.malId);
          if (anime) {
             const isFinal = anime.metadata?.episodes && h.episodesWatched === anime.metadata.episodes;
             activity.push({
               id: `hist-${h.id}`, 
               type: isFinal ? 'completed' : 'progress', 
               title: anime.metadata?.title || anime.metadata?.englishTitle,
               desc: isFinal ? `Completed series (Ep ${h.episodesWatched})` : `Watched Episode ${h.episodesWatched}`,
               date: new Date(h.date), 
               malId: h.malId
             });
          }
        });
        
        activity.sort((a,b) => b.date - a.date);
        setRecentActivity(activity.slice(0, 5));
        setRecentActivity(activity.slice(0, 5));

        // Determine Hero State
        if (queue.length > 0) {
           setHeroState({ type: 'watching', anime: queue[0] });
        } else if (collection.length > 0 && collection.some(c => c.personalStatus === 'Completed')) {
           // Find highest rated or just top recommendation
           setHeroState({ type: 'completed', anime: recs.length > 0 ? recs[0].anime : null });
        } else {
           setHeroState({ type: 'empty', anime: null });
        }
        
      } catch (e) {
        console.error(e);
        setErrorState(true);
      } finally {
        setLoading(false);
      }
    }
    
    async function fetchTrending() {
      const query = `query { Page(page: 1, perPage: 10) { media(type: ANIME, sort: TRENDING_DESC) { idMal title { romaji english } coverImage { large } bannerImage status } } }`;
      try {
        const res = await fetch('https://graphql.anilist.co', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
        const json = await res.json();
        setTrending(json.data.Page.media.filter(a => a.idMal));
        setHeroState({ type: 'unauth', anime: json.data.Page.media[0] });
      } catch (e) {}
      setLoading(false);
    }
    
    loadDashboard();
  }, [session]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-void"><Loader2 className="animate-spin text-primary" size={32} /></div>;

  const renderHero = () => {
    if (errorState) {
       return (
         <div className="relative w-full h-[40vh] md:h-[50vh] rounded-3xl overflow-hidden mb-12 shadow-depth-3 border border-red-500/10 flex items-center justify-center bg-surface-1">
            <div className="text-center z-20 px-4">
               <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Flame className="text-red-500/50" size={32} />
               </div>
               <h1 className="text-h3 md:text-h2 font-bold text-white mb-3">Command Center Unavailable</h1>
               <p className="text-zinc-400 mb-6 max-w-md mx-auto text-sm md:text-base">We couldn't connect to your personal anime database. You can still explore trending anime below.</p>
               <button onClick={() => window.location.reload()} className="bg-surface-2 text-white px-6 py-2 rounded-full font-bold hover:bg-surface-3 transition-colors text-sm border border-white/5">
                  Retry Connection
               </button>
            </div>
         </div>
       );
    }

    if (heroState?.type === 'watching' && heroState.anime) {
      const a = heroState.anime;
      const progress = Math.round(a.progressPercent) || 0;
      const title = a.title || 'Unknown Anime';
      return (
         <div className="relative w-full h-[50vh] md:h-[60vh] rounded-3xl overflow-hidden mb-12 shadow-depth-3 border border-white/10 group">
            <div className="absolute inset-0 bg-void/50 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-transparent z-10" />
            {a.poster && <img src={a.poster} alt={title} className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-1000" />}
            
            <div className="absolute bottom-0 left-0 p-8 md:p-12 z-20 w-full">
               <div className="text-accent font-bold tracking-widest uppercase text-xs mb-3 animate-in fade-in slide-in-from-bottom-4 duration-500">Continue Your Journey</div>
               <h1 className="text-display-s md:text-display-m font-bold text-white mb-4 line-clamp-2 drop-shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-500 delay-100">{title}</h1>
               <div className="flex items-center gap-6 mb-6 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200">
                  <div className="flex-1 max-w-xs bg-surface-2 h-2 rounded-full overflow-hidden border border-white/5">
                     <div className="h-full bg-primary" style={{ width: `${progress}%` }} />
                  </div>
                  <span className="text-sm font-bold text-zinc-400">EP {(a.isFranchise ? a.totalWatched : a.episodesWatched)} / {(a.isFranchise ? a.totalCanon : a.metadata?.episodes) || '?'} &bull; {progress}% Complete</span>
               </div>
               <Link to={`/watch/${a.isFranchise ? a.franchiseId : a.malId}`} className="inline-flex items-center gap-3 bg-white text-void px-8 py-4 rounded-full font-bold hover:bg-zinc-200 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 min-h-[44px]">
                  <PlayCircle size={20} /> Resume Episode {(a.isFranchise ? a.totalWatched : a.episodesWatched) + 1}
               </Link>
            </div>
         </div>
      );
    }
    
    if (heroState?.type === 'completed' && heroState.anime) {
       const a = heroState.anime;
       return (
         <div className="relative w-full h-[50vh] md:h-[60vh] rounded-3xl overflow-hidden mb-12 shadow-depth-3 border border-white/10 group">
            <div className="absolute inset-0 bg-void/50 z-10" />
            <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-transparent z-10" />
            {a.bannerImage && <img src={a.bannerImage} alt={a.title?.english} className="absolute inset-0 w-full h-full object-cover opacity-60 scale-105 group-hover:scale-100 transition-transform duration-1000" />}
            
            <div className="absolute bottom-0 left-0 p-8 md:p-12 z-20 max-w-3xl">
               <div className="text-primary font-bold tracking-widest uppercase text-xs mb-3">Your Next Story Awaits</div>
               <h1 className="text-display-s md:text-display-m font-bold text-white mb-4 line-clamp-2 drop-shadow-lg">{a.title?.english || a.title?.romaji}</h1>
               <p className="text-zinc-400 mb-6 line-clamp-2">{a.description?.replace(/<[^>]+>/g, '')}</p>
               <Link to={`/anime/${a.idMal}`} className="inline-flex items-center gap-3 bg-primary text-white px-8 py-4 rounded-full font-bold hover:bg-primary/90 transition-colors min-h-[44px]">
                  <PlayCircle size={20} /> View Details
               </Link>
            </div>
         </div>
       );
    }

    return (
       <div className="relative w-full h-[50vh] md:h-[60vh] rounded-3xl overflow-hidden mb-12 shadow-depth-3 border border-white/10 flex items-center justify-center bg-surface-1">
          <div className="text-center z-20 px-4">
             <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Flame className="text-primary" size={40} />
             </div>
             <h1 className="text-display-s md:text-display-m font-bold text-white mb-4">Your universe starts here.</h1>
             <p className="text-zinc-400 mb-8 max-w-md mx-auto">Discover anime, track your progress, and unlock a personalized command center.</p>
             <div className="flex justify-center gap-4">
                <Link to="/search" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-bold hover:bg-primary/90 transition-colors min-h-[44px]">
                   <Search size={20} /> Discover
                </Link>
                <Link to="/surprise-me" className="inline-flex items-center gap-2 bg-surface-2 text-white px-6 py-3 rounded-full font-bold hover:bg-surface-3 border border-white/5 transition-colors min-h-[44px]">
                   <Dices size={20} /> Surprise Me
                </Link>
             </div>
          </div>
       </div>
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto pb-32 relative isolate pt-12 md:pt-20 px-4">
      {session && !errorState && continueQueue.length > 0 ? <AnimatedAnimeBackground anime={continueQueue} /> : <AnimatedAnimeBackground anime={trending} />}
      
      <div className="relative z-10">
        {renderHero()}
        
        {session && !errorState && (
          <div className="flex flex-col lg:flex-row gap-8">
             {/* Main Content (Continue & Recs) */}
             <div className="flex-1">
                
                {/* Continue Watching Section */}
                {continueQueue.length > 0 && (
                   <section className="mb-16">
                      <div className="flex items-center justify-between mb-6">
                         <h2 className="text-h3 font-bold text-white">Smart Continue</h2>
                         <Link to="/my-anime" className="text-sm font-bold text-zinc-400 hover:text-white flex items-center gap-1 min-h-[44px]">All Anime <ChevronRight size={16} /></Link>
                      </div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-6 snap-x">
                         {continueQueue.slice(0, 5).map(anime => (
                            <Link key={anime.isFranchise ? anime.franchiseId : anime.malId} to={`/watch/${anime.isFranchise ? anime.franchiseId : anime.malId}`} className="snap-start shrink-0 w-72 md:w-80 group">
                               <div className="relative aspect-video rounded-2xl overflow-hidden bg-surface-1 border border-white/5 mb-3 shadow-depth-2 group-hover:border-primary/50 transition-colors">
                                  {anime.poster && <img src={anime.poster} alt={anime.title} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-500" />}
                                  <div className="absolute inset-0 bg-gradient-to-t from-void via-void/40 to-transparent" />
                                  <div className="absolute bottom-3 left-3 right-3">
                                     <h3 className="font-bold text-white line-clamp-1 text-sm mb-2">{anime.title}</h3>
                                     <div className="flex items-center gap-3">
                                        <div className="flex-1 bg-surface-3 h-1.5 rounded-full overflow-hidden">
                                           <div className="h-full bg-accent" style={{ width: `${anime.progressPercent}%` }} />
                                        </div>
                                        <span className="text-micro font-bold text-zinc-400">EP {(anime.isFranchise ? anime.totalWatched : anime.episodesWatched)} / {(anime.isFranchise ? anime.totalCanon : anime.metadata?.episodes) || '?'}</span>
                                     </div>
                                  </div>
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-void/40 backdrop-blur-sm transition-opacity">
                                     <div className="bg-primary text-white p-3 rounded-full shadow-lg">
                                        <PlayCircle size={24} />
                                     </div>
                                  </div>
                               </div>
                            </Link>
                         ))}
                      </div>
                   </section>
                )}

                {/* Picked For You */}
                {releaseRadar.length > 0 && (
                   <section className="mb-16">
                      <ReleaseRadar title="Coming Up For You" items={releaseRadar} limit={3} variant="grid" />
                   </section>
                )}

                {recommendations.length > 0 && (
                   <section className="mb-16">
                      <div className="flex items-center justify-between mb-6">
                         <h2 className="text-h3 font-bold text-white">Picked For You</h2>
                         <Link to="/surprise-me" className="text-sm font-bold text-zinc-400 hover:text-white flex items-center gap-1 min-h-[44px]">Explore <ChevronRight size={16} /></Link>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                         {recommendations.slice(0, 4).map(rec => (
                            <AnimeCard3DWrapper key={rec.anime.idMal}>
                               <Link to={`/anime/${rec.anime.idMal}`} className="block relative group rounded-xl overflow-hidden bg-surface-1 border border-white/5 hover:border-primary transition-all shadow-depth-1">
                                  <div className="aspect-[2/3] w-full bg-surface-2 relative">
                                     {rec.anime.coverImage?.large && <img src={rec.anime.coverImage.large} alt={rec.anime.title?.english} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />}
                                     <div className="absolute top-2 left-2 bg-void/80 backdrop-blur-sm px-2 py-1 rounded text-micro font-bold text-primary border border-white/5" style={{ transform: "translateZ(30px)" }}>
                                        {rec.reason}
                                     </div>
                                  </div>
                                  <div className="p-4 bg-surface-1 flex flex-col gap-2">
                                     <h3 className="text-sm font-bold text-white line-clamp-1">{rec.anime.title?.english || rec.anime.title?.romaji}</h3>
                                     {rec.explanations && rec.explanations.length > 0 && (
                                        <div className="mt-2 border-t border-white/5 pt-2">
                                           <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-1">Why this anime?</div>
                                           <ul className="text-xs text-zinc-400 space-y-1">
                                              {rec.explanations.map((exp, i) => (
                                                 <li key={i} className="flex items-start gap-1"><span className="text-primary mt-0.5">•</span> <span className="line-clamp-2 leading-tight">{exp}</span></li>
                                              ))}
                                           </ul>
                                        </div>
                                     )}
                                  </div>
                               </Link>
                            </AnimeCard3DWrapper>
                         ))}
                      </div>
                   </section>
                )}
             </div>

             {/* Sidebar (Recent Activity) */}
             <div className="w-full lg:w-80 shrink-0">
                <div className="bg-surface-1 border border-white/5 rounded-3xl p-6 shadow-depth-2 sticky top-24">
                   <div className="flex items-center justify-between mb-6">
                      <h3 className="text-h4 font-bold text-white">Activity</h3>
                      <Link to="/journey" className="text-micro font-bold text-accent hover:underline min-h-[44px] flex items-center">Timeline</Link>
                   </div>
                   
                   {recentActivity.length === 0 ? (
                      <p className="text-sm text-zinc-500 italic">No recent history.</p>
                   ) : (
                      <div className="flex flex-col gap-5">
                         {recentActivity.map(act => (
                            <Link key={act.id} to={`/anime/${act.malId}`} className="flex gap-3 group">
                               <div className="w-8 h-8 rounded-full bg-surface-2 border border-white/5 flex items-center justify-center shrink-0 group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                                  {act.type === 'completed' ? <Star size={14} className="text-warning" /> : <PlayCircle size={14} className="text-zinc-400 group-hover:text-primary" />}
                               </div>
                               <div>
                                  <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors line-clamp-1">{act.title}</h4>
                                  <p className="text-xs text-zinc-400">{act.desc}</p>
                                  <p className="text-micro text-zinc-600 mt-1">{act.date.toLocaleDateString()}</p>
                               </div>
                            </Link>
                         ))}
                      </div>
                   )}
                </div>
             </div>
          </div>
        )}

        {/* Universal Trending Section */}
        <section className={session ? "mt-16" : ""}>
           <div className="flex items-center justify-between mb-6">
              <h2 className="text-h3 font-bold text-white flex items-center gap-2">
                 <Flame className="text-primary" size={24} /> Trending Now
              </h2>
           </div>
           
           {trendingLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                 {[...Array(6)].map((_, i) => (
                    <div key={i} className="aspect-[2/3] bg-surface-2 animate-pulse rounded-xl border border-white/5" />
                 ))}
              </div>
           ) : trendingError ? (
              <div className="bg-surface-1 border border-white/5 rounded-2xl p-8 text-center text-zinc-500 shadow-depth-1">
                 <Flame size={32} className="mx-auto mb-3 opacity-20" />
                 <p className="font-bold text-sm">Trending unavailable</p>
                 <p className="text-xs mt-1">We couldn't reach the discovery network.</p>
              </div>
           ) : trending.length === 0 ? (
              <div className="bg-surface-1 border border-white/5 rounded-2xl p-8 text-center text-zinc-500 shadow-depth-1">
                 <Flame size={32} className="mx-auto mb-3 opacity-20" />
                 <p className="font-bold text-sm">No trending anime found</p>
              </div>
           ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                 {trending.map(anime => (
                    <AnimeCard3DWrapper key={anime.idMal}>
                       <Link to={`/anime/${anime.idMal}`} className="block relative group rounded-xl overflow-hidden bg-surface-1 border border-white/5 hover:border-primary transition-all shadow-depth-1 h-full flex flex-col focus:outline-none focus:ring-2 focus:ring-primary">
                          <div className="aspect-[2/3] w-full bg-surface-2 relative shrink-0 overflow-hidden">
                             {anime.coverImage?.large ? (
                                <img src={anime.coverImage.large} alt={anime.title?.english || anime.title?.romaji} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out" loading="lazy" />
                             ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-600">No Image</div>
                             )}
                             <div className="absolute inset-0 bg-gradient-to-t from-void via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                             <div className="absolute bottom-2 right-2 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white shadow-lg">
                                   <ChevronRight size={16} />
                                </div>
                             </div>
                          </div>
                          <div className="p-3 bg-surface-1 flex-1 flex flex-col justify-center">
                             <h3 className="text-sm font-bold text-white line-clamp-2 leading-tight">{anime.title?.english || anime.title?.romaji}</h3>
                          </div>
                       </Link>
                    </AnimeCard3DWrapper>
                 ))}
              </div>
           )}
        </section>
      </div>
    </div>
  );
}

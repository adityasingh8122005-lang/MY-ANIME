import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Play, Calendar, Clock, Sparkles } from 'lucide-react';

// Format precise countdown using Math
function getCountdownText(timestamp) {
   const now = Math.floor(Date.now() / 1000);
   const diff = timestamp - now;
   
   if (diff < -86400) return 'Aired';
   if (diff < 0) return 'Aired recently';
   
   const d = Math.floor(diff / 86400);
   const h = Math.floor((diff % 86400) / 3600);
   const m = Math.floor((diff % 3600) / 60);
   
   if (d > 0) return `${d}d ${h}h remaining`;
   if (h > 0) return `${h}h ${m}m remaining`;
   return `${m}m remaining`;
}

// Format relative day
function getDayText(timestamp) {
   const date = new Date(timestamp * 1000);
   return new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(date);
}

export default function ReleaseRadar({ title, items = [], limit = 0, variant = 'list' }) {
   const [now, setNow] = useState(Math.floor(Date.now() / 1000));
   
   // Efficient global timer for countdowns
   useEffect(() => {
      // Only tick if we actually have items with future timestamps
      const hasFuture = items.some(a => a.nextAiringEpisode?.airingAt && a.nextAiringEpisode.airingAt > now);
      if (!hasFuture) return;
      
      const interval = setInterval(() => {
         setNow(Math.floor(Date.now() / 1000));
      }, 60000); // Update every minute to prevent extreme render cascades
      
      return () => clearInterval(interval);
   }, [items, now]);
   
   // Sort items by release proximity
   const displayItems = useMemo(() => {
      const sorted = [...items].sort((a, b) => {
         const tA = a.nextAiringEpisode?.airingAt || Infinity;
         const tB = b.nextAiringEpisode?.airingAt || Infinity;
         return tA - tB;
      });
      return limit > 0 ? sorted.slice(0, limit) : sorted;
   }, [items, limit]);

   if (!displayItems || displayItems.length === 0) return null;

   return (
      <div className="w-full">
         {title && (
            <div className="flex items-center gap-2 mb-4">
               <Sparkles size={18} className="text-primary" />
               <h2 className="text-h4 font-bold text-white">{title}</h2>
            </div>
         )}
         
         <div className={`grid gap-3 ${variant === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}>
            {displayItems.map(anime => {
               const ep = anime.nextAiringEpisode;
               const isAiringNow = ep && (ep.airingAt - now <= 0);
               const hasTimestamp = !!ep?.airingAt;
               
               // Compute user's position if they are actively watching
               // If next episode is 10, and they've watched 8, they have 1 available now.
               const watched = anime.episodesWatched || 0;
               let userAction = null;
               
               if (anime.personalStatus === 'Watching') {
                  if (ep && watched < ep.episode - 1) {
                     userAction = "Catch Up";
                  } else {
                     userAction = "Up to Date";
                  }
               }
               
               return (
                  <div key={anime.malId || anime.idMal} className="bg-surface-1 border border-white/5 rounded-xl p-4 flex gap-4 hover:border-primary/50 transition-colors shadow-depth-1 relative overflow-hidden group">
                     {/* Background Glow */}
                     {isAiringNow && <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />}
                     
                     <div className="w-16 h-20 bg-surface-2 rounded-lg overflow-hidden shrink-0 shadow-md">
                        {anime.poster || anime.coverImage?.large ? (
                           <img src={anime.poster || anime.coverImage?.large} alt={anime.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        ) : <div className="w-full h-full flex items-center justify-center text-micro text-zinc-600">No Img</div>}
                     </div>
                     
                     <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h3 className="font-bold text-white text-sm line-clamp-1 mb-1" title={anime.title}>{anime.title}</h3>
                        
                        {ep ? (
                           <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-zinc-300">
                                 Episode {ep.episode}
                                 {userAction === "Catch Up" && <span className="ml-2 text-warning text-micro bg-warning/10 px-1.5 py-0.5 rounded">Catch Up: Behind schedule</span>}
                              </span>
                              <div className="flex items-center gap-1.5 text-xs text-primary font-bold">
                                 {isAiringNow ? (
                                    <><Play size={12} className="fill-primary" /> {ep.airingAt - now < -86400 ? 'Aired' : ep.airingAt - now < 0 ? 'Aired recently' : 'Airing soon'}</>
                                 ) : hasTimestamp ? (
                                    <><Clock size={12} /> {getCountdownText(ep.airingAt)}</>
                                 ) : (
                                    <><Calendar size={12} /> Airing {getDayText(ep.airingAt)}</>
                                 )}
                              </div>
                           </div>
                        ) : (
                           <div className="flex flex-col gap-1">
                              <span className="text-xs font-bold text-zinc-400">Release pending</span>
                              <span className="text-xs text-zinc-500">{anime.status || "Unknown Status"}</span>
                           </div>
                        )}
                     </div>
                     
                     <Link to={`/anime/${anime.malId || anime.idMal}`} className="absolute inset-0 z-10">
                        <span className="sr-only">View {anime.title}</span>
                     </Link>
                  </div>
               );
            })}
         </div>
      </div>
   );
}

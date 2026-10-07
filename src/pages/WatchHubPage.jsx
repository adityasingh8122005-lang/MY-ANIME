import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getAnimeDetails, getAnimeEpisodes } from '../services/jikanApi';
import { getUserAnime, updateUserAnime, getWatchHistory, addWatchHistory, deleteWatchHistory } from '../services/userService';
import { Loader2, PlayCircle, CheckCircle2, ChevronLeft, ChevronRight, XCircle, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';
import { getFranchiseData } from '../services/franchiseApi';
import { addFranchiseToDb } from '../services/franchiseService';

export default function WatchHubPage() {
  const { malId } = useParams();
  const { session } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [anime, setAnime] = useState(null);
  const [episodes, setEpisodes] = useState([]);
  const [history, setHistory] = useState([]);
  const [userAnime, setUserAnime] = useState(null);
  const [currentEpisode, setCurrentEpisode] = useState(1);
  const [selectedEpisode, setSelectedEpisode] = useState(null);
  const [error, setError] = useState(null);
  
  const listRef = useRef(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const hist = await getWatchHistory(malId);
      const details = await getAnimeDetails(malId);
      const local = await getUserAnime(malId);
      
      const maxWatched = hist && hist.length > 0 ? Math.max(...hist.map(h => h.episodesWatched)) : 0;
      const eps = await getAnimeEpisodes(malId, maxWatched);
      
      setAnime(details);
      setEpisodes(eps);
      setHistory(hist);
      setUserAnime(local);
      
      // Determine next unwatched episode strictly based on history
      let nextEp = 1;
      if (hist && hist.length > 0) {
         if (maxWatched < (details.episodes || Infinity)) {
            nextEp = maxWatched + 1;
         } else {
            nextEp = maxWatched; // completed or maxed
         }
      }
      
      setCurrentEpisode(nextEp);
      setSelectedEpisode(eps.find(e => e.mal_id === nextEp) || eps[0]);
      
      // Removed automatic addFranchiseToDb mutation to preserve strict user data boundaries
    } catch (e) {
      console.error(e);
      setError("Failed to load anime data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session && malId) {
       loadData();
    }
  }, [malId, session]);

  const watchedSet = new Set(history.map(h => h.episodesWatched));
  const isCompleted = anime?.episodes && watchedSet.size >= anime.episodes && watchedSet.has(anime.episodes);
  const total = anime?.episodes || '?';
  const progressPercent = anime?.episodes ? Math.min(100, Math.round((watchedSet.size / anime.episodes) * 100)) : 0;

  const handleToggleWatched = async (epNum) => {
     if (!session) return;
     const isWatched = watchedSet.has(epNum);
     
     try {
       if (isWatched) {
          // Unwatch
          const rows = history.filter(h => h.episodesWatched === epNum);
          for (const row of rows) {
             await deleteWatchHistory(row.id);
          }
          const newHist = history.filter(h => h.episodesWatched !== epNum);
          setHistory(newHist);
          
          const maxNow = newHist.length > 0 ? Math.max(...newHist.map(h => h.episodesWatched)) : 0;
          
          // Re-evaluate completion status
          const uniqueSetSize = new Set(newHist.map(h => h.episodesWatched)).size;
          const isNowCompleted = anime?.episodes && uniqueSetSize >= anime.episodes && newHist.some(h => h.episodesWatched === anime.episodes);
          
          let nextStatus = 'Watching';
          if (maxNow === 0) nextStatus = 'Plan to Watch';
          if (isNowCompleted) nextStatus = 'Completed';
          
          await updateUserAnime(malId, { 
             episodesWatched: maxNow,
             personalStatus: nextStatus
          });
       } else {
          // Watch
          const date = new Date().toISOString();
          const newRow = await addWatchHistory(malId, date, epNum);
          const newHist = [...history, newRow];
          setHistory(newHist);
          
          const maxNow = Math.max(...newHist.map(h => h.episodesWatched));
          
          // Re-evaluate completion status
          const uniqueSetSize = new Set(newHist.map(h => h.episodesWatched)).size;
          const isNowCompleted = anime?.episodes && uniqueSetSize >= anime.episodes && newHist.some(h => h.episodesWatched === anime.episodes);
          
          await updateUserAnime(malId, { 
             episodesWatched: maxNow,
             personalStatus: isNowCompleted ? 'Completed' : 'Watching'
          });
          
          if (!isNowCompleted && epNum === currentEpisode) {
             setCurrentEpisode(epNum + 1);
             setSelectedEpisode(episodes.find(e => e.mal_id === epNum + 1) || selectedEpisode);
          }
       }
     } catch (e) {
        console.error("Failed to toggle watch state", e);
     }
  };

  const handlePrev = () => {
     if (selectedEpisode && selectedEpisode.mal_id > 1) {
        setSelectedEpisode(episodes.find(e => e.mal_id === selectedEpisode.mal_id - 1));
     }
  };

  const handleNext = () => {
     if (selectedEpisode && selectedEpisode.mal_id < episodes.length) {
        setSelectedEpisode(episodes.find(e => e.mal_id === selectedEpisode.mal_id + 1));
     }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-void"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (error) return <div className="min-h-screen flex items-center justify-center text-error bg-void">{error}</div>;

  return (
    <div className="min-h-screen bg-void pb-32">
       {/* Cinematic Header */}
       <div className="relative w-full h-[50vh] min-h-[400px] border-b border-white/5">
          <div className="absolute inset-0 bg-void/60 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-void via-void/80 to-transparent z-10" />
          <img src={anime?.poster || anime?.coverImage?.large} alt={anime?.title} className="absolute inset-0 w-full h-full object-cover opacity-30" />
          
          <div className="absolute top-4 left-4 z-30">
            <Link to="/journey" className="inline-flex items-center gap-2 text-zinc-400 hover:text-white transition-colors bg-surface-1/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 text-sm font-bold min-h-[44px]">
               <ArrowLeft size={16} /> Back to Journey
            </Link>
          </div>
          
          <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 z-20 max-w-[1600px] mx-auto flex flex-col md:flex-row gap-8 items-end">
             <img src={anime?.poster} alt={anime?.title} className="w-32 md:w-48 rounded-xl shadow-depth-3 border border-white/10 hidden md:block" />
             <div className="flex-1">
                {isCompleted ? (
                   <div className="inline-flex items-center gap-2 text-success font-bold text-xs tracking-widest uppercase mb-3 bg-success/10 px-3 py-1 rounded-full border border-success/20">
                      <CheckCircle2 size={14} /> Completed
                   </div>
                ) : (
                   <div className="text-primary font-bold tracking-widest uppercase text-xs mb-3">Episode Journey</div>
                )}
                
                <h1 className="text-display-s md:text-display-m font-bold text-white mb-4 line-clamp-2">{anime?.title}</h1>
                
                <div className="flex items-center gap-6 max-w-md">
                   <div className="flex-1 bg-surface-2 h-2 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-primary transition-all duration-500" style={{ width: `${progressPercent}%` }} />
                   </div>
                   <span className="text-sm font-bold text-zinc-400 min-w-[80px]">{watchedSet.size} / {total} EP</span>
                </div>
             </div>
          </div>
       </div>

       {/* Main Hub Content */}
       <div className="max-w-[1600px] mx-auto px-4 py-12 flex flex-col lg:flex-row gap-12 relative z-20">
          
          {/* Left: Episode Selector & Controls */}
          <div className="flex-1 lg:max-w-2xl">
             <div className="bg-surface-1 border border-white/5 shadow-depth-2 rounded-3xl p-6 md:p-10 mb-8 sticky top-24">
                <div className="flex justify-between items-center mb-8">
                   
<h2 className="text-h3 font-bold text-white">
   {isCompleted ? "Series Completed" : "Active Episode"}
</h2>

                   <div className="flex gap-2">
                      <button onClick={handlePrev} disabled={!selectedEpisode || selectedEpisode.mal_id === 1} className="w-11 h-11 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-white disabled:opacity-30 disabled:hover:bg-surface-2 transition-colors border border-white/5">
                         <ChevronLeft size={20} />
                      </button>
                      <button onClick={handleNext} disabled={!selectedEpisode || selectedEpisode.mal_id === episodes.length} className="w-11 h-11 rounded-full bg-surface-2 hover:bg-surface-3 flex items-center justify-center text-white disabled:opacity-30 disabled:hover:bg-surface-2 transition-colors border border-white/5">
                         <ChevronRight size={20} />
                      </button>
                   </div>
                </div>

                {selectedEpisode ? (
                   <div>
                      <div className="flex items-center gap-3 mb-4">
                         <span className="text-accent font-bold text-xl">EP {selectedEpisode.mal_id}</span>
                         {selectedEpisode.filler && <span className="bg-warning/20 text-warning px-2 py-0.5 rounded text-xs font-bold border border-warning/20">FILLER</span>}
                      </div>
                      <h3 className="text-h4 font-bold text-white mb-8 line-clamp-2">{selectedEpisode.title}</h3>
                      
                      {selectedEpisode.aired && (
                         <p className="text-sm text-zinc-500 mb-8">Aired: {new Date(selectedEpisode.aired).toLocaleDateString()}</p>
                      )}

                      <div className="flex gap-4">
                         {watchedSet.has(selectedEpisode.mal_id) ? (
                            <button onClick={() => handleToggleWatched(selectedEpisode.mal_id)} className="flex-1 min-h-[56px] rounded-full font-bold transition-all flex items-center justify-center gap-3 bg-surface-2 hover:bg-surface-3 text-white border border-white/10 group">
                               <CheckCircle2 size={24} className="text-success" /> Watched (Undo)
                            </button>
                         ) : (
                            <button onClick={() => handleToggleWatched(selectedEpisode.mal_id)} className="flex-1 min-h-[56px] rounded-full font-bold transition-all flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20">
                               <PlayCircle size={24} /> Mark as Watched
                            </button>
                         )}
                      </div>
                   </div>
                ) : (
                   <div className="text-center py-12 text-zinc-500">No episodes available.</div>
                )}
             </div>
          </div>

          {/* Right: The Episode Journey (List) */}
          <div className="flex-1 lg:max-w-md xl:max-w-lg">
             <h3 className="text-h4 font-bold text-white mb-6">Episode Journey</h3>
             <div className="bg-surface-1 border border-white/5 shadow-depth-2 rounded-3xl p-4 md:p-6 max-h-[800px] overflow-y-auto no-scrollbar relative" ref={listRef}>
                <div className="absolute left-10 md:left-12 top-0 bottom-0 w-px bg-white/5 z-0" />
                <div className="flex flex-col gap-4 relative z-10">
                   {episodes.map(ep => {
                      const isWatched = watchedSet.has(ep.mal_id);
                      const isCurrent = currentEpisode === ep.mal_id;
                      const isSelected = selectedEpisode?.mal_id === ep.mal_id;
                      
                      return (
                         <button 
                            key={ep.mal_id}
                            onClick={() => setSelectedEpisode(ep)}
                            className={clsx(
                               "flex items-center gap-4 p-3 rounded-2xl transition-all min-h-[64px] text-left relative",
                               isSelected ? "bg-surface-2 border border-white/10 shadow-depth-1" : "hover:bg-surface-2/50 border border-transparent"
                            )}
                         >
                            <div className={clsx(
                               "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border transition-colors",
                               isWatched ? "bg-success/20 border-success/30 text-success" : 
                               isCurrent ? "bg-primary/20 border-primary/30 text-primary" : 
                               "bg-surface-3 border-white/5 text-zinc-500"
                            )}>
                               {isWatched ? <CheckCircle2 size={16} /> : isCurrent ? <PlayCircle size={16} /> : <span className="text-xs font-bold">{ep.mal_id}</span>}
                            </div>
                            <div className="flex-1 min-w-0">
                               <div className="flex items-center gap-2 mb-1">
                                  <h4 className={clsx("text-sm font-bold line-clamp-1", isWatched ? "text-zinc-400" : isCurrent ? "text-white" : "text-zinc-300")}>
                                     {ep.title}
                                  </h4>
                                  {ep.filler && <span className="shrink-0 bg-warning/20 text-warning px-1.5 py-0.5 rounded text-[10px] font-bold">FILLER</span>}
                               </div>
                            </div>
                         </button>
                      );
                   })}
                </div>
             </div>
          </div>

       </div>
    </div>
  );
}

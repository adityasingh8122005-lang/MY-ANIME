import React, { useState, useEffect, useMemo } from 'react';
import { getSeasonalAnime } from '../services/jikanApi';
import { AnimeCard3DWrapper } from '../components/ui/AnimeCard3DWrapper';
import { Link } from 'react-router-dom';
import WeeklySchedule from '../components/WeeklySchedule';
import { Loader2, ChevronLeft, ChevronRight, CalendarDays, Sparkles } from 'lucide-react';

const SEASONS = ['WINTER', 'SPRING', 'SUMMER', 'FALL'];

function getCurrentSeasonInfo() {
   const now = new Date();
   const month = now.getMonth(); // 0-11
   const year = now.getFullYear();
   
   let seasonIdx = 0;
   if (month >= 0 && month <= 2) seasonIdx = 0; // Winter
   else if (month >= 3 && month <= 5) seasonIdx = 1; // Spring
   else if (month >= 6 && month <= 8) seasonIdx = 2; // Summer
   else seasonIdx = 3; // Fall
   
   return { seasonIdx, year };
}

export default function SeasonalPage() {
  const currentInfo = useMemo(() => getCurrentSeasonInfo(), []);
  
  const [activeSeasonIdx, setActiveSeasonIdx] = useState(currentInfo.seasonIdx);
  const [activeYear, setActiveYear] = useState(currentInfo.year);
  
  const [animeList, setAnimeList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchIdRef = React.useRef(0);

  useEffect(() => {
     let isMounted = true;
     const currentFetchId = ++fetchIdRef.current;
     
     async function load() {
        setIsLoading(true);
        setError(null);
        try {
           const seasonStr = SEASONS[activeSeasonIdx];
           const data = await getSeasonalAnime(seasonStr, activeYear);
           
           // Race condition protection: only update state if this is the most recent request
           if (isMounted && currentFetchId === fetchIdRef.current) {
               setAnimeList(data);
               setIsLoading(false);
           }
        } catch (e) {
           console.error(e);
           if (isMounted && currentFetchId === fetchIdRef.current) {
               setError("Failed to load seasonal data.");
               setIsLoading(false);
           }
        }
     }
     
     load();
     return () => { isMounted = false; };
  }, [activeSeasonIdx, activeYear]);

  const handlePrev = () => {
     if (activeSeasonIdx === 0) {
        setActiveSeasonIdx(3);
        setActiveYear(y => y - 1);
     } else {
        setActiveSeasonIdx(i => i - 1);
     }
  };

  const handleNext = () => {
     if (activeSeasonIdx === 3) {
        setActiveSeasonIdx(0);
        setActiveYear(y => y + 1);
     } else {
        setActiveSeasonIdx(i => i + 1);
     }
  };
  
  const handleCurrent = () => {
     setActiveSeasonIdx(currentInfo.seasonIdx);
     setActiveYear(currentInfo.year);
  };

  const seasonName = SEASONS[activeSeasonIdx];
  const isCurrent = activeSeasonIdx === currentInfo.seasonIdx && activeYear === currentInfo.year;

  return (
    <div className="min-h-screen pt-20 pb-32 px-4 relative isolate">
       <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl -z-10 translate-x-1/3 -translate-y-1/3" />
       
       <div className="max-w-7xl mx-auto">
          {/* Header & Navigation */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-12 gap-6">
             <div>
                <h1 className="text-display-m font-bold text-white tracking-tight flex items-center gap-3">
                   <CalendarDays size={40} className="text-primary" />
                   {seasonName} {activeYear}
                </h1>
                <p className="text-zinc-400 mt-2 text-lg">Explore the most popular anime of the season.</p>
             </div>
             
             <div className="flex items-center gap-2 bg-surface-1 border border-white/5 p-2 rounded-2xl shadow-depth-2">
                <button onClick={handlePrev} className="p-3 text-zinc-400 hover:text-white hover:bg-surface-2 rounded-xl transition-colors">
                   <ChevronLeft size={20} />
                </button>
                <button onClick={handleCurrent} className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-colors ${isCurrent ? 'bg-primary text-white shadow-glow' : 'text-zinc-400 hover:text-white'}`}>
                   Current
                </button>
                <button onClick={handleNext} className="p-3 text-zinc-400 hover:text-white hover:bg-surface-2 rounded-xl transition-colors">
                   <ChevronRight size={20} />
                </button>
             </div>
          </div>

          {/* Grid */}
          {isLoading ? (
             <div className="flex flex-col items-center justify-center py-32 text-zinc-500 gap-4">
                <Loader2 size={40} className="animate-spin text-primary" />
                <p className="font-bold">Scanning Seasonal Frequencies...</p>
             </div>
          ) : error ? (
             <div className="text-center py-32 text-warning font-bold">{error}</div>
          ) : animeList.length === 0 ? (
             <div className="text-center py-32 text-zinc-500">
                <CalendarDays size={48} className="mx-auto mb-4 opacity-20" />
                <p className="font-bold text-lg text-white">No Seasonal Data Found</p>
                <p>The universe hasn't expanded this far yet.</p>
             </div>
          ) : (
             <>
               {isCurrent && <div className="mb-12"><WeeklySchedule /></div>}
               <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
                {animeList.map(anime => {
                   const ep = anime.nextAiringEpisode;
                   
                   return (
                      <AnimeCard3DWrapper key={anime.malId}>
                         <Link to={`/anime/${anime.malId}`} className="block relative group rounded-2xl overflow-hidden bg-surface-1 border border-white/5 hover:border-primary transition-all shadow-depth-1 flex flex-col h-full">
                            <div className="aspect-[2/3] w-full bg-surface-2 relative overflow-hidden shrink-0">
                               {anime.poster ? (
                                  <img src={anime.poster} alt={anime.title} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 group-hover:scale-110 transition-transform duration-700 ease-out" />
                               ) : (
                                  <div className="w-full h-full flex items-center justify-center text-sm font-bold text-zinc-600">No Image</div>
                               )}
                               
                               {/* Badges */}
                               <div className="absolute top-2 left-2 flex flex-col gap-1 z-10" style={{ transform: "translateZ(30px)" }}>
                                  {anime.score && (
                                     <span className="bg-void/80 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-warning border border-white/10 flex items-center gap-1 shadow-depth-1">
                                        <Sparkles size={10} /> {anime.score}
                                     </span>
                                  )}
                                  {ep && (
                                     <span className="bg-primary/90 backdrop-blur-md px-2 py-1 rounded text-[10px] font-bold text-white border border-white/20 shadow-depth-1">
                                        Ep {ep.episode}
                                     </span>
                                  )}
                               </div>
                            </div>
                            
                            <div className="p-4 flex-1 flex flex-col bg-gradient-to-t from-surface-1 to-surface-2 relative">
                               <h3 className="font-bold text-white text-sm line-clamp-2 mb-2 group-hover:text-primary transition-colors">{anime.title}</h3>
                               
                               <div className="mt-auto flex items-center justify-between text-xs text-zinc-500 font-medium">
                                  <span className="truncate">{anime.status}</span>
                                  <span>{anime.episodes ? `${anime.episodes} Eps` : '? Eps'}</span>
                               </div>
                            </div>
                         </Link>
                      </AnimeCard3DWrapper>
                   );
                })}
             </div>
             </>
          )}
       </div>
    </div>
  );
}

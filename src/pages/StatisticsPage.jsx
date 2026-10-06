import React, { useEffect, useState } from 'react';
import { Loader2, Tv, Clock, Calendar, BarChart3, ChevronRight } from 'lucide-react';
import { getIntelligenceData } from '../services/intelligence/intelligenceService';
import AnimeUniverse from '../components/intelligence/AnimeUniverse';
import AnimeDNA from '../components/intelligence/AnimeDNA';
import clsx from 'clsx';

export default function StatisticsPage() {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setIsLoading(true);
        const intData = await getIntelligenceData();
        setData(intData);
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!data || data.totalAnime === 0) {
    return (
      <div className="max-w-4xl mx-auto py-32 text-center">
        <h1 className="text-display-m font-bold text-white mb-4">Not enough data yet.</h1>
        <p className="text-zinc-400 text-body-l">Keep building your collection and your statistics will appear here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-24 pt-8">
      
      {/* 1. Statistics Hero */}
      <section className="text-center md:text-left">
         <h2 className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-4">Your Anime Journey</h2>
         <div className="flex flex-wrap gap-x-12 gap-y-8 items-baseline justify-center md:justify-start">
            <div className="flex flex-col">
               <span className="text-display-l font-bold text-white leading-none">{data.totalAnime}</span>
               <span className="text-zinc-400 font-medium mt-2">Anime</span>
            </div>
            <div className="flex flex-col">
               <span className="text-display-l font-bold text-white leading-none">{data.totalEpisodes}</span>
               <span className="text-zinc-400 font-medium mt-2">Episodes</span>
            </div>
            <div className="flex flex-col">
               <span className="text-display-l font-bold text-white leading-none flex items-baseline gap-1">
                 {data.watchHours} <span className="text-h3 text-zinc-500">hrs</span>
               </span>
               <span className="text-zinc-400 font-medium mt-2">Estimated Watch Time</span>
            </div>
            <div className="flex flex-col">
               <span className="text-display-l font-bold text-primary leading-none flex items-baseline gap-1">
                 {data.avgRating} <span className="text-h3 text-zinc-500">/10</span>
               </span>
               <span className="text-zinc-400 font-medium mt-2">Average Rating</span>
            </div>
         </div>
      </section>

      {/* 2. Anime Universe */}
      <section>
         <h2 className="text-h3 font-bold text-white mb-6">Anime Universe</h2>
         <AnimeUniverse nodes={data.nodes} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* 3. Anime DNA */}
         <section>
            <h2 className="text-h3 font-bold text-white mb-6">Anime DNA</h2>
            <AnimeDNA dna={data.dna} />
         </section>
         
         {/* 4. Insights & Status */}
         <section className="flex flex-col gap-8">
            <div className="bg-surface-1 rounded-[24px] border border-white/5 p-8 shadow-depth-4">
               <h3 className="text-h4 font-bold text-white mb-6 flex items-center gap-2">
                 <BarChart3 className="text-primary" size={20} /> Your Insights
               </h3>
               <ul className="space-y-4">
                  {data.insights.map((insight, i) => (
                     <li key={i} className="flex gap-3 text-body-m text-zinc-300 items-start">
                        <ChevronRight className="text-primary shrink-0 mt-0.5" size={18} />
                        <span>{insight}</span>
                     </li>
                  ))}
               </ul>
            </div>

            <div className="bg-surface-1 rounded-[24px] border border-white/5 p-8 shadow-depth-4 flex-1">
               <h3 className="text-h4 font-bold text-white mb-6 flex items-center gap-2">
                 <Tv className="text-primary" size={20} /> Collection Status
               </h3>
               <div className="space-y-4">
                  {Object.entries(data.statuses).filter(([_, count]) => count > 0).map(([status, count]) => (
                     <div key={status} className="flex justify-between items-center group">
                        <span className="text-zinc-400 group-hover:text-white transition-colors">{status}</span>
                        <div className="flex items-center gap-4">
                           <div className="w-32 h-1.5 bg-surface-3 rounded-full overflow-hidden hidden sm:block">
                              <div 
                                className={clsx("h-full rounded-full transition-all duration-1000", status === 'Completed' ? 'bg-success' : status === 'Watching' ? 'bg-warning' : 'bg-primary')} 
                                style={{ width: `${(count / data.totalAnime) * 100}%` }}
                              />
                           </div>
                           <span className="font-bold text-white w-8 text-right">{count}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>
         </section>
      </div>

      {/* 5. Watch Activity Graph */}
      <section>
         <h2 className="text-h3 font-bold text-white mb-6">Recent Watch Activity</h2>
         <div className="bg-surface-1 rounded-[24px] border border-white/5 p-8 shadow-depth-4 h-64 flex items-end gap-2 sm:gap-4 group">
            {data.chartData.length === 0 ? (
               <div className="w-full text-center text-zinc-500 mb-20">No recent watch sessions recorded.</div>
            ) : (
               data.chartData.map((d, i) => {
                  const height = Math.max(2, (d.episodes / data.maxChartEps) * 100);
                  return (
                     <div key={i} className="flex-1 flex flex-col justify-end items-center relative group/bar h-full">
                        <div className="absolute -top-12 opacity-0 group-hover/bar:opacity-100 transition-opacity bg-surface-3 border border-white/10 text-white text-xs py-1.5 px-3 rounded-lg shadow-depth-2 whitespace-nowrap z-10 pointer-events-none">
                           <strong className="text-primary">{d.episodes}</strong> eps on {d.date}
                        </div>
                        <div 
                           className="w-full bg-primary/40 hover:bg-primary rounded-t-sm transition-all duration-300"
                           style={{ height: `${height}%` }}
                        />
                        <div className="text-micro text-zinc-600 mt-3 truncate w-full text-center hidden sm:block">
                           {d.date.substring(5)}
                        </div>
                     </div>
                  );
               })
            )}
         </div>
      </section>

    </div>
  );
}

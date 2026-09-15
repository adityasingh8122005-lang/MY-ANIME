import { useState, useEffect } from 'react';
import { getGroupedCollection } from '../services/franchiseService';
import { getWatchHistory } from '../services/userService';
import { db } from '../services/db';
import { BarChart3, Clock, Tv, Calendar, Loader2 } from 'lucide-react';

export default function StatisticsPage() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const groupedCollection = await getGroupedCollection();
        const watchHistory = await db.watchHistory.toArray();

        // 1. Collection Breakdown (using grouped franchises)
        const collectionStats = {
          'Watching': 0, 'Plan to Watch': 0, 'Completed': 0, 'On Hold': 0, 'Dropped': 0, total: 0
        };
        groupedCollection.forEach(a => {
          if (collectionStats[a.personalStatus] !== undefined) {
            collectionStats[a.personalStatus]++;
          }
          collectionStats.total++;
        });

        // 2. Global Totals
        let totalEpisodesWatched = 0;
        groupedCollection.forEach(a => {
          totalEpisodesWatched += (a.totalWatched ?? a.episodesWatched ?? 0);
        });

        const totalWatchingSessions = watchHistory.length;

        // Estimated Watch Time
        // The Jikan duration string looks like "24 min per ep", "1 hr 13 min", "Unknown"
        // We only use the explicitly defined minutes. We do NOT fabricate missing durations.
        let totalMinutes = 0;
        let hasKnownDuration = false;
        groupedCollection.forEach(g => {
          // If it's a franchise, we iterate its seasons to get duration
          const items = g.isFranchise ? g.seasons : [g];
          items.forEach(a => {
            const watched = a.episodesWatched || 0;
            if (watched > 0 && a.metadata?.duration) {
              const minMatch = a.metadata.duration.match(/(\d+)\s*min/);
              const hrMatch = a.metadata.duration.match(/(\d+)\s*hr/);
              let mins = 0;
              if (hrMatch) mins += parseInt(hrMatch[1], 10) * 60;
              if (minMatch) mins += parseInt(minMatch[1], 10);
              
              if (mins > 0) {
                totalMinutes += (watched * mins);
                hasKnownDuration = true;
              }
            }
          });
        });
        
        const estWatchHours = hasKnownDuration ? (totalMinutes / 60).toFixed(1) : "Unavailable";

        // 3. Watch History Graph (Last 7 days of activity)
        // Group history by date
        const historyByDate = {};
        watchHistory.forEach(h => {
          if (!historyByDate[h.date]) historyByDate[h.date] = 0;
          historyByDate[h.date] += h.episodesWatched;
        });

        // Sort dates chronologically
        const sortedDates = Object.keys(historyByDate).sort();
        // Take the last 14 active days for the chart
        const recentDates = sortedDates.slice(-14);
        
        const chartData = recentDates.map(date => ({
          date,
          episodes: historyByDate[date]
        }));
        
        const maxChartEps = chartData.length > 0 ? Math.max(...chartData.map(d => d.episodes)) : 0;

        setStats({
          collectionStats,
          totalEpisodesWatched,
          totalWatchingSessions,
          estWatchHours,
          chartData,
          maxChartEps
        });
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    loadStats();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 size={32} className="animate-spin text-accent" />
      </div>
    );
  }

  if (!stats || stats.collectionStats.total === 0) {
    return (
      <div className="max-w-4xl mx-auto py-20 text-center border border-zinc-800 bg-dark-surface rounded-lg">
        <BarChart3 size={48} className="mx-auto text-zinc-600 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Not Enough Data</h1>
        <p className="text-zinc-400">Add some anime to your collection and record watch sessions to generate statistics.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2 mb-6">
        <BarChart3 className="text-accent" /> Personal Statistics
      </h1>

      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Tv size={14} /> Total Anime
          </div>
          <div className="text-3xl font-bold text-white">{stats.collectionStats.total}</div>
        </div>
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Tv size={14} /> Total Episodes
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalEpisodesWatched}</div>
        </div>
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Clock size={14} /> Watch Time (Est)
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.estWatchHours} {stats.estWatchHours !== "Unavailable" && <span className="text-lg text-zinc-500 font-normal">hrs</span>}
          </div>
        </div>
        <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
            <Calendar size={14} /> Watch Sessions
          </div>
          <div className="text-3xl font-bold text-white">{stats.totalWatchingSessions}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Collection Breakdown */}
        <div className="col-span-1 bg-dark-surface border border-zinc-800 rounded-lg p-6 flex flex-col">
          <h2 className="text-lg font-semibold text-white mb-6 border-b border-zinc-800 pb-2">Collection</h2>
          <div className="space-y-4 flex-1">
            {['Watching', 'Plan to Watch', 'Completed', 'On Hold', 'Dropped'].map(status => (
              <div key={status} className="flex justify-between items-center">
                <span className="text-zinc-400">{status}</span>
                <span className="font-bold text-white">{stats.collectionStats[status]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Watch History Graph */}
        <div className="col-span-1 md:col-span-2 bg-dark-surface border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-6 border-b border-zinc-800 pb-2">Recent Watch History</h2>
          
          {stats.chartData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-zinc-500">
              No recent watch sessions recorded.
            </div>
          ) : (
            <div className="h-48 flex items-end gap-2 md:gap-4 pt-4">
              {stats.chartData.map((data, i) => {
                const heightPercentage = Math.max(5, (data.episodes / stats.maxChartEps) * 100);
                return (
                  <div key={i} className="flex-1 flex flex-col justify-end items-center group relative">
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-dark-elevated border border-zinc-700 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-10 pointer-events-none">
                      {data.date}: {data.episodes} eps
                    </div>
                    {/* Bar */}
                    <div 
                      className="w-full bg-accent/80 hover:bg-accent rounded-t transition-all"
                      style={{ height: `${heightPercentage}%` }}
                    />
                    {/* Label */}
                    <div className="text-[10px] text-zinc-500 mt-2 truncate max-w-full hidden md:block">
                      {data.date.substring(5)} {/* MM-DD */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>



    </div>
  );
}

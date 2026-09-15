const fs = require('fs');
let code = fs.readFileSync('src/pages/StatisticsPage.jsx', 'utf8');

// Use getGroupedCollection for collectionStats
code = code.replace(
  "import { getAllUserAnime, getWatchHistory } from '../services/userService';",
  "import { getWatchHistory } from '../services/userService';\nimport { getGroupedCollection } from '../services/franchiseService';"
);

// Modify loadStats
const newLoadStats = `      try {
        const groupedCollection = await getGroupedCollection();
        const watchHistory = await getWatchHistory();

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
              const minMatch = a.metadata.duration.match(/(\\d+)\\s*min/);
              const hrMatch = a.metadata.duration.match(/(\\d+)\\s*hr/);
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
      } catch (err) {`;

code = code.replace(/      try \{[\s\S]*?      \} catch \(err\) \{/, newLoadStats);

// Remove the bottom section
const bottomSection = `      {/* Additional Stats */}
      <div className="bg-dark-surface border border-zinc-800 rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-2">Most Watched Anime</h3>
          <p className="text-xl font-bold text-white line-clamp-1">{stats.mostWatchedTitle}</p>
        </div>
        <div>
          <h3 className="text-zinc-500 text-sm font-semibold uppercase tracking-wider mb-2">Avg Episodes Per Session</h3>
          <p className="text-xl font-bold text-white">{stats.avgEpsPerSession} <span className="text-sm text-zinc-400 font-normal">episodes</span></p>
        </div>
      </div>`;
code = code.replace(bottomSection, "");

fs.writeFileSync('src/pages/StatisticsPage.jsx', code);

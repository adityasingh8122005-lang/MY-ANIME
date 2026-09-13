import 'fake-indexeddb/auto';
import { db } from './src/services/db.js';
import { updateUserAnime, addWatchHistory, getUserAnime } from './src/services/userService.js';

// Re-implement the stats calculation exactly as in StatisticsPage.jsx
async function runStatsCalculation() {
  const collection = await db.userAnime.toArray();
  const watchHistory = await db.watchHistory.toArray();

  let mostWatchedAnime = null;
  let maxEps = -1;
  collection.forEach(a => {
    if (a.episodesWatched !== undefined && a.episodesWatched > maxEps) {
      maxEps = a.episodesWatched;
      mostWatchedAnime = a;
    }
  });

  const totalEpisodesWatched = collection.reduce((sum, a) => sum + (a.episodesWatched || 0), 0);
  const totalWatchingSessions = watchHistory.length;
  const avgEpsPerSession = totalWatchingSessions > 0 
    ? (watchHistory.reduce((sum, h) => sum + h.episodesWatched, 0) / totalWatchingSessions).toFixed(1)
    : 0;
    
  const historyByDate = {};
  watchHistory.forEach(h => {
    if (!historyByDate[h.date]) historyByDate[h.date] = 0;
    historyByDate[h.date] += h.episodesWatched;
  });

  return {
    mostWatchedMalId: mostWatchedAnime?.malId,
    totalEpisodesWatched,
    avgEpsPerSession,
    historyByDate
  };
}

async function runTest() {
  await db.transaction('rw', db.userAnime, db.watchHistory, db.animeMetadata, async () => {
    await db.userAnime.clear();
    await db.watchHistory.clear();
    
    // Anime A: 10 episodes watched across 2 sessions (5+5)
    await updateUserAnime(1, { episodesWatched: 10 });
    await addWatchHistory(1, "2023-10-01", 5);
    await addWatchHistory(1, "2023-10-01", 5); // Same day test

    // Anime B: 25 episodes watched across 1 session
    await updateUserAnime(2, { episodesWatched: 25 });
    await addWatchHistory(2, "2023-10-02", 25);

    // Anime C: 5 episodes watched across 5 sessions
    await updateUserAnime(3, { episodesWatched: 5 });
    await addWatchHistory(3, "2023-10-03", 1);
    await addWatchHistory(3, "2023-10-04", 1);
    await addWatchHistory(3, "2023-10-05", 1);
    await addWatchHistory(3, "2023-10-06", 1);
    await addWatchHistory(3, "2023-10-07", 1);
  });

  const stats = await runStatsCalculation();
  console.log(stats);
  
  if (stats.totalEpisodesWatched === 40) console.log("✅ Total Episodes = 40");
  else console.error("❌ Total Episodes Failed");
  
  if (stats.mostWatchedMalId === 2) console.log("✅ Most Watched = Anime B (ID: 2)");
  else console.error("❌ Most Watched Failed");
  
  if (stats.avgEpsPerSession === "5.0") console.log("✅ Avg Eps/Session = 5.0");
  else console.error("❌ Avg Eps/Session Failed");
  
  if (stats.historyByDate["2023-10-01"] === 10) console.log("✅ Same Day Aggregation = 10 episodes on 2023-10-01");
  else console.error("❌ Same Day Aggregation Failed");
  
  process.exit(0);
}

runTest();

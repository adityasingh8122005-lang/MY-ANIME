import 'fake-indexeddb/auto';
import { db } from './src/services/db.js';
import { searchLocalAnime, searchJikanAnime } from './src/services/jikanApi.js';
import { updateUserAnime, addWatchHistory, getWatchHistory, exportUserData, importUserData, getAllUserAnime } from './src/services/userService.js';

async function runSmokeTest() {
  console.log("--- V1 SMOKE TEST ---");
  
  // Clean start
  await db.userAnime.clear();
  await db.animeMetadata.clear();
  await db.watchHistory.clear();
  
  // 1. ADD / TRACK
  await db.animeMetadata.put({
    malId: 100,
    title: "Smoke Test Anime",
    episodes: 24,
    status: "Finished Airing"
  });
  
  await updateUserAnime(100, {
    personalStatus: 'Watching',
    episodesWatched: 12,
    personalRating: 9
  });
  
  const userAnime = await db.userAnime.get(100);
  if (userAnime.episodesWatched === 12 && userAnime.personalRating === 9) {
    console.log("✅ TRACK: Status and progress tracked successfully.");
  } else {
    console.error("❌ TRACK failed");
  }

  // 2. HISTORY
  await addWatchHistory(100, "2023-11-01", 3);
  const history = await getWatchHistory(100);
  if (history.length === 1 && history[0].episodesWatched === 3) {
    console.log("✅ HISTORY: Watch history recorded.");
  } else {
    console.error("❌ HISTORY failed");
  }
  
  // 3. BACKUP
  const exported = await exportUserData();
  const backup = JSON.parse(exported);
  if (backup.data.userAnime.length === 1 && backup.data.watchHistory.length === 1) {
    console.log("✅ BACKUP: Export structure is correct.");
  } else {
    console.error("❌ BACKUP Export failed");
  }
  
  await db.userAnime.clear();
  await db.watchHistory.clear();
  
  await importUserData(backup);
  const restored = await getAllUserAnime(true);
  if (restored.length === 1 && restored[0].episodesWatched === 12) {
    console.log("✅ BACKUP: Import/Restore successful.");
  } else {
    console.error("❌ BACKUP Import failed");
  }

  // 4. NEW SEASON (Metadata update preserves personal data)
  await db.animeMetadata.put({
    malId: 100,
    title: "Smoke Test Anime: The Final Season", // Title updated
    episodes: 36, // Increased
    status: "Currently Airing"
  });
  
  const verifiedMetadataUpdate = await getAllUserAnime(true);
  if (verifiedMetadataUpdate[0].episodesWatched === 12 && verifiedMetadataUpdate[0].metadata.episodes === 36) {
    console.log("✅ NEW SEASON: Metadata update preserved personal progress.");
  } else {
    console.error("❌ NEW SEASON failed");
  }

  console.log("--- SMOKE TEST COMPLETE ---");
}

runSmokeTest();

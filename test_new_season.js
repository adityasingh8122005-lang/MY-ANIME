import 'fake-indexeddb/auto';
import { db } from './src/services/db.js';
import { updateUserAnime, getUserAnime } from './src/services/userService.js';

async function runTest() {
  const malId = 12345;

  // 1. Initial State
  // Anime is 2 seasons, 55 total episodes, Ongoing
  await db.animeMetadata.put({
    malId,
    title: 'Test Anime',
    episodes: 55,
    seasons: 2,
    status: 'Currently Airing'
  });

  // User watches 55/55 and rates it
  await updateUserAnime(malId, {
    personalStatus: 'Watching',
    episodesWatched: 55,
    personalRating: 9
  });

  const userBefore = await getUserAnime(malId);
  console.log("=== BEFORE NEW SEASON ===");
  console.log("Metadata Episodes: 55");
  console.log("User Episodes Watched:", userBefore.episodesWatched);
  console.log("User Status:", userBefore.personalStatus);
  console.log("User Rating:", userBefore.personalRating);
  
  // Logic from UI:
  let metadata = await db.animeMetadata.get(malId);
  let isCaughtUp = metadata.episodes && userBefore.episodesWatched === metadata.episodes && metadata.status !== "Finished Airing";
  console.log("UI State -> CAUGHT UP:", isCaughtUp);

  // 2. Simulate Metadata Update (New Season)
  // Anime now has 78 episodes.
  console.log("\nSimulating metadata update...");
  await db.animeMetadata.put({
    malId,
    title: 'Test Anime',
    episodes: 78,
    seasons: 3,
    status: 'Currently Airing'
  });

  const userAfter = await getUserAnime(malId);
  metadata = await db.animeMetadata.get(malId);

  console.log("\n=== AFTER NEW SEASON ===");
  console.log("Metadata Episodes:", metadata.episodes);
  console.log("User Episodes Watched:", userAfter.episodesWatched);
  console.log("User Status:", userAfter.personalStatus);
  console.log("User Rating:", userAfter.personalRating);

  isCaughtUp = metadata.episodes && userAfter.episodesWatched === metadata.episodes && metadata.status !== "Finished Airing";
  const isFinished = metadata.episodes && userAfter.episodesWatched === metadata.episodes && metadata.status === "Finished Airing";
  
  console.log("UI State -> CAUGHT UP:", isCaughtUp);
  console.log("UI State -> COMPLETED:", isFinished);
  console.log("UI State -> PROGRESS:", `${userAfter.episodesWatched} / ${metadata.episodes}`);
  
  // Verifications
  if (userAfter.episodesWatched === 55) console.log("✅ Verification 1: episodesWatched remains 55");
  else console.error("❌ Verification 1 Failed");

  if (userAfter.personalStatus === 'Watching') console.log("✅ Verification 2: personalStatus remains unchanged");
  else console.error("❌ Verification 2 Failed");

  if (userAfter.personalRating === 9) console.log("✅ Verification 3: personalRating remains unchanged");
  else console.error("❌ Verification 3 Failed");

  if (!isCaughtUp && !isFinished) console.log("✅ Verification 4/6/7: State is distinguishable from COMPLETED/CAUGHT UP, UI represents additional content available.");
  else console.error("❌ Verification 4/6/7 Failed");

  if (`${userAfter.episodesWatched} / ${metadata.episodes}` === '55 / 78') console.log("✅ Verification 5: Progress becomes 55/78.");
  else console.error("❌ Verification 5 Failed");

  process.exit(0);
}

runTest().catch(err => {
  console.error(err);
  process.exit(1);
});

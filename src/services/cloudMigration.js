import { db } from './db.js';
import { supabase } from './supabase.js';

export async function migrateLocalToCloud(userId) {
  try {
    const localAnime = await db.userAnime.toArray();
    const localHistory = await db.watchHistory.toArray();
    const localMetadata = await db.animeMetadata.toArray();
    const localFranchises = await db.franchises.toArray();

    if (localAnime.length === 0 && localFranchises.length === 0) {
      console.log("No local data to migrate.");
      return;
    }

    console.log("Starting cloud migration...");

    // 1. Migrate Metadata
    for (const meta of localMetadata) {
      await supabase.from('anime_metadata').upsert({
        mal_id: meta.malId,
        title: meta.title,
        english_title: meta.englishTitle,
        poster: meta.poster,
        episodes: meta.episodes,
        status: meta.status,
        duration: meta.duration
      }, { onConflict: 'mal_id' });
    }

    // 2. Migrate Franchises
    for (const f of localFranchises) {
      await supabase.from('franchises').upsert({
        franchise_id: f.franchiseId,
        franchise_name: f.franchiseName,
        poster: f.poster,
        seasons: f.seasons // jsonb
      }, { onConflict: 'franchise_id' });
    }

    // 3. Migrate User Anime
    for (const ua of localAnime) {
      await supabase.from('user_anime').upsert({
        user_id: userId,
        mal_id: ua.malId,
        personal_status: ua.personalStatus,
        episodes_watched: ua.episodesWatched,
        personal_rating: ua.personalRating,
        franchise_id: ua.franchiseId,
        added_at: ua.addedAt,
        updated_at: ua.updatedAt
      }, { onConflict: 'user_id,mal_id' });
    }

    // 4. Migrate Watch History
    for (const h of localHistory) {
      // Need to avoid duplicate entries since history has no unique constraint other than ID.
      // We'll just insert it. To prevent re-inserting on every login, we clear local DB after success.
      await supabase.from('watch_history').insert({
        user_id: userId,
        mal_id: h.malId,
        date: h.date,
        episodes_watched: h.episodesWatched
      });
    }

    console.log("Migration complete. Clearing local DB to prevent duplicates.");
    await db.transaction('rw', db.userAnime, db.watchHistory, db.animeMetadata, db.franchises, async () => {
      await db.userAnime.clear();
      await db.watchHistory.clear();
      await db.animeMetadata.clear();
      await db.franchises.clear();
    });

  } catch (err) {
    console.error("Migration failed:", err);
  }
}

import { db } from './db.js';

/**
 * Gets a user's personal tracking data for a specific anime
 */
export async function getUserAnime(malId) {
  return await db.userAnime.get(Number(malId));
}

/**
 * Gets all anime in the user's personal collection, optionally joined with metadata
 */
export async function getAllUserAnime(withMetadata = true) {
  const userList = await db.userAnime.toArray();
  
  if (!withMetadata) return userList;

  // Join with metadata
  const metadataMap = new Map();
  const malIds = userList.map(u => u.malId);
  
  // Bulk get metadata
  const metadataList = await db.animeMetadata.where('malId').anyOf(malIds).toArray();
  metadataList.forEach(m => metadataMap.set(m.malId, m));
  
  return userList.map(u => ({
    ...u,
    metadata: metadataMap.get(u.malId) || null
  }));
}

/**
 * Updates or adds an anime to the personal collection
 */
export async function updateUserAnime(malId, updates) {
  const id = Number(malId);
  const existing = await getUserAnime(id);
  
  const now = new Date().toISOString();
  
  if (existing) {
    const updated = {
      ...existing,
      ...updates,
      updatedAt: now
    };
    await db.userAnime.put(updated);
    return updated;
  } else {
    const fresh = {
      malId: id,
      personalStatus: 'Plan to Watch',
      episodesWatched: 0,
      personalRating: null,
      addedAt: now,
      updatedAt: now,
      ...updates
    };
    await db.userAnime.put(fresh);
    return fresh;
  }
}

/**
 * Removes an anime from the personal collection
 */
export async function removeUserAnime(malId) {
  await db.userAnime.delete(Number(malId));
}

/**
 * Adds a manual watch history entry
 */
export async function addWatchHistory(malId, date, episodesWatched) {
  return await db.watchHistory.add({
    malId: Number(malId),
    date,
    episodesWatched: Number(episodesWatched)
  });
}

/**
 * Updates a specific watch history entry
 */
export async function updateWatchHistory(id, date, episodesWatched) {
  return await db.watchHistory.update(Number(id), {
    date,
    episodesWatched: Number(episodesWatched)
  });
}

/**
 * Deletes a specific watch history entry
 */
export async function deleteWatchHistory(id) {
  return await db.watchHistory.delete(Number(id));
}

/**
 * Gets watch history for a specific anime
 */
export async function getWatchHistory(malId) {
  return await db.watchHistory.where('malId').equals(Number(malId)).reverse().sortBy('date');
}

/**
 * Exports user data to a JSON string
 */
export async function exportUserData() {
  const userAnime = await db.userAnime.toArray();
  const watchHistory = await db.watchHistory.toArray();
  
  return JSON.stringify({
    version: 1,
    exportDate: new Date().toISOString(),
    data: {
      userAnime,
      watchHistory
    }
  });
}

/**
 * Imports user data from a parsed JSON object
 */
export async function importUserData(parsedData) {
  if (!parsedData || !parsedData.data) throw new Error("Invalid backup format");
  
  await db.transaction('rw', db.userAnime, db.watchHistory, async () => {
    if (parsedData.data.userAnime) {
      await db.userAnime.bulkPut(parsedData.data.userAnime);
    }
    if (parsedData.data.watchHistory) {
      await db.watchHistory.bulkPut(parsedData.data.watchHistory);
    }
  });
}

/**
 * Clears all user data from the local database
 */
export async function clearAllUserData() {
  await db.transaction('rw', db.userAnime, db.watchHistory, db.animeMetadata, db.franchises, async () => {
    await db.userAnime.clear();
    await db.watchHistory.clear();
    await db.animeMetadata.clear();
    await db.franchises.clear();
  });
}

/**
 * Removes only anime that were added without metadata (the "Unknown" ones)
 */
export async function removeUnknownAnime() {
  const userList = await db.userAnime.toArray();
  const metadataMap = new Map();
  const malIds = userList.map(u => u.malId);
  
  const metadataList = await db.animeMetadata.where('malId').anyOf(malIds).toArray();
  metadataList.forEach(m => metadataMap.set(m.malId, m));
  
  const idsToDelete = [];
  for (const u of userList) {
    if (!metadataMap.has(u.malId)) {
      idsToDelete.push(u.malId);
    }
  }
  
  if (idsToDelete.length > 0) {
    await db.userAnime.bulkDelete(idsToDelete);
  }
  return idsToDelete.length;
}

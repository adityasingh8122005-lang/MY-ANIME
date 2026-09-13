import Dexie from 'dexie';

export const db = new Dexie('MyAnimeDB');

// Phase 1: Clean metadata schema. Title search is done efficiently using simple substring or Dexie's standard features where possible.
// Dexie doesn't have built-in full-text search easily without tokens, but we will fetch from Jikan for full search, and cache locally.
// We can index `title` for basic exact matches, or just fetch all locally and filter in memory since the local list will be small initially.
db.version(1).stores({
  animeMetadata: 'malId, title', // malId is PK.
  userAnime: 'malId, personalStatus', // Phase 2 setup
  watchHistory: '++id, malId, date' // Phase 4 setup
});

import { db } from './db.js';

export async function addFranchiseToDb(franchiseData, initialStatus = "Plan to Watch") {
  const { franchiseId, franchiseName, poster, seasons } = franchiseData;
  
  await db.franchises.put({
    franchiseId,
    franchiseName,
    poster,
    seasons: seasons.map(s => ({ malId: s.malId, title: s.title, canonEpisodes: s.canonEpisodes, format: s.format }))
  });

  for (const season of seasons) {
    // Add metadata
    await db.animeMetadata.put({
      malId: season.malId,
      title: season.title,
      englishTitle: season.title,
      poster: season.poster || poster,
      episodes: season.episodes,
      status: "Unknown" // Since we fetch from AniList, we might not have full Jikan status here
    });

    // Add to user collection
    const existing = await db.userAnime.get(season.malId);
    if (!existing) {
      await db.userAnime.put({
        malId: season.malId,
        personalStatus: initialStatus,
        episodesWatched: 0,
        personalRating: null,
        updatedAt: new Date().toISOString(),
        franchiseId
      });
    } else if (!existing.franchiseId) {
      await db.userAnime.update(season.malId, { franchiseId });
    }
  }
}

export async function getFranchises() {
  return await db.franchises.toArray();
}

export async function getFranchiseWithProgress(franchiseId) {
  const franchise = await db.franchises.get(franchiseId);
  if (!franchise) return null;

  const userAnimes = await db.userAnime.where({ franchiseId }).toArray();
  const progressMap = new Map();
  userAnimes.forEach(ua => progressMap.set(ua.malId, ua));

  let totalCanon = 0;
  let totalWatched = 0;

  const enrichedSeasons = franchise.seasons.map(s => {
    const user = progressMap.get(s.malId) || { episodesWatched: 0 };
    // Cap watched to canon episodes if they watched filler? 
    // Actually, episodesWatched tracks their absolute watched count for that season.
    const watched = Math.min(user.episodesWatched || 0, s.canonEpisodes || s.episodes || 0);
    
    totalCanon += (s.canonEpisodes || s.episodes || 0);
    totalWatched += watched;

    return {
      ...s,
      episodesWatched: user.episodesWatched || 0
    };
  });

  return {
    ...franchise,
    totalCanon,
    totalWatched,
    seasons: enrichedSeasons
  };
}

export async function getGroupedCollection() {
  const userAnimes = await db.userAnime.toArray();
  const allFranchises = await db.franchises.toArray();
  const metadataMap = new Map();
  const metadataList = await db.animeMetadata.toArray();
  metadataList.forEach(m => metadataMap.set(m.malId, m));

  const groups = new Map();

  for (const ua of userAnimes) {
    const meta = metadataMap.get(ua.malId);
    if (ua.franchiseId) {
      if (!groups.has(ua.franchiseId)) {
        const f = allFranchises.find(x => x.franchiseId === ua.franchiseId);
        groups.set(ua.franchiseId, {
          isFranchise: true,
          franchiseId: ua.franchiseId,
          title: f?.franchiseName || meta?.title || "Unknown Franchise",
          poster: f?.poster || meta?.poster,
          seasons: [],
          totalCanon: 0,
          totalWatched: 0,
          updatedAt: ua.updatedAt
        });
      }
      const g = groups.get(ua.franchiseId);
      // find season canon eps
      const f = allFranchises.find(x => x.franchiseId === ua.franchiseId);
      const sData = f?.seasons?.find(s => s.malId === ua.malId);
      
      const canon = sData?.canonEpisodes || meta?.episodes || 0;
      const watched = Math.min(ua.episodesWatched || 0, canon);
      
      g.totalCanon += canon;
      g.totalWatched += watched;
      g.seasons.push({ ...ua, metadata: meta, canonEpisodes: canon });
      
      if (new Date(ua.updatedAt) > new Date(g.updatedAt)) {
        g.updatedAt = ua.updatedAt;
      }
    } else {
      // Legacy item
      groups.set(`legacy_${ua.malId}`, {
        isFranchise: false,
        malId: ua.malId,
        title: meta?.title || "Unknown",
        poster: meta?.poster,
        episodesWatched: ua.episodesWatched,
        canonEpisodes: meta?.episodes || 0,
        personalStatus: ua.personalStatus,
        personalRating: ua.personalRating,
        updatedAt: ua.updatedAt,
        metadata: meta
      });
    }
  }

  return Array.from(groups.values());
}

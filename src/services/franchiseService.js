import { supabase } from './supabase.js';
import { getAllUserAnime } from './userService.js';


// Hardcoded fallback for existing database entries that lack the field
const KNOWN_CANON_MOVIES = [40456, 52742, 16870, 48561, 36946, 51552, 59192, 62546, 62547];

export async function addFranchiseToDb(franchiseData, initialStatus = "Plan to Watch") {
  const { franchiseId, franchiseName, poster, seasons } = franchiseData;
  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) return;
  
  // Upsert the franchise info (global)
  await supabase.from('franchises').upsert({
    franchise_id: franchiseId,
    franchise_name: franchiseName,
    poster: poster,
    seasons: seasons.map(s => ({ malId: s.malId, title: s.title, canonEpisodes: s.canonEpisodes, format: s.format, status: s.status, movieCanonStatus: s.movieCanonStatus, startDate: s.startDate }))
  }, { onConflict: 'franchise_id' });

  // Update user collection and global metadata
  for (const season of seasons) {
    
    let mappedStatus = "Unknown";
    if (season.status === 'RELEASING' || season.status === 'Currently Airing') mappedStatus = 'Releasing';
    else if (season.status === 'FINISHED' || season.status === 'Finished Airing') mappedStatus = 'Finished Airing';
    else if (season.status === 'NOT_YET_RELEASED' || season.status === 'Not yet aired') mappedStatus = 'Not yet aired';

    await supabase.from('anime_metadata').upsert({
      mal_id: season.malId,
      title: season.title,
      english_title: season.title,
      poster: season.poster || poster,
      episodes: season.episodes,
      status: mappedStatus
    }, { onConflict: 'mal_id' });

    // Add to user collection
    const { data: existing } = await supabase.from('user_anime').select('*').eq('user_id', userId).eq('mal_id', season.malId).maybeSingle();
    
    if (!existing) {
      await supabase.from('user_anime').insert({
        user_id: userId,
        mal_id: season.malId,
        personal_status: initialStatus,
        episodes_watched: 0,
        franchise_id: franchiseId,
        added_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    } else if (!existing.franchise_id) {
      await supabase.from('user_anime').update({ franchise_id: franchiseId }).eq('user_id', userId).eq('mal_id', season.malId);
    }
  }
}

export async function getFranchises() {
  const { data, error } = await supabase.from('franchises').select('*');
  if (error) return [];
  return data.map(f => ({
    franchiseId: f.franchise_id,
    franchiseName: f.franchise_name,
    poster: f.poster,
    seasons: f.seasons
  }));
}

export async function getFranchiseWithProgress(franchiseId) {
  const { data: franchise } = await supabase.from('franchises').select('*').eq('franchise_id', franchiseId).single();
  if (!franchise) return null;

  const fObj = {
    franchiseId: franchise.franchise_id,
    franchiseName: franchise.franchise_name,
    poster: franchise.poster,
    seasons: franchise.seasons
  };

  const { data: { session } } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  let userAnimes = [];
  if (userId) {
    const { data } = await supabase.from('user_anime').select('*').eq('user_id', userId).eq('franchise_id', franchiseId);
    if (data) userAnimes = data;
  }

  const progressMap = new Map();
  userAnimes.forEach(ua => progressMap.set(ua.mal_id, ua));

  let totalCanon = 0;
  let totalWatched = 0;
  let totalEpisodes = 0;
  let totalWatchedAll = 0;

  const filteredSeasons = fObj.seasons.filter(s => s.format !== 'SPECIAL' && s.format !== 'OVA');
  const enrichedSeasons = filteredSeasons.map(s => {
    const user = progressMap.get(s.malId) || { episodes_watched: 0 };
    let canonStatus = s.movieCanonStatus;
    if (!canonStatus && s.format === "MOVIE" && KNOWN_CANON_MOVIES.includes(s.malId)) canonStatus = "CANON";
    const isNonCanonMovie = s.format === "MOVIE" && canonStatus !== "CANON";
    const maxCanon = isNonCanonMovie ? 0 : (s.canonEpisodes || s.episodes || 0);
    const watched = maxCanon > 0 ? Math.min(user.episodes_watched || 0, maxCanon) : (user.episodes_watched || 0);
    
    totalCanon += maxCanon;
    totalWatched += watched;
    const seasonTotal = s.episodes || maxCanon;
    totalEpisodes += seasonTotal;
    totalWatchedAll += (user.episodes_watched || 0);

    return {
      ...s,
      movieCanonStatus: canonStatus,
      episodesWatched: watched
    };
  });

  return {
    ...fObj,
    totalCanon,
    totalWatched,
    totalEpisodes,
    totalWatchedAll,
    seasons: enrichedSeasons
  };
}

export async function getGroupedCollection(showNonCanonMovies = false) {
  const userAnimes = await getAllUserAnime(true); // this already camelCases and includes metadata
  if (!userAnimes || userAnimes.length === 0) return [];

  const allFranchises = await getFranchises();
  const groups = new Map();

  for (const ua of userAnimes) {
    const meta = ua.metadata;
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
          totalEpisodes: 0,
          totalWatchedAll: 0,
          updatedAt: ua.updatedAt
        });
      }
      const g = groups.get(ua.franchiseId);
      const f = allFranchises.find(x => x.franchiseId === ua.franchiseId);
      const sData = f?.seasons?.find(s => s.malId === ua.malId);
      
      // Skip SPECIALs entirely
      if (sData?.format === 'SPECIAL' || meta?.format === 'SPECIAL') continue;
      
      const isMovie = sData?.format === "MOVIE" || meta?.format === "MOVIE";
      let canonStatus = sData?.movieCanonStatus;
      if (!canonStatus && isMovie && KNOWN_CANON_MOVIES.includes(ua.malId)) canonStatus = "CANON";
      const isNonCanonMovie = isMovie && canonStatus !== "CANON";
      if (isNonCanonMovie && !showNonCanonMovies) continue;

      const canon = isNonCanonMovie ? 0 : (sData?.canonEpisodes || meta?.episodes || 0);
      const watched = canon > 0 ? Math.min(ua.episodesWatched || 0, canon) : (ua.episodesWatched || 0);
      
      g.totalCanon += canon;
      g.totalWatched += watched;
      const seasonTotal = meta?.episodes || canon;
      g.totalEpisodes += seasonTotal;
      g.totalWatchedAll += (ua.episodesWatched || 0);
      g.seasons.push({ ...ua, metadata: meta, canonEpisodes: canon, episodesWatched: watched });
      
      if (new Date(ua.updatedAt) > new Date(g.updatedAt)) {
        g.updatedAt = ua.updatedAt;
      }
    } else {
      if (meta?.format === "SPECIAL") continue;
      // We don't have movieCanonStatus natively for legacy, but if it's MOVIE we assume UNKNOWN -> hide if setting is off.
      if (meta?.format === "MOVIE" && !showNonCanonMovies) continue;
      groups.set(`legacy_${ua.malId}`, {
        isFranchise: false,
        malId: ua.malId,
        title: meta?.title || "Unknown",
        poster: meta?.poster,
        episodesWatched: ua.episodesWatched || 0,
        totalEpisodes: meta?.episodes || 0,
        totalWatchedAll: ua.episodesWatched || 0,
        canonEpisodes: meta?.episodes || 0,
        personalStatus: ua.personalStatus,
        personalRating: ua.personalRating,
        updatedAt: ua.updatedAt,
        metadata: meta
      });
    }
  }

  const result = Array.from(groups.values());
  for (const g of result) {
    if (g.isFranchise) {
      if ((g.totalEpisodes > 0 && g.totalWatchedAll >= g.totalEpisodes) || (g.totalCanon > 0 && g.totalWatched >= g.totalCanon)) {
        g.personalStatus = 'Completed';
      } else if (g.totalWatched > 0) {
        g.personalStatus = 'Watching';
      } else {
        g.personalStatus = 'Plan to Watch';
      }
      
      const f = allFranchises.find(x => x.franchiseId === g.franchiseId);
      g.airStatus = determineFranchiseAirStatus(f, g);
      
      // Find nearest upcoming episode across all seasons in the franchise
      const upcoming = g.seasons
         .filter(s => s.metadata?.nextAiringEpisode?.airingAt)
         .map(s => s.metadata.nextAiringEpisode)
         .sort((a,b) => a.airingAt - b.airingAt);
      if (upcoming.length > 0) {
         g.nextAiringEpisode = upcoming[0];
      }
    } else {
      g.airStatus = determineFranchiseAirStatus(null, g);
      if (g.metadata?.nextAiringEpisode?.airingAt) {
         g.nextAiringEpisode = g.metadata.nextAiringEpisode;
      }
    }
  }
  return result;
}


export async function autoHealUnknownMetadata() {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;

  const { data: userAnimes } = await supabase.from('user_anime').select('mal_id').eq('user_id', session.user.id);
  if (!userAnimes) return;

  const malIds = userAnimes.map(u => u.mal_id);
  if (malIds.length === 0) return;
  const { data: metadataList } = await supabase.from('anime_metadata').select('mal_id, status').in('mal_id', malIds).eq('status', 'Unknown');
  
  if (!metadataList || metadataList.length === 0) return;

  // We have some unknown metadata. Let's fix them.
  console.log('Auto-healing metadata for', metadataList.length, 'items');
  const idsToFix = metadataList.map(m => m.mal_id);
  
  // Fetch from AniList in batches of 50
  for (let i = 0; i < idsToFix.length; i += 50) {
    const batch = idsToFix.slice(i, i + 50);
    const query = `
      query ($idIn: [Int]) {
        Page {
          media(idMal_in: $idIn, type: ANIME) {
            idMal
            status
          }
        }
      }
    `;
    
    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { idIn: batch } })
      });
      const json = await response.json();
      const mediaList = json.data?.Page?.media || [];
      
      for (const media of mediaList) {
        let mappedStatus = "Finished Airing";
        if (media.status === 'RELEASING') mappedStatus = 'Releasing';
        else if (media.status === 'NOT_YET_RELEASED') mappedStatus = 'Not yet aired';
        
        await supabase.from('anime_metadata').update({ status: mappedStatus }).eq('mal_id', media.idMal);
      }
    } catch (e) {
      console.error('Auto-heal failed', e);
    }
  }
}

export async function autoHealFranchiseDates() {
  const { data: franchises } = await supabase.from('franchises').select('*');
  if (!franchises) return;
  
  const malIdsToFetch = new Set();
  const franchisesToUpdate = [];

  for (const f of franchises) {
    if (!f.seasons) continue;
    let needsHeal = false;
    for (const s of f.seasons) {
      if (s.startDate === undefined) {
        needsHeal = true;
        malIdsToFetch.add(s.malId);
      }
    }
    if (needsHeal) franchisesToUpdate.push(f);
  }

  if (malIdsToFetch.size === 0) return;
  
  const idsArray = Array.from(malIdsToFetch);
  const dateMap = new Map();
  
  // Batch fetch from AniList
  for (let i = 0; i < idsArray.length; i += 50) {
    const batch = idsArray.slice(i, i + 50);
    const query = `
      query ($idIn: [Int]) {
        Page {
          media(idMal_in: $idIn, type: ANIME) {
            idMal
            startDate { year month day }
          }
        }
      }
    `;
    try {
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { idIn: batch } })
      });
      const json = await response.json();
      const mediaList = json.data?.Page?.media || [];
      for (const media of mediaList) {
        dateMap.set(media.idMal, media.startDate);
      }
    } catch (e) {
      console.error('Auto-heal dates failed', e);
      return;
    }
  }

  // Update franchises
  for (const f of franchisesToUpdate) {
    let updated = false;
    const newSeasons = f.seasons.map(s => {
      if (s.startDate === undefined && dateMap.has(s.malId)) {
        updated = true;
        return { ...s, startDate: dateMap.get(s.malId) };
      }
      return s;
    });
    
    if (updated) {
      await supabase.from('franchises').update({ seasons: newSeasons }).eq('franchise_id', f.franchise_id);
    }
  }
}

export async function autoSyncStaleData() {
  const lastSync = localStorage.getItem('lastStaleDataSync');
  const now = Date.now();
  // Sync once every 24 hours
  if (lastSync && now - parseInt(lastSync) < 24 * 60 * 60 * 1000) return;
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  
  console.log("Running daily stale data sync for statuses...");
  
  try {
    const { data: userAnimes } = await supabase.from('user_anime').select('mal_id').eq('user_id', session.user.id);
    if (!userAnimes || userAnimes.length === 0) return;
    
    // We will sync ALL metadata rows that belong to this user
    const malIds = userAnimes.map(u => u.mal_id);
    const { data: metadataList } = await supabase.from('anime_metadata').select('mal_id, status').in('mal_id', malIds);
    
    // Also sync all franchises' seasons
    const { data: franchises } = await supabase.from('franchises').select('franchise_id, seasons');
    
    const allMalIdsToFetch = new Set(metadataList?.map(m => m.mal_id) || []);
    if (franchises) {
      for (const f of franchises) {
        if (f.seasons) {
          f.seasons.forEach(s => allMalIdsToFetch.add(s.malId));
        }
      }
    }
    
    const idsArray = Array.from(allMalIdsToFetch);
    if (idsArray.length === 0) return;
    
    const latestStatusMap = new Map();
    
    for (let i = 0; i < idsArray.length; i += 50) {
      const batch = idsArray.slice(i, i + 50);
      const query = `
        query ($idIn: [Int]) {
          Page {
            media(idMal_in: $idIn, type: ANIME) {
              idMal
              status
            }
          }
        }
      `;
      const response = await fetch('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { idIn: batch } })
      });
      const json = await response.json();
      const mediaList = json.data?.Page?.media || [];
      for (const media of mediaList) {
        latestStatusMap.set(media.idMal, media.status);
      }
    }
    
    // Update anime_metadata if changed
    if (metadataList) {
      for (const meta of metadataList) {
        const freshStatus = latestStatusMap.get(meta.mal_id);
        if (freshStatus) {
          let mapped = 'Finished Airing';
          if (freshStatus === 'RELEASING') mapped = 'Releasing';
          else if (freshStatus === 'NOT_YET_RELEASED') mapped = 'Not yet aired';
          
          if (meta.status !== mapped) {
            await supabase.from('anime_metadata').update({ status: mapped }).eq('mal_id', meta.mal_id);
          }
        }
      }
    }
    
    // Update franchises if changed
    if (franchises) {
      for (const f of franchises) {
        let changed = false;
        if (!f.seasons) continue;
        const newSeasons = f.seasons.map(s => {
          const freshStatus = latestStatusMap.get(s.malId);
          if (freshStatus && s.status !== freshStatus) {
            changed = true;
            return { ...s, status: freshStatus };
          }
          return s;
        });
        if (changed) {
          await supabase.from('franchises').update({ seasons: newSeasons }).eq('franchise_id', f.franchise_id);
        }
      }
    }
    
    localStorage.setItem('lastStaleDataSync', now.toString());
    console.log("Stale data sync complete.");
  } catch (err) {
    console.error("Failed to sync stale data", err);
  }
}

export async function autoRebuildFranchises() {
  const lastRebuild = localStorage.getItem('lastFranchiseRebuild');
  const now = Date.now();
  // Rebuild once every 7 days
  if (lastRebuild && now - parseInt(lastRebuild) < 7 * 24 * 60 * 60 * 1000) return;
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return;
  
  console.log("Running weekly franchise rebuild...");
  
  try {
    const { data: franchises } = await supabase.from('franchises').select('franchise_id');
    if (!franchises || franchises.length === 0) return;
    
    const { getFranchiseData } = await import('./franchiseApi');
    
    // We will rebuild 1 franchise every 2 seconds to avoid rate limits on client side
    let i = 0;
    const processNext = async () => {
      if (i >= franchises.length) {
        localStorage.setItem('lastFranchiseRebuild', now.toString());
        console.log("Weekly franchise rebuild complete.");
        return;
      }
      const f = franchises[i];
      const rootId = f.franchise_id.replace('franchise_', '');
      try {
        const freshData = await getFranchiseData(rootId);
        if (freshData && freshData.seasons) {
          await supabase.from('franchises').update({ seasons: freshData.seasons }).eq('franchise_id', f.franchise_id);
        }
      } catch (e) {
        console.error("Failed to rebuild", f.franchise_id, e);
      }
      
      i++;
      setTimeout(processNext, 2000); // 2 second delay between requests
    };
    
    processNext();
    
  } catch (err) {
    console.error("Failed to rebuild franchises", err);
  }
}


export function determineFranchiseAirStatus(f, g) {
  if (g.isFranchise) {
      let hasOngoing = false;
      let hasHiatus = false;
      let hasNotYetAired = false;
      let hasCancelled = false;
      let hasFinished = false;

      const checkStatus = (status) => {
        if (!status) return;
        const s = status.toUpperCase();
        if (s.includes('RELEASING') || s.includes('ONGOING') || s.includes('CURRENTLY AIRING')) hasOngoing = true;
        else if (s.includes('HIATUS')) hasHiatus = true;
        else if (s.includes('NOT_YET_RELEASED') || s.includes('NOT YET AIRED')) hasNotYetAired = true;
        else if (s.includes('CANCELLED')) hasCancelled = true;
        else if (s.includes('FINISHED')) hasFinished = true;
      };

      if (f && f.seasons) {
        for (const season of f.seasons) {
          checkStatus(season.status);
          if (season.sourceOngoing === true) hasOngoing = true;
        }
      }
      
      for (const season of g.seasons) {
        if (season.metadata) checkStatus(season.metadata.status);
      }
      
      if (g.franchiseId === 'franchise_44511') hasOngoing = true; // Chainsaw Man override

      if (hasOngoing || (hasFinished && hasNotYetAired)) return 'Ongoing';
      else if (hasHiatus) return 'Hiatus';
      else if (hasNotYetAired) return 'Not Yet Aired';
      else if (hasCancelled) return 'Cancelled';
      else if (hasFinished) return 'Finished';
      else return 'Unknown';
  } else {
      let status = g.metadata?.status?.toUpperCase() || 'UNKNOWN';
      if (status.includes('RELEASING') || status.includes('ONGOING')) return 'Ongoing';
      else if (status.includes('HIATUS')) return 'Hiatus';
      else if (status.includes('NOT_YET_RELEASED') || status.includes('NOT YET AIRED')) return 'Not Yet Aired';
      else if (status.includes('CANCELLED')) return 'Cancelled';
      else if (status.includes('FINISHED')) return 'Finished';
      else return 'Unknown';
  }
}

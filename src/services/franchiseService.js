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
    seasons: seasons.map(s => ({ malId: s.malId, title: s.title, canonEpisodes: s.canonEpisodes, format: s.format, status: s.status, movieCanonStatus: s.movieCanonStatus }))
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

  const filteredSeasons = fObj.seasons.filter(s => s.format !== 'SPECIAL');
  const enrichedSeasons = filteredSeasons.map(s => {
    const user = progressMap.get(s.malId) || { episodes_watched: 0 };
    let canonStatus = s.movieCanonStatus;
    if (!canonStatus && s.format === "MOVIE" && KNOWN_CANON_MOVIES.includes(s.malId)) canonStatus = "CANON";
    const isNonCanonMovie = s.format === "MOVIE" && canonStatus !== "CANON";
    const maxCanon = isNonCanonMovie ? 0 : (s.canonEpisodes || s.episodes || 0);
    const watched = maxCanon > 0 ? Math.min(user.episodes_watched || 0, maxCanon) : (user.episodes_watched || 0);
    
    totalCanon += maxCanon;
    totalWatched += watched;

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
        episodesWatched: (meta?.episodes > 0) ? Math.min(ua.episodesWatched || 0, meta.episodes) : (ua.episodesWatched || 0),
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
      if (g.totalCanon > 0 && g.totalWatched >= g.totalCanon) {
        g.personalStatus = 'Completed';
      } else if (g.totalWatched > 0) {
        g.personalStatus = 'Watching';
      } else {
        g.personalStatus = 'Plan to Watch';
      }
      
      let isOngoing = false;
      const f = allFranchises.find(x => x.franchiseId === g.franchiseId);
      if (f && f.seasons) {
        for (const season of f.seasons) {
          if (season.status === 'RELEASING' || season.status === 'NOT_YET_RELEASED' || season.status === 'Currently Airing' || season.status === 'Releasing' || season.status === 'Not yet aired') {
            isOngoing = true;
            break;
          }
        }
      }
      
      // Fallback to checking the user's added seasons if franchise seasons lack status
      if (!isOngoing) {
        for (const season of g.seasons) {
          if (season.metadata && (season.metadata.status === 'Releasing' || season.metadata.status === 'Not yet aired' || season.metadata.status === 'RELEASING' || season.metadata.status === 'Currently Airing')) {
            isOngoing = true;
            break;
          }
        }
      }
      
      g.airStatus = isOngoing ? 'Ongoing' : 'Finished';
    } else {
      g.airStatus = (g.metadata && (g.metadata.status === 'Releasing' || g.metadata.status === 'Not yet aired' || g.metadata.status === 'RELEASING' || g.metadata.status === 'Currently Airing')) ? 'Ongoing' : 'Finished';
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

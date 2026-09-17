import { supabase } from './supabase.js';
import { getAllUserAnime } from './userService.js';

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
    seasons: seasons.map(s => ({ malId: s.malId, title: s.title, canonEpisodes: s.canonEpisodes, format: s.format }))
  }, { onConflict: 'franchise_id' });

  // Update user collection and global metadata
  for (const season of seasons) {
    await supabase.from('anime_metadata').upsert({
      mal_id: season.malId,
      title: season.title,
      english_title: season.title,
      poster: season.poster || poster,
      episodes: season.episodes,
      status: "Unknown"
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
    const isNonCanonMovie = s.format === "MOVIE" && s.movieCanonStatus !== "CANON";
    const maxCanon = isNonCanonMovie ? 0 : (s.canonEpisodes || s.episodes || 0);
    const watched = maxCanon > 0 ? Math.min(user.episodes_watched || 0, maxCanon) : (user.episodes_watched || 0);
    
    totalCanon += maxCanon;
    totalWatched += watched;

    return {
      ...s,
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
      
      const isNonCanonMovie = (sData?.format === "MOVIE" || meta?.format === "MOVIE") && sData?.movieCanonStatus !== "CANON";
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
      for (const season of g.seasons) {
        if (season.metadata && (season.metadata.status === 'Releasing' || season.metadata.status === 'Not yet aired' || season.metadata.status === 'Unknown')) {
          isOngoing = true;
          break;
        }
      }
      g.airStatus = isOngoing ? 'Ongoing' : 'Finished';
    } else {
      g.airStatus = (g.metadata && (g.metadata.status === 'Releasing' || g.metadata.status === 'Not yet aired')) ? 'Ongoing' : 'Finished';
    }
  }
  return result;
}

import { supabase } from './supabase.js';

// Helper to map DB snake_case to JS camelCase
function mapToCamelCase(row) {
  if (!row) return null;
  return {
    ...row,
    malId: row.mal_id,
    personalStatus: row.personal_status,
    episodesWatched: row.episodes_watched,
    personalRating: row.personal_rating,
    franchiseId: row.franchise_id,
    addedAt: row.added_at,
    updatedAt: row.updated_at
  };
}

// Get the current logged-in user ID
async function getUserId() {
  const { data } = await supabase.auth.getSession();
  return data?.session?.user?.id;
}

export async function getUserAnime(malId) {
  const userId = await getUserId();
  if (!userId) return null;
  
  const { data, error } = await supabase
    .from('user_anime')
    .select('*')
    .eq('user_id', userId)
    .eq('mal_id', Number(malId))
    .maybeSingle();
    
  if (error) console.error(error);
  return mapToCamelCase(data);
}

export async function getAllUserAnime(withMetadata = true) {
  const userId = await getUserId();
  if (!userId) return [];

  const { data: userAnimes, error } = await supabase
    .from('user_anime')
    .select('*')
    .eq('user_id', userId);
    
  if (error) {
    console.error(error);
    return [];
  }

  const camelList = userAnimes.map(mapToCamelCase);

  if (!withMetadata || camelList.length === 0) return camelList;

  const malIds = camelList.map(u => u.malId);
  const { data: metadataList } = await supabase
    .from('anime_metadata')
    .select('*')
    .in('mal_id', malIds);

  const metadataMap = new Map();
  if (metadataList) {
    metadataList.forEach(m => {
      metadataMap.set(m.mal_id, {
        malId: m.mal_id,
        title: m.title,
        englishTitle: m.english_title,
        poster: m.poster,
        episodes: m.episodes,
        status: m.status,
        duration: m.duration
      });
    });
  }

  return camelList.map(u => ({
    ...u,
    metadata: metadataMap.get(u.malId) || null
  }));
}

export async function updateUserAnime(malId, updates) {
  const userId = await getUserId();
  if (!userId) return null;

  const existing = await getUserAnime(malId);
  const now = new Date().toISOString();
  
  const payload = {
    user_id: userId,
    mal_id: Number(malId),
    updated_at: now
  };

  if (updates.personalStatus !== undefined) payload.personal_status = updates.personalStatus;
  if (updates.episodesWatched !== undefined) payload.episodes_watched = updates.episodesWatched;
  if (updates.personalRating !== undefined) payload.personal_rating = updates.personalRating;
  if (updates.franchiseId !== undefined) payload.franchise_id = updates.franchiseId;

  if (existing) {
    const { data, error } = await supabase
      .from('user_anime')
      .update(payload)
      .eq('user_id', userId)
      .eq('mal_id', Number(malId))
      .select()
      .single();
    if (error) throw error;
    return mapToCamelCase(data);
  } else {
    payload.added_at = now;
    payload.personal_status = payload.personal_status || 'Plan to Watch';
    payload.episodes_watched = payload.episodes_watched || 0;
    
    const { data, error } = await supabase
      .from('user_anime')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return mapToCamelCase(data);
  }
}

export async function removeUserAnime(malId) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase
    .from('user_anime')
    .delete()
    .eq('user_id', userId)
    .eq('mal_id', Number(malId));
}

export async function addWatchHistory(malId, date, episodesWatched) {
  const userId = await getUserId();
  if (!userId) return;
  const { data } = await supabase
    .from('watch_history')
    .insert({
      user_id: userId,
      mal_id: Number(malId),
      date,
      episodes_watched: Number(episodesWatched)
    })
    .select()
    .single();
  return data;
}

export async function updateWatchHistory(id, date, episodesWatched) {
  const userId = await getUserId();
  if (!userId) return;
  const { data } = await supabase
    .from('watch_history')
    .update({
      date,
      episodes_watched: Number(episodesWatched)
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();
  return data;
}

export async function deleteWatchHistory(id) {
  const userId = await getUserId();
  if (!userId) return;
  await supabase
    .from('watch_history')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);
}

export async function getWatchHistory(malId) {
  const userId = await getUserId();
  if (!userId) return [];
  let query = supabase
    .from('watch_history')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });
    
  if (malId) {
    query = query.eq('mal_id', Number(malId));
  }
  
  const { data, error } = await query;
  if (error) return [];
  return data.map(h => ({
    ...h,
    malId: h.mal_id,
    episodesWatched: h.episodes_watched
  }));
}

export async function getAllWatchHistory() {
  return getWatchHistory();
}

// Stubs for legacy import/export
export async function exportUserData() {
  return JSON.stringify({ error: "Export is now handled via cloud." });
}
export async function importUserData(parsedData) {}

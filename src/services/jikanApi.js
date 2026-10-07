import { db } from './db.js';

const ANILIST_URL = 'https://graphql.anilist.co';

async function fetchWithTimeout(resource, options = {}) {
  const { timeout = 8000 } = options;
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetchWithTimeout(resource, { ...options, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}


/**
 * Normalizes AniList API response into our internal metadata structure.
 * We continue using MAL IDs internally so it doesn't break existing user data!
 */
function normalizeAnilistData(media) {
  return {
    malId: media.idMal, // Crucial: We only accept anime that have a MAL ID
    title: media.title.english || media.title.romaji,
    alternativeTitles: [media.title.romaji].filter(Boolean),
    japaneseTitle: media.title.native,
    episodes: media.episodes,
    status: (function(s) {
      if (s === 'RELEASING') return 'Ongoing';
      if (s === 'FINISHED') return 'Finished';
      if (s === 'NOT_YET_RELEASED') return 'Not Yet Aired';
      if (s === 'CANCELLED') return 'Cancelled';
      if (s === 'HIATUS') return 'Hiatus';
      return 'Unknown';
    })(media.status),
    score: media.averageScore ? (media.averageScore / 10).toFixed(2) : null,
    synopsis: media.description ? media.description.replace(/<[^>]*>?/gm, '') : 'No synopsis available.',
    poster: media.coverImage?.large,
    genres: media.genres || [],
    themes: [], // AniList uses tags which are too numerous, keeping this empty
    malUrl: media.idMal ? `https://myanimelist.net/anime/${media.idMal}` : null,
    year: media.seasonYear,
    season: media.season ? media.season.toLowerCase() : null
  };
}

/**
 * Searches anime in the local database first.
 */
export async function searchLocalAnime(query) {
  if (!query || query.trim().length < 3) return [];
  const lowerQuery = query.toLowerCase();
  
  const allLocal = await db.animeMetadata.toArray();
  return allLocal.filter(a => 
    a.title?.toLowerCase().includes(lowerQuery) || 
    a.alternativeTitles?.some(t => t.toLowerCase().includes(lowerQuery)) ||
    a.japaneseTitle?.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Core fetcher for AniList GraphQL
 */
async function fetchAnilist(query, variables) {
  const res = await fetchWithTimeout(ANILIST_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({ query, variables })
  });
  
  if (!res.ok) throw new Error('AniList API error');
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}

/**
 * Searches AniList for anime and filters out any that don't have a MAL ID.
 * (We keep the function name searchJikanAnime so we don't break other files)
 */
export async function searchJikanAnime(query, filters = {}) {
  // If no query and no filters, return empty
  if ((!query || query.trim().length < 3) && Object.keys(filters).length === 0) return [];
  
  const graphqlQuery = `
    query($search: String, $genre_in: [String], $format_in: [MediaFormat], $status: MediaStatus, $averageScore_greater: Int, $episodes_greater: Int, $episodes_lesser: Int) {
      Page(page: 1, perPage: 50) {
        media(search: $search, genre_in: $genre_in, format_in: $format_in, status: $status, averageScore_greater: $averageScore_greater, episodes_greater: $episodes_greater, episodes_lesser: $episodes_lesser, type: ANIME) {
          idMal
          title { english romaji native }
          episodes
          status
          averageScore
          description
          coverImage { large }
          genres
          season
          seasonYear
          nextAiringEpisode { airingAt episode }
        }
      }
    }
  `;

  const variables = {};
  if (query && query.trim().length >= 3) variables.search = query;
  if (filters.genre) variables.genre_in = [filters.genre];
  if (filters.format) variables.format_in = [filters.format];
  if (filters.status) variables.status = filters.status;
  if (filters.score) variables.averageScore_greater = parseInt(filters.score, 10);
  
  if (filters.episodes) {
     if (filters.episodes === 'short') variables.episodes_lesser = 14;
     if (filters.episodes === 'medium') { variables.episodes_greater = 11; variables.episodes_lesser = 27; }
     if (filters.episodes === 'long') variables.episodes_greater = 26;
  }

  const data = await fetchAnilist(graphqlQuery, variables);
  
  // Only keep results that have a MAL ID to preserve database integrity
  const rawResults = data.Page.media.filter(m => m.idMal != null);
  const results = rawResults.map(m => ({ ...normalizeAnilistData(m), nextAiringEpisode: m.nextAiringEpisode || null }));

  // Cache new results in Dexie
  await db.animeMetadata.bulkPut(results);

  return results;
}

/**
 * Get details for a specific anime by MAL ID using AniList.
 */
const inflightAnimeDetails = new Map();

export async function getAnimeDetails(malId) {
  if (inflightAnimeDetails.has(malId)) {
     return inflightAnimeDetails.get(malId);
  }
  
  const promise = (async () => {
    const local = await db.animeMetadata.get(Number(malId));
    // If we have local data but it's an ongoing/upcoming show missing schedule data, force an AniList check
    if (local && (local.status === 'Ongoing' || local.status === 'Not Yet Aired') && !local.nextAiringEpisode && !local._scheduleChecked) {
        try {
           const alRes = await fetchWithTimeout('https://graphql.anilist.co', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                 query: `query($idMal: Int) { Media(idMal: $idMal, type: ANIME) { nextAiringEpisode { episode airingAt timeUntilAiring } } }`,
                 variables: { idMal: Number(malId) }
              })
           });
           if (alRes.ok) {
              const alJson = await alRes.json();
              if (alJson.data?.Media?.nextAiringEpisode) {
                 local.nextAiringEpisode = alJson.data.Media.nextAiringEpisode;
              }
              local._scheduleChecked = Date.now();
              await db.animeMetadata.put(local);
           }
        } catch (e) {}
    }
    if (local) return local;

    const res = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${malId}/full`);
    if (!res.ok) throw new Error("Failed to fetch anime details from Jikan");
    const json = await res.json();
    const j = json.data;

    let bannerImage = null;
    try {
       const alRes = await fetchWithTimeout('https://graphql.anilist.co', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
             query: `query($idMal: Int) { Media(idMal: $idMal, type: ANIME) { bannerImage coverImage { large } nextAiringEpisode { episode airingAt timeUntilAiring } } }`,
             variables: { idMal: Number(malId) }
          })
       });
       if (alRes.ok) {
          const alJson = await alRes.json();
          bannerImage = alJson.data?.Media?.bannerImage || alJson.data?.Media?.coverImage?.large;
          if (alJson.data?.Media?.nextAiringEpisode) {
             j.nextAiringEpisode = alJson.data.Media.nextAiringEpisode;
          }
       }
    } catch (e) {
       console.log("AniList enrichment failed, ignoring", e);
    }

    let s = j.status ? j.status.toUpperCase() : 'UNKNOWN';
    let mappedStatus = 'Unknown';
    if (s.includes('AIRING') || s.includes('CURRENTLY AIRING')) mappedStatus = 'Ongoing';
    else if (s.includes('FINISHED') || s.includes('COMPLETED')) mappedStatus = 'Finished';
    else if (s.includes('NOT YET AIRED')) mappedStatus = 'Not Yet Aired';

    const normalized = {
      malId: j.mal_id,
      title: j.title_english || j.title,
      alternativeTitles: [j.title, j.title_english, j.title_japanese].filter(Boolean),
      japaneseTitle: j.title_japanese,
      episodes: j.episodes,
      status: mappedStatus,
      score: j.score ? j.score.toString() : null,
      synopsis: j.synopsis || 'No synopsis available.',
      poster: j.images?.webp?.large_image_url || j.images?.jpg?.large_image_url,
      bannerImage: bannerImage || j.images?.webp?.large_image_url,
      genres: j.genres ? j.genres.map(g => g.name) : [],
      themes: j.themes ? j.themes.map(t => t.name) : [],
      malUrl: j.url,
      year: j.year || null,
      season: j.season || null,
      duration: j.duration || null,
      nextAiringEpisode: j.nextAiringEpisode || null
    };
    
    await db.animeMetadata.put(normalized);
    return normalized;
  })();

  inflightAnimeDetails.set(malId, promise);
  try {
     return await promise;
  } finally {
     inflightAnimeDetails.delete(malId);
  }
}

/**
 * Get episodes for a specific anime.
 * Since AniList doesn't provide a strict episode list API like Jikan, 
 * we dynamically generate the list based on the total episode count.
 */
export async function getAnimeEpisodes(malId, maxWatched = 0) {
  const details = await getAnimeDetails(malId);
  const safeEps = (details.episodes === 1 && details.status === "Unknown") ? null : details.episodes;
  
  // If we don't know the total episodes, we only show up to what they've watched + 1 (the next episode)
  const totalEps = safeEps || Math.max(1, maxWatched + 1);
  
  const episodesList = [];
  for (let i = 1; i <= totalEps; i++) {
    episodesList.push({
      mal_id: i,
      title: `Episode ${i}`,
      filler: false,
      recap: false
    });
  }

  try {
    const res = await fetchWithTimeout(`https://api.jikan.moe/v4/anime/${malId}/episodes`);
    if (res.ok) {
      const json = await res.json();
      if (json.data && json.data.length > 0) {
        json.data.forEach(ep => {
           const index = ep.mal_id - 1;
           if (episodesList[index]) {
              episodesList[index].title = ep.title || `Episode ${ep.mal_id}`;
              episodesList[index].aired = ep.aired;
              episodesList[index].filler = ep.filler || false;
              episodesList[index].recap = ep.recap || false;
           }
        });
      }
    }
  } catch (e) {
    console.log("Jikan episodes fetch failed, using pure dynamic placeholders.");
  }

  return episodesList;
}


// Phase 10: Seasonal & Release Radar Support

export async function getSeasonalAnime(season, year, page = 1) {
  const query = `
    query($season: MediaSeason, $seasonYear: Int, $page: Int) {
      Page(page: $page, perPage: 50) {
        media(season: $season, seasonYear: $seasonYear, type: ANIME, sort: POPULARITY_DESC) {
          idMal
          title { english romaji native }
          episodes
          status
          averageScore
          description
          coverImage { large }
          genres
          season
          seasonYear
          nextAiringEpisode {
            airingAt
            timeUntilAiring
            episode
          }
        }
      }
    }
  `;
  
  const variables = { season, seasonYear: year, page };
  const data = await fetchAnilist(query, variables);
  
  const rawResults = data.Page.media.filter(m => m.idMal != null);
  return rawResults.map(m => {
     const normalized = normalizeAnilistData(m);
     return { ...normalized, nextAiringEpisode: m.nextAiringEpisode };
  });
}

export async function getAiringSchedule(malIds) {
  if (!malIds || malIds.length === 0) return [];
  
  // Anilist limits array inputs, so chunking might be needed if > 50, but we assume max 50 for personal airing radar.
  const query = `
    query($idMalIn: [Int]) {
      Page(page: 1, perPage: 50) {
        media(idMal_in: $idMalIn, type: ANIME, status: RELEASING) {
          idMal
          title { english romaji }
          status
          episodes
          coverImage { large }
          nextAiringEpisode {
            airingAt
            episode
          }
        }
      }
    }
  `;
  
  const variables = { idMalIn: malIds };
  const data = await fetchAnilist(query, variables);
  
  const rawResults = data.Page.media.filter(m => m.idMal != null);
  return rawResults.map(m => {
     const normalized = normalizeAnilistData(m);
     return { ...normalized, nextAiringEpisode: m.nextAiringEpisode };
  });
}


export async function syncMissingMetadata(malIds) {
  if (!malIds || malIds.length === 0) return;
  
  // Chunk array into groups of 40 to stay within Anilist limits
  const chunks = [];
  for (let i = 0; i < malIds.length; i += 40) {
    chunks.push(malIds.slice(i, i + 40));
  }

  for (const chunk of chunks) {
    try {
      const query = `
        query($idMalIn: [Int]) {
          Page(page: 1, perPage: 50) {
            media(idMal_in: $idMalIn, type: ANIME) {
              idMal
              title { english romaji native }
              episodes
              status
              averageScore
              description
              coverImage { large }
              bannerImage
              genres
              season
              seasonYear
              nextAiringEpisode { airingAt episode }
            }
          }
        }
      `;
      
      const alRes = await fetchWithTimeout('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables: { idMalIn: chunk } })
      });
      
      if (alRes.ok) {
        const json = await alRes.json();
        if (json.data && json.data.Page && json.data.Page.media) {
           const bulk = json.data.Page.media.filter(m => m.idMal != null).map(m => {
              let s = m.status ? m.status.toUpperCase() : 'UNKNOWN';
              let mappedStatus = 'Unknown';
              if (s === 'RELEASING') mappedStatus = 'Ongoing';
              else if (s === 'FINISHED') mappedStatus = 'Finished';
              else if (s === 'NOT_YET_RELEASED') mappedStatus = 'Not Yet Aired';
              else if (s === 'CANCELLED') mappedStatus = 'Cancelled';
              else if (s === 'HIATUS') mappedStatus = 'Hiatus';
              
              return {
                malId: m.idMal,
                title: m.title.english || m.title.romaji,
                alternativeTitles: [m.title.romaji].filter(Boolean),
                japaneseTitle: m.title.native,
                episodes: m.episodes,
                status: mappedStatus,
                score: m.averageScore ? (m.averageScore / 10).toFixed(2) : null,
                synopsis: m.description ? m.description.replace(/<[^>]*>?/gm, '') : 'No synopsis available.',
                poster: m.coverImage?.large,
                bannerImage: m.bannerImage || m.coverImage?.large,
                genres: m.genres || [],
                themes: [],
                malUrl: `https://myanimelist.net/anime/${m.idMal}`,
                year: m.seasonYear || null,
                season: m.season ? m.season.toLowerCase() : null,
                nextAiringEpisode: m.nextAiringEpisode || null
              };
           });
           
           if (bulk.length > 0) {
              await db.animeMetadata.bulkPut(bulk);
           }
        }
      }
    } catch (e) {
      console.log("Failed to sync chunk of missing metadata", e);
    }
  }
}


export async function getWeeklySchedule(startUnix, endUnix) {
  let allSchedules = [];
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage && page <= 20) { // Cap at 5 pages to prevent infinite loops
    try {
      const query = `
        query($airingAt_greater: Int, $airingAt_lesser: Int, $page: Int) {
          Page(page: $page, perPage: 50) {
            pageInfo { hasNextPage }
            airingSchedules(airingAt_greater: $airingAt_greater, airingAt_lesser: $airingAt_lesser, sort: TIME) {
              id
              airingAt
              episode
              media {
                idMal
                title { english romaji native }
                coverImage { large }
                status
              }
            }
          }
        }
      `;
      
      const variables = { airingAt_greater: startUnix, airingAt_lesser: endUnix, page };
      const res = await fetchWithTimeout('https://graphql.anilist.co', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, variables })
      });
      
      if (!res.ok) throw new Error("Anilist schedule fetch failed");
      const json = await res.json();
      
      if (json.data?.Page?.airingSchedules) {
        const mapped = json.data.Page.airingSchedules
          .filter(s => s.media && s.media.idMal)
          .map(s => ({
            id: s.id,
            airingAt: s.airingAt,
            episode: s.episode,
            malId: s.media.idMal,
            title: s.media.title.english || s.media.title.romaji,
            poster: s.media.coverImage?.large,
            status: s.media.status
          }));
        allSchedules = allSchedules.concat(mapped);
      }
      
      hasNextPage = json.data?.Page?.pageInfo?.hasNextPage || false;
      page++;
    } catch (e) {
      console.log("Failed to fetch weekly schedule page", page, e);
      hasNextPage = false;
    }
  }
  
  
  // Deduplicate records based on airingSchedule.id
  const seen = new Set();
  const deduplicated = [];
  for (const s of allSchedules) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      deduplicated.push(s);
    }
  }
  return deduplicated;
}

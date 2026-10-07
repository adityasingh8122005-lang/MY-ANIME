import { db } from './db.js';

const ANILIST_URL = 'https://graphql.anilist.co';

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
  const res = await fetch(ANILIST_URL, {
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
  const results = rawResults.map(normalizeAnilistData);

  // Cache new results in Dexie
  await db.animeMetadata.bulkPut(results);

  return results;
}

/**
 * Get details for a specific anime by MAL ID using AniList.
 */
export async function getAnimeDetails(malId) {
  const local = await db.animeMetadata.get(Number(malId));
  if (local) return local;

  const graphqlQuery = `
    query($idMal: Int) {
      Media(idMal: $idMal, type: ANIME) {
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
      }
    }
  `;

  const data = await fetchAnilist(graphqlQuery, { idMal: Number(malId) });
  const normalized = normalizeAnilistData(data.Media);
  
  await db.animeMetadata.put(normalized);
  return normalized;
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
    const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}/episodes`);
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

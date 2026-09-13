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
    status: media.status ? media.status.replace(/_/g, ' ') : 'Unknown',
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
export async function searchJikanAnime(query) {
  if (!query || query.trim().length < 3) return [];
  
  const graphqlQuery = `
    query($search: String) {
      Page(page: 1, perPage: 15) {
        media(search: $search, type: ANIME, format_in: [TV, TV_SHORT, MOVIE]) {
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

  const data = await fetchAnilist(graphqlQuery, { search: query });
  
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
export async function getAnimeEpisodes(malId) {
  const details = await getAnimeDetails(malId);
  const totalEps = details.episodes || 12; // Fallback to 12 if unknown
  
  const episodesList = [];
  for (let i = 1; i <= totalEps; i++) {
    episodesList.push({
      mal_id: i,
      title: `Episode ${i}`
    });
  }
  return episodesList;
}

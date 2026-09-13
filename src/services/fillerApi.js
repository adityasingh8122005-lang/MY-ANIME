/**
 * Anime Filler List API Interface
 * 
 * Note: Anime Filler List currently does NOT offer a public, legitimate JSON API.
 * Scraping their HTML is fragile and unpermitted.
 * This service interface is built so it can be seamlessly integrated in the future 
 * if a legitimate structured data source becomes available.
 */

// Supported Episode Classifications:
export const FILLER_STATUS = {
  CANON: 'Canon',
  FILLER: 'Filler',
  MIXED: 'Mixed Canon/Filler',
  ANIME_CANON: 'Anime Canon',
  UNKNOWN: 'Unknown'
};

/**
 * Attempts to map a MAL ID to a Filler Data Source ID.
 * Since no reliable mapping exists currently, this returns null.
 */
export async function getFillerSourceMapping(malId) {
  // TODO: Implement legitimate MAL -> AnimeFillerList mapping when available
  return null;
}

/**
 * Gets episode-level filler classifications for an anime.
 * Always returns UNKNOWN currently to prevent data fabrication.
 * 
 * Future return format:
 * {
 *   1: FILLER_STATUS.CANON,
 *   2: FILLER_STATUS.FILLER,
 *   ...
 * }
 */
export async function getEpisodeFillerData(malId) {
  const mapping = await getFillerSourceMapping(malId);
  if (!mapping) {
    return null; // Signals data unavailable
  }
  
  // Future implementation here...
  return null;
}

/**
 * Helper to determine the status of a specific episode safely.
 */
export function getSingleEpisodeFillerStatus(fillerData, episodeNumber) {
  if (!fillerData || !fillerData[episodeNumber]) {
    return FILLER_STATUS.UNKNOWN;
  }
  return fillerData[episodeNumber];
}

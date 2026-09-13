/**
 * IMDb API Interface
 * 
 * Note: IMDb does NOT offer a free public JSON API. Official bulk TSV files are 
 * too large for client-side processing, and mapping MAL IDs to IMDb IDs is notoriously unreliable.
 * This service interface prepares the architecture for future legitimate integration.
 */

/**
 * Attempts to map a MAL ID to an IMDb ID.
 * Returns null as reliable mapping without a dedicated backend database is currently impossible.
 */
export async function getImdbMapping(malId) {
  // TODO: Implement legitimate MAL -> IMDb mapping when available
  return null;
}

/**
 * Gets the overall IMDb rating for a mapped anime.
 * 
 * @returns {Promise<number|null>} The IMDb score (1-10) or null if unavailable.
 */
export async function getImdbRating(malId) {
  const imdbId = await getImdbMapping(malId);
  if (!imdbId) {
    return null; // Signals data unavailable
  }
  
  // Future implementation here...
  return null;
}

/**
 * Gets episode-level ratings for an IMDb show.
 * Marked as NO-GO in V1 specs due to architectural limits.
 */
export async function getImdbEpisodeRatings(malId) {
  return null;
}

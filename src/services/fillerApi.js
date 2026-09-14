/**
 * Anime Filler List API Interface
 * Fetches from our custom Vercel Serverless Backend to bypass CORS and Cloudflare.
 */

export const FILLER_STATUS = {
  CANON: 'Canon',
  FILLER: 'Filler',
  MIXED: 'Mixed Canon/Filler',
  ANIME_CANON: 'Anime Canon',
  UNKNOWN: 'Unknown'
};

export async function getAnimeFillerStats(title, englishTitle) {
  try {
    const params = new URLSearchParams();
    if (title) params.append('title', title);
    if (englishTitle) params.append('englishTitle', englishTitle);
    
    // In dev mode, this hits the Vite proxy or absolute URL if configured.
    // In production on Vercel, this hits the serverless function.
    const res = await fetch(`/api/filler?${params.toString()}`);
    if (!res.ok) return null;
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("Failed to fetch filler stats from backend", err);
    return null;
  }
}

export async function getFillerSourceMapping(malId) { return null; }
export async function getEpisodeFillerData(malId) { return null; }
export function getSingleEpisodeFillerStatus(fillerData, episodeNumber) { return FILLER_STATUS.UNKNOWN; }

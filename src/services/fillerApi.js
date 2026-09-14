/**
 * Anime Filler List API Interface
 * Scrapes animefillerlist.com via a CORS proxy to get canon/filler counts.
 */

export const FILLER_STATUS = {
  CANON: 'Canon',
  FILLER: 'Filler',
  MIXED: 'Mixed Canon/Filler',
  ANIME_CANON: 'Anime Canon',
  UNKNOWN: 'Unknown'
};

export async function getAnimeFillerStats(title, englishTitle) {
  const trySlug = async (str) => {
    if (!str) return null;
    const slug = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    try {
      const res = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://www.animefillerlist.com/shows/' + slug)}`);
      if (!res.ok) return null;
      const data = await res.json();
      if (!data.contents || data.contents.includes("Page not found")) return null;
      return parseFillerHtml(data.contents);
    } catch(e) {
      return null;
    }
  }

  let result = await trySlug(englishTitle);
  if (!result) result = await trySlug(title);
  
  if (!result && englishTitle && englishTitle.includes('Season')) {
     result = await trySlug(englishTitle.split('Season')[0].trim());
  }
  
  return result;
}

function parseFillerHtml(html) {
  const extractCount = (className) => {
    const sectionRegex = new RegExp(`class="${className}"[\\s\\S]*?class="Episodes">([\\s\\S]*?)<\\/span>`, 'i');
    const match = html.match(sectionRegex);
    if (!match) return 0;
    
    const ranges = match[1].match(/>\\s*(\\d+(?:-\\d+)?)\\s*</g);
    if (!ranges) return 0;
    
    let count = 0;
    for (let r of ranges) {
      const text = r.replace(/[><]/g, '').trim();
      if (text.includes('-')) {
        const [start, end] = text.split('-').map(Number);
        count += (end - start + 1);
      } else {
        count += 1;
      }
    }
    return count;
  };

  const mangaCanon = extractCount('manga_canon');
  const mixed = extractCount('mixed_canon\\\\/filler');
  const filler = extractCount('filler');
  const animeCanon = extractCount('anime_canon');

  const total = mangaCanon + mixed + filler + animeCanon;
  if (total === 0) return null;

  return {
    canon: mangaCanon + animeCanon,
    mixed,
    filler,
    total,
    fillerPercentage: Math.round((filler / total) * 100),
    canonPercentage: Math.round(((mangaCanon + animeCanon) / total) * 100)
  };
}

export async function getFillerSourceMapping(malId) { return null; }
export async function getEpisodeFillerData(malId) { return null; }
export function getSingleEpisodeFillerStatus(fillerData, episodeNumber) { return FILLER_STATUS.UNKNOWN; }

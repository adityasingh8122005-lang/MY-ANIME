export default async function handler(req, res) {
  // Setup CORS just in case
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )
  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  const { title, englishTitle } = req.query;

  const trySlug = async (str) => {
    if (!str) return null;
    const slug = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    try {
      const response = await fetch(`https://www.animefillerlist.com/shows/${slug}`, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5'
        }
      });
      
      if (!response.ok) return null;
      const html = await response.text();
      if (!html || html.includes("Page not found")) return null;
      
      return parseFillerHtml(html);
    } catch(e) {
      console.error(e);
      return null;
    }
  }

  let result = await trySlug(englishTitle);
  if (!result) result = await trySlug(title);
  
  if (!result && englishTitle && englishTitle.includes('Season')) {
     result = await trySlug(englishTitle.split('Season')[0].trim());
  }

  if (result) {
    res.status(200).json(result);
  } else {
    res.status(404).json({ error: "Filler data not found" });
  }
}

function parseFillerHtml(html) {
  const extractCount = (className) => {
    const sectionRegex = new RegExp(`class="${className}"[\\s\\S]*?class="Episodes">([\\s\\S]*?)<\\/span>`, 'i');
    const match = html.match(sectionRegex);
    if (!match) return 0;
    
    const ranges = match[1].match(/>\s*(\d+(?:-\d+)?)\s*</g);
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
  const mixed = extractCount('mixed_canon/filler');
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

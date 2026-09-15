const trySlug = async (str) => {
  if (!str) return null;
  const slug = str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  try {
    const response = await fetch(`https://www.animefillerlist.com/shows/${slug}`);
    if (!response.ok) return null;
    const html = await response.text();
    if (!html || html.includes("Page not found")) return null;
    
    return parseFillerHtml(html);
  } catch(e) {
    console.error(e);
    return null;
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

trySlug("One Piece").then(console.log);

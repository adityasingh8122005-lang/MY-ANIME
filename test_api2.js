async function run() {
  const malId = 16498;
  const englishTitle = 'Attack on Titan';
  // 1. Fetch AFL filler list
  let fillerSet = new Set();
  try {
    const slug = englishTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const res = await fetch(`https://www.animefillerlist.com/shows/${slug}`);
    let text = await res.text();
    if (res.status === 404 && slug.includes('on-')) {
      const altSlug = slug.replace('on-', '');
      const altRes = await fetch(`https://www.animefillerlist.com/shows/${altSlug}`);
      text = await altRes.text();
    }
    
    // Parse table rows
    const matches = text.matchAll(/<tr class="([^"]*)".*?<td class="Number">(\d+)<\/td>/g);
    for (const match of matches) {
      const cls = match[1];
      const epNum = parseInt(match[2]);
      if (cls.includes('filler') && !cls.includes('mixed')) {
        fillerSet.add(epNum);
      }
    }
  } catch(e) {}
  console.log('Filler episodes:', Array.from(fillerSet));
}
run();

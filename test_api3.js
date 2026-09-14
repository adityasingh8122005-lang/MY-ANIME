async function run() {
  const englishTitle = 'Naruto';
  let fillerSet = new Set();
  const slug = englishTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const res = await fetch(`https://www.animefillerlist.com/shows/${slug}`);
  const text = await res.text();
  const matches = text.matchAll(/<tr class="([^"]*)".*?<td class="Number">(\d+)<\/td>/g);
  for (const match of matches) {
    const cls = match[1];
    const epNum = parseInt(match[2]);
    if (cls.includes('filler') && !cls.includes('mixed')) {
      fillerSet.add(epNum);
    }
  }
  console.log('Filler episodes length:', Array.from(fillerSet).length);
}
run();

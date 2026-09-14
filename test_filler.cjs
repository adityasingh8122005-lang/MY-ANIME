async function test() {
  const res = await fetch('https://api.allorigins.win/get?url=' + encodeURIComponent('https://www.animefillerlist.com/shows/naruto-shippuden'));
  const data = await res.json();
  const html = data.contents;
  
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

  console.log({
    mangaCanon: extractCount('manga_canon'),
    mixed: extractCount('mixed_canon\\\\/filler'),
    filler: extractCount('filler'),
    animeCanon: extractCount('anime_canon'),
  });
}
test();

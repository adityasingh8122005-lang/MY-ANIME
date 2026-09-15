fetch('https://www.animefillerlist.com/shows/one-piece')
  .then(res => res.text())
  .then(html => {
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
    console.log({ canon: mangaCanon + animeCanon, mixed, filler, total });
  });

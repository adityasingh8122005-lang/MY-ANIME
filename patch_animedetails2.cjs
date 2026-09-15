const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

code = code.replace(
  'const maxEps = anime.episodes || fillerStats?.total || null;',
  'const safeAnimeEps = (anime.episodes === 1 && anime.status === "Unknown") ? null : anime.episodes;\n    const maxEps = safeAnimeEps || fillerStats?.total || null;'
);

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);

const fs = require('fs');
let code = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

// 1. Remove Series Graph
const sgRegex = /\s*\{\/\* Series Graph via iframe \*\/\}[\s\S]*?<\/p>\s*<\/div>/;
code = code.replace(sgRegex, '');

// 2. Fix the displayEpisodes calculation to ignore the Franchise "Unknown 1" bug
code = code.replace(
  'const displayEpisodes = anime.episodes || fillerStats?.total || null;',
  `// Fix for the old franchise Add bug which hardcoded episodes to 1 and status to Unknown
  const safeAnimeEps = (anime.episodes === 1 && anime.status === "Unknown") ? null : anime.episodes;
  const displayEpisodes = safeAnimeEps || fillerStats?.total || null;`
);

fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', code);

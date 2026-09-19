const fs = require('fs');
let code = fs.readFileSync('src/components/SortableAnimeItem.jsx', 'utf8');

// Replace progress bar max and watched
code = code.replace(
  /item\.totalWatched \?\? item\.episodesWatched/g,
  "item.totalWatchedAll ?? item.episodesWatched"
);
code = code.replace(
  /item\.totalCanon \?\? item\.canonEpisodes/g,
  "item.totalEpisodes ?? item.totalEpisodes"
);

// Replace "77: {item.totalWatched ?? item.episodesWatched ?? 0} / {item.totalCanon ?? item.canonEpisodes ?? '?'} Eps" with total
// Wait, the regex needs to just catch the Eps text
code = code.replace(
  /\{item\.totalWatched \?\? item\.episodesWatched \?\? 0\} \/ \{item\.totalCanon \?\? item\.canonEpisodes \?\? '\?'\}/g,
  "{item.totalWatchedAll ?? item.episodesWatched ?? 0} / {item.totalEpisodes ?? item.canonEpisodes ?? '?'}"
);
code = code.replace(
  /<span>\{item\.totalWatched \?\? item\.episodesWatched \?\? 0\} \/ \{item\.totalCanon \?\? item\.canonEpisodes \?\? '\?'\} Eps<\/span>/g,
  `<span>{item.totalWatchedAll ?? item.episodesWatched ?? 0} / {item.totalEpisodes ?? item.canonEpisodes ?? '?'} Eps</span>`
);

fs.writeFileSync('src/components/SortableAnimeItem.jsx', code);

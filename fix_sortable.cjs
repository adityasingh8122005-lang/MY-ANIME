const fs = require('fs');
let code = fs.readFileSync('src/components/SortableAnimeItem.jsx', 'utf8');

code = code.replace(/item\.totalEpisodes \?\? item\.totalEpisodes/g, 'item.totalEpisodes ?? item.canonEpisodes');

fs.writeFileSync('src/components/SortableAnimeItem.jsx', code);

const fs = require('fs');
let code = fs.readFileSync('api/franchise.js', 'utf8');

code = code.replace(
  'episodes: currentMedia.episodes || 1,',
  'episodes: currentMedia.episodes || null,'
);

code = code.replace(
  'for (let i = 1; i <= season.episodes; i++) {',
  'const epCount = season.episodes || 1000;\n        for (let i = 1; i <= epCount; i++) {'
);

code = code.replace(
  'absoluteEpCounter = season.episodes + 1;',
  'absoluteEpCounter = epCount + 1;'
);

code = code.replace(
  'for (let i = 0; i < season.episodes; i++) {',
  'const epCount = season.episodes || 1000;\n          for (let i = 0; i < epCount; i++) {'
);

code = code.replace(
  'absoluteEpCounter += season.episodes;',
  'absoluteEpCounter += epCount;'
);

code = code.replace(
  'season.canonEpisodes = season.episodes - seasonFillerCount;',
  'season.canonEpisodes = season.episodes ? season.episodes - seasonFillerCount : 0;'
);

fs.writeFileSync('api/franchise.js', code);

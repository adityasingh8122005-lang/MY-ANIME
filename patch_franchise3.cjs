const fs = require('fs');
let code = fs.readFileSync('api/franchise.js', 'utf8');

code = code.replace(
  /let seasonFillerCount = 0;\s*if \(rootFillerSet\) {[\s\S]*?season\.canonEpisodes = season\.episodes - seasonFillerCount;/g,
  `let seasonFillerCount = 0;
        const epCount = season.episodes || 1000;
        if (rootFillerSet) {
          for (let i = 0; i < epCount; i++) {
            if (rootFillerSet.has(absoluteEpCounter)) seasonFillerCount++;
            absoluteEpCounter++;
          }
        } else {
          // No filler data at all for root, assume all canon
          absoluteEpCounter += epCount;
        }
        season.canonEpisodes = season.episodes ? season.episodes - seasonFillerCount : 0;`
);

fs.writeFileSync('api/franchise.js', code);

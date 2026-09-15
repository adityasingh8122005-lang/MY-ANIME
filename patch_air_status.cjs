const fs = require('fs');
let code = fs.readFileSync('src/services/franchiseService.js', 'utf8');

const replacement = `  const result = Array.from(groups.values());
  for (const g of result) {
    if (g.isFranchise) {
      if (g.totalCanon > 0 && g.totalWatched >= g.totalCanon) {
        g.personalStatus = 'Completed';
      } else if (g.totalWatched > 0) {
        g.personalStatus = 'Watching';
      } else {
        g.personalStatus = 'Plan to Watch';
      }
      
      let isOngoing = false;
      for (const season of g.seasons) {
        if (season.metadata && (season.metadata.status === 'Releasing' || season.metadata.status === 'Not yet aired' || season.metadata.status === 'Unknown')) {
          isOngoing = true;
          break;
        }
      }
      g.airStatus = isOngoing ? 'Ongoing' : 'Finished';
    } else {
      g.airStatus = (g.metadata && (g.metadata.status === 'Releasing' || g.metadata.status === 'Not yet aired')) ? 'Ongoing' : 'Finished';
    }
  }
  return result;`;

code = code.replace(/  const result = Array\.from\(groups\.values\(\)\);[\s\S]*?return result;/, replacement);
fs.writeFileSync('src/services/franchiseService.js', code);

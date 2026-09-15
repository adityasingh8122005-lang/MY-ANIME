const fs = require('fs');
let code = fs.readFileSync('src/services/franchiseService.js', 'utf8');

code = code.replace(
  '  return Array.from(groups.values());',
  `  const result = Array.from(groups.values());
  for (const g of result) {
    if (g.isFranchise) {
      if (g.totalCanon > 0 && g.totalWatched >= g.totalCanon) {
        g.personalStatus = 'Completed';
      } else if (g.totalWatched > 0) {
        g.personalStatus = 'Watching';
      } else {
        g.personalStatus = 'Plan to Watch';
      }
    }
  }
  return result;`
);

fs.writeFileSync('src/services/franchiseService.js', code);

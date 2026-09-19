const fs = require('fs');
let code = fs.readFileSync('src/services/franchiseService.js', 'utf8');

// Update getFranchiseWithProgress
code = code.replace(
  /let totalCanon = 0;\n  let totalWatched = 0;/g,
  `let totalCanon = 0;
  let totalWatched = 0;
  let totalEpisodes = 0;
  let totalWatchedAll = 0;`
);

code = code.replace(
  /totalCanon \+= maxCanon;\n    totalWatched \+= watched;/g,
  `totalCanon += maxCanon;
    totalWatched += watched;
    const seasonTotal = s.episodes || maxCanon;
    totalEpisodes += seasonTotal;
    totalWatchedAll += (user.episodes_watched || 0);`
);

code = code.replace(
  /totalCanon,\n    totalWatched,\n    seasons: enrichedSeasons/g,
  `totalCanon,
    totalWatched,
    totalEpisodes,
    totalWatchedAll,
    seasons: enrichedSeasons`
);

// Update getGroupedCollection
code = code.replace(
  /totalCanon: 0,\n          totalWatched: 0,\n          updatedAt: ua\.updatedAt/g,
  `totalCanon: 0,
          totalWatched: 0,
          totalEpisodes: 0,
          totalWatchedAll: 0,
          updatedAt: ua.updatedAt`
);

code = code.replace(
  /g\.totalCanon \+= canon;\n      g\.totalWatched \+= watched;/g,
  `g.totalCanon += canon;
      g.totalWatched += watched;
      const seasonTotal = meta?.episodes || canon;
      g.totalEpisodes += seasonTotal;
      g.totalWatchedAll += (ua.episodesWatched || 0);`
);

code = code.replace(
  /if \(g\.totalCanon > 0 && g\.totalWatched >= g\.totalCanon\) {/g,
  `if ((g.totalEpisodes > 0 && g.totalWatchedAll >= g.totalEpisodes) || (g.totalCanon > 0 && g.totalWatched >= g.totalCanon)) {`
);

code = code.replace(
  /episodesWatched: \(meta\?\.episodes > 0\) \? Math\.min\(ua\.episodesWatched \|\| 0, meta\.episodes\) : \(ua\.episodesWatched \|\| 0\),/g,
  `episodesWatched: ua.episodesWatched || 0,
        totalEpisodes: meta?.episodes || 0,
        totalWatchedAll: ua.episodesWatched || 0,`
);

fs.writeFileSync('src/services/franchiseService.js', code);

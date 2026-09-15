const fs = require('fs');
let code = fs.readFileSync('src/pages/StatisticsPage.jsx', 'utf8');

code = code.replace(
  "const watchHistory = await getWatchHistory();",
  "const watchHistory = await db.watchHistory.toArray();"
);

fs.writeFileSync('src/pages/StatisticsPage.jsx', code);

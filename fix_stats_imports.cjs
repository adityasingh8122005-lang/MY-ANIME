const fs = require('fs');
let code = fs.readFileSync('src/pages/StatisticsPage.jsx', 'utf8');

code = code.replace(
  "import { getAllUserAnime } from '../services/userService';",
  "import { getGroupedCollection } from '../services/franchiseService';\nimport { getWatchHistory } from '../services/userService';"
);

fs.writeFileSync('src/pages/StatisticsPage.jsx', code);

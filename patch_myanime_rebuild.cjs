const fs = require('fs');
let code = fs.readFileSync('src/pages/MyAnimePage.jsx', 'utf8');

code = code.replace(
  "import { getGroupedCollection, autoHealUnknownMetadata, autoHealFranchiseDates, addFranchiseToDb, autoSyncStaleData } from '../services/franchiseService';",
  "import { getGroupedCollection, autoHealUnknownMetadata, autoHealFranchiseDates, addFranchiseToDb, autoSyncStaleData, autoRebuildFranchises } from '../services/franchiseService';"
);

code = code.replace(
  "autoSyncStaleData();",
  "autoSyncStaleData();\n        autoRebuildFranchises();"
);

fs.writeFileSync('src/pages/MyAnimePage.jsx', code);

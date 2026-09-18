const fs = require('fs');
let code = fs.readFileSync('src/pages/MyAnimePage.jsx', 'utf8');

code = code.replace(
  "import { getGroupedCollection, autoHealUnknownMetadata, autoHealFranchiseDates, addFranchiseToDb } from '../services/franchiseService';",
  "import { getGroupedCollection, autoHealUnknownMetadata, autoHealFranchiseDates, addFranchiseToDb, autoSyncStaleData } from '../services/franchiseService';"
);

code = code.replace(
  "autoHealFranchiseDates();\n        setCollection(data);",
  "autoHealFranchiseDates();\n        autoSyncStaleData();\n        setCollection(data);"
);

fs.writeFileSync('src/pages/MyAnimePage.jsx', code);

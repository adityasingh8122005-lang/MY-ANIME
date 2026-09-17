const fs = require('fs');
let code = fs.readFileSync('src/pages/MyAnimePage.jsx', 'utf8');

code = code.replace(
  "import { getGroupedCollection, autoHealUnknownMetadata, autoHealFranchiseDates } from '../services/franchiseService';",
  "import { getGroupedCollection, autoHealUnknownMetadata, autoHealFranchiseDates, addFranchiseToDb } from '../services/franchiseService';\nimport { getFranchiseData } from '../services/franchiseApi';"
);

code = code.replace(
  "const { getFranchiseData } = await import('../services/franchiseApi');\n          const { addFranchiseToDb } = await import('../services/franchiseService');",
  ""
);

fs.writeFileSync('src/pages/MyAnimePage.jsx', code);

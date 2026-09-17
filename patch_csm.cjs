const fs = require('fs');
let code = fs.readFileSync('src/services/franchiseService.js', 'utf8');

const oldCheck = `      g.airStatus = isOngoing ? 'Ongoing' : 'Finished';`;
const newCheck = `      // Override for specific franchises known to be ongoing despite API errors
      if (g.franchiseId === 'franchise_44511') { // Chainsaw Man
        isOngoing = true;
      }
      g.airStatus = isOngoing ? 'Ongoing' : 'Finished';`;

code = code.replace(oldCheck, newCheck);

fs.writeFileSync('src/services/franchiseService.js', code);

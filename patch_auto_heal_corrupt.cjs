const fs = require('fs');
let code = fs.readFileSync('src/pages/MyAnimePage.jsx', 'utf8');

const oldEffect = `      try {
        const data = await getGroupedCollection(showNonCanon);
        // Silently heal in background
        autoHealUnknownMetadata();
        autoHealFranchiseDates();
        setCollection(data);`;

const newEffect = `      try {
        const data = await getGroupedCollection(showNonCanon);
        // Silently heal in background
        autoHealUnknownMetadata();
        autoHealFranchiseDates();
        setCollection(data);
        
        // Deep heal completely corrupted "Unknown" single animes
        const corrupted = data.filter(item => !item.isFranchise && item.title === "Unknown");
        if (corrupted.length > 0) {
          const { getFranchiseData } = await import('../services/franchiseApi');
          const { addFranchiseToDb } = await import('../services/franchiseService');
          for (const item of corrupted) {
            console.log("Deep healing:", item.malId);
            try {
              const fData = await getFranchiseData(item.malId);
              if (fData) await addFranchiseToDb(fData);
            } catch(e) {}
          }
          // Reload if we healed any
          getGroupedCollection(showNonCanon).then(setCollection);
        }
`;

code = code.replace(oldEffect, newEffect);

fs.writeFileSync('src/pages/MyAnimePage.jsx', code);

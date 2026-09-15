const fs = require('fs');

// 1. Revert AnimeDetailsPage to old input
let detailsCode = fs.readFileSync('src/pages/AnimeDetailsPage.jsx', 'utf8');

// Remove Stepper import
detailsCode = detailsCode.replace(/import Stepper from '\.\.\/components\/Stepper\.jsx';\n?/, '');

// Replace Stepper usage with native input
const stepperRegex = /<Stepper[\s\S]*?\/>/;
const oldInput = `<div className="flex items-center gap-2">
                    <input 
                      type="number" 
                      min="0"
                      max={displayEpisodes || ''}
                      value={userAnime.episodesWatched || 0}
                      onChange={(e) => handleEpisodesChange(e.target.value)}
                      className="w-16 bg-dark-base border border-zinc-700 rounded p-2 text-white text-sm focus:border-accent focus:outline-none text-center"
                    />
                  </div>`;
detailsCode = detailsCode.replace(stepperRegex, oldInput);
fs.writeFileSync('src/pages/AnimeDetailsPage.jsx', detailsCode);

// 2. Add DB Migration to App.jsx
let appCode = fs.readFileSync('src/App.jsx', 'utf8');
appCode = appCode.replace("import clsx from 'clsx';", "import clsx from 'clsx';\nimport { useEffect } from 'react';\nimport { db } from './services/db.js';");

const fixDbCode = `
  useEffect(() => {
    async function fixDb() {
      try {
        const metadata = await db.animeMetadata.where('episodes').equals(1).toArray();
        for (const m of metadata) {
          if (m.status === "Unknown" && m.title === "ONE PIECE") {
            await db.animeMetadata.update(m.malId, { episodes: null });
          }
        }
        
        const franchises = await db.franchises.toArray();
        for (const f of franchises) {
          let updated = false;
          f.seasons = f.seasons.map(s => {
            if (s.canonEpisodes === 1 && s.title === "ONE PIECE") {
              updated = true;
              return { ...s, canonEpisodes: 1168, episodes: null };
            }
            return s;
          });
          if (updated) {
            await db.franchises.put(f);
          }
        }
      } catch (e) { console.error(e); }
    }
    fixDb();
  }, []);
`;

appCode = appCode.replace('function App() {', `function App() {\n${fixDbCode}`);
fs.writeFileSync('src/App.jsx', appCode);


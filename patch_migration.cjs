const fs = require('fs');
let appCode = fs.readFileSync('src/App.jsx', 'utf8');

const badCode = `        const metadata = await db.animeMetadata.where('episodes').equals(1).toArray();
        for (const m of metadata) {
          if (m.status === "Unknown" && m.title === "ONE PIECE") {
            await db.animeMetadata.update(m.malId, { episodes: null });
          }
        }`;

const goodCode = `        const m = await db.animeMetadata.get(21);
        if (m && m.episodes === 1 && (m.status === "Unknown" || m.title === "ONE PIECE")) {
          await db.animeMetadata.update(21, { episodes: null });
        }`;

appCode = appCode.replace(badCode, goodCode);
fs.writeFileSync('src/App.jsx', appCode);
